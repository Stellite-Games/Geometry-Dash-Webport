/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module "@mercuryworkshop/libcurl-transport" {
	type RawHeaders = Array<[string, string]>;

	interface TransferrableResponse {
		status: number;
		statusText: string;
		headers: RawHeaders;
		body: ReadableStream;
	}

	interface LibcurlClientOptions {
		wisp: string;
		websocket?: string;
		proxy?: string;
		transport?: string;
		connections?: Array<number>;
	}

	export default class LibcurlClient {
		ready: boolean;
		constructor(options: LibcurlClientOptions);
		init(): Promise<void>;
		meta(): Promise<void>;
		request(
			remote: URL,
			method: string,
			body: BodyInit | null,
			headers: RawHeaders,
			signal: AbortSignal | undefined,
		): Promise<TransferrableResponse>;
		connect(
			url: URL,
			protocols: string[],
			requestHeaders: RawHeaders,
			onopen: (protocol: string, extensions: string) => void,
			onmessage: (data: Blob | ArrayBuffer | string) => void,
			onclose: (code: number, reason: string) => void,
			onerror: (error: string) => void,
		): [
			(data: Blob | ArrayBuffer | string) => void,
			(code: number, reason: string) => void,
		];
	}

	export { LibcurlClient };
}

declare namespace Phaser {
	namespace Geom {
		class Rectangle {
			constructor(x: number, y: number, width: number, height: number);
			static Contains(rect: Rectangle, x: number, y: number): boolean;
		}
	}

	namespace GameObjects {
		class GameObject {
			setDepth(value: number): this;
			setScale(x: number, y?: number): this;
			setAlpha(value: number): this;
			setOrigin(x: number, y?: number): this;
			setScrollFactor(x: number, y?: number): this;
			setInteractive(
				config?: Record<string, unknown> | Geom.Rectangle,
				callback?: (...args: never) => unknown,
			): this;
			setTint(value: number): this;
			setMaxWidth(value: number): this;
			setText(value: string): this;
			setVisible(value: boolean): this;
			setFlipX(value: boolean): this;
			setFlipY(value: boolean): this;
			setDisplaySize(width: number, height: number): this;
			on(event: string, callback: (...args: never) => unknown): this;
			off(event: string, callback?: (...args: never) => unknown): this;
			destroy(): void;
			x: number;
			y: number;
			width: number;
			height: number;
			displayWidth: number;
			displayHeight: number;
		}

		class Sprite extends GameObject {
			constructor(
				scene: Scene,
				x: number,
				y: number,
				texture: string,
				frame?: string,
			);
		}

		class BitmapText extends GameObject {
			constructor(
				scene: Scene,
				x: number,
				y: number,
				font: string,
				text?: string,
				size?: number,
			);
			text: string;
		}

		class Container extends GameObject {
			constructor(
				scene: Scene,
				x?: number,
				y?: number,
				children?: GameObject[],
			);
			add(child: GameObject | GameObject[]): this;
			remove(child: GameObject | GameObject[]): this;
			removeAll(destroyChild?: boolean): this;
			setInteractive(
				shape: Geom.Rectangle,
				callback: (...args: never) => unknown,
			): this;
			list: GameObject[];
		}

		class Rectangle extends GameObject {
			constructor(
				scene: Scene,
				x: number,
				y: number,
				width: number,
				height: number,
				fillColor?: number,
				fillAlpha?: number,
			);
			setFillStyle(color: number, alpha?: number): this;
		}

		class Graphics extends GameObject {
			fillStyle(color: number, alpha?: number): this;
			fillRect(x: number, y: number, width: number, height: number): this;
			lineStyle(width: number, color: number, alpha?: number): this;
			strokeRect(x: number, y: number, width: number, height: number): this;
			clear(): this;
		}

		class TileSprite extends GameObject {
			constructor(
				scene: Scene,
				x: number,
				y: number,
				width: number,
				height: number,
				texture: string,
				frame?: string,
			);
			tilePositionX: number;
		}
	}

	namespace Textures {
		class TextureManager {
			exists(key: string): boolean;
			get(key: string): { has(frame: string): boolean };
		}
	}

	class Scene {
		add: {
			sprite(
				x: number,
				y: number,
				texture: string,
				frame?: string,
			): GameObjects.Sprite;
			bitmapText(
				x: number,
				y: number,
				font: string,
				text?: string,
				size?: number,
			): GameObjects.BitmapText;
			container(
				x?: number,
				y?: number,
				children?: GameObjects.GameObject[],
			): GameObjects.Container;
			rectangle(
				x: number,
				y: number,
				width: number,
				height: number,
				fillColor?: number,
				fillAlpha?: number,
			): GameObjects.Rectangle;
			graphics(): GameObjects.Graphics;
			image(
				x: number,
				y: number,
				texture: string,
				frame?: string,
			): GameObjects.Sprite;
			tileSprite(
				x: number,
				y: number,
				width: number,
				height: number,
				texture: string,
				frame?: string,
			): GameObjects.TileSprite;
		};
		textures: Textures.TextureManager;
		scene: {
			start(key: string, data?: Record<string, unknown>): void;
			stop(key?: string): void;
			restart(data?: Record<string, unknown>): void;
		};
		input: {
			keyboard: {
				on(event: string, callback: (...args: never) => unknown): void;
			};
			on(event: string, callback: (...args: never) => unknown): void;
		};
		tweens: {
			add(config: Record<string, unknown>): unknown;
			killTweensOf(target: unknown): void;
		};
		cameras: {
			main: {
				width: number;
				height: number;
				setBackgroundColor(color: string | number): void;
			};
		};
		game: {
			registry: {
				set(key: string, value: unknown): void;
				get(key: string): unknown;
			};
		};
	}

	class Game {
		constructor(config: Record<string, unknown>);
		scene: {
			add(
				key: string,
				scene: Record<string, unknown> | typeof Scene,
				autoStart?: boolean,
			): void;
		};
	}
}
