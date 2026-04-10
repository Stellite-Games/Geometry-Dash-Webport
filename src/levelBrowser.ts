import {
	downloadLevel,
	downloadSong,
	type GDLevelPreview,
	type GDSongInfo,
	getDifficultyName,
	getLengthName,
	getSongInfo,
	getSongName,
	initApi,
	SEARCH_TYPE,
	type SearchResult,
	searchLevels,
} from "./api";
import { DIFFICULTY_SPRITE } from "./consts";
import {
	hasOnlineLevel,
	hasOnlineSong,
	saveOnlineLevel,
	saveOnlineSong,
} from "./save";

declare const window: Window &
	typeof globalThis & {
		_eeLevelName: string;
		_eeLevelSong: string;
		_eeAutoPlay: boolean;
		_eeLevelBrowserType: number | undefined;
	};

const CELL_H = 80;
const CELLS_PER_PAGE = 5;

const EVEN_ROW = 0xa1582c;
const ODD_ROW = 0xbf723e;

interface BrowserState {
	query: string;
	searchType: number;
	page: number;
	results: GDLevelPreview[];
	songs: Map<number, GDSongInfo>;
	totalResults: number;
	loading: boolean;
	inputEl: HTMLInputElement | null;
	listContainer: Phaser.GameObjects.Container | null;
	statusText: Phaser.GameObjects.BitmapText | null;
	pageText: Phaser.GameObjects.BitmapText | null;
	loadingText: Phaser.GameObjects.BitmapText | null;
	gameW: number;
	gameH: number;
	resizeHandler: (() => void) | null;
}

const state: BrowserState = {
	query: "",
	searchType: SEARCH_TYPE.FEATURED,
	page: 0,
	results: [],
	songs: new Map(),
	totalResults: 0,
	loading: false,
	inputEl: null,
	listContainer: null,
	statusText: null,
	pageText: null,
	loadingText: null,
	gameW: 960,
	gameH: 640,
	resizeHandler: null,
};

function centerX(): number {
	return state.gameW / 2;
}

function listW(): number {
	return Math.min(700, state.gameW - 40);
}

function listH(): number {
	return state.gameH - 240;
}

function listX(): number {
	return centerX() - listW() / 2;
}

const LIST_Y = 95;

function R(scene: Phaser.Scene, frameName: string): string | null {
	const atlases = [
		"GJ_GameSheet03-hd",
		"GJ_GameSheet-hd",
		"GJ_GameSheet02-hd",
		"GJ_GameSheetGlow-hd",
		"GJ_GameSheet04-hd",
		"GJ_WebSheet",
	];
	for (const atlas of atlases) {
		if (scene.textures.exists(atlas)) {
			const tex = scene.textures.get(atlas);
			if (tex.has(frameName)) return atlas;
		}
	}
	return null;
}

function addSprite(
	scene: Phaser.Scene,
	posX: number,
	posY: number,
	frameName: string,
): Phaser.GameObjects.Sprite | null {
	const atlas = R(scene, frameName);
	if (!atlas) return null;
	return scene.add.sprite(posX, posY, atlas, frameName);
}

function addButton(
	scene: Phaser.Scene,
	posX: number,
	posY: number,
	frameName: string,
	callback: () => void,
	scale = 1.0,
): Phaser.GameObjects.Sprite | null {
	const sprite = addSprite(scene, posX, posY, frameName);
	if (!sprite) return null;
	sprite.setScale(scale);
	sprite.setInteractive({ useHandCursor: true });
	sprite.on("pointerover", () => {
		scene.tweens.killTweensOf(sprite);
		scene.tweens.add({
			targets: sprite,
			scaleX: scale * 1.1,
			scaleY: scale * 1.1,
			duration: 100,
			ease: "Quad.Out",
		});
	});
	sprite.on("pointerout", () => {
		scene.tweens.killTweensOf(sprite);
		scene.tweens.add({
			targets: sprite,
			scaleX: scale,
			scaleY: scale,
			duration: 150,
			ease: "Quad.Out",
		});
	});
	sprite.on("pointerdown", () => callback());
	return sprite;
}

function createSearchInput(): HTMLInputElement {
	const input = document.createElement("input");
	input.type = "text";
	input.placeholder = "Search levels...";
	input.maxLength = 30;
	Object.assign(input.style, {
		position: "absolute",
		left: `${centerX() - 160}px`,
		top: "52px",
		width: "260px",
		height: "28px",
		fontSize: "16px",
		fontFamily: "Arial, sans-serif",
		background: "rgba(0, 56, 141, 0.9)",
		color: "#ffffff",
		border: "2px solid #0066cc",
		borderRadius: "4px",
		padding: "2px 8px",
		outline: "none",
		zIndex: "1000",
	});
	return input;
}

function positionInput(input: HTMLInputElement) {
	const canvas = document.querySelector("canvas");
	if (!canvas) return;
	const rect = canvas.getBoundingClientRect();
	const scaleX = rect.width / state.gameW;
	const scaleY = rect.height / state.gameH;
	const scale = Math.min(scaleX, scaleY);
	const offX = (rect.width - state.gameW * scale) / 2 + rect.left;
	const offY = (rect.height - state.gameH * scale) / 2 + rect.top;
	Object.assign(input.style, {
		left: `${offX + (centerX() - 130) * scale}px`,
		top: `${offY + 42 * scale}px`,
		width: `${260 * scale}px`,
		height: `${28 * scale}px`,
		fontSize: `${16 * scale}px`,
	});
}

async function doSearch(scene: Phaser.Scene, resetPage = true) {
	if (state.loading) return;
	state.loading = true;
	if (resetPage) state.page = 0;

	if (state.loadingText) state.loadingText.setVisible(true);

	try {
		await initApi();
		const result: SearchResult = await searchLevels(
			state.query,
			state.page,
			state.searchType,
		);
		state.results = result.levels;
		state.songs = result.songs;
		state.totalResults = result.total;
		renderResults(scene);
	} catch (err) {
		if (state.statusText) {
			state.statusText.setText(`Error: ${(err as Error).message}`);
			state.statusText.setVisible(true);
		}
	} finally {
		state.loading = false;
		if (state.loadingText) state.loadingText.setVisible(false);
	}
}

function renderResults(scene: Phaser.Scene) {
	if (state.listContainer) {
		state.listContainer.removeAll(true);
	}

	if (state.results.length === 0) {
		if (state.statusText) {
			state.statusText.setText("No levels found");
			state.statusText.setVisible(true);
		}
		if (state.pageText) state.pageText.setVisible(false);
		return;
	}

	if (state.statusText) state.statusText.setVisible(false);

	const totalPages = Math.ceil(state.totalResults / CELLS_PER_PAGE);
	if (state.pageText) {
		state.pageText.setText(`Page ${state.page + 1} / ${totalPages}`);
		state.pageText.setVisible(true);
	}

	for (let idx = 0; idx < state.results.length && idx < CELLS_PER_PAGE; idx++) {
		const level = state.results[idx];
		const cellY = LIST_Y + idx * CELL_H;
		const rowColor = idx % 2 === 0 ? EVEN_ROW : ODD_ROW;

		const cellBg = scene.add.rectangle(
			centerX(),
			cellY + CELL_H / 2,
			listW(),
			CELL_H - 2,
			rowColor,
			0.85,
		);
		(state.listContainer as Phaser.GameObjects.Container).add(cellBg);

		const diffName = getDifficultyName(level);
		const diffFrame = DIFFICULTY_SPRITE[diffName] || "diffIcon_00_btn_001.png";
		const diffSprite = addSprite(
			scene,
			listX() + 35,
			cellY + CELL_H / 2 - 5,
			diffFrame,
		);
		if (diffSprite) {
			diffSprite.setScale(0.7);
			(state.listContainer as Phaser.GameObjects.Container).add(diffSprite);
		}

		if (level.stars > 0) {
			const starIcon = addSprite(
				scene,
				listX() + 35,
				cellY + CELL_H / 2 + 22,
				"GJ_bigStar_001.png",
			);
			if (starIcon) {
				starIcon.setScale(0.25);
				(state.listContainer as Phaser.GameObjects.Container).add(starIcon);
			}
			const starLabel = scene.add.bitmapText(
				listX() + 48,
				cellY + CELL_H / 2 + 22,
				"chatFont",
				String(level.stars),
				12,
			);
			starLabel.setOrigin(0, 0.5);
			(state.listContainer as Phaser.GameObjects.Container).add(starLabel);
		}

		const nameText = scene.add.bitmapText(
			listX() + 70,
			cellY + 14,
			"bigFont",
			level.name,
			20,
		);
		nameText.setOrigin(0, 0);
		nameText.setMaxWidth(280);
		(state.listContainer as Phaser.GameObjects.Container).add(nameText);

		const creatorText = scene.add.bitmapText(
			listX() + 72,
			cellY + 38,
			"goldFont",
			`By ${level.creatorName || "Unknown"}`,
			13,
		);
		creatorText.setOrigin(0, 0);
		creatorText.setMaxWidth(200);
		(state.listContainer as Phaser.GameObjects.Container).add(creatorText);

		const songNameStr = getSongName(level, state.songs);
		const songLabel = scene.add.bitmapText(
			listX() + 72,
			cellY + 55,
			"chatFont",
			songNameStr,
			12,
		);
		songLabel.setOrigin(0, 0);
		songLabel.setTint(level.customSongId > 0 ? 0xff84d3 : 0x27cefa);
		(state.listContainer as Phaser.GameObjects.Container).add(songLabel);

		const statsStr = `${getLengthName(level)}  DL:${formatNumber(level.downloads)}  ${level.likes >= 0 ? "+" : ""}${formatNumber(level.likes)}`;
		const statsText = scene.add.bitmapText(
			listX() + 380,
			cellY + 55,
			"chatFont",
			statsStr,
			11,
		);
		statsText.setOrigin(0, 0);
		statsText.setTint(0xaaaaaa);
		(state.listContainer as Phaser.GameObjects.Container).add(statsText);

		const viewBtn = scene.add.rectangle(
			listX() + listW() - 55,
			cellY + CELL_H / 2,
			80,
			36,
			0x4a9b2e,
			1,
		);
		viewBtn.setInteractive({ useHandCursor: true });
		viewBtn.on("pointerdown", () => downloadAndPlay(scene, level));
		viewBtn.on("pointerover", () => viewBtn.setScale(1.05));
		viewBtn.on("pointerout", () => viewBtn.setScale(1.0));
		(state.listContainer as Phaser.GameObjects.Container).add(viewBtn);

		const viewLabel = scene.add.bitmapText(
			listX() + listW() - 55,
			cellY + CELL_H / 2,
			"chatFont",
			"Play",
			14,
		);
		viewLabel.setOrigin(0.5, 0.5);
		(state.listContainer as Phaser.GameObjects.Container).add(viewLabel);
	}
}

function formatNumber(num: number): string {
	if (Math.abs(num) >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
	if (Math.abs(num) >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
	return String(num);
}

async function downloadAndPlay(scene: Phaser.Scene, level: GDLevelPreview) {
	if (state.loading) return;
	state.loading = true;
	if (state.loadingText) {
		state.loadingText.setText("Downloading level...");
		state.loadingText.setVisible(true);
	}

	try {
		const hasLevel = await hasOnlineLevel(level.id);
		let levelData: string;

		if (hasLevel) {
			levelData = "";
		} else {
			const fullLevel = await downloadLevel(level.id);
			levelData = fullLevel.levelData;
			await saveOnlineLevel(level.id, levelData);
		}

		if (level.customSongId > 0) {
			const hasSong = await hasOnlineSong(level.customSongId);
			if (!hasSong) {
				if (state.loadingText) state.loadingText.setText("Downloading song...");
				let songUrl = "";
				const cached = state.songs.get(level.customSongId);
				if (cached?.downloadUrl) {
					songUrl = cached.downloadUrl;
				} else {
					const songInfo = await getSongInfo(level.customSongId);
					songUrl = songInfo.downloadUrl;
				}
				if (songUrl) {
					const songData = await downloadSong(songUrl);
					await saveOnlineSong(level.customSongId, songData);
				}
			}
		}

		removeInput();

		window._eeLevelName = level.name;
		window._eeLevelSong = getSongName(level, state.songs);
		window._eeAutoPlay = true;

		const url = new URL(window.location.href);
		url.searchParams.set("level", `online_${level.id}`);
		window.history.replaceState({}, "", url.toString());

		scene.scene.start("GameScene");
	} catch (err) {
		if (state.loadingText) {
			state.loadingText.setText(`Error: ${(err as Error).message}`);
		}
	} finally {
		state.loading = false;
	}
}

function removeInput() {
	if (state.inputEl) {
		state.inputEl.remove();
		state.inputEl = null;
	}
}

interface CategoryDef {
	label: string;
	type: number;
}

const CATEGORIES: CategoryDef[] = [
	{ label: "Featured", type: SEARCH_TYPE.FEATURED },
	{ label: "Trending", type: SEARCH_TYPE.TRENDING },
	{ label: "Recent", type: SEARCH_TYPE.RECENT },
	{ label: "Most DL", type: SEARCH_TYPE.MOST_DOWNLOADED },
	{ label: "Most Liked", type: SEARCH_TYPE.MOST_LIKED },
	{ label: "Awarded", type: SEARCH_TYPE.AWARDED },
	{ label: "Magic", type: SEARCH_TYPE.MAGIC },
];

export function createLevelBrowserScene(): Record<string, unknown> {
	return {
		key: "levelBrowser",
		create: function (this: Phaser.Scene) {
			state.gameW = this.cameras.main.width;
			state.gameH = this.cameras.main.height;

			if (typeof window._eeLevelBrowserType === "number") {
				state.searchType = window._eeLevelBrowserType;
				window._eeLevelBrowserType = undefined;
			}

			const bg = this.add.rectangle(
				centerX(),
				state.gameH / 2,
				state.gameW,
				state.gameH,
				0x003366,
			);
			bg.setDepth(-10);

			const backBtn = addButton(
				this,
				28,
				28,
				"GJ_arrow_01_001.png",
				() => {
					removeInput();
					this.scene.start("creatorPanel");
				},
				0.5,
			);
			if (backBtn) {
				backBtn.setFlipX(true);
				backBtn.setDepth(10);
			}

			const titleText = this.add.bitmapText(
				centerX() + 60,
				22,
				"bigFont",
				"Online Levels",
				28,
			);
			titleText.setOrigin(0.5, 0.5);
			titleText.setDepth(5);

			state.inputEl = createSearchInput();
			document.body.appendChild(state.inputEl);
			positionInput(state.inputEl);

			state.resizeHandler = () => {
				if (state.inputEl) positionInput(state.inputEl);
			};
			window.addEventListener("resize", state.resizeHandler);

			(
				this as unknown as Record<
					string,
					{ once(event: string, cb: () => void): void }
				>
			).events.once("shutdown", () => {
				if (state.resizeHandler) {
					window.removeEventListener("resize", state.resizeHandler);
					state.resizeHandler = null;
				}
				removeInput();
			});

			state.inputEl.addEventListener("keydown", (ev: KeyboardEvent) => {
				if (ev.key === "Enter") {
					state.query = (state.inputEl as HTMLInputElement).value;
					state.searchType = state.query
						? SEARCH_TYPE.SEARCH
						: SEARCH_TYPE.FEATURED;
					doSearch(this);
				}
			});

			const searchBtnBg = this.add.rectangle(
				centerX() + 160,
				50,
				70,
				30,
				0x0066cc,
				1,
			);
			searchBtnBg.setDepth(5);
			searchBtnBg.setInteractive({ useHandCursor: true });
			searchBtnBg.on("pointerover", () => searchBtnBg.setScale(1.05));
			searchBtnBg.on("pointerout", () => searchBtnBg.setScale(1.0));
			searchBtnBg.on("pointerdown", () => {
				state.query = state.inputEl?.value || "";
				state.searchType = state.query
					? SEARCH_TYPE.SEARCH
					: SEARCH_TYPE.FEATURED;
				doSearch(this);
			});

			const searchBtnLabel = this.add.bitmapText(
				centerX() + 160,
				50,
				"chatFont",
				"Search",
				14,
			);
			searchBtnLabel.setOrigin(0.5, 0.5);
			searchBtnLabel.setDepth(6);

			let catX = listX() + 30;
			const catY = 78;
			for (const cat of CATEGORIES) {
				const catLabel = this.add.bitmapText(
					catX,
					catY,
					"chatFont",
					cat.label,
					13,
				);
				catLabel.setOrigin(0, 0.5);
				catLabel.setInteractive({ useHandCursor: true });
				catLabel.setTint(cat.type === state.searchType ? 0xffff00 : 0xaaaaaa);
				catLabel.on("pointerdown", () => {
					state.searchType = cat.type;
					state.query = "";
					if (state.inputEl) state.inputEl.value = "";
					doSearch(this);
				});
				catLabel.on("pointerover", () => catLabel.setTint(0xffffff));
				catLabel.on("pointerout", () =>
					catLabel.setTint(cat.type === state.searchType ? 0xffff00 : 0xaaaaaa),
				);
				catX += cat.label.length * 9 + 20;
			}

			state.listContainer = this.add.container(0, 0);
			state.listContainer.setDepth(2);

			state.statusText = this.add.bitmapText(
				centerX(),
				LIST_Y + listH() / 2,
				"chatFont",
				"Loading...",
				18,
			);
			state.statusText.setOrigin(0.5, 0.5);
			state.statusText.setDepth(3);

			state.loadingText = this.add.bitmapText(
				centerX(),
				state.gameH - 60,
				"chatFont",
				"Loading...",
				16,
			);
			state.loadingText.setOrigin(0.5, 0.5);
			state.loadingText.setDepth(10);
			state.loadingText.setVisible(false);

			const totalPages = Math.max(
				1,
				Math.ceil(state.totalResults / CELLS_PER_PAGE),
			);
			state.pageText = this.add.bitmapText(
				centerX(),
				state.gameH - 30,
				"goldFont",
				`Page ${state.page + 1} / ${totalPages}`,
				16,
			);
			state.pageText.setOrigin(0.5, 0.5);
			state.pageText.setDepth(5);
			state.pageText.setVisible(false);

			const prevBtn = addButton(
				this,
				centerX() - 140,
				state.gameH - 30,
				"GJ_arrow_02_001.png",
				() => {
					if (state.page > 0) {
						state.page--;
						doSearch(this, false);
					}
				},
				0.35,
			);
			if (prevBtn) prevBtn.setDepth(5);

			const nextBtn = addButton(
				this,
				centerX() + 140,
				state.gameH - 30,
				"GJ_arrow_01_001.png",
				() => {
					const totalPg = Math.ceil(state.totalResults / CELLS_PER_PAGE);
					if (state.page < totalPg - 1) {
						state.page++;
						doSearch(this, false);
					}
				},
				0.35,
			);
			if (nextBtn) nextBtn.setDepth(5);

			doSearch(this);
		},
	};
}
