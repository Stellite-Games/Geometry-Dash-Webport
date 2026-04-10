import { registerSW } from "virtual:pwa-register";
import * as Comlink from "comlink";
import { LEVEL_NAMES, LEVEL_SONGS } from "./consts";
import { createCreatorPanelScene } from "./creatorPanel";
import { createGarageScene } from "./garage";
import { createLevelBrowserScene } from "./levelBrowser";
import { createLevelSelectScene } from "./levelSelect";
import type { PlistApi } from "./parsers/plist";
import {
	derotateAtlas,
	parseParticlePlist,
	plistToPhaser,
} from "./parsers/plist";
import { readOnlineLevel, readOnlineSong } from "./save";

declare const window: Window &
	typeof globalThis & {
		_eeLevelName: string;
		_eeLevelSong: string;
		_eeAutoPlay: boolean;
		_eeLevelBrowserType: number | undefined;
		_gdConfig: Record<string, unknown> | undefined;
		_gdPhaser: typeof Phaser | undefined;
	};

const plistApi: PlistApi = {
	parseParticlePlist,
	plistToPhaser,
	derotateAtlas,
	readLevelData: readOnlineLevel,
	readSongData: readOnlineSong,
};

function waitForSW(): Promise<void> {
	return new Promise((resolve) => {
		registerSW({ immediate: true });

		if (navigator.serviceWorker.controller) return resolve();

		navigator.serviceWorker.addEventListener(
			"controllerchange",
			() => resolve(),
			{ once: true },
		);
	});
}

function setupComlink() {
	navigator.serviceWorker?.addEventListener("message", (ev) => {
		if (ev.data?.type === "comlink-init" && ev.ports[0]) {
			Comlink.expose(plistApi, ev.ports[0]);
			return;
		}

		if (ev.data?.type === "conversion-stats") {
			window.parent.postMessage(
				{
					type: "conversion-stats",
					levelId: ev.data.levelId,
					stats: ev.data.stats,
				},
				"*",
			);
		}
	});
}

function waitForGameDeferred(): Promise<void> {
	return new Promise((resolve) => {
		const check = () => {
			if (window._gdConfig && window._gdPhaser) return resolve();
			requestAnimationFrame(check);
		};
		check();
	});
}

function injectAndCreateGame() {
	waitForGameDeferred().then(() => {
		const config = window._gdConfig as Record<string, unknown>;
		const PhaserNs = window._gdPhaser as typeof Phaser;

		const scenes = config.scene as unknown[];
		scenes.push(createLevelSelectScene());
		scenes.push(createLevelBrowserScene());
		scenes.push(createCreatorPanelScene());
		scenes.push(createGarageScene());

		new PhaserNs.Game(config);
	});
}

const params = new URLSearchParams(location.search);

if (params.has("level")) {
	const levelId = parseInt(params.get("level") || "1", 10) || 1;
	(window as unknown as Record<string, unknown>)._eeLevelName =
		LEVEL_NAMES[levelId] || "Stereo Madness";
	(window as unknown as Record<string, unknown>)._eeLevelSong =
		LEVEL_SONGS[levelId] || "Stereo Madness";
}

setupComlink();

new ResizeObserver(() => {
	window.dispatchEvent(new Event("resize"));
}).observe(document.documentElement);

waitForSW().then(() => {
	if (document.querySelector('script[src="./assets/index-game.js"]')) return;

	const script = document.createElement("script");
	script.type = "module";
	script.crossOrigin = "";
	script.src = "./assets/index-game.js";
	document.head.appendChild(script);

	injectAndCreateGame();
});
