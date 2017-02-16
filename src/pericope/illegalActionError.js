export default class IllegalActionError extends Error {
	/**
	 * @constructor
	 * @param {string} messageKey - key for the internationalizable error message to display to the user
	 */
	constructor(messageKey) {
		super();

		this.messageKey = messageKey;
	}

	toString() {
		return `IllegalActionError(${this.messageKey})`;
	}
}
