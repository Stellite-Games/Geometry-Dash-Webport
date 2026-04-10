import { $modify, addr } from "./framework";

$modify(
	"PlayerObject::enterShipMode_clearModes",
	`[_0x6e411f(0x3a4)](_0xeb37c6=null){var _0x52e772=_0x6e411f;if(this['p'][_0x52e772(0x5df)])return;`,
	[
		`[_0x6e411f(${addr.enterShipMode})](_0xeb37c6=null){var _0x52e772=_0x6e411f;`,
		`if(this['p']['_eeBall']){`,
		`this['p']['_eeBall']=false;`,
		`this[_0x52e772(${addr.setShipVisual})](false);`,
		`for(var _bl of this[_0x52e772(${addr._playerLayers})])if(_bl&&_bl[_0x52e772(${addr.sprite})])_bl[_0x52e772(${addr.sprite})][_0x52e772(${addr.setScale})](1);`,
		`}`,
		`this['p']['_eeDart']=false;`,
		`this['p']['_eeRobot']=false;`,
		`this['p']['_eeRobotBoosting']=false;`,
		`this['p']['_eeRobotJumped']=false;`,
		`this['p']['_eeUfo']=false;`,
		`this['p']['_eeUfoCanClick']=false;`,
		`if(this['p'][_0x52e772(${addr.isFlying})])return;`,
	].join(""),
);

$modify(
	"PlayerObject::exitShipMode_clearModes",
	"['exitShipMode'](){var _0x997b22=_0x6e411f;if(this['p']['isFlying']){",
	[
		`['exitShipMode'](){var _0x997b22=_0x6e411f;`,
		`if(this['p']['_eeBall']){`,
		`this['p']['_eeBall']=false;`,
		`this[_0x997b22(${addr.setShipVisual})](false);`,
		`for(var _bl of this[_0x997b22(${addr._playerLayers})])if(_bl&&_bl[_0x997b22(${addr.sprite})])_bl[_0x997b22(${addr.sprite})][_0x997b22(${addr.setScale})](1);`,
		`}`,
		`this['p']['_eeDart']=false;`,
		`this['p']['_eeRobot']=false;`,
		`this['p']['_eeRobotBoosting']=false;`,
		`this['p']['_eeRobotJumped']=false;`,
		`this['p']['_eeUfo']=false;`,
		`this['p']['_eeUfoCanClick']=false;`,
		`if(this['p']['isFlying']){`,
	].join(""),
);
