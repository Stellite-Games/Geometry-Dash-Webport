import { $modify, addr, BALL_ROTATION_RATE } from "./framework";

$modify(
	"PlayerObject::rotationDispatch_ballBranch",
	"this[_0x1936ef(0x9ed)][_0x1936ef(0x5df)]||(this['_state']['onGround']?this[_0x1936ef(0x500)][_0x1936ef(0xb42)](_0x5caeb1):this[_0x1936ef(0x500)][_0x1936ef(0x12fd)]&&this[_0x1936ef(0x500)][_0x1936ef(0x1100)](u))",
	[
		`this[_0x1936ef(0x9ed)]['_eeBall']`,
		`?(this[_0x1936ef(0x500)][_0x1936ef(${addr._rotation})]+=`,
		`${BALL_ROTATION_RATE}*(this[_0x1936ef(0x9ed)][_0x1936ef(${addr.gravityFlipped})]?-1:1))`,
		`:this[_0x1936ef(0x9ed)][_0x1936ef(${addr.isFlying})]`,
		`||(this['_state']['onGround']`,
		`?this[_0x1936ef(0x500)][_0x1936ef(${addr.updateGroundRotation})](_0x5caeb1)`,
		`:this[_0x1936ef(0x500)][_0x1936ef(${addr._rotateActionActive})]&&this[_0x1936ef(0x500)][_0x1936ef(${addr.updateRotateAction})](u))`,
	].join(""),
);
