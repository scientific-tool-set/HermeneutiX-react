export default class ListAccessor {
	/**
	 * @constructor
	 * @param {object} parent - pericope containing the wrapped list
	 * @param {string} listName - name of the targeted list property
	 */
	constructor(parent, listName) {
		this.parent = parent;
		this.listName = listName;

		Object.freeze(this);
	}

	get list() {
		return this.parent[this.listName];
	}

	set list(newList) {
		this.parent[this.listName] = newList;
	}
}
