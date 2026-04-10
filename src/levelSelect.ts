import {
	DIFFICULTY_SPRITE,
	LEVEL_DIFFICULTY,
	LEVEL_IDS,
	LEVEL_NAMES,
	LEVEL_SONGS,
} from "./consts";

declare const window: Window &
	typeof globalThis & {
		_eeLevelName: string;
		_eeLevelSong: string;
		_eeAutoPlay: boolean;
	};

const BG_COLORS = [
	0x0066ff, 0x00ccff, 0x9933ff, 0xff3366, 0xff6600, 0x00cc66, 0x3366ff,
	0xff0066, 0x6633cc,
];

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

let currentPage = 0;
const totalLevels = LEVEL_IDS.length;
let pageContainer: Phaser.GameObjects.Container | null = null;
let bgRect: Phaser.GameObjects.Rectangle | null = null;

function playLevel(scene: Phaser.Scene, levelId: number) {
	window._eeLevelName = LEVEL_NAMES[levelId] || `Level ${levelId}`;
	window._eeLevelSong = LEVEL_SONGS[levelId] || "Stereo Madness";
	window._eeAutoPlay = true;

	const url = new URL(window.location.href);
	url.searchParams.set("level", String(levelId));
	window.history.replaceState({}, "", url.toString());

	scene.scene.start("GameScene");
}

function buildProgressBar(
	scene: Phaser.Scene,
	centerX: number,
	centerY: number,
	barWidth: number,
	label: string,
	fillColor: number,
): Phaser.GameObjects.Container {
	const barH = 24;
	const barContainer = scene.add.container(centerX, centerY);

	const labelText = scene.add.bitmapText(0, -20, "chatFont", label, 20);
	labelText.setOrigin(0.5, 0.5);
	barContainer.add(labelText);

	const barBg = scene.add.rectangle(0, 5, barWidth, barH, 0x000000, 0.5);
	barContainer.add(barBg);

	const barFill = scene.add.rectangle(
		-barWidth / 2 + 1,
		5,
		0,
		barH - 2,
		fillColor,
		1,
	);
	barFill.setOrigin(0, 0.5);
	barContainer.add(barFill);

	const pctText = scene.add.bitmapText(0, 5, "chatFont", "0%", 16);
	pctText.setOrigin(0.5, 0.5);
	barContainer.add(pctText);

	return barContainer;
}

function buildLevelPage(
	scene: Phaser.Scene,
	levelIdx: number,
	gameW: number,
	gameH: number,
): Phaser.GameObjects.Container {
	const levelId = LEVEL_IDS[levelIdx];
	const cx = gameW / 2;
	const cy = gameH / 2 - 15;
	const panelW = gameW * 0.75;
	const panelH = gameH * 0.65;
	const barW = panelW * 0.7;
	const container = scene.add.container(cx, cy);

	const difficulty = LEVEL_DIFFICULTY[levelId] || "N/A";
	const diffFrame = DIFFICULTY_SPRITE[difficulty] || "diffIcon_00_btn_001.png";
	const levelName = LEVEL_NAMES[levelId] || `Level ${levelId}`;

	const panelBorder = scene.add.rectangle(
		0,
		0,
		panelW + 4,
		panelH + 4,
		0x4a3728,
		0.8,
	);
	container.add(panelBorder);

	const panelBg = scene.add.rectangle(0, 0, panelW, panelH, 0x000000, 0.5);
	panelBg.setInteractive({ useHandCursor: true });
	panelBg.on("pointerdown", () => playLevel(scene, levelId));
	container.add(panelBg);

	const faceX = -panelW / 2 + 75;
	const faceY = -panelH / 2 + 85;
	const diffSprite = addSprite(scene, faceX, faceY, diffFrame);
	if (diffSprite) {
		diffSprite.setScale(1.8);
		container.add(diffSprite);
	}

	const nameX = -panelW / 2 + 140;
	const nameY = -panelH / 2 + 65;
	const nameText = scene.add.bitmapText(nameX, nameY, "bigFont", levelName, 38);
	nameText.setOrigin(0, 0.5);
	nameText.setMaxWidth(panelW - 180);
	container.add(nameText);

	const coinY = -panelH / 2 + 110;
	for (let idx = 0; idx < 3; idx++) {
		const coinSprite = addSprite(
			scene,
			nameX + idx * 35,
			coinY,
			"GJ_coinsIcon_001.png",
		);
		if (coinSprite) {
			coinSprite.setScale(0.7);
			coinSprite.setAlpha(0.4);
			container.add(coinSprite);
		}
	}

	const normalBar = buildProgressBar(
		scene,
		0,
		-20,
		barW,
		"Normal Mode",
		0x00ff00,
	);
	container.add(normalBar);

	const practiceBar = buildProgressBar(
		scene,
		0,
		75,
		barW,
		"Practice Mode",
		0x00ffff,
	);
	container.add(practiceBar);

	const pageLabel = scene.add.bitmapText(
		0,
		panelH / 2 - 25,
		"chatFont",
		`Level ${levelIdx + 1} of ${totalLevels}`,
		14,
	);
	pageLabel.setOrigin(0.5, 0.5);
	pageLabel.setTint(0xaaaaaa);
	container.add(pageLabel);

	return container;
}

function showPage(scene: Phaser.Scene, pageIdx: number) {
	if (pageContainer) {
		pageContainer.destroy();
		pageContainer = null;
	}

	currentPage = Math.max(0, Math.min(pageIdx, totalLevels - 1));

	const bgColor = BG_COLORS[currentPage % BG_COLORS.length];
	if (bgRect) {
		(bgRect as Phaser.GameObjects.Rectangle).setFillStyle(bgColor, 1);
	}

	const gameW = scene.cameras.main.width;
	const gameH = scene.cameras.main.height;
	pageContainer = buildLevelPage(scene, currentPage, gameW, gameH);
	pageContainer.setDepth(1);

	pageContainer.setAlpha(0);
	scene.tweens.add({
		targets: pageContainer,
		alpha: 1,
		duration: 150,
		ease: "Quad.Out",
	});
}

function goNext(scene: Phaser.Scene) {
	if (currentPage < totalLevels - 1) {
		showPage(scene, currentPage + 1);
	}
}

function goPrev(scene: Phaser.Scene) {
	if (currentPage > 0) {
		showPage(scene, currentPage - 1);
	}
}

export function createLevelSelectScene(): Record<string, unknown> {
	return {
		key: "levelSelect",
		create: function (this: Phaser.Scene) {
			const gameW = this.cameras.main.width;
			const gameH = this.cameras.main.height;
			const cx = gameW / 2;
			const cy = gameH / 2;
			const panelY = cy - 15;

			const initColor = BG_COLORS[currentPage % BG_COLORS.length];
			bgRect = this.add.rectangle(cx, cy, gameW, gameH, initColor);
			bgRect.setDepth(-10);

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

			showPage(this, currentPage);

			const leftArrow = addButton(
				this,
				40,
				panelY,
				"navArrowBtn_001.png",
				() => goPrev(this),
				1.0,
			);
			if (leftArrow) {
				leftArrow.setFlipX(true);
				leftArrow.setDepth(5);
			} else {
				const fallbackLeft = addButton(
					this,
					40,
					panelY,
					"GJ_arrow_02_001.png",
					() => goPrev(this),
					1.0,
				);
				if (fallbackLeft) fallbackLeft.setDepth(5);
			}

			const rightArrow = addButton(
				this,
				gameW - 40,
				panelY,
				"navArrowBtn_001.png",
				() => goNext(this),
				1.0,
			);
			if (rightArrow) {
				rightArrow.setDepth(5);
			} else {
				const fallbackRight = addButton(
					this,
					gameW - 40,
					panelY,
					"GJ_arrow_01_001.png",
					() => goNext(this),
					1.0,
				);
				if (fallbackRight) fallbackRight.setDepth(5);
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

			this.input.keyboard?.on("keydown-LEFT", () => goPrev(this));
			this.input.keyboard?.on("keydown-RIGHT", () => goNext(this));
			this.input.keyboard?.on("keydown-ENTER", () => {
				playLevel(this, LEVEL_IDS[currentPage]);
			});
		},
	};
}
