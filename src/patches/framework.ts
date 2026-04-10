export const addr: Record<string, string> = {
	isFlying: "0x5df",
	yVelocity: "0x845",
	gravityFlipped: "0xa22",
	upKeyDown: "0xb10",
	canJump: "0x18ce",
	isJumping: "0x18a3",
	wasBoosted: "0x9ab",
	inputPressed: "0x1086",
	flipMod: "0x4bd",
	_updateFlyJump: "0x15cf",
	updateJump: "0xc83",
	enterShipMode: "0x3a4",
	exitShipMode: "0xc06",
	hitGround: "0x1890",
	startRotateAction: "0x18a6",
	stopRotateAction: "0xa5f",
	updateGroundRotation: "0xb42",
	updateRotateAction: "0x1100",
	updateFlyRotation: "0xec0",
	_rotateActionActive: "0x12fd",
	_rotation: "0x1255",
	rotateActionTime: "0x97a",
	rotateActionDuration: "0x90e",
	rotateActionStart: "0x15c2",
	rotateActionDelta: "0x3ee",
	playerIsFalling: "0xcaa",
	lerpAngle: "0x1815",
	_playerLayers: "0x719",
	skinObject: "0x244",
	scene: "0x9d4",
	portalFlash: "0xc7a",
	checkCollisions: "0x636",
	sprite: "0xe42",
	setScale: "0x655",
	_gameLayer: "0x12ba",
	setFlying: "0xd80",
	particleEmitter1: "0x809",
	stop: "0x1852",
	particleEmitter2: "0x31c",
	particleEmitter3: "0x163d",
	shipDragEmitter: "0x1b6",
	restart: "0x9d9",
	start: "0x128f",
	streakActive: "0x1822",
	setShipVisual: "0xc52",
	visualRestore: "0x168f",
	die: "0x154",
	onGround: "onGround",
	lastGroundY: "lastGroundY",
	y: "y",
	lastY: "lastY",
};

class Scope {
	decoder: string;

	constructor(decoder: string) {
		this.decoder = decoder;
	}

	resolve(name: string): string {
		const hex = addr[name];
		if (!hex) throw new Error(`Unknown symbol: ${name}`);
		if (hex.startsWith("0x")) return `${this.decoder}(${hex})`;
		return `'${hex}'`;
	}

	prop(obj: string, name: string): string {
		return `${obj}[${this.resolve(name)}]`;
	}

	call(obj: string, method: string, ...args: string[]): string {
		return `${obj}[${this.resolve(method)}](${args.join(",")})`;
	}

	state(name: string): string {
		return this.prop("this['p']", name);
	}
}

interface Hook {
	name: string;
	find: string;
	replace: string;
}

const hooks: Hook[] = [];

export function $modify(name: string, find: string, replace: string) {
	hooks.push({ name, find, replace });
}

export function applyHooks(js: string): string {
	let result = js;
	for (const hook of hooks) {
		const idx = result.indexOf(hook.find);
		if (idx === -1) {
			console.warn(`$modify "${hook.name}" failed: string not found`);
			continue;
		}
		result = result.replace(hook.find, hook.replace);
	}
	return result;
}

export const BALL_GRAVITY_MULT = 0.6;
export const BALL_JUMP_VEL = 13.416;
export const BALL_TERMINAL = 30;
export const BALL_ROTATION_RATE = `(Math.PI*10/3/240)`;
export const BALL_PAD_MULT = 0.6;
export const BALL_RING_MULT = 0.7;

export const WAVE_SPEED = 16;

export const ROBOT_GRAVITY_MULT = 0.9;
export const ROBOT_JUMP_VEL = 11.180032;
export const ROBOT_TERMINAL = 30;
export const ROBOT_PAD_MULT = 0.8;
export const ROBOT_RING_MULT = 0.9;
export const ROBOT_BOOST_MAX = 0.5;

export const UFO_CLICK_BOOST = 14;
export const UFO_GRAVITY_FALLING = 0.4;
export const UFO_GRAVITY_RISING = 0.6;
export const UFO_TERMINAL_FALL = 12.8;
export const UFO_TERMINAL_RISE = 16;

export const SPEED_HALF = 0.7 / 0.9;
export const SPEED_NORMAL = 1.0;
export const SPEED_DOUBLE = 1.1 / 0.9;
export const SPEED_TRIPLE = 1.3 / 0.9;
