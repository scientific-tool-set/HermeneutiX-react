/**
 * Role (described by a title and high or low weight) of an associate (Proposition|Relation) in a superordinated Relation.
 */
export default class AssociateRole {
	/**
	 * @constructor
	 * @param {string} role - this associate's role in the super ordinated relation
	 * @param {boolean} highWeight - whether this associate has a high weight in the super ordinated relation
	 */
	constructor(role, highWeight) {
		this.role = role;
		this.highWeight = highWeight;

		Object.freeze(this);
	}
}
