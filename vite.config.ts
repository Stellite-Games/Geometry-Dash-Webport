import { createReadStream, existsSync, readdirSync, statSync } from "node:fs";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, extname, join, resolve } from "node:path";
import { jsxPlugin } from "dreamland/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const STEAM_EXTS = new Set([".png", ".plist", ".fnt"]);

function globSteamAssets(steamPath: string): string[] {
	if (!existsSync(steamPath)) return [];
	return readdirSync(steamPath).filter((file) => STEAM_EXTS.has(extname(file)));
}

const MIME: Record<string, string> = {
	".png": "image/png",
	".plist": "application/xml",
	".fnt": "text/plain",
	".json": "application/json",
};

const GD_ICON_CDN =
	"https://cdn.cloudflare.steamstatic.com/steamcommunity/public/images/apps/322170/7fb2e71773468dbd98d56c733b604c92f5ab0ad4.jpg";

const faviconCachePath = join(homedir(), ".cache", "gd-favicon.jpg");

async function createFavicon(): Promise<string | null> {
	if (existsSync(faviconCachePath)) return faviconCachePath;
	try {
		await mkdir(join(homedir(), ".cache"), { recursive: true });
		const resp = await fetch(GD_ICON_CDN);
		if (!resp.ok) return null;
		const bytes = new Uint8Array(await resp.arrayBuffer());
		await writeFile(faviconCachePath, bytes);
		return faviconCachePath;
	} catch {
		return null;
	}
}

function steamAssetsPlugin(steamPath: string): Plugin {
	const files = globSteamAssets(steamPath);
	const fileMap = new Map(
		files.map((file) => [`/assets/steam/${file}`, resolve(steamPath, file)]),
	);

	return {
		name: "steam-assets",
		configureServer(server) {
			server.middlewares.use((req, res, next) => {
				if (req.url === "/favicon.png") {
					createFavicon().then((faviconPath) => {
						if (!faviconPath) return next();
						const stat = statSync(faviconPath);
						res.writeHead(200, {
							"Content-Type": "image/jpeg",
							"Content-Length": stat.size,
							"Cache-Control": "no-cache",
						});
						createReadStream(faviconPath).pipe(res);
					});
					return;
				}

				const absPath = fileMap.get(req.url ?? "");
				if (!absPath || !existsSync(absPath)) return next();

				const stat = statSync(absPath);
				const ext = absPath.slice(absPath.lastIndexOf("."));
				res.writeHead(200, {
					"Content-Type": MIME[ext] || "application/octet-stream",
					"Content-Length": stat.size,
					"Cache-Control": "no-cache",
				});
				createReadStream(absPath).pipe(res);
			});
		},
		async writeBundle(options) {
			const outDir = options.dir || "dist";
			const destDir = join(outDir, "assets", "steam");
			await mkdir(destDir, { recursive: true });
			for (const [, absPath] of fileMap) {
				if (existsSync(absPath)) {
					await copyFile(absPath, join(destDir, basename(absPath)));
				}
			}

			const faviconPath = await createFavicon();
			if (faviconPath) {
				await copyFile(faviconPath, join(outDir, "favicon.png"));
			}
		},
	};
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "GD_");
	const steamPath = resolve(
		(env.GD_STEAM_RESOURCES || "").replace(/^~/, homedir()),
	);

	return {
		publicDir: "geometrydash.com/game",
		server: { port: 3000 },
		preview: { port: 3000 },
		plugins: [
			jsxPlugin(),
			steamAssetsPlugin(steamPath),
			VitePWA({
				strategies: "injectManifest",
				srcDir: "src",
				filename: "sw.ts",
				registerType: "autoUpdate",
				injectManifest: {
					injectionPoint: undefined,
				},
				devOptions: {
					enabled: true,
					type: "module",
					suppressWarnings: true,
				},
			}),
		],
	};
});
