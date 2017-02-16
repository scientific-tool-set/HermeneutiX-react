import Commentable from './commentable';

export default class Connectable extends Commentable {
	/**
	 * @constructor
	 */
	constructor() {
		super();

		this.superOrdinatedRelation = null;
		this.role = null;
	}
}
