import { $modify, addr } from "./framework";

$modify(
	"PlayerObject::die_clearModes",
	"[_0x6e411f(0x154)](){var _0x2c3b9f=_0x6e411f;if(this['p'][_0x2c3b9f(0x429)])return;",
	[
		`[_0x6e411f(${addr.die})](){var _0x2c3b9f=_0x6e411f;`,
		`if(this['p']['_eeBall']){`,
		`this['p']['_eeBall']=false;`,
		`this['p']['_eeBallCanClick']=true;`,
		`this[_0x2c3b9f(${addr.setShipVisual})](false);`,
		`for(var _bl of this[_0x2c3b9f(${addr._playerLayers})])if(_bl&&_bl[_0x2c3b9f(${addr.sprite})])_bl[_0x2c3b9f(${addr.sprite})][_0x2c3b9f(${addr.setScale})](1);`,
		`}`,
		`this['p']['_eeDart']=false;`,
		`this['p']['_eeRobot']=false;`,
		`this['p']['_eeRobotBoosting']=false;`,
		`this['p']['_eeRobotJumped']=false;`,
		`this['p']['_eeRobotBoostTime']=0;`,
		`this['p']['_eeUfo']=false;`,
		`this['p']['_eeUfoCanClick']=false;`,
		`this['p']['_eeSpeedMult']=1;`,
		`this['p']['_eeMirror']=false;`,
		`if(this['p'][_0x2c3b9f(0x429)])return;`,
	].join(""),
);
