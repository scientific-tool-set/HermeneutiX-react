import Commentable from './commentable';

export default class ClauseItem extends Commentable {
	constructor(originText) {
		super();

		this.parent = null;
		this.originText = originText;
		this.syntacticFunction = null;
		this.fontStyle = null;
	}

	toString() {
		return `ClauseItem("${this.originText}", syntacticFunction: ${this.syntacticFunction})`;
	}
}
