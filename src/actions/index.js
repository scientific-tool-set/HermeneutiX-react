export const NEW_PROJECT = 'NEW_PROJECT';
export const START_ANALYSIS = 'START_ANALYSIS';
export const INDENT_PROPOSITION = 'INDENT_PROPOSITION';
export const MERGE_PROPOSITIONS = 'MERGE_PROPOSITIONS';
export const REMOVE_INDENTATION = 'REMOVE_INDENTATION';
export const SPLIT_PROPOSITION = 'SPLIT_PROPOSITION';
export const RESET_STANDALONE_STATE = 'RESET_STANDALONE_STATE';
export const MERGE_CLAUSE_ITEM_WITH_PRIOR = 'MERGE_CLAUSE_ITEM_WITH_PRIOR';
export const MERGE_CLAUSE_ITEM_WITH_FOLLOWER = 'MERGE_CLAUSE_ITEM_WITH_FOLLOWER';
export const SPLIT_CLAUSE_ITEM = 'SPLIT_CLAUSE_ITEM';
export const CREATE_RELATION = 'CREATE_RELATION';
export const ROTATE_ASSOCIATE_ROLES = 'ROTATE_ASSOCIATE_ROLES';
export const ALTER_RELATION_TYPE = 'ALTER_RELATION_TYPE';
export const REMOVE_RELATION = 'REMOVE_RELATION';
export const PREPEND_TEXT = 'PREPEND_TEXT';
export const APPEND_TEXT = 'APPEND_TEXT';
export const REMOVE_PROPOSITIONS = 'REMOVE_PROPOSITIONS';

/**
 * A single ClauseItem converted to an immutable data-only structure.
 * @typedef {object} PlainClauseItem
 * @property {integer} index - index of the represented clause item in its parent propostion
 * @property {integer} parentIndex - index of the parent proposition in the origin text order
 * @property {string} originText - the represented part of the origin text
 * @property {?SyntacticFunction} syntacticFunction - th associated syntactic function with its parent proposition
 * @property {?string} comment - additional comment text
 */
/**
 * A single Proposition converted to an immutable structure without circular references (i.e. no back references to objects).
 * @typedef {object} PlainProposition
 * @property {integer} index - index of the represented proposition in the origin text order
 * @property {?Array.<PlainProposition>} priorChildren - preceeding subordinated child propositions
 * @property {Array.<PlainClauseItem>} clauseItems - the clause items containing the origin text
 * @property {?string} label - a short identifier
 * @property {?string} syntacticTranslation - associated translation from the syntactic analysis
 * @property {?string} semanticTranslation - associated translation from the semantic analysis
 * @property {?SyntacticFunction} syntacticFunction - syntactic function of this proposition (if it is subordinated to another one)
 * @property {?string} comment - additional comment text
 * @property {?Array.<PlainProposition>} laterChildren - following subordinated child propositions
 * @property {?PlainProposition} partAfterArrow - another part of the same proposition that continues after some enclosed subordinated child propositions
 */
/**
 * Representation of a non-partAfterArrow Proposition in the plain connectable subtree.
 * @typedef {object} PlainPropositionPlaceholder
 * @property {integer} index - index of the represented proposition in the origin text order
 * @property {?AssociateRole} role - role and weight of this proposition in its super ordinated relation
 */
/**
 * A single Relation converted to an immutable structure without a circular back reference to its super ordinated relation, in the plain connectable subtree.
 * @typedef {object} PlainRelation
 * @property {integer} index - index of the represented relation in the origin text order (and from top to bottom in case of a relation tree)
 * @property {Array.<(PlainPropositionPlaceholder|PlainRelation)>} associates - contained propositions and/or relations in this one
 * @property {?AssociateRole} role - role and weight of this relation in its super ordinated relation
 */

/**
 * Helper for constructing consistent action objects.
 * @param {string} type - constant determing the action's type
 * @param {object} payload - repective content to include as contextual information in the action
 * @returns {{ type: string }} created action
 */
const createAction = (type, payload = {}) => ({ type, ...payload });

/**
 * Action Creator: initialising a new (empty) project.
 * @returns {{ type: string }} created action
 */
export const createNewProject = () => ({ type: NEW_PROJECT });

/**
 * Action Creator: Start analysis of pericope based on the given origin text.
 * @param {string} originText - origin text to create initial pericope structure from
 * @returns {{ type: string, originText: string }} created action
 */
export const startAnalysis = originText => createAction(START_ANALYSIS, { originText });

/**
 * Action Creator: Subordinate the given target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 * @param {PlainProposition} target - proposition to subordinate under parent
 * @param {PlainProposition} parent - proposition to subordinate target to
 * @param {SyntacticFunction} syntacticFunction - indentation function to set for target
 * @returns {{ action: string, targetIndex: integer, parentIndex: integer, syntacticFunction: SyntacticFunction }} created action
 */
export const indentPropositionUnderParent = (target, parent, syntacticFunction) => {
	return createAction(INDENT_PROPOSITION, {
		targetIndex: target.index,
		parentIndex: parent.index,
		syntacticFunction
	});
};

/**
 * Action Creator: Merge the two given propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {PlainProposition} propOne - one proposition to merge with the other
 * @param {PlainProposition} propTwo - other proposition to merge with the one
 * @returns {{ action: string, propOneIndex: integer, propTwoIndex: integer }} created action
 */
export const mergePropositions = (propOne, propTwo) => {
	return createAction(MERGE_PROPOSITIONS, {
		propOneIndex: propOne.index,
		propTwoIndex: propTwo.index
	});
};

/**
 * Action Creator: Make the given proposition a sibling of its current parent, i.e. un-subordinate it once.
 * @param {PlainProposition} proposition - proposition to move up to the same level as its parent
 * @returns {{ action: string, propositionIndex: integer }} created action
 */
export const removeOneIndentation = proposition => {
	return createAction(REMOVE_INDENTATION, {
		propositionIndex: proposition.index
	});
};

/**
 * Action Creator: Split the item's parent proposition after the designated clause item and remove all relations that will become invalid by this change.
 * @param {PlainClauseItem} lastItemInFirstPart - last clause item after which to split the proposition
 * @returns {{ action: string, propositionIndex: integer, lastItemInFirstPartIndex: integer }} created action
 */
export const splitProposition = (lastItemInFirstPart) => {
	return createAction(SPLIT_PROPOSITION, {
		propositionIndex: lastItemInFirstPart.parentIndex,
		lastItemInFirstPartIndex: lastItemInFirstPart.index
	});
};

/**
 * Action Creator: Restore the standalone state of the given proposition part.
 * @param {PlainProposition} partAfterArrow - proposition part to revert into connectable proposition
 * @returns {{ action: string, partAfterArrowIndex: integer }} created action
 */
export const resetStandaloneStateOfPartAfterArrow = partAfterArrow => {
	return createAction(RESET_STANDALONE_STATE, {
		partAfterArrowIndex: partAfterArrow.index
	});
};

/**
 * Action Creator: Merge the given clause item with its preceeding clause item.
 * @param {PlainClauseItem} itemToMerge - trailing clause item to merge
 * @returns {{ action: string, parentPropositionIndex: integer, itemToMergeIndex: integer }} created action
 */
export const mergeClauseItemWithPrior = itemToMerge => {
	return createAction(MERGE_CLAUSE_ITEM_WITH_PRIOR, {
		parentPropositionIndex: itemToMerge.parentIndex,
		itemToMergeIndex: itemToMerge.index
	});
};

/**
 * Action Creator: Merge the given clause item with its following clause item.
 * @param {PlainClauseItem} itemToMerge - leading clause item to merge
 * @returns {{ action: string, parentPropositionIndex: integer, itemToMergeIndex: integer }} created action
 */
export const mergeClauseItemWithFollower = itemToMerge => {
	return createAction(MERGE_CLAUSE_ITEM_WITH_FOLLOWER, {
		parentPropositionIndex: itemToMerge.parentIndex,
		itemToMergeIndex: itemToMerge.index
	});
};

/**
 * Split the given clause item after the specified origin text part.
 * @param {PlainClauseItem} itemToSplit - clause item to split into two
 * @param {string} firstOriginTextPart - leading part of the origin text after which to split the clause item into two
 * @returns {{ action: string, parentPropositionIndex: integer, itemToSplitIndex: integer, firstOriginTextPart: string }} created action
 */
export const splitClauseItem = (itemToSplit, firstOriginTextPart) => {
	return createAction(SPLIT_CLAUSE_ITEM, {
		parentPropositionIndex: itemToSplit.parentIndex,
		itemToSplitIndex: itemToSplit.index,
		firstOriginTextPart
	});
};

/**
 * Action Creator: Create a relation over the given associates by setting their roles and weights according to the specified template.
 * @param {Array.<(PlainRelation|PlainProposition)>} associates - elements to combine under new super ordinated relation
 * @param {RelationTemplate} template - definition of applicable roles and weights of the associates in the new relation
 * @returns {{ action: string, associates: Array.<({ relationIndex: integer }|{ propositionIndex: integer })>, template: RelationTempate }} created action
 */
export const createRelation = (associates, template) => {
	return createAction(CREATE_RELATION, {
		associates: [ ...associates ].map(element => {
			if (element.associates) {
				return { relationIndex: element.index };
			}
			return { propositionIndex: element.index };
		}),
		template
	});
};

/**
 * Action Creator: Rotate the roles (with their weights) between all associates of the given relation, by one step from top to bottom.
 * @param {PlainRelation} relation - relation in which to rotate all associates' roles
 * @returns {{ action: string, relationIndex: integer }} created action
 */
export const rotateAssociateRoles = relation => {
	return createAction(ROTATE_ASSOCIATE_ROLES, {
		relationIndex: relation.index
	});
};

/**
 * Action Creator: Change the given relations type according to the specified template.
 * @param {PlainRelation} relation - relation to change the type of
 * @param {RelationTempate} template - new relation type to apply
 * @returns {{ action: string, relationIndex: integer, template: RelationTempate }} created action
 */
export const alterRelationType = (relation, template) => {
	return createAction(ALTER_RELATION_TYPE, {
		relationIndex: relation.index,
		template
	});
};

/**
 * Action Creator: Remove the given relation and all super ordinated relations.
 * @param {Relation} relation - relation to remove
 * @returns {{ action: string, relation: Relation }} created action
 */
export const removeRelation = relation => {
	return createAction(REMOVE_RELATION, {
		relationIndex: relation.index
	});
};

/**
 * Action Creator: Add the specified origin text as new propositions in front of the existing ones.
 * @param {string} originText - origin text to prepend
 * @returns {{ action: string, originText: string }} created action
 */
export const prependText = originText => createAction(PREPEND_TEXT, { originText });

/**
 * Action Creator: Add the specified origin text as new propositions behind the existing ones.
 * @param {string} originText - origin text to append
 * @returns {{ action: string, originText: string }} created action
 */
export const appendText = originText => createAction(APPEND_TEXT, { originText });

/**
 * Action Creator: Remove the specified propositions and their super ordinated relations.
 * Propositions must not be subordinated to other ones and have no child Propositions of their own.
 * @param {Array.<PlainProposition>} propositions - propositions to remove from pericope
 * @returns {{ action: string, propositionIndexes: Array.<integer> }} created action
 */
export const removePropositions = propositions => {
	return createAction(REMOVE_PROPOSITIONS, {
		propositionIndexes: [ ...propositions ].map(prop => prop.index)
	});
};
