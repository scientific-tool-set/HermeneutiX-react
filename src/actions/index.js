export const START_ANALYSIS = 'START_ANALYSIS';
export const TOGGLE_PROPOSITION_SELECTION = 'TOGGLE_PROPOSITION_SELECTION';
export const SET_PROPOSITION_LABEL = 'SET_PROPOSITION_LABEL';
export const SET_SYNTACTIC_TRANSLATION = 'SET_SYNTACTIC_TRANSLATION';
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
 * Helper for constructing consistent action objects.
 * @param {string} type - constant determing the action's type
 * @param {object} payload - repective content to include as contextual information in the action
 * @returns {{ type: string }} created action
 */
const createAction = (type, payload = {}) => ({
	type,
	...payload
});

/**
 * Action Creator: Start analysis of pericope based on the given origin text.
 * @param {string} originText - origin text to create initial pericope structure from
 * @param {string} languageName - name of the selected origin text language
 * @param {object} font - font to display origin text with
 * @param {string} font.type - font type to use when displaying origin text
 * @param {integer} font.size - font size to apply when displaying origin text
 * @returns {{ type: string, originText: string, languageName: string, font: { type: string, size: integer } }} created action
 */
export const startAnalysis = (originText, languageName, font) => createAction(START_ANALYSIS, {
	originText,
	languageName,
	font
});

/**
 * Action Creator: Select/unselect the indicated proposition.
 * @param {integer} propositionIndex - index of the proposition in origin text order
 * @returns {{ type: string, propositionIndex: integer }} created action
 */
export const togglePropositionSelection = propositionIndex => createAction(TOGGLE_PROPOSITION_SELECTION, {
	propositionIndex
});

/**
 * Action Creator: Change the indicated proposition's label.
 * @param {integer} propositionIndex - index of the proposition in origin text order
 * @param {string} label - new label to set
 * @returns {{ type: string, propositionIndex: integer, label: string }} created action
 */
export const setPropositionLabel = (propositionIndex, label) => createAction(SET_PROPOSITION_LABEL, {
	propositionIndex,
	label
});

/**
 * Action Creator: Change the indicated proposition's syntactic translation.
 * @param {integer} propositionIndex - index of the proposition in origin text order
 * @param {string} translation - new syntactic translation to set
 * @returns {{ type: string, propositionIndex: integer, translation: string }} created action
 */
export const setSyntacticTranslation = (propositionIndex, translation) => createAction(SET_SYNTACTIC_TRANSLATION, {
	propositionIndex,
	translation
});

/**
 * Action Creator: Subordinate the given target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 * @param {integer} targetIndex - index of the proposition to subordinate under parent
 * @param {integer} parentIndex - index of the proposition to subordinate target to
 * @param {SyntacticFunction} syntacticFunction - indentation function to set for target
 * @returns {{ action: string, targetIndex: integer, parentIndex: integer, syntacticFunction: SyntacticFunction }} created action
 */
export const indentPropositionUnderParent = (targetIndex, parentIndex, syntacticFunction) => createAction(INDENT_PROPOSITION, {
	targetIndex,
	parentIndex,
	syntacticFunction
});

/**
 * Action Creator: Merge the two given propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {integer} propOneIndex - index of one proposition to merge with the other
 * @param {integer} propTwoIndex - index of other proposition to merge with the one
 * @returns {{ action: string, propOneIndex: integer, propTwoIndex: integer }} created action
 */
export const mergePropositions = (propOneIndex, propTwoIndex) => createAction(MERGE_PROPOSITIONS, {
	propOneIndex,
	propTwoIndex
});

/**
 * Action Creator: Make the given proposition a sibling of its current parent, i.e. un-subordinate it once.
 * @param {integer} propositionIndex - proposition to move up to the same level as its parent
 * @returns {{ action: string, propositionIndex: integer }} created action
 */
export const removeOneIndentation = propositionIndex => createAction(REMOVE_INDENTATION, {
	propositionIndex
});

/**
 * Action Creator: Split the indicated proposition after the designated clause item and remove all relations that will become invalid by this change.
 * @param {integer} propositionIndex - index of the proposition to split
 * @param {integer} lastItemInFirstPartIndex - index of the last clause item after which to split the proposition
 * @returns {{ action: string, propositionIndex: integer, lastItemInFirstPartIndex: integer }} created action
 */
export const splitProposition = (propositionIndex, lastItemInFirstPartIndex) => createAction(SPLIT_PROPOSITION, {
	propositionIndex,
	lastItemInFirstPartIndex
});

/**
 * Action Creator: Restore the standalone state of the given proposition part.
 * @param {integer} partAfterArrowIndex - index of the proposition part to revert into a connectable proposition
 * @returns {{ action: string, partAfterArrowIndex: integer }} created action
 */
export const resetStandaloneStateOfPartAfterArrow = partAfterArrowIndex => createAction(RESET_STANDALONE_STATE, {
	partAfterArrowIndex
});

/**
 * Action Creator: Merge the indicated clause item with its preceeding clause item.
 * @param {integer} parentPropositionIndex - index of the clause item's parent proposition
 * @param {integer} itemToMergeIndex - index of the clause item to merge
 * @returns {{ action: string, parentPropositionIndex: integer, itemToMergeIndex: integer }} created action
 */
export const mergeClauseItemWithPrior = (parentPropositionIndex, itemToMergeIndex) => createAction(MERGE_CLAUSE_ITEM_WITH_PRIOR, {
	parentPropositionIndex,
	itemToMergeIndex
});

/**
 * Action Creator: Merge the given clause item with its following clause item.
 * @param {integer} parentPropositionIndex - index of the clause item's parent proposition
 * @param {integer} itemToMergeIndex - index of the clause item to merge
 * @returns {{ action: string, parentPropositionIndex: integer, itemToMergeIndex: integer }} created action
 */
export const mergeClauseItemWithFollower = (parentPropositionIndex, itemToMergeIndex) => createAction(MERGE_CLAUSE_ITEM_WITH_FOLLOWER, {
	parentPropositionIndex,
	itemToMergeIndex
});

/**
 * Split the given clause item after the specified origin text part.
 * @param {integer} parentPropositionIndex - index of the clause item's parent proposition
 * @param {integer} itemToSplitIndex - index of the clause item to split into two
 * @param {string} firstOriginTextPart - leading part of the origin text after which to split the clause item into two
 * @returns {{ action: string, parentPropositionIndex: integer, itemToSplitIndex: integer, firstOriginTextPart: string }} created action
 */
export const splitClauseItem = (parentPropositionIndex, itemToSplitIndex, firstOriginTextPart) => createAction(SPLIT_CLAUSE_ITEM, {
	parentPropositionIndex,
	itemToSplitIndex,
	firstOriginTextPart
});

/**
 * Action Creator: Create a relation over the given associates by setting their roles and weights according to the specified template.
 * @param {Array.<({ relationIndex: integer }|{ propositionIndex: integer })>} associates - elements to combine under new super ordinated relation
 * @param {RelationTemplate} template - definition of applicable roles and weights of the associates in the new relation
 * @returns {{ action: string, associates: Array.<({ relationIndex: integer }|{ propositionIndex: integer })>, template: RelationTempate }} created action
 */
export const createRelation = (associates, template) => createAction(CREATE_RELATION, {
	associates: [ ...associates ],
	template
});

/**
 * Action Creator: Rotate the roles (with their weights) between all associates of the given relation, by one step from top to bottom.
 * @param {integer} relationIndex - index of the relation in which to rotate all associates' roles
 * @returns {{ action: string, relationIndex: integer }} created action
 */
export const rotateAssociateRoles = relationIndex => createAction(ROTATE_ASSOCIATE_ROLES, {
	relationIndex
});

/**
 * Action Creator: Change the given relations type according to the specified template.
 * @param {integer} relationIndex - index of the relation to change the type of
 * @param {RelationTempate} template - new relation type to apply
 * @returns {{ action: string, relationIndex: integer, template: RelationTempate }} created action
 */
export const alterRelationType = (relationIndex, template) => createAction(ALTER_RELATION_TYPE, {
	relationIndex,
	template
});

/**
 * Action Creator: Remove the given relation and all super ordinated relations.
 * @param {integer} relationIndex - index of the relation to remove
 * @returns {{ action: string, relationIndex: integer }} created action
 */
export const removeRelation = relationIndex => createAction(REMOVE_RELATION, {
	relationIndex
});

/**
 * Action Creator: Add the specified origin text as new propositions in front of the existing ones.
 * @param {string} originText - origin text to prepend
 * @returns {{ action: string, originText: string }} created action
 */
export const prependText = originText => createAction(PREPEND_TEXT, {
	originText
});

/**
 * Action Creator: Add the specified origin text as new propositions behind the existing ones.
 * @param {string} originText - origin text to append
 * @returns {{ action: string, originText: string }} created action
 */
export const appendText = originText => createAction(APPEND_TEXT, {
	originText
});

/**
 * Action Creator: Remove the specified propositions and their super ordinated relations.
 * Propositions must not be subordinated to other ones and have no child Propositions of their own.
 * @param {Array.<{ integer }>} propositionIndexes - indexes of propositions to remove from pericope
 * @returns {{ action: string, propositionIndexes: Array.<integer> }} created action
 */
export const removePropositions = propositionIndexes => createAction(REMOVE_PROPOSITIONS, {
	propositionIndexes: [ ...propositionIndexes ]
});
