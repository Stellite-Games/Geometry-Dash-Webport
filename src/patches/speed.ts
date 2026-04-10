import { $modify } from "./framework";

$modify(
	"GameScene::update_playerSpeedMult",
	"this['_playerWorldX']+=_0x426602*c*d",
	"this['_playerWorldX']+=_0x426602*c*d*(this[_0x1936ef(0x9ed)]['_eeSpeedMult']||1)",
);

$modify(
	"GameScene::update_cameraSpeedMult",
	"this[_0x1936ef(0x8f6)]+=_0x3c9318*c*d;const _0x4f81e7=0.25;this[_0x1936ef(0xcb7)]=(this[_0x1936ef(0xcb7)]||this['_cameraX'])+_0x3c9318*c*d*_0x4f81e7",
	"var _eeSpd=(this[_0x1936ef(0x9ed)]['_eeSpeedMult']||1);this[_0x1936ef(0x8f6)]+=_0x3c9318*c*d*_eeSpd;const _0x4f81e7=0.25;this[_0x1936ef(0xcb7)]=(this[_0x1936ef(0xcb7)]||this['_cameraX'])+_0x3c9318*c*d*_eeSpd*_0x4f81e7",
);
