/**
 * Wrapper for an object's single property allowing its retrieval and update via a delegating getter/setter pair.
 */
export default class PropertyAccessor {
	/**
	 * @constructor
	 * @param {object} parent - object containing the wrapped property
	 * @param {string} propertyName - name of the targeted property
	 */
	constructor(parent, propertyName) {
		this.parent = parent;
		this.propertyName = propertyName;

		Object.freeze(this);
	}

	get value() {
		return this.parent[this.propertyName];
	}

	set value(newValue) {
		this.parent[this.propertyName] = newValue;
	}
}
