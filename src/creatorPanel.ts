import { SEARCH_TYPE } from "./api";

declare const window: Window &
	typeof globalThis & {
		_eeLevelBrowserType: number | undefined;
	};

const BG_COLOR = 0x0066ff;

const GRID_BUTTONS: Array<{
	frame: string;
	label: string;
	row: number;
	col: number;
	action: string;
}> = [
	{
		frame: "GJ_createBtn_001.png",
		label: "Create",
		row: 0,
		col: 0,
		action: "create",
	},
	{
		frame: "GJ_savedBtn_001.png",
		label: "Saved",
		row: 0,
		col: 1,
		action: "saved",
	},
	{
		frame: "GJ_highscoreBtn_001.png",
		label: "Scores",
		row: 0,
		col: 2,
		action: "scores",
	},
	{
		frame: "GJ_featuredBtn_001.png",
		label: "Featured",
		row: 1,
		col: 0,
		action: "featured",
	},
	{
		frame: "GJ_mapPacksBtn_001.png",
		label: "Map Packs",
		row: 1,
		col: 1,
		action: "mapPacks",
	},
	{
		frame: "GJ_searchBtn_001.png",
		label: "Search",
		row: 1,
		col: 2,
		action: "search",
	},
];

function findAtlas(scene: Phaser.Scene, frameName: string): string | null {
	const atlases = [
		"GJ_GameSheet03-hd",
		"GJ_GameSheet04-hd",
		"GJ_GameSheet-hd",
		"GJ_GameSheet02-hd",
		"GJ_GameSheetGlow-hd",
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
	const atlas = findAtlas(scene, frameName);
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
			scaleX: scale * 1.26,
			scaleY: scale * 1.26,
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

function handleAction(scene: Phaser.Scene, action: string) {
	switch (action) {
		case "featured":
			window._eeLevelBrowserType = SEARCH_TYPE.FEATURED;
			scene.scene.start("levelBrowser");
			break;
		case "search":
			window._eeLevelBrowserType = SEARCH_TYPE.SEARCH;
			scene.scene.start("levelBrowser");
			break;
		case "scores":
			window._eeLevelBrowserType = SEARCH_TYPE.HALL_OF_FAME;
			scene.scene.start("levelBrowser");
			break;
		default:
			break;
	}
}

export function createCreatorPanelScene(): Record<string, unknown> {
	return {
		key: "creatorPanel",
		create: function (this: Phaser.Scene) {
			const gameW = this.cameras.main.width;
			const gameH = this.cameras.main.height;
			const cx = gameW / 2;
			const cy = gameH / 2;

			const bg = this.add.rectangle(cx, cy, gameW, gameH, BG_COLOR);
			bg.setDepth(-10);

			const titleText = this.add.bitmapText(cx, 40, "bigFont", "Creator", 44);
			titleText.setOrigin(0.5, 0.5);
			titleText.setDepth(5);

			const gridCx = cx;
			const gridCy = cy + 10;
			const spacingX = gameW * 0.2;
			const spacingY = gameH * 0.22;
			const btnScale = 0.85;

			for (const btn of GRID_BUTTONS) {
				const offsetX = (btn.col - 1) * spacingX;
				const offsetY = (btn.row - 0.5) * spacingY;
				const posX = gridCx + offsetX;
				const posY = gridCy + offsetY;

				const sprite = addButton(
					this,
					posX,
					posY,
					btn.frame,
					() => handleAction(this, btn.action),
					btnScale,
				);

				if (sprite) {
					sprite.setDepth(5);
				} else {
					const fallback = this.add.bitmapText(
						posX,
						posY,
						"goldFont",
						btn.label,
						28,
					);
					fallback.setOrigin(0.5, 0.5);
					fallback.setDepth(5);
					fallback.setInteractive({ useHandCursor: true });
					fallback.on("pointerdown", () => handleAction(this, btn.action));
				}
			}

			const backBtn = addButton(
				this,
				28,
				28,
				"GJ_arrow_01_001.png",
				() => this.scene.start("GameScene"),
				0.5,
			);
			if (backBtn) {
				backBtn.setFlipX(true);
				backBtn.setDepth(10);
			}

			const topBar = addSprite(this, cx, 16, "GJ_topBar_001.png");
			if (topBar) {
				topBar.setDisplaySize(gameW, 32);
				topBar.setDepth(5);
			}

			const cornerL = addSprite(this, 55, gameH - 55, "GJ_sideArt_001.png");
			if (cornerL) {
				cornerL.setScale(0.7);
				cornerL.setAlpha(0.5);
				cornerL.setDepth(5);
			}

			const cornerR = addSprite(
				this,
				gameW - 55,
				gameH - 55,
				"GJ_sideArt_001.png",
			);
			if (cornerR) {
				cornerR.setScale(0.7);
				cornerR.setFlipX(true);
				cornerR.setAlpha(0.5);
				cornerR.setDepth(5);
			}

			this.input.keyboard?.on("keydown-ESC", () =>
				this.scene.start("GameScene"),
			);
		},
	};
}
