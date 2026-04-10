import LibcurlClient from "@mercuryworkshop/libcurl-transport";
import { Logger } from "tslog";

const log = new Logger({ name: "GD-API" });

const BASE_URL = "https://www.boomlings.com/database/";
const SECRET = "Wmfd2893gb7";
const WISP_RELAY = "wss://stellite.games/wisp/";

let client: LibcurlClient | null = null;

export async function initApi(): Promise<void> {
	if (client) return;
	client = new LibcurlClient({ wisp: WISP_RELAY });
	await client.init();
	log.info("libcurl-transport initialized with Wisp relay");
}

async function getClient(): Promise<LibcurlClient> {
	if (!client) await initApi();
	return client as LibcurlClient;
}

async function post(
	endpoint: string,
	params: Record<string, string>,
): Promise<string> {
	const transport = await getClient();

	const body = new URLSearchParams(params).toString();
	const url = new URL(`${BASE_URL}${endpoint}`);

	const headers: Array<[string, string]> = [
		["Content-Type", "application/x-www-form-urlencoded"],
		["User-Agent", ""],
	];

	const resp = await transport.request(url, "POST", body, headers, undefined);

	const text = await new Response(resp.body).text();

	if (text === "-1" || text === "-2") {
		throw new Error(`GD API error: ${text}`);
	}

	return text;
}

export interface GDLevelPreview {
	id: number;
	name: string;
	description: string;
	version: number;
	creatorId: number;
	difficulty: number;
	downloads: number;
	likes: number;
	length: number;
	stars: number;
	coins: number;
	verifiedCoins: boolean;
	demonDifficulty: number;
	songId: number;
	customSongId: number;
	objectCount: number;
	creatorName: string;
}

export interface GDLevelFull extends GDLevelPreview {
	levelData: string;
}

export interface GDSongInfo {
	id: number;
	name: string;
	artistId: number;
	artistName: string;
	size: number;
	downloadUrl: string;
}

function parseLevelString(raw: string): Record<string, string> {
	const parts = raw.split(":");
	const result: Record<string, string> = {};
	for (let idx = 0; idx < parts.length - 1; idx += 2) {
		result[parts[idx]] = parts[idx + 1];
	}
	return result;
}

function parseSongString(raw: string): Record<string, string> {
	const parts = raw.split("~|~");
	const result: Record<string, string> = {};
	for (let idx = 0; idx < parts.length - 1; idx += 2) {
		result[parts[idx]] = parts[idx + 1];
	}
	return result;
}

function decodeBase64Description(encoded: string): string {
	try {
		return atob(encoded);
	} catch {
		return encoded;
	}
}

const DIFFICULTY_MAP: Record<number, string> = {
	0: "N/A",
	10: "Easy",
	20: "Normal",
	30: "Hard",
	40: "Harder",
	50: "Insane",
};

const DEMON_DIFF_MAP: Record<number, string> = {
	3: "Easy Demon",
	4: "Medium Demon",
	0: "Hard Demon",
	5: "Insane Demon",
	6: "Extreme Demon",
};

const LENGTH_MAP: Record<number, string> = {
	0: "Tiny",
	1: "Short",
	2: "Medium",
	3: "Long",
	4: "XL",
	5: "Platformer",
};

export function getDifficultyName(level: GDLevelPreview): string {
	if (level.stars === 1 && level.difficulty === 0) return "Auto";
	const isDemon = level.difficulty === 50 && level.stars >= 10;
	if (isDemon) return DEMON_DIFF_MAP[level.demonDifficulty] || "Hard Demon";
	return DIFFICULTY_MAP[level.difficulty] || "N/A";
}

export function getLengthName(level: GDLevelPreview): string {
	return LENGTH_MAP[level.length] || "Unknown";
}

function buildLevelPreview(
	data: Record<string, string>,
	creatorName: string,
): GDLevelPreview {
	return {
		id: parseInt(data["1"] || "0", 10),
		name: data["2"] || "",
		description: decodeBase64Description(data["3"] || ""),
		version: parseInt(data["5"] || "1", 10),
		creatorId: parseInt(data["6"] || "0", 10),
		difficulty: parseInt(data["9"] || "0", 10),
		downloads: parseInt(data["10"] || "0", 10),
		likes: parseInt(data["14"] || "0", 10),
		length: parseInt(data["15"] || "0", 10),
		stars: parseInt(data["18"] || "0", 10),
		coins: parseInt(data["37"] || "0", 10),
		verifiedCoins: data["38"] === "1",
		demonDifficulty: parseInt(data["43"] || "0", 10),
		songId: parseInt(data["12"] || "0", 10),
		customSongId: parseInt(data["35"] || "0", 10),
		objectCount: parseInt(data["45"] || "0", 10),
		creatorName,
	};
}

export interface SearchResult {
	levels: GDLevelPreview[];
	total: number;
	page: number;
	songs: Map<number, GDSongInfo>;
}

export async function searchLevels(
	query: string,
	page = 0,
	type = 0,
): Promise<SearchResult> {
	const params: Record<string, string> = {
		gameVersion: "22",
		binaryVersion: "42",
		gdw: "0",
		type: String(type),
		str: query,
		page: String(page),
		total: "0",
		secret: SECRET,
	};

	const raw = await post("getGJLevels21.php", params);
	const sections = raw.split("#");

	if (sections.length < 3) {
		return { levels: [], total: 0, page, songs: new Map() };
	}

	const creatorSection = sections[1];
	const creatorMap = new Map<string, string>();
	if (creatorSection) {
		for (const entry of creatorSection.split("|")) {
			const parts = entry.split(":");
			if (parts.length >= 2) {
				creatorMap.set(parts[0], parts[1]);
			}
		}
	}

	const songSection = sections[2];
	const songs = new Map<number, GDSongInfo>();
	if (songSection) {
		for (const entry of songSection.split("~:~")) {
			if (!entry.trim()) continue;
			const songData = parseSongString(entry);
			const songId = parseInt(songData["1"] || "0", 10);
			if (songId > 0) {
				songs.set(songId, {
					id: songId,
					name: songData["2"] || "",
					artistId: parseInt(songData["3"] || "0", 10),
					artistName: songData["4"] || "",
					size: parseFloat(songData["5"] || "0"),
					downloadUrl: decodeURIComponent(songData["10"] || ""),
				});
			}
		}
	}

	const pageInfo = sections[3];
	let total = 0;
	if (pageInfo) {
		const pageParts = pageInfo.split(":");
		total = parseInt(pageParts[0] || "0", 10);
	}

	const levelStrings = sections[0].split("|");
	const levels: GDLevelPreview[] = [];

	for (const levelStr of levelStrings) {
		if (!levelStr.trim()) continue;
		const data = parseLevelString(levelStr);
		const creatorId = data["6"] || "0";
		const creatorName = creatorMap.get(creatorId) || "";
		levels.push(buildLevelPreview(data, creatorName));
	}

	log.info(
		`Search "${query}" page ${page}: ${levels.length} results, ${total} total`,
	);

	return { levels, total, page, songs };
}

export async function downloadLevel(levelId: number): Promise<GDLevelFull> {
	const params: Record<string, string> = {
		gameVersion: "22",
		binaryVersion: "42",
		gdw: "0",
		levelID: String(levelId),
		secret: SECRET,
	};

	const raw = await post("downloadGJLevel22.php", params);
	const data = parseLevelString(raw);
	const creatorName = data["crName"] || "";

	const preview = buildLevelPreview(data, creatorName);

	return {
		...preview,
		levelData: data["4"] || "",
	};
}

export async function getSongInfo(songId: number): Promise<GDSongInfo> {
	const params: Record<string, string> = {
		secret: SECRET,
		songID: String(songId),
	};

	const raw = await post("getGJSongInfo.php", params);
	const data = parseSongString(raw);

	return {
		id: parseInt(data["1"] || "0", 10),
		name: data["2"] || "",
		artistId: parseInt(data["3"] || "0", 10),
		artistName: data["4"] || "",
		size: parseFloat(data["5"] || "0"),
		downloadUrl: decodeURIComponent(data["10"] || ""),
	};
}

export async function downloadSong(url: string): Promise<ArrayBuffer> {
	const transport = await getClient();

	const headers: Array<[string, string]> = [["User-Agent", ""]];
	const resp = await transport.request(
		new URL(url),
		"GET",
		null,
		headers,
		undefined,
	);

	if (resp.status < 200 || resp.status >= 300) {
		throw new Error(`Song download failed: ${resp.status}`);
	}

	return new Response(resp.body).arrayBuffer();
}

export const SEARCH_TYPE = {
	SEARCH: 0,
	MOST_DOWNLOADED: 1,
	MOST_LIKED: 2,
	TRENDING: 3,
	RECENT: 4,
	FEATURED: 6,
	MAGIC: 7,
	AWARDED: 11,
	HALL_OF_FAME: 16,
} as const;

export const OFFICIAL_SONG_NAMES: Record<number, string> = {
	0: "Stereo Madness",
	1: "Back On Track",
	2: "Polargeist",
	3: "Dry Out",
	4: "Base After Base",
	5: "Can't Let Go",
	6: "Jumper",
	7: "Time Machine",
	8: "Cycles",
	9: "xStep",
	10: "Clutterfunk",
	11: "Theory of Everything",
	12: "Electroman Adventures",
	13: "Clubstep",
	14: "Electrodynamix",
	15: "Hexagon Force",
	16: "Blast Processing",
	17: "Theory of Everything 2",
	18: "Geometrical Dominator",
	19: "Deadlocked",
	20: "Fingerdash",
	21: "Dash",
};

export function getSongName(
	level: GDLevelPreview,
	songs: Map<number, GDSongInfo>,
): string {
	if (level.customSongId > 0) {
		const song = songs.get(level.customSongId);
		return song ? song.name : `Song ${level.customSongId}`;
	}
	return OFFICIAL_SONG_NAMES[level.songId] || `Level ${level.songId}`;
}
