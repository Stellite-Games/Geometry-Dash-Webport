const BG_COLOR = 0x1a1a2e;

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

export function createGarageScene(): Record<string, unknown> {
	return {
		key: "garage",
		create: function (this: Phaser.Scene) {
			const gameW = this.cameras.main.width;
			const gameH = this.cameras.main.height;
			const cx = gameW / 2;
			const cy = gameH / 2;

			const bg = this.add.rectangle(cx, cy, gameW, gameH, BG_COLOR);
			bg.setDepth(-10);

			const titleText = this.add.bitmapText(cx, 40, "bigFont", "Icon Kit", 44);
			titleText.setOrigin(0.5, 0.5);
			titleText.setDepth(5);

			const placeholder = this.add.bitmapText(
				cx,
				cy,
				"goldFont",
				"Coming Soon",
				36,
			);
			placeholder.setOrigin(0.5, 0.5);
			placeholder.setDepth(5);
			placeholder.setTint(0xaaaaaa);

			const playerIcon = addSprite(this, cx, cy - 80, "player_01_001.png");
			if (playerIcon) {
				playerIcon.setScale(2.5);
				playerIcon.setDepth(5);
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

			this.input.keyboard?.on("keydown-ESC", () =>
				this.scene.start("GameScene"),
			);
		},
	};
}
