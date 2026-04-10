declare const self: ServiceWorkerGlobalScope;

import * as Comlink from "comlink";
import { Logger } from "tslog";
import { registerRoute } from "workbox-routing";
import { convertLevel } from "./converter";
import {
	ATLAS_PRELOAD_HOOK,
	BG_COLOR_HOOK,
	CHATFONT_PRELOAD_HOOK,
	CHILD_TINT_HOOK,
	COLLISION_HOOK,
	COMPLETE_HOOK,
	CREATION_HOOK,
	DEATH_HOOK,
	DISPATCH_HOOK,
	END_SCREEN_HOOK,
	FLIP_HOOK,
	GAME_CONFIG_HOOK,
	generateAtlasPreloadReplacement,
	generateBgColorReplacement,
	generateChatFontPreloadReplacement,
	generateChildTintReplacement,
	generateCollisionReplacement,
	generateCompleteReplacement,
	generateCreationReplacement,
	generateDeathReplacement,
	generateDispatchReplacement,
	generateEndScreenReplacement,
	generateFlipReplacement,
	generateGameConfigReplacement,
	generateLevelNameReplacement,
	generateLevelParseReplacement,
	generateMenuButtonsReplacement,
	generateOsTableReplacement,
	generatePArrayReplacement,
	generatePauseMenuReplacement,
	generatePortalSubPatch,
	generateSceneRedirectReplacement,
	generateSongNameReplacement,
	generateSpawnReplacement,
	generateStartGameReplacement,
	generateTryMeReplacement,
	LEVEL_NAME_HOOK,
	LEVEL_PARSE_HOOK,
	MENU_BUTTONS_HOOK,
	OS_TABLE_HOOK,
	P_ARRAY_HOOK,
	PAUSE_MENU_HOOK,
	type PadEffectConfig,
	PORTAL_SUB_HOOK,
	SCENE_REDIRECT_HOOK,
	SONG_NAME_HOOK,
	SPAWN_HOOK,
	START_GAME_HOOK,
	STEAM_ATLAS_KEYS,
	TRY_ME_HOOK,
	translateEffects,
} from "./objects";
import type { PlistApi } from "./parsers/plist";
import { applyHooks } from "./patches";

const log = new Logger({ name: "SW", type: "pretty" });

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (ev) => ev.waitUntil(self.clients.claim()));

const DOMAIN_CHECK =
	"const Ts=window[_0x6e411f(0xfa0)][_0x6e411f(0x1876)],bs=[0x67,0x65,0x6f,0x6d,0x65,0x74,0x72,0x79,0x64,0x61,0x73,0x68,0x2e,0x63,0x6f,0x6d]['map'](_0x1c1bb4=>String[_0x6e411f(0x370)](_0x1c1bb4))[_0x6e411f(0xb6b)]('');if(!(Ts===bs||Ts===_0x6e411f(0x7ec)+bs||Ts[_0x6e411f(0x696)]('.'+bs)||_0x6e411f(0x10b9)===Ts))throw document['body']['innerHTML']='',new Error('');";

const MUSIC_MAP: Record<number, string> = {
	1: "StereoMadness",
	2: "BackOnTrack",
	3: "Polargeist",
	4: "DryOut",
	5: "BaseAfterBase",
	6: "CantLetGo",
	7: "Jumper",
	8: "TimeMachine",
	9: "Cycles",
	10: "xStep",
	11: "Clutterfunk",
	12: "TheoryOfEverything",
	13: "Electroman",
	14: "Clubstep",
	15: "Electrodynamix",
	16: "HexagonForce",
	17: "BlastProcessing",
	18: "TheoryOfEverything2",
	19: "GeometricalDominator",
	20: "Deadlocked",
	21: "Fingerdash",
	22: "Dash",
	3001: "Clubstep",
	5001: "PowerTrip",
	5002: "StayInsideMe",
	5003: "StereoMadness",
	5004: "StereoMadness",
};

async function getLevelId(clientId: string): Promise<number> {
	const client = await self.clients.get(clientId);
	if (!client) return 1;

	const url = new URL(client.url);

	return parseInt(url.searchParams.get("level") || "1", 10) || 1;
}

const comlinkApiCache = new Map<string, Comlink.Remote<PlistApi>>();

async function getComlinkApi(
	clientId: string,
): Promise<Comlink.Remote<PlistApi>> {
	const cached = comlinkApiCache.get(clientId);
	if (cached) return cached;

	const client = await self.clients.get(clientId);
	if (!client) throw new Error(`No client found for ${clientId}`);

	const channel = new MessageChannel();
	client.postMessage({ type: "comlink-init" }, [channel.port2]);

	const api = Comlink.wrap<PlistApi>(channel.port1);
	comlinkApiCache.set(clientId, api);
	return api;
}

let effectsCache: PadEffectConfig | null = null;

async function loadEffects(clientId: string): Promise<PadEffectConfig> {
	if (effectsCache) return effectsCache;

	const api = await getComlinkApi(clientId);

	const [bumpResp, ringResp] = await Promise.all([
		fetch("/assets/steam/bumpEffect.plist"),
		fetch("/assets/steam/ringEffect.plist"),
	]);

	const [bumpXml, ringXml] = await Promise.all([
		bumpResp.text(),
		ringResp.text(),
	]);

	const [bumpData, ringData] = await Promise.all([
		api.parseParticlePlist(bumpXml),
		api.parseParticlePlist(ringXml),
	]);

	effectsCache = translateEffects(bumpData, ringData);
	log.info("Loaded particle effects via Comlink IPC", effectsCache);
	return effectsCache;
}

const atlasCache = new Map<string, { json: string; png: ArrayBuffer | null }>();

const atlasConversionInFlight = new Map<string, Promise<void>>();

async function ensureAtlasConverted(
	atlasKey: string,
	clientId: string,
): Promise<void> {
	if (atlasCache.has(atlasKey)) return;

	const existing = atlasConversionInFlight.get(atlasKey);
	if (existing) return existing;

	const promise = (async () => {
		const plistPath = `/assets/steam/${atlasKey}.plist`;
		const pngPath = `/assets/steam/${atlasKey}.png`;

		const [plistResp, pngResp] = await Promise.all([
			fetch(plistPath),
			fetch(pngPath),
		]);

		if (!plistResp.ok || !pngResp.ok) {
			throw new Error(`Failed to fetch atlas resources for ${atlasKey}`);
		}

		const [plistXml, pngBuffer] = await Promise.all([
			plistResp.text(),
			pngResp.arrayBuffer(),
		]);

		const imageName = `${atlasKey}.png`;

		try {
			const api = await getComlinkApi(clientId);
			const result = await api.derotateAtlas(plistXml, imageName, pngBuffer);
			atlasCache.set(atlasKey, { json: result.json, png: result.png });
			log.info(
				`Atlas converted: ${atlasKey} (derotated PNG: ${result.png ? "yes" : "no"})`,
			);
		} catch (derotateErr) {
			log.warn(
				`derotateAtlas failed for ${atlasKey}, falling back to plistToPhaser:`,
				derotateErr,
			);
			const api = await getComlinkApi(clientId);
			const fallbackAtlas = await api.plistToPhaser(plistXml, imageName);
			atlasCache.set(atlasKey, {
				json: JSON.stringify(fallbackAtlas),
				png: null,
			});
		}
	})();

	atlasConversionInFlight.set(atlasKey, promise);
	try {
		await promise;
	} finally {
		atlasConversionInFlight.delete(atlasKey);
	}
}

const steamAtlasKeySet = new Set(STEAM_ATLAS_KEYS);

registerRoute(
	({ url }) =>
		url.pathname.startsWith("/assets/steam/") && url.pathname.endsWith(".json"),
	async ({ url, event }) => {
		const fe = event as FetchEvent;
		const filename = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
		const atlasKey = filename.replace(/\.json$/, "");

		if (!steamAtlasKeySet.has(atlasKey)) {
			return fetch(url.href);
		}

		try {
			await ensureAtlasConverted(atlasKey, fe.clientId);
			const cached = atlasCache.get(atlasKey);
			if (!cached)
				return new Response("atlas conversion failed", { status: 500 });

			return new Response(cached.json, {
				headers: { "Content-Type": "application/json" },
			});
		} catch (routeErr) {
			log.error(`JSON route failed for ${atlasKey}:`, routeErr);
			return new Response("atlas conversion error", { status: 500 });
		}
	},
);

registerRoute(
	({ url }) =>
		url.pathname.startsWith("/assets/steam/") && url.pathname.endsWith(".png"),
	async ({ url, event }) => {
		const fe = event as FetchEvent;
		const filename = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
		const atlasKey = filename.replace(/\.png$/, "");

		if (!steamAtlasKeySet.has(atlasKey)) {
			return fetch(url.href);
		}

		try {
			await ensureAtlasConverted(atlasKey, fe.clientId);
			const cached = atlasCache.get(atlasKey);
			if (!cached)
				return new Response("atlas conversion failed", { status: 500 });

			if (cached.png) {
				return new Response(cached.png, {
					headers: { "Content-Type": "image/png" },
				});
			}

			return fetch(url.href);
		} catch (routeErr) {
			log.error(`PNG route failed for ${atlasKey}, passing through:`, routeErr);
			return fetch(url.href);
		}
	},
);

registerRoute(
	({ url }) => url.pathname === "/assets/index-game.js",
	async ({ event }) => {
		const fe = event as FetchEvent;

		const [resp, effects] = await Promise.all([
			fetch("/assets/index-game.js"),
			loadEffects(fe.clientId),
		]);

		let js = await resp.text();

		js = js.replace(DOMAIN_CHECK, "");
		js = js.replace(P_ARRAY_HOOK, generatePArrayReplacement());
		js = js.replace(ATLAS_PRELOAD_HOOK, generateAtlasPreloadReplacement());
		js = js.replace(OS_TABLE_HOOK, generateOsTableReplacement());
		js = js.replace(PORTAL_SUB_HOOK, generatePortalSubPatch());
		js = js.replace(SPAWN_HOOK, generateSpawnReplacement(effects));
		js = js.replace(CREATION_HOOK, generateCreationReplacement());
		js = js.replace(DISPATCH_HOOK, generateDispatchReplacement(effects));
		js = js.replace(COLLISION_HOOK, generateCollisionReplacement());
		js = js.replace(FLIP_HOOK, generateFlipReplacement());
		js = js.replace(TRY_ME_HOOK, generateTryMeReplacement());
		js = js.replace(LEVEL_NAME_HOOK, generateLevelNameReplacement());
		js = js.replace(SONG_NAME_HOOK, generateSongNameReplacement());
		js = js.replace(DEATH_HOOK, generateDeathReplacement());
		js = js.replace(COMPLETE_HOOK, generateCompleteReplacement());
		js = js.replace(LEVEL_PARSE_HOOK, generateLevelParseReplacement());
		js = js.replace(BG_COLOR_HOOK, generateBgColorReplacement());
		js = js.replace(CHILD_TINT_HOOK, generateChildTintReplacement());
		js = js.replace(GAME_CONFIG_HOOK, generateGameConfigReplacement());
		js = js.replace(
			CHATFONT_PRELOAD_HOOK,
			generateChatFontPreloadReplacement(),
		);
		js = js.replace(SCENE_REDIRECT_HOOK, generateSceneRedirectReplacement());
		js = js.replace(START_GAME_HOOK, generateStartGameReplacement());
		js = js.replace(MENU_BUTTONS_HOOK, generateMenuButtonsReplacement());
		js = js.replace(PAUSE_MENU_HOOK, generatePauseMenuReplacement());
		js = js.replace(END_SCREEN_HOOK, generateEndScreenReplacement());
		js = applyHooks(js);
		return new Response(js, {
			headers: { "Content-Type": "application/javascript; charset=utf-8" },
		});
	},
);

const OFFICIAL_LEVEL_IDS = new Set([
	1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
	3001, 5001, 5002, 5003, 5004,
]);

registerRoute(
	({ url }) => url.pathname === "/assets/1.txt",
	async ({ event }) => {
		const fe = event as FetchEvent;

		const levelId = await getLevelId(fe.clientId);

		if (OFFICIAL_LEVEL_IDS.has(levelId)) {
			const resp = await fetch(`/assets/levels/${levelId}.txt`);
			if (!resp.ok) return fetch("/assets/1.txt");

			const raw = await resp.text();
			const { encoded, stats } = convertLevel(raw);

			log.info(`Level ${levelId} converted`, stats);

			const client = await self.clients.get(fe.clientId);
			client?.postMessage({ type: "conversion-stats", levelId, stats });

			return new Response(encoded, {
				headers: { "Content-Type": "text/plain" },
			});
		}

		try {
			const api = await getComlinkApi(fe.clientId);
			const levelData = await api.readLevelData(levelId);

			if (!levelData) {
				log.warn(`Online level ${levelId} not found in TFS`);
				return new Response("-1", { status: 404 });
			}

			const { encoded, stats } = convertLevel(levelData);
			log.info(`Online level ${levelId} converted`, stats);

			const client = await self.clients.get(fe.clientId);
			client?.postMessage({ type: "conversion-stats", levelId, stats });

			return new Response(encoded, {
				headers: { "Content-Type": "text/plain" },
			});
		} catch (readErr) {
			log.error(`Failed to read online level ${levelId}:`, readErr);
			return new Response("-1", { status: 500 });
		}
	},
);

registerRoute(
	({ url }) => url.pathname === "/assets/StereoMadness.mp3",
	async ({ event }) => {
		const fe = event as FetchEvent;

		const levelId = await getLevelId(fe.clientId);

		if (OFFICIAL_LEVEL_IDS.has(levelId)) {
			const track = MUSIC_MAP[levelId] || "StereoMadness";
			return fetch(`/assets/${track}.mp3`);
		}

		const customSongId = parseInt(
			new URL(
				(await self.clients.get(fe.clientId))?.url || "",
			).searchParams.get("song") || "0",
			10,
		);

		if (customSongId > 0) {
			try {
				const api = await getComlinkApi(fe.clientId);
				const songData = await api.readSongData(customSongId);

				if (songData) {
					log.info(`Serving online song ${customSongId} from TFS`);
					return new Response(songData, {
						headers: { "Content-Type": "audio/mpeg" },
					});
				}
			} catch (songErr) {
				log.warn(`Failed to read online song ${customSongId}:`, songErr);
			}
		}

		return fetch("/assets/StereoMadness.mp3");
	},
);
