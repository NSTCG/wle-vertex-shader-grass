import {Component} from "@wonderlandengine/api";
/**
 * move
 */
export class Move extends Component {
	static TypeName = "move";

	update(dt: number) {
		/* Called every frame. */
		this.object.translateWorld([dt, 0, 0]);
	}
}
