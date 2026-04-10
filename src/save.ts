import { TFS } from "@terbiumos/tfs/browser";
import { Logger } from "tslog";

const log = new Logger({ name: "Save" });

let tfsInstance: InstanceType<typeof TFS> | null = null;

async function getTFS(): Promise<InstanceType<typeof TFS>> {
	if (tfsInstance) return tfsInstance;
	tfsInstance = await TFS.init();
	return tfsInstance;
}

export async function saveOnlineLevel(
	levelId: number,
	levelData: string,
): Promise<void> {
	const tfs = await getTFS();
	const dir = "/levels";
	const dirExists = await tfs.fs.promises.exists(dir);
	if (!dirExists) {
		await tfs.fs.promises.mkdir(dir);
	}
	await tfs.fs.promises.writeFile(`${dir}/${levelId}.txt`, levelData, "utf8");
	log.info(`Saved online level ${levelId}`);
}

export async function readOnlineLevel(levelId: number): Promise<string | null> {
	const tfs = await getTFS();
	const path = `/levels/${levelId}.txt`;
	const exists = await tfs.fs.promises.exists(path);
	if (!exists) return null;
	return (await tfs.fs.promises.readFile(path, "utf8")) as string;
}

export async function saveOnlineSong(
	songId: number,
	data: ArrayBuffer,
): Promise<void> {
	const tfs = await getTFS();
	const dir = "/songs";
	const dirExists = await tfs.fs.promises.exists(dir);
	if (!dirExists) {
		await tfs.fs.promises.mkdir(dir);
	}
	await tfs.fs.promises.writeFile(`${dir}/${songId}.mp3`, data, "arraybuffer");
	log.info(`Saved online song ${songId} (${data.byteLength} bytes)`);
}

export async function readOnlineSong(
	songId: number,
): Promise<ArrayBuffer | null> {
	const tfs = await getTFS();
	const path = `/songs/${songId}.mp3`;
	const exists = await tfs.fs.promises.exists(path);
	if (!exists) return null;
	return (await tfs.fs.promises.readFile(path, "arraybuffer")) as ArrayBuffer;
}

export async function hasOnlineLevel(levelId: number): Promise<boolean> {
	const tfs = await getTFS();
	return tfs.fs.promises.exists(`/levels/${levelId}.txt`);
}

export async function hasOnlineSong(songId: number): Promise<boolean> {
	const tfs = await getTFS();
	return tfs.fs.promises.exists(`/songs/${songId}.mp3`);
}
