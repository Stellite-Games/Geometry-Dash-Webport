import pako from "pako";

const TRIGGER_IDS = new Set([
	22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 55, 56, 57, 58, 59, 104, 105,
	221, 717, 718, 743, 744, 900, 915, 899, 901, 1006, 1007, 1049, 1268, 1346,
	1347, 1520, 1585, 1595, 1611, 1612, 1613, 1615, 1616, 1811, 1812, 1814, 1815,
	1817, 1818, 1819, 1912, 1913, 1914, 1916, 1917, 1931, 1932, 1933, 1934, 1935,
	2015, 2016, 2062, 2063, 2066, 2067, 2068, 2069, 2899, 2900, 2901, 2903, 2904,
	2909, 2910, 2912, 2916, 2919, 2920, 2921, 2922, 2923, 2924, 2925, 2999, 3006,
	3007, 3008, 3009, 3010, 3011, 3012, 3013, 3014, 3015, 3016, 3022, 3024, 3029,
	3030, 3031, 3032, 3033, 3600, 3602, 3603, 3604, 3605, 3606, 3607, 3608, 3609,
	3612, 3613, 3614, 3615, 3617, 3618, 3619, 3620, 3640, 3641, 3642, 3643, 3645,
	3655, 3660, 3661, 3662,
]);
const PORTAL_IDS = new Set([
	10, 11, 12, 13, 45, 46, 47, 99, 101, 111, 200, 201, 202, 203, 286, 287, 660,
	745, 747, 749, 1331, 1334, 1933,
]);
const DECO_GLOW_IDS = new Set([18, 19, 20, 21, 41]);
const BACKGROUND_IDS = new Set([73]);

const DEFAULT_HEADER_KEYS: Record<string, string> = {
	kA13: "0",
	kA15: "0",
	kA16: "0",
	kA14: "",
	kA6: "0",
	kA7: "0",
	kA25: "0",
	kA17: "0",
	kA18: "0",
	kS39: "0",
	kA2: "0",
	kA3: "0",
	kA8: "0",
	kA4: "0",
	kA9: "0",
	kA10: "0",
	kA22: "0",
	kA23: "0",
	kA24: "0",
	kA27: "0",
	kA40: "0",
	kA48: "0",
	kA41: "0",
	kA42: "0",
	kA28: "0",
	kA29: "0",
	kA31: "0",
	kA32: "0",
	kA36: "0",
	kA43: "0",
	kA44: "0",
	kA45: "0",
	kA46: "0",
	kA47: "0",
	kA33: "0",
	kA34: "0",
	kA35: "0",
	kA37: "0",
	kA38: "0",
	kA39: "0",
	kA19: "0",
	kA26: "0",
	kA20: "0",
	kA21: "0",
	kA49: "0",
	kA50: "0",
	kA51: "0",
	kA52: "0",
	kA53: "",
	kA54: "0",
	kA11: "0",
};

function b64urlDecode(str: string): Uint8Array {
	let s = str.replace(/-/g, "+").replace(/_/g, "/");
	while (s.length % 4) s += "=";
	const binary = atob(s);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

	return bytes;
}

function b64urlEncode(data: Uint8Array): string {
	let binary = "";
	for (let i = 0; i < data.length; i++) binary += String.fromCharCode(data[i]);
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function decodeLevelString(encoded: string): string {
	const compressed = b64urlDecode(encoded);
	const inflated = pako.inflate(compressed);

	return new TextDecoder().decode(inflated);
}

function encodeLevelString(raw: string): string {
	const compressed = pako.gzip(new TextEncoder().encode(raw));

	return b64urlEncode(compressed);
}

function parseKV(str: string): Record<string, string> {
	const result: Record<string, string> = {};
	const parts = str.split(",");
	for (let i = 0; i < parts.length - 1; i += 2) {
		result[parts[i]] = parts[i + 1];
	}

	return result;
}

const serializeKV = (obj: Record<string, string>): string =>
	Object.entries(obj)
		.map(([k, v]) => `${k},${v}`)
		.join(",");

function convertHeader(header: Record<string, string>): Record<string, string> {
	const out = { ...header };
	for (const [key, defaultVal] of Object.entries(DEFAULT_HEADER_KEYS)) {
		out[key] ??= defaultVal;
	}

	return out;
}

function assignRenderLayer(id: number): string {
	if (TRIGGER_IDS.has(id) || PORTAL_IDS.has(id) || BACKGROUND_IDS.has(id))
		return "1";
	if (DECO_GLOW_IDS.has(id)) return "3";

	return "2";
}

function convertObject(obj: Record<string, string>): Record<string, string> {
	const id = parseInt(obj["1"], 10);
	const out = { ...obj };
	if (out["4"] === "0") delete out["4"];
	if (out["5"] === "0") delete out["5"];
	if (out["6"] === "0") delete out["6"];

	if (id === 899) {
		out["35"] = out["35"] || "1";
		out["36"] = out["36"] || "1";
	} else if (id === 901 || id === 1006) {
		out["36"] = out["36"] || "1";
	} else if (PORTAL_IDS.has(id)) {
		out["36"] = "1";
	}

	out["155"] ??= assignRenderLayer(id);

	return out;
}

const COIN_ID = 142;

export function convertLevel(inputEncoded: string): {
	encoded: string;
	stats: { total: number; kept: number; stripped: number; score: number };
} {
	const decoded = decodeLevelString(inputEncoded.trim());
	const segments = decoded.split(";");
	const header = parseKV(segments[0]);
	const convertedHeader = convertHeader(header);
	const parts = [serializeKV(convertedHeader)];
	let kept = 0;
	let stripped = 0;

	const coinXPositions: number[] = [];
	for (let idx = 1; idx < segments.length; idx++) {
		const seg = segments[idx].trim();
		if (!seg) continue;
		const obj = parseKV(seg);
		const id = parseInt(obj["1"], 10);
		if (id === COIN_ID) {
			coinXPositions.push(parseFloat(obj["2"] || "0"));
		}
	}
	const sortedCoinX = [...coinXPositions].sort((posA, posB) => posA - posB);

	let coinCounter = 0;
	for (let idx = 1; idx < segments.length; idx++) {
		const seg = segments[idx].trim();
		if (!seg) continue;

		const obj = parseKV(seg);
		const id = parseInt(obj["1"], 10);
		if (Number.isNaN(id)) {
			stripped++;
			continue;
		}

		const converted = convertObject(obj);

		if (id === COIN_ID) {
			const xPos = parseFloat(obj["2"] || "0");
			const coinIndex = sortedCoinX.indexOf(xPos);
			converted["200"] = String(coinIndex >= 0 ? coinIndex : coinCounter);
			coinCounter++;
		}

		parts.push(serializeKV(converted));
		kept++;
	}

	const total = kept + stripped;
	const score = total > 0 ? Math.round((kept / total) * 10000) / 100 : 100;

	return {
		encoded: encodeLevelString(parts.join(";")),
		stats: { total, kept, stripped, score },
	};
}
