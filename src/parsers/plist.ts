interface SpriteFrame {
	name: string;
	x: number;
	y: number;
	w: number;
	h: number;
	rotated: boolean;
	offsetX: number;
	offsetY: number;
	sourceW: number;
	sourceH: number;
}

function parsePoint(s: string): [number, number] {
	const m = s.match(/{(-?[\d.]+),\s*(-?[\d.]+)}/);

	return m ? [parseFloat(m[1]), parseFloat(m[2])] : [0, 0];
}

function parseRect(s: string): [number, number, number, number] {
	const m = s.match(
		/{{(-?[\d.]+),\s*(-?[\d.]+)},\s*{(-?[\d.]+),\s*(-?[\d.]+)}}/,
	);

	return m
		? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3]), parseFloat(m[4])]
		: [0, 0, 0, 0];
}

function getChildText(dict: Element, key: string): string | null {
	const keys = dict.querySelectorAll(":scope > key");
	for (const k of keys)
		if (k.textContent === key) {
			const next = k.nextElementSibling;

			return next?.textContent ?? null;
		}
	return null;
}

function getChildBool(dict: Element, key: string): boolean {
	const keys = dict.querySelectorAll(":scope > key");
	for (const k of keys)
		if (k.textContent === key) return k.nextElementSibling?.tagName === "true";

	return false;
}

function getChildDict(dict: Element, key: string): Element | null {
	const keys = dict.querySelectorAll(":scope > key");
	for (const k of keys)
		if (k.textContent === key) {
			const next = k.nextElementSibling;

			return next?.tagName === "dict" ? next : null;
		}

	return null;
}

function parsePlist(xml: string): Map<string, SpriteFrame> {
	const parser = new DOMParser();

	const doc = parser.parseFromString(xml, "text/xml");
	const root = doc.querySelector("plist > dict");
	if (!root) return new Map();
	const framesDict = getChildDict(root, "frames");
	if (!framesDict) return new Map();

	const result = new Map<string, SpriteFrame>();
	const keys = framesDict.querySelectorAll(":scope > key");

	for (const k of keys) {
		const name = k.textContent;
		if (!name) continue;
		const dict = k.nextElementSibling as Element;
		if (dict?.tagName !== "dict") continue;

		const [tx, ty, tw, th] = parseRect(
			getChildText(dict, "textureRect") || "{{0,0},{0,0}}",
		);
		const [ox, oy] = parsePoint(getChildText(dict, "spriteOffset") || "{0,0}");
		const [sw, sh] = parsePoint(
			getChildText(dict, "spriteSourceSize") || "{0,0}",
		);
		const rotated = getChildBool(dict, "textureRotated");

		result.set(name, {
			name,
			x: tx,
			y: ty,
			w: rotated ? th : tw,
			h: rotated ? tw : th,
			rotated,
			offsetX: ox,
			offsetY: oy,
			sourceW: sw,
			sourceH: sh,
		});
	}

	return result;
}

interface PhaserFrame {
	filename: string;
	rotated: boolean;
	trimmed: boolean;
	sourceSize: { w: number; h: number };
	spriteSourceSize: { x: number; y: number; w: number; h: number };
	frame: { x: number; y: number; w: number; h: number };
}

interface PhaserAtlas {
	textures: [
		{
			image: string;
			format: string;
			size: { w: number; h: number };
			scale: number;
			frames: PhaserFrame[];
		},
	];
	meta: { app: string };
}

export function plistToPhaser(xml: string, imageName: string): PhaserAtlas {
	const frames = parsePlist(xml);
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "text/xml");
	const root = doc.querySelector("plist > dict") as Element;
	const metaDict = getChildDict(root, "metadata");
	const [texW, texH] = metaDict
		? parsePoint(getChildText(metaDict, "size") || "{0,0}")
		: [0, 0];

	const phaserFrames: PhaserFrame[] = [];

	for (const [, frame] of frames) {
		const displayW = frame.rotated ? frame.h : frame.w;
		const displayH = frame.rotated ? frame.w : frame.h;
		const trimmed =
			frame.offsetX !== 0 ||
			frame.offsetY !== 0 ||
			displayW !== frame.sourceW ||
			displayH !== frame.sourceH;
		const sssX = (frame.sourceW - displayW) / 2 + frame.offsetX;
		const sssY = (frame.sourceH - displayH) / 2 - frame.offsetY;

		phaserFrames.push({
			filename: frame.name,
			rotated: frame.rotated,
			trimmed,
			sourceSize: { w: frame.sourceW, h: frame.sourceH },
			spriteSourceSize: { x: sssX, y: sssY, w: displayW, h: displayH },
			frame: {
				x: frame.x,
				y: frame.y,
				w: frame.w,
				h: frame.h,
			},
		});
	}

	return {
		textures: [
			{
				image: imageName,
				format: "RGBA8888",
				size: { w: texW, h: texH },
				scale: 0.5,
				frames: phaserFrames,
			},
		],
		meta: { app: "gd-web-port" },
	};
}

interface DerotateResult {
	json: string;
	png: ArrayBuffer | null;
}

export interface PlistApi {
	parseParticlePlist: (xml: string) => Record<string, number | string>;
	plistToPhaser: (xml: string, imageName: string) => PhaserAtlas;
	derotateAtlas: (
		plistXml: string,
		imageName: string,
		pngBuffer: ArrayBuffer,
	) => Promise<DerotateResult>;
	readLevelData: (levelId: number) => Promise<string | null>;
	readSongData: (songId: number) => Promise<ArrayBuffer | null>;
}

export function parseParticlePlist(
	xml: string,
): Record<string, number | string> {
	const parser = new DOMParser();
	const doc = parser.parseFromString(xml, "text/xml");
	const root = doc.querySelector("plist > dict");
	if (!root) return {};

	const result: Record<string, number | string> = {};
	const keys = root.querySelectorAll(":scope > key");

	for (const key of keys) {
		const name = key.textContent;
		if (!name) continue;
		const next = key.nextElementSibling;
		if (!next) continue;

		if (next.tagName === "real" || next.tagName === "integer") {
			result[name] = parseFloat(next.textContent || "0");
		} else if (next.tagName === "string") {
			result[name] = next.textContent || "";
		}
	}

	return result;
}

const OVERFLOW_PAD = 2;

export async function derotateAtlas(
	plistXml: string,
	imageName: string,
	pngBuffer: ArrayBuffer,
): Promise<DerotateResult> {
	const frames = parsePlist(plistXml);

	const rotatedFrames: SpriteFrame[] = [];
	for (const [, frame] of frames) {
		if (frame.rotated) rotatedFrames.push(frame);
	}

	if (rotatedFrames.length === 0) {
		const atlas = plistToPhaser(plistXml, imageName);
		return { json: JSON.stringify(atlas), png: null };
	}

	const blob = new Blob([pngBuffer], { type: "image/png" });
	const blobUrl = URL.createObjectURL(blob);
	const atlasImg = await new Promise<HTMLImageElement>((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = () => reject(new Error("Failed to load atlas PNG"));
		img.src = blobUrl;
	});
	URL.revokeObjectURL(blobUrl);
	const origW = atlasImg.width;
	const origH = atlasImg.height;

	let cursorX = 0;
	let cursorY = origH + OVERFLOW_PAD;
	let rowHeight = 0;
	const placements: Array<{
		frame: SpriteFrame;
		destX: number;
		destY: number;
		derotatedW: number;
		derotatedH: number;
	}> = [];

	for (const frame of rotatedFrames) {
		const derotatedW = frame.h;
		const derotatedH = frame.w;

		if (cursorX + derotatedW > origW && cursorX > 0) {
			cursorY += rowHeight + OVERFLOW_PAD;
			cursorX = 0;
			rowHeight = 0;
		}

		placements.push({
			frame,
			destX: cursorX,
			destY: cursorY,
			derotatedW,
			derotatedH,
		});

		cursorX += derotatedW + OVERFLOW_PAD;
		rowHeight = Math.max(rowHeight, derotatedH);
	}

	const totalH = cursorY + rowHeight + OVERFLOW_PAD;

	const canvas = document.createElement("canvas");
	canvas.width = origW;
	canvas.height = totalH;
	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	ctx.drawImage(atlasImg, 0, 0);

	const derotatedPositions = new Map<
		string,
		{ destX: number; destY: number; derotatedW: number; derotatedH: number }
	>();

	for (const placement of placements) {
		const { frame, destX, destY, derotatedW, derotatedH } = placement;

		ctx.save();
		ctx.translate(destX, destY + frame.w);
		ctx.rotate(-Math.PI / 2);
		ctx.drawImage(
			atlasImg,
			frame.x,
			frame.y,
			frame.w,
			frame.h,
			0,
			0,
			frame.w,
			frame.h,
		);
		ctx.restore();

		derotatedPositions.set(frame.name, {
			destX,
			destY,
			derotatedW,
			derotatedH,
		});
	}

	const parser = new DOMParser();
	const doc = parser.parseFromString(plistXml, "text/xml");
	const root = doc.querySelector("plist > dict") as Element;
	const metaDict = getChildDict(root, "metadata");
	const [texW] = metaDict
		? parsePoint(getChildText(metaDict, "size") || "{0,0}")
		: [0, 0];

	const phaserFrames: PhaserFrame[] = [];

	for (const [, frame] of frames) {
		const pos = derotatedPositions.get(frame.name);

		if (pos) {
			const displayW = pos.derotatedW;
			const displayH = pos.derotatedH;
			const trimmed =
				frame.offsetX !== 0 ||
				frame.offsetY !== 0 ||
				displayW !== frame.sourceW ||
				displayH !== frame.sourceH;
			const sssX = (frame.sourceW - displayW) / 2 + frame.offsetX;
			const sssY = (frame.sourceH - displayH) / 2 - frame.offsetY;

			phaserFrames.push({
				filename: frame.name,
				rotated: false,
				trimmed,
				sourceSize: { w: frame.sourceW, h: frame.sourceH },
				spriteSourceSize: { x: sssX, y: sssY, w: displayW, h: displayH },
				frame: {
					x: pos.destX,
					y: pos.destY,
					w: displayW,
					h: displayH,
				},
			});
		} else {
			const displayW = frame.w;
			const displayH = frame.h;
			const trimmed =
				frame.offsetX !== 0 ||
				frame.offsetY !== 0 ||
				displayW !== frame.sourceW ||
				displayH !== frame.sourceH;
			const sssX = (frame.sourceW - displayW) / 2 + frame.offsetX;
			const sssY = (frame.sourceH - displayH) / 2 - frame.offsetY;

			phaserFrames.push({
				filename: frame.name,
				rotated: false,
				trimmed,
				sourceSize: { w: frame.sourceW, h: frame.sourceH },
				spriteSourceSize: { x: sssX, y: sssY, w: displayW, h: displayH },
				frame: {
					x: frame.x,
					y: frame.y,
					w: displayW,
					h: displayH,
				},
			});
		}
	}

	const atlas: PhaserAtlas = {
		textures: [
			{
				image: imageName,
				format: "RGBA8888",
				size: { w: texW, h: totalH },
				scale: 0.5,
				frames: phaserFrames,
			},
		],
		meta: { app: "gd-web-port" },
	};

	const outBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
		canvas.toBlob((result) => {
			if (!result) return reject(new Error("canvas.toBlob returned null"));
			result.arrayBuffer().then(resolve, reject);
		}, "image/png");
	});

	return { json: JSON.stringify(atlas), png: outBuffer };
}
