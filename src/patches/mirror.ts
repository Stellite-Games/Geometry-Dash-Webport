import { $modify } from "./framework";

const MIRROR_APPLY = [
	"(function(_eeCtx){",
	"var _eeM=_eeCtx[_0x1936ef(0x9ed)]['_eeMirror'];",
	"var _eeSx=_eeM?-1:1;",
	"var _eeL=_eeCtx['_level'];",
	"_eeL[_0x1936ef(0x17ca)]['scaleX']=_eeSx;",
	"_eeL[_0x1936ef(0x9e0)]['scaleX']=_eeSx;",
	"_eeL[_0x1936ef(0x133)]['scaleX']=_eeSx;",
	"if(_eeM){",
	"var _eeW=_eeCtx['scale']['gameSize']['width'];",
	"var _eeCx=_eeCtx[_0x1936ef(0xe32)];",
	"_eeL[_0x1936ef(0x17ca)]['x']=_eeCx+_eeW;",
	"_eeL[_0x1936ef(0x9e0)]['x']=_eeCx+_eeW;",
	"_eeL[_0x1936ef(0x133)]['x']=_eeCx+_eeW;",
	"}",
	"})(this)",
].join("");

$modify(
	"GameScene::update_mirrorContainers_path3",
	"this['_level']['topContainer']['y']=this[_0x1936ef(0xb0c)]" +
		";let _0x5464ab=this['_playerWorldX']",
	"this['_level']['topContainer']['y']=this[_0x1936ef(0xb0c)];" +
		MIRROR_APPLY +
		";let _0x5464ab=this['_playerWorldX']",
);

$modify(
	"GameScene::update_mirrorContainers_path1",
	"this['_level'][_0x1936ef(0x133)]['y']=this[_0x1936ef(0xb0c)]," +
		"this['_level'][_0x1936ef(0x81e)](this[_0x1936ef(0xe32)])",
	"this['_level'][_0x1936ef(0x133)]['y']=this[_0x1936ef(0xb0c)]," +
		MIRROR_APPLY +
		",this['_level'][_0x1936ef(0x81e)](this[_0x1936ef(0xe32)])",
);
