import gdrwebObjects from "./gdrweb-objects.json";
import {
	BALL_PAD_MULT,
	BALL_RING_MULT,
	ROBOT_PAD_MULT,
	ROBOT_RING_MULT,
	SPEED_DOUBLE,
	SPEED_HALF,
	SPEED_NORMAL,
	SPEED_TRIPLE,
} from "./patches";

type GdrColorType = "Base" | "Black" | "Detail";

interface GdrChild {
	texture: string;
	color_type?: GdrColorType;
	x?: number;
	y?: number;
	z?: number;
	scale_x?: number;
	scale_y?: number;
	flip_x?: boolean;
	flip_y?: boolean;
	rot?: number;
	opacity?: number;
	children?: GdrChild[];
}

interface GdrObjectEntry {
	color_type?: GdrColorType;
	swap_base_detail?: boolean;
	default_base_color_channel?: number;
	default_detail_color_channel?: number;
	children?: GdrChild[];
}

const gdrData = gdrwebObjects as Record<string, GdrObjectEntry>;

export interface PadEffectConfig {
	burst: {
		lifespanMin: number;
		lifespanMax: number;
		speedMin: number;
		speedMax: number;
		scaleStart: number;
		scaleEnd: number;
		alphaStart: number;
		alphaEnd: number;
		explodeCount: number;
		destroyDelay: number;
	};
	idle: {
		lifespanMin: number;
		lifespanMax: number;
		speedMin: number;
		speedMax: number;
		angleMin: number;
		angleMax: number;
		scaleStart: number;
		scaleEnd: number;
		alphaStart: number;
		alphaEnd: number;
		frequency: number;
		quantity: number;
		emitZoneHalfW: number;
		emitZoneHalfH: number;
	};
	shockwave: {
		radius: number;
		expandScale: number;
		duration: number;
		lineWidth: number;
	};
	ringIdle: {
		lifespanMin: number;
		lifespanMax: number;
		speedMin: number;
		speedMax: number;
		scaleStart: number;
		scaleEnd: number;
		alphaStart: number;
		alphaEnd: number;
		gravityY: number;
		frequency: number;
		quantity: number;
		emitRadius: number;
	};
}

const SQUARE_TEXTURE_PX = 16;
const CONTENT_SCALE = 2;

export function translateEffects(
	bump: Record<string, number | string>,
	ring: Record<string, number | string>,
): PadEffectConfig {
	const lifeMs = (bump.particleLifespan as number) * 1000;
	const lifeVarMs = (bump.particleLifespanVariance as number) * 1000;
	const speed = bump.speed as number;
	const speedVar = bump.speedVariance as number;
	const angle = bump.angle as number;
	const angleVar = bump.angleVariance as number;
	const startSize = bump.startParticleSize as number;
	const endSize = bump.finishParticleSize as number;
	const startAlpha = bump.startColorAlpha as number;
	const endAlpha = bump.finishColorAlpha as number;
	const maxPart = bump.maxParticles as number;
	const srcVarX = bump.sourcePositionVariancex as number;
	const srcVarY = bump.sourcePositionVariancey as number;

	const ringMaxR = ring.maxRadius as number;
	const ringLifeMs = (ring.particleLifespan as number) * 1000;
	const ringLifeVarMs = (ring.particleLifespanVariance as number) * 1000;
	const ringStartSize = ring.startParticleSize as number;
	const ringEndSize = ring.finishParticleSize as number;
	const ringMaxPart = ring.maxParticles as number;
	const ringStartAlpha = (ring.startColorAlpha as number) ?? 0;
	const ringEndAlpha = (ring.finishColorAlpha as number) ?? 0;
	const ringStartAlphaVar = (ring.startColorVarianceAlpha as number) || 0;
	const ringIsRadial = (ring.emitterType as number) === 1;

	const lifespanMin = Math.round(lifeMs - lifeVarMs);
	const lifespanMax = Math.round(lifeMs + lifeVarMs);
	const scaleStart = +((startSize * CONTENT_SCALE) / SQUARE_TEXTURE_PX).toFixed(
		4,
	);
	const scaleEnd = +((endSize * CONTENT_SCALE) / SQUARE_TEXTURE_PX).toFixed(4);

	return {
		burst: {
			lifespanMin,
			lifespanMax,
			speedMin: speed - speedVar,
			speedMax: speed + speedVar,
			scaleStart,
			scaleEnd,
			alphaStart: startAlpha,
			alphaEnd: endAlpha,
			explodeCount: maxPart,
			destroyDelay: lifespanMax + 200,
		},
		idle: {
			lifespanMin,
			lifespanMax,
			speedMin: speed - speedVar,
			speedMax: speed + speedVar,
			angleMin: -(angle + angleVar),
			angleMax: -(angle - angleVar),
			scaleStart,
			scaleEnd,
			alphaStart: startAlpha,
			alphaEnd: endAlpha,
			frequency: Math.round(lifeMs / maxPart),
			quantity: 1,
			emitZoneHalfW: srcVarX * CONTENT_SCALE,
			emitZoneHalfH: srcVarY * CONTENT_SCALE,
		},
		shockwave: {
			radius: Math.round(ringMaxR / 2),
			expandScale: 4,
			duration: Math.round(ringLifeMs),
			lineWidth: 2,
		},
		ringIdle: {
			lifespanMin: Math.round(ringLifeMs - ringLifeVarMs),
			lifespanMax: Math.round(ringLifeMs + ringLifeVarMs),
			speedMin: ringIsRadial ? 5 : 55,
			speedMax: ringIsRadial ? 15 : 95,
			scaleStart: +(
				(ringStartSize * CONTENT_SCALE) /
				SQUARE_TEXTURE_PX
			).toFixed(4),
			scaleEnd: +((ringEndSize * CONTENT_SCALE) / SQUARE_TEXTURE_PX).toFixed(4),
			alphaStart: +Math.max(ringStartAlpha, ringStartAlphaVar * 0.5).toFixed(4),
			alphaEnd: +Math.min(ringEndAlpha, 1).toFixed(4),
			gravityY: ringIsRadial ? 0 : 300,
			frequency: Math.round(ringLifeMs / ringMaxPart),
			quantity: 1,
			emitRadius: Math.round(ringMaxR * CONTENT_SCALE),
		},
	};
}

interface ObjectDef {
	id: number;
	frame: string | null;
	type: string;
	gridW: number;
	gridH: number;
	sheet?: string;
	spriteW?: number;
	spriteH?: number;
	hitboxScaleX?: number;
	hitboxScaleY?: number;
	black?: boolean;
	children?: {
		frame: string;
		x: number;
		y: number;
		sheet?: string;
		blend?: string;
		tint?: number;
		z?: number;
		audioScale?: boolean;
	}[];
	sub?: string;
	portalParticle?: boolean;
	portalParticleColor?: number;
	audioScale?: boolean;
	padParticleColor?: number;
	inOriginalOs: boolean;
	collision?: {
		type: string;
		width: number;
		height: number;
	};
	padVelocity?: number;
	padFlipGravity?: boolean;
	ringVelocity?: number;
	ringFlipGravity?: boolean;
	ringParticleColor?: number;
	portalDispatch?: string;
	isCoin?: boolean;
	coinParticleColor?: number;
	spinSpeed?: number | [number, number];
}

const OBJECTS: ObjectDef[] = [
	{
		id: 32,
		frame: null,
		type: "ss",
		gridW: 0,
		gridH: 0,
		inOriginalOs: false,
	},
	{
		id: 33,
		frame: null,
		type: "ss",
		gridW: 0,
		gridH: 0,
		inOriginalOs: false,
	},
	{
		id: 73,
		frame: "square_c_05_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 110,
		frame: "d_chain_02_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 50,
		frame: "d_ball_01_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		audioScale: true,
		inOriginalOs: true,
	},
	{
		id: 54,
		frame: "d_ball_05_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		audioScale: true,
		inOriginalOs: true,
	},
	{
		id: 142,
		frame: "secretCoin_01_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet02-hd",
		inOriginalOs: true,
		isCoin: true,
		coinParticleColor: 0xffc832,
		collision: {
			type: "coin",
			width: 44,
			height: 44,
		},
	},
	{
		id: 62,
		frame: "square_b_01_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		children: [{ frame: "blockOutline_02_001.png", x: 0, y: 7.25 }],
		inOriginalOs: true,
	},
	{
		id: 65,
		frame: "square_b_04_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		children: [{ frame: "blockOutline_02_001.png", x: 0, y: 7.25 }],
		inOriginalOs: true,
	},
	{
		id: 68,
		frame: "square_b_06_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		children: [{ frame: "blockOutline_02_001.png", x: 0, y: 7.25 }],
		inOriginalOs: true,
	},
	{
		id: 35,
		frame: "bump_01_001.png",
		type: "es",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		padParticleColor: 0xffff00,
		inOriginalOs: true,
		collision: {
			type: "ypad",
			width: 50,
			height: 8,
		},
		padVelocity: 32.0,
	},
	{
		id: 140,
		frame: "bump_03_001.png",
		type: "es",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		padParticleColor: 0xff00ff,
		inOriginalOs: true,
		collision: {
			type: "ppad",
			width: 50,
			height: 10,
		},
		padVelocity: 20.8,
	},
	{
		id: 67,
		frame: "gravbump_01_001.png",
		type: "es",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		padParticleColor: 0x00ffff,
		inOriginalOs: true,
		collision: {
			type: "gpad",
			width: 50,
			height: 12,
		},
		padVelocity: 25.6,
		padFlipGravity: true,
	},
	{
		id: 36,
		frame: "ring_01_001.png",
		type: "is",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		audioScale: true,
		inOriginalOs: true,
		collision: {
			type: "yring",
			width: 72,
			height: 72,
		},
		ringVelocity: 22.360064,
		ringParticleColor: 0xffff00,
	},
	{
		id: 10,
		frame: "portal_01_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "gravity_normal",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0x00ffff,
		inOriginalOs: true,
		collision: {
			type: "gnorm",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p'][_0x5f48d1(0xa22)]=!0x1;",
			"this['p']['yVelocity']/=2;",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 11,
		frame: "portal_02_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "gravity_flip",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xffff00,
		inOriginalOs: true,
		collision: {
			type: "gflip",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p'][_0x5f48d1(0xa22)]=!0x0;",
			"this['p']['yVelocity']/=2;",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 47,
		frame: "portal_07_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "ball",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xff8000,
		inOriginalOs: false,
		collision: {
			type: "ball",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"if(!this['p']['_eeBall']){",
			"this['p']['_eeBall']=true;",
			"this['p']['_eeBallCanClick']=true;",
			"if(this['p'][_0x5f48d1(0x5df)]){this[_0x5f48d1(0xc06)]();}",
			"this['p'][_0x5f48d1(0x845)]*=0.5;",
			"this['p'][_0x5f48d1(0x18a3)]=false;",
			"this['p']['onGround']=false;",
			"this['p'][_0x5f48d1(0x18ce)]=false;",
			"this['p'][_0x5f48d1(0x9ab)]=false;",
			"this[_0x5f48d1(0xa5f)]();",
			"this[_0x5f48d1(0x1255)]=0;",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](0.85);",
			"}",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 745,
		frame: "portal_09_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "wave",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xffff00,
		inOriginalOs: false,
		collision: {
			type: "wave",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"if(!this['p']['_eeDart']){",
			"this['p']['_eeBall']=false;",
			"this['p']['_eeRobot']=false;",
			"this['p']['_eeRobotBoosting']=false;",
			"this['p']['_eeRobotJumped']=false;",
			"if(!this['p'][_0x5f48d1(0x5df)]){this[_0x5f48d1(0x3a4)](_0x1b13b8);}",
			"this['p']['_eeDart']=true;",
			"this['p'][_0x5f48d1(0x845)]*=0.5;",
			"this[_0x5f48d1(0xa5f)]();",
			"this[_0x5f48d1(0x1255)]=0;",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](0.7);",
			"}",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 747,
		frame: "portal_10_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "robot",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xff0000,
		inOriginalOs: false,
		collision: {
			type: "robot",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"if(!this['p']['_eeRobot']){",
			"this['p']['_eeBall']=false;",
			"this['p']['_eeDart']=false;",
			"if(this['p'][_0x5f48d1(0x5df)]){this['exitShipMode']();}",
			"this['p']['_eeRobot']=true;",
			"this['p']['_eeRobotBoosting']=false;",
			"this['p']['_eeRobotJumped']=false;",
			"this['p']['_eeRobotBoostTime']=0;",
			"this['p'][_0x5f48d1(0x845)]*=0.5;",
			"this['p'][_0x5f48d1(0x18a3)]=false;",
			"this['p']['onGround']=false;",
			"this['p'][_0x5f48d1(0x18ce)]=false;",
			"this['p'][_0x5f48d1(0x9ab)]=false;",
			"this[_0x5f48d1(0xa5f)]();",
			"this[_0x5f48d1(0x1255)]=0;",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](1);",
			"}",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 69,
		frame: "blockOutline_01_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 70,
		frame: "lightsquare_01_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 71,
		frame: "blockOutline_03_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 74,
		frame: "blockOutline_04_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 75,
		frame: "blockOutline_05_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 85,
		frame: "d_cogwheel_01_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: [90, 180],
	},
	{
		id: 86,
		frame: "d_cogwheel_02_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: [90, 180],
	},
	{
		id: 87,
		frame: "d_cogwheel_03_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: [90, 180],
	},
	{
		id: 97,
		frame: "d_cogwheel_04_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: [90, 180],
	},
	{
		id: 90,
		frame: "blockOutline_01_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 91,
		frame: "lightsquare_01_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 92,
		frame: "blockOutline_03_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 93,
		frame: "blockOutline_06_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 94,
		frame: "lightsquare_01_05_color_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 95,
		frame: "blockOutline_04_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 96,
		frame: "blockOutline_05_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	// Size portals
	{
		id: 99,
		frame: "portal_08_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "mini",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0x00ff00,
		inOriginalOs: false,
		collision: {
			type: "mini",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p']['_eeMini']=true;",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](0.6);",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 101,
		frame: "portal_09_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "normal_size",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xff00ff,
		inOriginalOs: false,
		collision: {
			type: "bigsize",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p']['_eeMini']=false;",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](1);",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	// UFO portal
	{
		id: 111,
		frame: "portal_10_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "ufo",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xffff00,
		inOriginalOs: false,
		collision: {
			type: "ufo",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"if(!this['p']['_eeUfo']){",
			"this['p']['_eeBall']=false;",
			"this['p']['_eeDart']=false;",
			"this['p']['_eeRobot']=false;",
			"this['p']['_eeRobotBoosting']=false;",
			"this['p']['_eeRobotJumped']=false;",
			"if(!this['p'][_0x5f48d1(0x5df)]){this[_0x5f48d1(0x3a4)](_0x1b13b8);}",
			"this['p']['_eeUfo']=true;",
			"this['p']['_eeUfoCanClick']=true;",
			"this['p'][_0x5f48d1(0x845)]*=0.5;",
			"this['p'][_0x5f48d1(0x18a3)]=false;",
			"this['p']['onGround']=false;",
			"this['p'][_0x5f48d1(0x18ce)]=false;",
			"this['p'][_0x5f48d1(0x9ab)]=false;",
			"this[_0x5f48d1(0xa5f)]();",
			"this[_0x5f48d1(0x1255)]=0;",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](0.85);",
			"}",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	// Speed portals
	{
		id: 200,
		frame: "boost_01_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "speed_half",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xffff00,
		inOriginalOs: false,
		collision: {
			type: "sphalf",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			`this['p']['_eeSpeedMult']=${SPEED_HALF};`,
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 201,
		frame: "boost_02_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "speed_normal",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0x00ffff,
		inOriginalOs: false,
		collision: {
			type: "spnorm",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			`this['p']['_eeSpeedMult']=${SPEED_NORMAL};`,
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 202,
		frame: "boost_03_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "speed_double",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xff8000,
		inOriginalOs: false,
		collision: {
			type: "spdbl",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			`this['p']['_eeSpeedMult']=${SPEED_DOUBLE};`,
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 203,
		frame: "boost_04_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "speed_triple",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xff0000,
		inOriginalOs: false,
		collision: {
			type: "sptrpl",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			`this['p']['_eeSpeedMult']=${SPEED_TRIPLE};`,
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 106,
		frame: "d_02_chain_01_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 107,
		frame: "d_02_chain_02_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 113,
		frame: "d_brick_01_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 114,
		frame: "d_brick_02_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 115,
		frame: "d_brick_03_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 116,
		frame: "square_f_01_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 117,
		frame: "square_f_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 118,
		frame: "square_f_03_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 119,
		frame: "blockOutline_06_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 120,
		frame: "square_f_05_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 121,
		frame: "square_f_06_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 122,
		frame: "square_f_07_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 12,
		frame: "portal_03_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "cubeport",
		inOriginalOs: true,
		collision: {
			type: "cubeport",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p']['_eeBall']=false;",
			"this['p']['_eeDart']=false;",
			"this['p']['_eeRobot']=false;",
			"this['p']['_eeRobotBoosting']=false;",
			"this['p']['_eeRobotJumped']=false;",
			"this['p']['_eeUfo']=false;",
			"if(this['p'][_0x5f48d1(0x5df)]){this[_0x5f48d1(0xc06)]();}",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](1);",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 13,
		frame: "portal_04_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "shipport",
		inOriginalOs: true,
		collision: {
			type: "shipport",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p']['_eeBall']=false;",
			"this['p']['_eeRobot']=false;",
			"this['p']['_eeRobotBoosting']=false;",
			"this['p']['_eeRobotJumped']=false;",
			"this['p']['_eeUfo']=false;",
			"if(!this['p'][_0x5f48d1(0x5df)]){this[_0x5f48d1(0x3a4)](_0x1b13b8);}",
			"for(var _bl of this[_0x5f48d1(0x719)])if(_bl&&_bl[_0x5f48d1(0xe42)])_bl[_0x5f48d1(0xe42)][_0x5f48d1(0x655)](1);",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 45,
		frame: "portal_05_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "mirror_on",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0xff8000,
		inOriginalOs: false,
		collision: {
			type: "mirror_on",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p']['_eeMirror']=true;",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 46,
		frame: "portal_06_front_001.png",
		type: "ts",
		gridW: 1,
		gridH: 3,
		sub: "mirror_off",
		sheet: "GJ_GameSheet02-hd",
		portalParticle: true,
		portalParticleColor: 0x00aaff,
		inOriginalOs: false,
		collision: {
			type: "mirror_off",
			width: 50,
			height: 150,
		},
		portalDispatch: [
			"if(!_0x1b13b8.activated){",
			"_0x1b13b8.activated=true;",
			"this['p']['_eeMirror']=false;",
			"try{this[_0x5f48d1(0xc7a)](_0x1b13b8);}catch(_ef){}",
			"}",
		].join(""),
	},
	{
		id: 48,
		frame: "d_cloud_01_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 49,
		frame: "d_cloud_02_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 60,
		frame: "d_ball_06_001.png",
		type: "$i",
		gridW: 0,
		gridH: 0,
		sheet: "GJ_GameSheet-hd",
		audioScale: true,
		inOriginalOs: false,
	},
	{
		id: 61,
		frame: "pit_04_001.png",
		type: "Qi",
		gridW: 0,
		gridH: 0,
		spriteW: 30,
		spriteH: 18,
		hitboxScaleX: 0.3,
		hitboxScaleY: 0.4,
		black: true,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 66,
		frame: "square_b_05_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 72,
		frame: "blockOutline_06_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 76,
		frame: "lightsquare_04_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 77,
		frame: "lightsquare_04_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 78,
		frame: "lightsquare_04_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 80,
		frame: "square_d_05_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 81,
		frame: "lightsquare_04_02_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 82,
		frame: "lightsquare_04_sideLine_001.png",
		type: "Ji",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
	},
	{
		id: 84,
		frame: "gravring_01_001.png",
		type: "is",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		audioScale: true,
		inOriginalOs: false,
		collision: {
			type: "gring",
			width: 72,
			height: 72,
		},
		ringVelocity: 22.360064,
		ringFlipGravity: true,
		ringParticleColor: 0x00ffff,
	},
	{
		id: 88,
		frame: "sawblade_01_001.png",
		type: "Qi",
		gridW: 1,
		gridH: 1,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: 300,
	},
	{
		id: 89,
		frame: "sawblade_02_001.png",
		type: "Qi",
		gridW: 2,
		gridH: 2,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: 360,
	},
	{
		id: 98,
		frame: "sawblade_03_001.png",
		type: "Qi",
		gridW: 3,
		gridH: 3,
		sheet: "GJ_GameSheet-hd",
		inOriginalOs: false,
		spinSpeed: 360,
	},
];

function padDispatch(
	velocity: number,
	color: number,
	flipGravity: boolean,
	effects: PadEffectConfig,
): string {
	const { burst, shockwave } = effects;
	const lines = ["if(!_0x1b13b8.activated){", "_0x1b13b8.activated=true;"];
	if (flipGravity) {
		lines.push("this['p'][_0x5f48d1(0xa22)]=!this['p'][_0x5f48d1(0xa22)];");
	}
	lines.push(
		`if(this['p']['_eeDart']){return;}`,
		`var _padVel=${velocity};`,
		`if(this['p']['_eeBall']){_padVel*=${BALL_PAD_MULT};}`,
		`else if(this['p']['_eeRobot']){_padVel*=${ROBOT_PAD_MULT};}`,
		"this['p']['yVelocity']=_padVel*this[_0x5f48d1(0x4bd)]();",
		"this['p'][_0x5f48d1(0x9ab)]=false;",
		"var _scene=this[_0x5f48d1(0x9d4)];",
		"if(_0x1b13b8._eeSprite){",
		"var _ps=_0x1b13b8._eeSprite;",
		"_ps.setScale(1.4,0.6);",
		"_scene[_0x5f48d1(0x16c1)][_0x5f48d1(0x42f)]({'targets':_ps,'scaleX':1,'scaleY':1,'duration':400,'ease':'Elastic.Out','easeParams':[1,0.3]});",
		"}",
		`var _pe=_scene[_0x5f48d1(0x42f)][_0x5f48d1(0x11d7)](_0x1b13b8.x,_0x1b13b8.y,_0x5f48d1(0xf44),{`,
		"'frame':_0x5f48d1(0x8a2),",
		`'lifespan':{'min':${burst.lifespanMin},'max':${burst.lifespanMax}},`,
		`'speed':{'min':${burst.speedMin},'max':${burst.speedMax}},`,
		`'scale':{'start':${burst.scaleStart},'end':${burst.scaleEnd}},`,
		`'alpha':{'start':${burst.alphaStart},'end':${burst.alphaEnd}},`,
		`'tint':${color},`,
		"'blendMode':Phaser[_0x5f48d1(0x496)][_0x5f48d1(0x98a)],",
		"'emitting':false",
		"});",
		`_pe.explode(${burst.explodeCount});`,
		`_scene.time.delayedCall(${burst.destroyDelay},function(){_pe.destroy();});`,
		`var _cw=_scene[_0x5f48d1(0x42f)].graphics({x:_0x1b13b8.x,y:_0x1b13b8.y});`,
		`_cw.lineStyle(${shockwave.lineWidth},${color},1);`,
		`_cw.strokeCircle(0,0,${shockwave.radius});`,
		`_scene[_0x5f48d1(0x16c1)][_0x5f48d1(0x42f)]({'targets':_cw,'scaleX':${shockwave.expandScale},'scaleY':${shockwave.expandScale},'alpha':0,'duration':${shockwave.duration},'ease':'Sine.Out','onComplete':function(){_cw.destroy();}});`,
		"}",
	);
	return lines.join("");
}

function ringDispatch(
	velocity: number,
	color: number,
	flipGravity: boolean,
	effects: PadEffectConfig,
): string {
	const { burst, shockwave } = effects;
	const gravFlipLine = flipGravity
		? "this['p'][_0x5f48d1(0xa22)]=!this['p'][_0x5f48d1(0xa22)];"
		: "";
	return [
		"if(!_0x1b13b8.activated&&this['p']['upKeyDown']){",
		"_0x1b13b8.activated=true;",
		`if(this['p']['_eeDart']){return;}`,
		gravFlipLine,
		`var _ringVel=${velocity};`,
		`if(this['p']['_eeBall']){_ringVel*=${BALL_RING_MULT};}`,
		`else if(this['p']['_eeRobot']){_ringVel*=${ROBOT_RING_MULT};}`,
		"this['p']['yVelocity']=_ringVel*this[_0x5f48d1(0x4bd)]();",
		"this['p'][_0x5f48d1(0x9ab)]=false;",
		"try{",
		"var _scene=this[_0x5f48d1(0x9d4)];",
		"if(_0x1b13b8._eeSprite){",
		"var _rs=_0x1b13b8._eeSprite;",
		"_rs.setScale(1.3);",
		"_scene[_0x5f48d1(0x16c1)][_0x5f48d1(0x42f)]({'targets':_rs,'scaleX':1,'scaleY':1,'duration':300,'ease':'Sine.Out'});",
		"}",
		`var _rpe=_scene[_0x5f48d1(0x42f)][_0x5f48d1(0x11d7)](_0x1b13b8.x,_0x1b13b8.y,_0x5f48d1(0xf44),{`,
		"'frame':_0x5f48d1(0x8a2),",
		`'lifespan':{'min':${burst.lifespanMin},'max':${burst.lifespanMax}},`,
		`'speed':{'min':${burst.speedMin},'max':${burst.speedMax}},`,
		`'scale':{'start':${burst.scaleStart},'end':${burst.scaleEnd}},`,
		`'alpha':{'start':${burst.alphaStart},'end':${burst.alphaEnd}},`,
		`'tint':${color},`,
		"'blendMode':Phaser[_0x5f48d1(0x496)][_0x5f48d1(0x98a)],",
		"'emitting':false",
		"});",
		`_rpe.explode(${burst.explodeCount});`,
		`_scene.time.delayedCall(${burst.destroyDelay},function(){_rpe.destroy();});`,
		`var _rcw=_scene[_0x5f48d1(0x42f)].graphics({x:_0x1b13b8.x,y:_0x1b13b8.y});`,
		`_rcw.lineStyle(${shockwave.lineWidth},${color},1);`,
		`_rcw.strokeCircle(0,0,${shockwave.radius});`,
		`_scene[_0x5f48d1(0x16c1)][_0x5f48d1(0x42f)]({'targets':_rcw,'scaleX':${shockwave.expandScale},'scaleY':${shockwave.expandScale},'alpha':0,'duration':${shockwave.duration},'ease':'Sine.Out','onComplete':function(){_rcw.destroy();}});`,
		"}catch(_ev){console.warn('ring vfx error',_ev);}",
		"}",
	].join("");
}

function coinDispatch(color: number): string {
	return [
		"if(!_0x1b13b8.activated){",
		"_0x1b13b8.activated=true;",
		"try{",
		"var _scene=this[_0x5f48d1(0x9d4)];",
		"if(_0x1b13b8._eeSprite){",
		"var _cs=_0x1b13b8._eeSprite;",
		`_scene[_0x5f48d1(0x16c1)][_0x5f48d1(0x42f)]({'targets':_cs,'scaleX':1.5,'scaleY':1.5,'alpha':0,'duration':300,'ease':'Sine.Out','onComplete':function(){_cs.setVisible(false);}});`,
		"}",
		`var _cpe=_scene[_0x5f48d1(0x42f)][_0x5f48d1(0x11d7)](_0x1b13b8.x,_0x1b13b8.y,_0x5f48d1(0xf44),{`,
		"'frame':_0x5f48d1(0x8a2),",
		"'lifespan':{'min':300,'max':500},",
		"'speed':{'min':100,'max':200},",
		"'scale':{'start':0.5,'end':0},",
		"'alpha':{'start':1,'end':0},",
		`'tint':${color},`,
		"'blendMode':Phaser[_0x5f48d1(0x496)][_0x5f48d1(0x98a)],",
		"'emitting':false",
		"});",
		"_cpe.explode(10);",
		"_scene.time.delayedCall(700,function(){_cpe.destroy();});",
		`var _ccw=_scene[_0x5f48d1(0x42f)].graphics({x:_0x1b13b8.x,y:_0x1b13b8.y});`,
		`_ccw.lineStyle(2,0xffffff,0.8);`,
		`_ccw.strokeCircle(0,0,5);`,
		`_scene[_0x5f48d1(0x16c1)][_0x5f48d1(0x42f)]({'targets':_ccw,'scaleX':4,'scaleY':4,'alpha':0,'duration':400,'ease':'Sine.Out','onComplete':function(){_ccw.destroy();}});`,
		"try{window.parent.postMessage({type:'coin-collected',coinIndex:_0x1b13b8._eeCoinIndex||0},'*');}catch(_pe){}",
		"}catch(_cev){console.warn('coin vfx error',_cev);}",
		"}",
	].join("");
}

function generateOsPatches(): string {
	const lines: string[] = [];

	for (const obj of OBJECTS) {
		if (!obj.inOriginalOs) {
			const props: string[] = [];
			props.push(`'type':${obj.type}`);
			if (obj.frame) {
				props.push(`'frame':'${obj.frame}'`);
			} else {
				props.push("'frame':null");
			}
			props.push(`'gridW':${obj.gridW}`);
			props.push(`'gridH':${obj.gridH}`);
			if (obj.spriteW !== undefined) props.push(`'spriteW':${obj.spriteW}`);
			if (obj.spriteH !== undefined) props.push(`'spriteH':${obj.spriteH}`);
			if (obj.hitboxScaleX !== undefined)
				props.push(`'hitboxScaleX':${obj.hitboxScaleX}`);
			if (obj.hitboxScaleY !== undefined)
				props.push(`'hitboxScaleY':${obj.hitboxScaleY}`);
			if (obj.black) props.push(`'black':!0`);
			lines.push(`os[${obj.id}]={${props.join(",")}};`);
		}

		if (obj.collision) {
			lines.push(`os[${obj.id}].colType='${obj.collision.type}';`);
			lines.push(`os[${obj.id}].hitW=${obj.collision.width};`);
			lines.push(`os[${obj.id}].hitH=${obj.collision.height};`);
		}

		if (obj.sub) {
			lines.push(`os[${obj.id}].sub='${obj.sub}';`);
		}

		if (obj.portalParticle) {
			lines.push(`os[${obj.id}]['portalParticle']=!0;`);
			lines.push(
				`os[${obj.id}]['portalParticleColor']=${obj.portalParticleColor};`,
			);
		}

		if (obj.audioScale) {
			lines.push(`os[${obj.id}]['audioScale']=!0;`);
		}

		if (obj.padParticleColor !== undefined) {
			lines.push(`os[${obj.id}]['padParticleColor']=${obj.padParticleColor};`);
		}

		if (obj.ringParticleColor !== undefined) {
			lines.push(
				`os[${obj.id}]['ringParticleColor']=${obj.ringParticleColor};`,
			);
			lines.push(`os[${obj.id}]['glow']=!1;`);
		}

		if (obj.isCoin) {
			lines.push(`os[${obj.id}]['isCoin']=!0;`);
		}

		if (obj.spinSpeed !== undefined) {
			if (Array.isArray(obj.spinSpeed)) {
				lines.push(
					`os[${obj.id}]['spinSpeed']=[${obj.spinSpeed[0]},${obj.spinSpeed[1]}];`,
				);
			} else {
				lines.push(`os[${obj.id}]['spinSpeed']=${obj.spinSpeed};`);
			}
		}

		const hasNewChildProps = obj.children?.some(
			(child) =>
				child.blend !== undefined ||
				child.z !== undefined ||
				child.audioScale ||
				child.tint !== undefined,
		);
		if (hasNewChildProps && obj.children) {
			const childEntries: string[] = [];
			for (const child of obj.children) {
				const childProps: string[] = [];
				childProps.push(`'frame':'${child.frame}'`);
				if (child.x !== 0) childProps.push(`'localDx':${child.x}`);
				if (child.y !== 0) childProps.push(`'localDy':${child.y}`);
				if (child.blend) childProps.push(`'blend':'${child.blend}'`);
				if (child.tint !== undefined) childProps.push(`'tint':${child.tint}`);
				if (child.z !== undefined) childProps.push(`'z':${child.z}`);
				if (child.audioScale) childProps.push(`'audioScale':!0`);
				childEntries.push(`{${childProps.join(",")}}`);
			}
			lines.push(`os[${obj.id}]['children']=[${childEntries.join(",")}];`);
		}
	}

	for (const [idStr, gdr] of Object.entries(gdrData)) {
		const id = Number(idStr);
		const guardedLines: string[] = [];
		if (gdr.color_type) {
			guardedLines.push(`os[${id}]['_eeColorType']='${gdr.color_type}';`);
		}
		if (gdr.children && gdr.children.length > 0) {
			const objectsEntry = OBJECTS.find((obj) => obj.id === id);
			const hasOurChildren = objectsEntry?.children?.some(
				(child) =>
					child.blend !== undefined ||
					child.z !== undefined ||
					child.audioScale ||
					child.tint !== undefined,
			);
			if (!hasOurChildren) {
				const gdrChildEntries: string[] = [];
				for (const gdrChild of gdr.children) {
					const props: string[] = [];
					props.push(`'frame':'${gdrChild.texture}'`);
					if (gdrChild.x && gdrChild.x !== 0)
						props.push(`'localDx':${gdrChild.x}`);
					if (gdrChild.y && gdrChild.y !== 0)
						props.push(`'localDy':${gdrChild.y}`);
					if (gdrChild.z !== undefined) props.push(`'z':${gdrChild.z}`);
					if (gdrChild.color_type === "Base") props.push(`'tint':-1`);
					if (gdrChild.color_type === "Black") props.push(`'black':!0`);
					if (gdrChild.scale_x !== undefined && gdrChild.scale_x !== 1)
						props.push(`'scaleX':${gdrChild.scale_x}`);
					if (gdrChild.scale_y !== undefined && gdrChild.scale_y !== 1)
						props.push(`'scaleY':${gdrChild.scale_y}`);
					if (gdrChild.flip_x) props.push(`'flipX':!0`);
					if (gdrChild.flip_y) props.push(`'flipY':!0`);
					if (gdrChild.rot && gdrChild.rot !== 0)
						props.push(`'rot':${gdrChild.rot}`);
					gdrChildEntries.push(`{${props.join(",")}}`);
				}
				guardedLines.push(
					`os[${id}]['children']=[${gdrChildEntries.join(",")}];`,
				);
			}
		}
		if (guardedLines.length > 0) {
			lines.push(`if(os[${id}]){${guardedLines.join("")}}`);
		}
	}

	return lines.join("");
}

export const OS_TABLE_HOOK = "=!0x0);function ls(";

export function generateOsTableReplacement(): string {
	return `=!0x0);${generateOsPatches()}function ls(`;
}

function generateCreationPatch(): string {
	return [
		"else if(_0x24471f.colType){",
		"var _col=new O(_0x24471f.colType,_0x173c58,_0x7ab528,_0x24471f.hitW,_0x24471f.hitH);",
		"_col._eeSprite=this._eeLastSprite;",
		"if(_0x24471f.isCoin){_col._eeCoinIndex=this._eeCoinCounter||0;this._eeCoinCounter=(this._eeCoinCounter||0)+1;}",
		"this[_0x5bb2ae(0x139c)][_0x5bb2ae(0x3ae)](_col);",
		"this[_0x5bb2ae(0x218)](_col);",
		"}",
	].join("");
}

export const CREATION_HOOK =
	"this[_0x5bb2ae(0x218)](_0x4bd7bc);}}}}}}_0x443c50";

export function generateCreationReplacement(): string {
	const closing = "this[_0x5bb2ae(0x218)](_0x4bd7bc);}";
	const portalBlockClose = "}";
	const newBranch = generateCreationPatch();
	const remainingBraces = "}}}}_0x443c50";

	return `${closing}${portalBlockClose}${newBranch}${remainingBraces}`;
}

function generateDispatchPatch(effects: PadEffectConfig): string {
	const checks: string[] = [];

	for (const obj of OBJECTS) {
		if (!obj.collision) continue;

		if (obj.padVelocity !== undefined) {
			const dispatch = padDispatch(
				obj.padVelocity,
				obj.padParticleColor as number,
				obj.padFlipGravity ?? false,
				effects,
			);
			checks.push(
				`if(_0x1b13b8.type==='${obj.collision.type}'){${dispatch}return;}`,
			);
		} else if (obj.ringVelocity !== undefined) {
			const dispatch = ringDispatch(
				obj.ringVelocity,
				obj.ringParticleColor as number,
				obj.ringFlipGravity ?? false,
				effects,
			);
			checks.push(
				`if(_0x1b13b8.type==='${obj.collision.type}'){${dispatch}return;}`,
			);
		} else if (obj.portalDispatch) {
			checks.push(
				`if(_0x1b13b8.type==='${obj.collision.type}'){${obj.portalDispatch}return;}`,
			);
		} else if (obj.isCoin) {
			const dispatch = coinDispatch(obj.coinParticleColor as number);
			checks.push(
				`if(_0x1b13b8.type==='${obj.collision.type}'){${dispatch}return;}`,
			);
		}
	}

	return checks.join("");
}

export const DISPATCH_HOOK =
	"if(_0x1b13b8[_0x5f48d1(0x1684)]!==_){if(_0x1b13b8[_0x5f48d1(0x1684)]!==w){if(_0x1b13b8[_0x5f48d1(0x1684)]===x)return void this[_0x5f48d1(0x154)]();if(_0x1b13b8[_0x5f48d1(0x1684)]===y)";

export function generateDispatchReplacement(effects: PadEffectConfig): string {
	return `${generateDispatchPatch(effects)}${DISPATCH_HOOK}`;
}

export const COLLISION_HOOK =
	"_0x2841ea=(this['p'][_0x5f48d1(0x845)]<=0x0||this['p'][_0x5f48d1(0x9ab)])&&(_0x146a97>=_0x8a8d9a||_0x869e42>=_0x8a8d9a);if(_0x3c1654&&!_0x2841ea)return void this[_0x5f48d1(0x154)]();if(_0x3c691e+0x1e-0x5>_0xf3791a&&_0x3c691e-0x1e+0x5<_0x17dbc8){if((_0x146a97>=_0x8a8d9a||_0x869e42>=_0x8a8d9a)&&(this['p'][_0x5f48d1(0x845)]<=0x0||this['p'][_0x5f48d1(0x9ab)])){this['p']['y']=_0x8a8d9a+_0x6bfa06,this[_0x5f48d1(0x1890)](),_0x30410f=!0x0,this['p'][_0x5f48d1(0x112f)]=_0x8a8d9a,this['p'][_0x5f48d1(0x5df)]||this['_checkSnapJump'](_0x1b13b8);continue;}if((_0x3e7199<=_0x2d2fa7||_0x135a9d<=_0x2d2fa7)&&(this['p'][_0x5f48d1(0x845)]>=0x0||this['p']['onGround'])&&this['p'][_0x5f48d1(0x5df)]){this['p']['y']=_0x2d2fa7-_0x6bfa06,this[_0x5f48d1(0x1890)](),this['p'][_0x5f48d1(0x200)]=!0x0,this['p']['collideTop']=_0x2d2fa7;continue;}}}}";

export function generateCollisionReplacement(): string {
	return [
		"_0x2841ea=this['p'][_0x5f48d1(0xa22)]",
		"?(this['p'][_0x5f48d1(0x845)]>=0x0||this['p'][_0x5f48d1(0x9ab)])&&(_0x3e7199<=_0x2d2fa7||_0x135a9d<=_0x2d2fa7)",
		":(this['p'][_0x5f48d1(0x845)]<=0x0||this['p'][_0x5f48d1(0x9ab)])&&(_0x146a97>=_0x8a8d9a||_0x869e42>=_0x8a8d9a);",
		"if(_0x3c1654&&!_0x2841ea)return void this[_0x5f48d1(0x154)]();",
		"var _gf=this['p'][_0x5f48d1(0xa22)];",
		"if(_0x3c691e+0x1e-0x5>_0xf3791a&&_0x3c691e-0x1e+0x5<_0x17dbc8){",
		"if((_gf?(_0x3e7199<=_0x2d2fa7||_0x135a9d<=_0x2d2fa7)&&(this['p'][_0x5f48d1(0x845)]>=0x0||this['p'][_0x5f48d1(0x9ab)]):(_0x146a97>=_0x8a8d9a||_0x869e42>=_0x8a8d9a)&&(this['p'][_0x5f48d1(0x845)]<=0x0||this['p'][_0x5f48d1(0x9ab)]))){",
		"this['p']['y']=_gf?_0x2d2fa7-_0x6bfa06:_0x8a8d9a+_0x6bfa06,this[_0x5f48d1(0x1890)](),_0x30410f=!0x0,this['p'][_0x5f48d1(0x112f)]=_gf?_0x2d2fa7:_0x8a8d9a,this['p'][_0x5f48d1(0x5df)]||this['_checkSnapJump'](_0x1b13b8);continue;}",
		"if((_gf?(_0x146a97>=_0x8a8d9a||_0x869e42>=_0x8a8d9a)&&(this['p'][_0x5f48d1(0x845)]<=0x0||this['p'][_0x5f48d1(0x9ab)]):(_0x3e7199<=_0x2d2fa7||_0x135a9d<=_0x2d2fa7)&&(this['p'][_0x5f48d1(0x845)]>=0x0||this['p']['onGround']))&&(_gf||this['p'][_0x5f48d1(0x5df)])){",
		"this['p']['y']=_gf?_0x8a8d9a+_0x6bfa06:_0x2d2fa7-_0x6bfa06,this[_0x5f48d1(0x1890)](),this['p'][_0x5f48d1(0x200)]=!0x0,this['p']['collideTop']=_gf?_0x8a8d9a:_0x2d2fa7;continue;}",
		"}}",
		"}",
	].join("");
}

export const FLIP_HOOK =
	"_0x2c61a1['sprite'][_0x423b5e(0x17fc)]=_0x2907d3);}this[_0x423b5e(0x4cf)](_0x30c325,_0x3f0607,_0x3afedf);}";

export function generateFlipReplacement(): string {
	return [
		"_0x2c61a1['sprite'][_0x423b5e(0x17fc)]=_0x2907d3);}",
		"for(var _fl of this[_0x423b5e(0x1204)])if(_fl&&_fl[_0x423b5e(0xe42)]){",
		"var _sp=_fl[_0x423b5e(0xe42)];",
		"if(this['p'][_0x423b5e(0xa22)]){",
		"_sp['scaleY']=-Math.abs(_sp['scaleY']);",
		"_sp[_0x423b5e(0x17fc)]=-_sp[_0x423b5e(0x17fc)];",
		"_sp['y']=2*_0x1a433c-_sp['y'];",
		"}else{_sp['scaleY']=Math.abs(_sp['scaleY']);}",
		"}",
		"var _snY=_0x1a433c-_0x3f0607;",
		"var _skObj=this[_0x423b5e(0x244)];",
		"var _origSP;",
		"if(this['p'][_0x423b5e(0xa22)]&&_skObj){",
		"_origSP=_skObj[_0x423b5e(0x7f9)];",
		"var _snRef=_snY;",
		"_skObj[_0x423b5e(0x7f9)]=function(px,py){return _origSP.call(this,px,2*_snRef-py);};",
		"}",
		"this[_0x423b5e(0x4cf)](_0x30c325,_0x3f0607,_0x3afedf);",
		"if(_origSP&&_skObj){_skObj[_0x423b5e(0x7f9)]=_origSP;}",
		"if(this['p'][_0x423b5e(0xa22)]){",
		"var _ge=this[_0x423b5e(0x809)];",
		"if(_ge){_ge[_0x423b5e(0x10eb)]=2*_snY-_ge[_0x423b5e(0x10eb)];}",
		"var _fe=this[_0x423b5e(0x31c)];",
		"if(_fe){_fe[_0x423b5e(0x10eb)]=2*_snY-_fe[_0x423b5e(0x10eb)];}",
		"var _f2=this[_0x423b5e(0x163d)];",
		"if(_f2){_f2[_0x423b5e(0x10eb)]=2*_snY-_f2[_0x423b5e(0x10eb)];}",
		"var _sd=this[_0x423b5e(0x1b6)];",
		"if(_sd){_sd[_0x423b5e(0x10eb)]=2*_0x1a433c-_sd[_0x423b5e(0x10eb)];}",
		"}",
		"}",
	].join("");
}

export function generatePortalSubPatch(): string {
	return [
		"if(_0x5bb2ae(0xcec)===_0x24471f['sub']?_0x25452a=_:",
		"'cube'===_0x24471f['sub']?_0x25452a=w:",
		"'cubeport'===_0x24471f['sub']?_0x25452a='cubeport':",
		"'shipport'===_0x24471f['sub']?_0x25452a='shipport':",
		"'gravity_flip'===_0x24471f['sub']?_0x25452a='gflip':",
		"'gravity_normal'===_0x24471f['sub']?_0x25452a='gnorm':",
		"'ball'===_0x24471f['sub']?_0x25452a='ball':",
		"'wave'===_0x24471f['sub']?_0x25452a='wave':",
		"'robot'===_0x24471f['sub']?_0x25452a='robot':",
		"'mini'===_0x24471f['sub']?_0x25452a='mini':",
		"'normal_size'===_0x24471f['sub']?_0x25452a='bigsize':",
		"'ufo'===_0x24471f['sub']?_0x25452a='ufo':",
		"'mirror_on'===_0x24471f['sub']?_0x25452a='mirror_on':",
		"'mirror_off'===_0x24471f['sub']?_0x25452a='mirror_off':",
		"'speed_half'===_0x24471f['sub']?_0x25452a='sphalf':",
		"'speed_normal'===_0x24471f['sub']?_0x25452a='spnorm':",
		"'speed_double'===_0x24471f['sub']?_0x25452a='spdbl':",
		"'speed_triple'===_0x24471f['sub']&&(_0x25452a='sptrpl')",
		",_0x25452a)",
	].join("");
}

export const PORTAL_SUB_HOOK =
	"if(_0x5bb2ae(0xcec)===_0x24471f['sub']?_0x25452a=_:'cube'===_0x24471f[_0x5bb2ae(0x11f7)]&&(_0x25452a=w),_0x25452a)";

export const SPAWN_HOOK =
	"this['_addToSection'](_0xe3eaec));}if(_0x24471f['children'])";

export function generateSpawnReplacement(effects: PadEffectConfig): string {
	const { idle, ringIdle } = effects;
	return [
		"this['_addToSection'](_0xe3eaec));}",
		"this._eeLastSprite=_0x554e0e;",
		"if(_0x554e0e&&_0x24471f&&_0x24471f['_eeColorType']){",
		"try{",
		"var _eeCT=_0x24471f['_eeColorType'];",
		"if(_eeCT==='Base'&&window._eeObjHex!==undefined){",
		"_0x554e0e[_0x5bb2ae(0x17b4)](window._eeObjHex);",
		"}else if(_eeCT==='Black'){",
		"_0x554e0e[_0x5bb2ae(0x17b4)](0x000000);",
		"}else if(_eeCT==='Detail'&&window._eeObjHex!==undefined){",
		"_0x554e0e[_0x5bb2ae(0x17b4)](window._eeObjHex);",
		"}",
		"}catch(_tErr){}",
		"}",
		"if(_0x24471f&&_0x24471f[_0x5bb2ae(0x743)]&&_0x554e0e){",
		"try{",
		"_0x554e0e[_0x5bb2ae(0x655)](0.1);",
		"_0x554e0e[_0x5bb2ae(0xd4c)](0.9);",
		"_0x554e0e[_0x5bb2ae(0x101d)]=!0x0;",
		"this[_0x5bb2ae(0x535)]['push'](_0x554e0e);",
		"}catch(_as0){console.warn('audioScale error',_as0,_0x24471f);}",
		"}",
		"if(_0x24471f&&_0x24471f['padParticleColor']!==undefined&&_0x554e0e){",
		"try{",
		"var _padScene=_0x554e0e['scene'];",
		"var _padColor=_0x24471f['padParticleColor'];",
		`var _padEmitter=_padScene[_0x5bb2ae(0x42f)][_0x5bb2ae(0x11d7)](_0x554e0e.x,_0x554e0e.y,_0x5bb2ae(0xf44),{`,
		"'frame':_0x5bb2ae(0x8a2),",
		`'lifespan':{'min':${idle.lifespanMin},'max':${idle.lifespanMax}},`,
		`'speed':{'min':${idle.speedMin},'max':${idle.speedMax}},`,
		`'angle':{'min':${idle.angleMin},'max':${idle.angleMax}},`,
		`'scale':{'start':${idle.scaleStart},'end':${idle.scaleEnd}},`,
		`'alpha':{'start':${idle.alphaStart},'end':${idle.alphaEnd}},`,
		"'tint':_padColor,",
		"'blendMode':Phaser[_0x5bb2ae(0x496)][_0x5bb2ae(0x98a)],",
		`'frequency':${idle.frequency},`,
		`'quantity':${idle.quantity},`,
		"'emitting':true,",
		`'emitZone':{'type':'random','source':new Phaser.Geom.Rectangle(${-idle.emitZoneHalfW},${-idle.emitZoneHalfH},${idle.emitZoneHalfW * 2},${idle.emitZoneHalfH * 2})}`,
		"});",
		"if(_0x554e0e.parentContainer){_0x554e0e.parentContainer.add(_padEmitter);}",
		"_padEmitter[_0x5bb2ae(0x115f)]((_0x554e0e.depth||1)-1);",
		"}catch(_pe0){console.warn('pad idle emitter error',_pe0);}",
		"}",
		"if(_0x24471f&&_0x24471f['ringParticleColor']!==undefined&&_0x554e0e){",
		"try{",
		"var _ringScene=_0x554e0e['scene'];",
		"var _ringColor=_0x24471f['ringParticleColor'];",
		`var _ringEmitter=_ringScene[_0x5bb2ae(0x42f)][_0x5bb2ae(0x11d7)](_0x554e0e.x,_0x554e0e.y,_0x5bb2ae(0xf44),{`,
		"'frame':_0x5bb2ae(0x8a2),",
		`'lifespan':{'min':${ringIdle.lifespanMin},'max':${ringIdle.lifespanMax}},`,
		`'speed':{'min':${ringIdle.speedMin},'max':${ringIdle.speedMax}},`,
		"'angle':{'min':0,'max':360},",
		`'scale':{'start':${ringIdle.scaleStart},'end':${ringIdle.scaleEnd}},`,
		`'alpha':{'start':${ringIdle.alphaStart},'end':${ringIdle.alphaEnd}},`,
		`'gravityY':${ringIdle.gravityY},`,
		"'tint':_ringColor,",
		"'blendMode':Phaser[_0x5bb2ae(0x496)][_0x5bb2ae(0x98a)],",
		`'frequency':${ringIdle.frequency},`,
		`'quantity':${ringIdle.quantity},`,
		"'emitting':true,",
		`'emitZone':{'type':'random','source':new Phaser.Geom.Circle(0,0,${ringIdle.emitRadius})}`,
		"});",
		"if(_0x554e0e.parentContainer){_0x554e0e.parentContainer.add(_ringEmitter);}",
		"_ringEmitter[_0x5bb2ae(0x115f)]((_0x554e0e.depth||1)-1);",
		"}catch(_re0){console.warn('ring idle emitter error',_re0);}",
		"}",
		"if(_0x24471f&&_0x24471f['ringParticleColor']!==undefined&&_0x554e0e){",
		"try{",
		"var _glowScene=_0x554e0e['scene'];",
		"if(!_glowScene.textures.exists('_eeRingGlow')){",
		"var _gc=document.createElement('canvas');",
		"_gc.width=80;_gc.height=80;",
		"var _gctx=_gc.getContext('2d');",
		"var _grad=_gctx.createRadialGradient(40,40,8,40,40,40);",
		"_grad.addColorStop(0,'rgba(255,255,255,0.7)');",
		"_grad.addColorStop(0.4,'rgba(255,255,255,0.3)');",
		"_grad.addColorStop(1,'rgba(255,255,255,0)');",
		"_gctx.fillStyle=_grad;",
		"_gctx.fillRect(0,0,80,80);",
		"_glowScene.textures.addCanvas('_eeRingGlow',_gc);",
		"}",
		"var _glowSp=_glowScene[_0x5bb2ae(0x42f)].image(_0x554e0e.x,_0x554e0e.y,'_eeRingGlow');",
		"_glowSp[_0x5bb2ae(0x52e)](Phaser[_0x5bb2ae(0x496)][_0x5bb2ae(0x98a)]);",
		"_glowSp.setTint(_0x24471f['ringParticleColor']);",
		"_glowSp[_0x5bb2ae(0x655)](0.1);",
		"_glowSp[_0x5bb2ae(0x101d)]=!0x0;",
		"this[_0x5bb2ae(0x535)][_0x5bb2ae(0x3ae)](_glowSp);",
		"if(_0x554e0e.parentContainer){_0x554e0e.parentContainer.addAt(_glowSp,0);}",
		"}catch(_ge0){console.warn('ring glow error',_ge0);}",
		"}",
		"if(_0x24471f&&_0x24471f['isCoin']&&_0x554e0e){",
		"try{",
		"var _coinScene=_0x554e0e['scene'];",
		"_coinScene[_0x5bb2ae(0x16c1)][_0x5bb2ae(0x42f)]({'targets':_0x554e0e,'angle':360,'duration':2000,'repeat':-1,'ease':'Linear'});",
		"}catch(_ci0){console.warn('coin idle error',_ci0);}",
		"}",
		"if(_0x24471f&&_0x24471f['spinSpeed']&&_0x554e0e){",
		"try{",
		"var _spinScene=_0x554e0e['scene'];",
		"var _spinSpd=_0x24471f['spinSpeed'];",
		"if(Array.isArray(_spinSpd)){_spinSpd=_spinSpd[0]+Math.random()*(_spinSpd[1]-_spinSpd[0]);}",
		"var _spinDir=Math.random()<0.5?1:-1;",
		"var _spinDur=Math.round(360/_spinSpd*1000);",
		"_spinScene[_0x5bb2ae(0x16c1)][_0x5bb2ae(0x42f)]({'targets':_0x554e0e,'angle':360*_spinDir,'duration':_spinDur,'repeat':-1,'ease':'Linear'});",
		"}catch(_sp0){console.warn('spin error',_sp0);}",
		"}",
		"if(_0x24471f['children'])",
	].join("");
}

export const CHILD_TINT_HOOK =
	"_0x2d433c[_0x1ed886(0x17b4)](_0x450956[_0x1ed886(0x1475)])";

export function generateChildTintReplacement(): string {
	return "_0x2d433c[_0x1ed886(0x17b4)](_0x450956[_0x1ed886(0x1475)]===-1&&window._eeObjHex!==void 0?window._eeObjHex:_0x450956[_0x1ed886(0x1475)])";
}

export const TRY_ME_HOOK =
	"this[_0x31a51c(0xd2c)]=this['add']['image'](0x0,182.5,_0x31a51c(0xf44),_0x31a51c(0x685))[_0x31a51c(0xab0)](0x0)['setDepth'](0x1e)";

export function generateTryMeReplacement(): string {
	return "this[_0x31a51c(0xd2c)]=null";
}

export const LEVEL_NAME_HOOK =
	"_0x13af33,0x41,'bigFont',_0x35560b(0x1503),0x28";

export function generateLevelNameReplacement(): string {
	return "_0x13af33,0x41,'bigFont',(window._eeLevelName||_0x35560b(0x1503)),0x28";
}

export const SONG_NAME_HOOK = "_0x2c3387(0x748),_0x2c3387(0xd97),0x28";

export function generateSongNameReplacement(): string {
	return "_0x2c3387(0x748),('Song: '+(window._eeLevelSong||'Stereo Madness')),0x28";
}

export const DEATH_HOOK =
	"_0x5ed0a9(0xb15)+this['_attempts']),this[_0x5ed0a9(0x124)]['setVisible'](!0x0),this[_0x5ed0a9(0x582)]();";

export function generateDeathReplacement(): string {
	return [
		"_0x5ed0a9(0xb15)+this['_attempts']),this[_0x5ed0a9(0x124)]['setVisible'](!0x0),this[_0x5ed0a9(0x582)]();",
		"try{window.parent.postMessage({type:'player-death',attempt:this['_attempts'],percent:this[_0x5ed0a9(0xb47)]||0},'*');}catch(_gdErr){}",
	].join("");
}

export const COMPLETE_HOOK = "['_levelComplete'](){var _0x56c872=_0x6e411f;";

export function generateCompleteReplacement(): string {
	return [
		"['_levelComplete'](){",
		"try{window.parent.postMessage({type:'level-complete',attempts:this['_attempts']},'*');}catch(_gdErr){}",
		"var _0x56c872=_0x6e411f;",
	].join("");
}

export const BG_COLOR_HOOK =
	"this['_level'][_0x31a51c(0x1235)](this[_0x31a51c(0x17a2)][_0x31a51c(0xc7f)](gs)),this[_0x31a51c(0x14c4)]['additiveContainer']";

export function generateBgColorReplacement(): string {
	return [
		"this['_level'][_0x31a51c(0x1235)](this[_0x31a51c(0x17a2)][_0x31a51c(0xc7f)](gs)),",
		"(function(_cm,_bg,_lv,_dec){",
		"try{",
		"if(window._eeBgColor){_cm.triggerColor(fs,window._eeBgColor,0);_bg['setTint'](_cm[_dec](fs));}",
		"if(window._eeGroundColor){_cm.triggerColor(gs,window._eeGroundColor,0);_lv[_0x31a51c(0x1235)](_cm[_dec](gs));}",
		"var _cols=window._eeColors;",
		"if(_cols){",
		"for(var _chId in _cols){",
		"var _cid=parseInt(_chId,10);",
		"if(_cid===1000||_cid===1001)continue;",
		"_cm.triggerColor(_cid,_cols[_chId],0);",
		"}",
		"}",
		"}catch(_bgErr){console.warn('bg color init error',_bgErr);}",
		"})(this[_0x31a51c(0x17a2)],this[_0x31a51c(0x1134)],this['_level'],_0x31a51c(0xc7f)),",
		"this[_0x31a51c(0x14c4)]['additiveContainer']",
	].join("");
}

export const LEVEL_PARSE_HOOK =
	"let {objects:_0x1b4349}=Zi(_0x335f1b);this[_0x40ba82(0xe7d)](_0x1b4349);";

export function generateLevelParseReplacement(): string {
	return [
		"let {objects:_0x1b4349,settings:_eeSettings}=Zi(_0x335f1b);",
		"try{",
		"var _eeHdr=_eeSettings.split(',');",
		"var _eeHdrKv={};",
		"for(var _ei=0;_ei<_eeHdr.length-1;_ei+=2){_eeHdrKv[_eeHdr[_ei]]=_eeHdr[_ei+1];}",
		"function _eeParseColor(_str){",
		"if(!_str)return null;",
		"var _cp=_str.split('_');",
		"var _co={};",
		"for(var _ci=0;_ci<_cp.length-1;_ci+=2){_co[_cp[_ci]]=_cp[_ci+1];}",
		"return{r:parseInt(_co['1']||'0',10),g:parseInt(_co['2']||'0',10),b:parseInt(_co['3']||'0',10)};",
		"}",
		"var _eeColors={};",
		"window._eeBgColor=_eeParseColor(_eeHdrKv['kS29']);",
		"window._eeGroundColor=_eeParseColor(_eeHdrKv['kS30']);",
		"if(window._eeBgColor)_eeColors[1000]=window._eeBgColor;",
		"if(window._eeGroundColor)_eeColors[1001]=window._eeGroundColor;",
		"var _eePreKsMap={'kS31':1002,'kS32':1004,'kS33':1,'kS34':2,'kS35':3,'kS36':4,'kS37':1003};",
		"for(var _ek in _eePreKsMap){var _ec=_eeParseColor(_eeHdrKv[_ek]);if(_ec)_eeColors[_eePreKsMap[_ek]]=_ec;}",
		"if(_eeHdrKv['kS38']){",
		"var _eeEntries=_eeHdrKv['kS38'].split('|');",
		"for(var _ee of _eeEntries){",
		"if(!_ee)continue;",
		"var _ekv={};var _ep2=_ee.split('_');",
		"for(var _j=0;_j<_ep2.length-1;_j+=2){_ekv[_ep2[_j]]=_ep2[_j+1];}",
		"var _chId=parseInt(_ekv['6'],10);",
		"if(!isNaN(_chId)){_eeColors[_chId]={r:parseInt(_ekv['1']||'0',10),g:parseInt(_ekv['2']||'0',10),b:parseInt(_ekv['3']||'0',10)};}",
		"}",
		"}",
		"var _objCol=_eeColors[1004];",
		"if(!_objCol||(_objCol.r===255&&_objCol.g===255&&_objCol.b===255)){",
		"if(_eeColors[1001])_eeColors[1004]=_eeColors[1001];",
		"}",
		"if(!_eeColors[1002]||(_eeColors[1002].r===255&&_eeColors[1002].g===255&&_eeColors[1002].b===255)){",
		"_eeColors[1002]={r:255,g:255,b:255};",
		"}",
		"window._eeColors=_eeColors;",
		"window._eeLineColor=_eeColors[1002]||null;",
		"var _eeOc=_eeColors[1004];",
		"if(_eeOc){window._eeObjHex=(_eeOc.r<<16)|(_eeOc.g<<8)|_eeOc.b;}",
		"}catch(_ep){console.warn('header color parse error',_ep);}",
		"this[_0x40ba82(0xe7d)](_0x1b4349);",
	].join("");
}

export const STEAM_ATLAS_KEYS = [
	"GJ_GameSheet-hd",
	"GJ_GameSheet02-hd",
	"GJ_GameSheetGlow-hd",
	"GJ_GameSheet03-hd",
	"GJ_GameSheet04-hd",
];

export const P_ARRAY_HOOK = "const P=[_0x6e411f(0xf44)];";

export function generatePArrayReplacement(): string {
	const entries = [
		...STEAM_ATLAS_KEYS.map((key) => `'${key}'`),
		"_0x6e411f(0xf44)",
	];
	return `const P=[${entries.join(",")}];`;
}

export const ATLAS_PRELOAD_HOOK =
	"_0x447d05(0xf44),'assets/GJ_WebSheet.png','assets/GJ_WebSheet.json')";

export function generateAtlasPreloadReplacement(): string {
	const loads = STEAM_ATLAS_KEYS.map(
		(key) =>
			`this[_0x447d05(0x16a0)][_0x447d05(0x7e7)]('${key}','assets/steam/${key}.png','assets/steam/${key}.json')`,
	);
	return `_0x447d05(0xf44),'assets/GJ_WebSheet.png','assets/GJ_WebSheet.json'),${loads.join(",")}`;
}

export const GAME_CONFIG_HOOK =
	"},'scene':[A,xs]};new s[(_0x6e411f(0x108b))](Ss);";

export function generateGameConfigReplacement(): string {
	return [
		"},'scene':[A,xs]};",
		"window._gdConfig=Ss;",
		"window._gdPhaser=s;",
	].join("");
}

export const SCENE_REDIRECT_HOOK =
	"_0x9a7483&&C(this,_0x382cc4(0x748),_0x9a7483),this['scene'][_0x382cc4(0x128f)](_0x382cc4(0x63c));}}";

export function generateSceneRedirectReplacement(): string {
	return [
		"_0x9a7483&&C(this,_0x382cc4(0x748),_0x9a7483);",
		"var _0xchatFnt=this['cache'][_0x382cc4(0x181e)]['get']('chatFontFnt');",
		"if(_0xchatFnt)C(this,'chatFont',_0xchatFnt);",
		"this['scene'][_0x382cc4(0x128f)](_0x382cc4(0x63c));}}",
	].join("");
}

export const START_GAME_HOOK =
	"'_startGame'](){var _0x241641=_0x6e411f;if(!this[_0x241641(0x1137)])return;";

export function generateStartGameReplacement(): string {
	return [
		"'_startGame'](){var _0x241641=_0x6e411f;if(!this[_0x241641(0x1137)])return;",
		"if(this['_eeGarageBtn'])this['_eeGarageBtn']['setVisible'](false);",
		"if(this['_eeCreatorBtn'])this['_eeCreatorBtn']['setVisible'](false);",
		"if(!window._eeAutoPlay){this['scene'][_0x241641(0x128f)]('levelSelect');return;}",
		"window._eeAutoPlay=false;",
	].join("");
}

export const CHATFONT_PRELOAD_HOOK = "'goldFontFnt',_0x447d05(0x2f7))";

export function generateChatFontPreloadReplacement(): string {
	return [
		"'goldFontFnt',_0x447d05(0x2f7))",
		",this['load']['image']('chatFont','assets/steam/chatFont-hd.png')",
		",this['load'][_0x447d05(0x181e)]('chatFontFnt','assets/steam/chatFont-hd.fnt')",
	].join("");
}

export const MENU_BUTTONS_HOOK = "this[_0x31a51c(0x14ed)]()";

export function generateMenuButtonsReplacement(): string {
	const d = "_0x31a51c";
	const atlasKeys = [
		"'GJ_GameSheet03-hd'",
		"'GJ_GameSheet04-hd'",
		"'GJ_WebSheet'",
	];
	const findFrame = `(function(_fr){${atlasKeys.map((ak) => `if(this['textures']['get'](${ak})?.['has'](_fr))return ${ak}`).join(";")};return null}).bind(this)`;
	return [
		`this[${d}(0x14ed)](),`,
		`(function(){`,
		`var _ff=${findFrame};`,
		`var _garageAtlas=_ff('GJ_garageBtn_001.png');`,
		`var _garageBtn=null;`,
		`if(_garageAtlas){`,
		`_garageBtn=this['add'][${d}(0x1bf)](0x0,0x0,_garageAtlas,'GJ_garageBtn_001.png')`,
		`['setScrollFactor'](0x0)[${d}(0x115f)](0x1e)[${d}(0x635)]();`,
		`_garageBtn['setScale'](0.85);`,
		`_garageBtn['setVisible'](false);`,
		`this[${d}(0xa88)](_garageBtn,0.85,()=>{`,
		`this['scene'][${d}(0x128f)]('garage');`,
		`},()=>this[${d}(0x1137)]);`,
		`}`,
		`var _creatorAtlas=_ff('GJ_creatorBtn_001.png');`,
		`var _creatorBtn=null;`,
		`if(_creatorAtlas){`,
		`_creatorBtn=this['add'][${d}(0x1bf)](0x0,0x0,_creatorAtlas,'GJ_creatorBtn_001.png')`,
		`['setScrollFactor'](0x0)[${d}(0x115f)](0x1e)[${d}(0x635)]();`,
		`_creatorBtn['setScale'](0.85);`,
		`_creatorBtn['setVisible'](false);`,
		`this[${d}(0xa88)](_creatorBtn,0.85,()=>{`,
		`this['scene'][${d}(0x128f)]('creatorPanel');`,
		`},()=>this[${d}(0x1137)]);`,
		`}`,
		`this['_eeGarageBtn']=_garageBtn;`,
		`this['_eeCreatorBtn']=_creatorBtn;`,
		`var _sceneRef=this;`,
		`this['events']['once']('update',function(){`,
		`if(window._eeAutoPlay){_sceneRef['_startGame']();return;}`,
		`var _playBtn=_sceneRef['_playBtn'];`,
		`if(_garageBtn&&_playBtn){`,
		`_garageBtn['x']=_playBtn['x']-_playBtn['displayWidth']*0.9;`,
		`_garageBtn['y']=_playBtn['y'];`,
		`_garageBtn['setVisible'](true);`,
		`}`,
		`if(_creatorBtn&&_playBtn){`,
		`_creatorBtn['x']=_playBtn['x']+_playBtn['displayWidth']*0.9;`,
		`_creatorBtn['y']=_playBtn['y'];`,
		`_creatorBtn['setVisible'](true);`,
		`}`,
		`});`,
		`}).call(this)`,
	].join("");
}

export const PAUSE_MENU_HOOK =
	"this[_0x2bff39(0x2ec)](),this[_0x2bff39(0x671)][_0x2bff39(0x633)]();";

export function generatePauseMenuReplacement(): string {
	return "this[_0x2bff39(0x2ec)](),this[_0x2bff39(0x671)][_0x2bff39(0x128f)]('levelSelect');";
}

export const END_SCREEN_HOOK =
	"_0x15310d>=0x1&&this[_0x4cc0d8(0x671)][_0x4cc0d8(0x633)]();";

export function generateEndScreenReplacement(): string {
	return "_0x15310d>=0x1&&this[_0x4cc0d8(0x671)][_0x4cc0d8(0x128f)]('levelSelect');";
}
