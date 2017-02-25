import { NEW_PROJECT, START_ANALYSIS, PREPEND_TEXT, APPEND_TEXT, REMOVE_PROPOSITIONS,
		INDENT_PROPOSITION, MERGE_PROPOSITIONS, REMOVE_INDENTATION, SPLIT_PROPOSITION, RESET_STANDALONE_STATE,
		MERGE_CLAUSE_ITEM_WITH_PRIOR, MERGE_CLAUSE_ITEM_WITH_FOLLOWER, SPLIT_CLAUSE_ITEM,
		CREATE_RELATION, ROTATE_ASSOCIATE_ROLES, ALTER_RELATION_TYPE, REMOVE_RELATION
} from '../actions/index';
import * as ModelChanger from './modelChanger';
import { buildPropositionsFromText, copyPlainPericope, copyMutablePericope, getFlatText, getFlatRelations } from './modelHelper';
import Pericope from './model/pericope';
import LanguageModel from './model/languageModel';

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
 * The object representing a plain Pericope, i.e. the one used as the state.
 * @typedef {object} PlainPericope
 * @property {LanguageModel} language - the associated origin text language with its name, orientation, and syntactic functions
 * @property {Array.<PlainProposition>} text - the list of top level Propositions with their nested child Propositions and partAfterArrows
 * @property {Array.<(PlainPropositionPlaceholder|PlainRelation)>} connectables - the list of relation sub trees filled up with placeholders for unrelated Propositions
 */

/**
 * Initial state to fall back on in the beginning and to reset to on NEW_PROJECT action.
 * @type {PlainPericope}
 */
const INITIAL_STATE = {
	language: new LanguageModel('', true, [ [ ] ]),
	text: [ ],
	connectables: [ ]
};

/**
 * Reducer returning the new state after the given action has been applied.
 * @param {PlainPericope} state - the current state
 * @param {{ type: string }} action - action to apply, additional fields can be expected depending on the action's type
 * @returns {PlainPericope} new state (potentially the old one if nothing changed)
 */
export default function(state = INITIAL_STATE, action) {
	switch (action.type) {
		case NEW_PROJECT:
			return INITIAL_STATE;
		case START_ANALYSIS:
			return copyPlainPericope(new Pericope(buildPropositionsFromText(action.originText)));
		case INDENT_PROPOSITION:
			return indentPropositionUnderParent(state, action);
		case MERGE_PROPOSITIONS:
			return mergePropositions(state, action);
		case REMOVE_INDENTATION:
			return removeOneIndentation(state, action);
		case SPLIT_PROPOSITION:
			return splitProposition(state, action);
		case RESET_STANDALONE_STATE:
			return resetStandaloneStateOfPartAfterArrow(state, action);
		case MERGE_CLAUSE_ITEM_WITH_PRIOR:
			return mergeClauseItemWithPrior(state, action);
		case MERGE_CLAUSE_ITEM_WITH_FOLLOWER:
			return mergeClauseItemWithFollower(state, action);
		case SPLIT_CLAUSE_ITEM:
			return splitClauseItem(state, action);
		case CREATE_RELATION:
			return createRelation(state, action);
		case ROTATE_ASSOCIATE_ROLES:
			return rotateAssociateRoles(state, action);
		case ALTER_RELATION_TYPE:
			return alterRelationType(state, action);
		case REMOVE_RELATION:
			return removeRelation(state, action);
		case PREPEND_TEXT:
			return prependText(state, action);
		case APPEND_TEXT:
			return appendText(state, action);
		case REMOVE_PROPOSITIONS:
			return removePropositions(state, action);
		default:
			return state;
	}
}

/**
 * Subordinate the indicated target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 * @param {PlainPericope} state - current state
 * @param {object} action - object identifying two propositions (to indent target under parent with given function)
 * @param {integer} action.targetIndex - index of the proposition to indent under the other one
 * @param {integer} action.parentIndex - index of the designated parent proposition
 * @param {SyntacticFunction} action.syntacticFunction - syntactic function of the indented proposition in relation to its parent
 * @returns {PlainPericope} new state
 */
function indentPropositionUnderParent(state, action) {
	const pericope = copyMutablePericope(state);
	const pericopeFlatText = getFlatText(pericope).cacheResult();
	const targetProposition = pericopeFlatText.get(action.targetIndex);
	const parentProposition = pericopeFlatText.get(action.parentIndex);
	ModelChanger.indentPropositionUnderParent(targetProposition, parentProposition, action.syntacticFunction);
	return copyPlainPericope(pericope);
}

/**
 * Merge the two indicated propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating two propositions to merge
 * @param {integer} action.propOneIndex - index of one proposition to merge with the other
 * @param {integer} action.propTwoIndex - index of other proposition to merge
 * @returns {PlainPericope} new state
 */
function mergePropositions(state, action) {
	const pericope = copyMutablePericope(state);
	const pericopeFlatText = getFlatText(pericope).cacheResult();
	const propOneProposition = pericopeFlatText.get(action.propOneIndex);
	const propTwoProposition = pericopeFlatText.get(action.propTwoIndex);
	ModelChanger.mergePropositions(propOneProposition, propTwoProposition);
	return copyPlainPericope(pericope);
}

/**
 * Make the indicated proposition a sibling of its current parent, i.e. un-subordinate it once.
 * @param {PlainPericope} state - current state
 * @param {{ propositionIndex: integer }} action - object indicating proposition by its index to move up to the same level as its parent
 * @returns {PlainPericope} new state
 * @throws {IllegalActionError} proposition is a top level propositions or a directly enclosed child
 */
function removeOneIndentation(state, action) {
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(action.propositionIndex);
	ModelChanger.removeOneIndentation(proposition);
	return copyPlainPericope(pericope);
}

/**
 * Split the indicated proposition after the designated clause item and remove all relations that will become invalid by this change.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating proposition to split after designated clause item
 * @param {integer} action.propositionIndex - index of the proposition to split
 * @param {integer} action.lastItemInFirstPartIndex - index of the clause item after which to split
 * @returns {PlainPericope} new state
 * @throws {IllegalActionError}
 */
function splitProposition(state, action) {
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(action.propositionIndex);
	const item = proposition.clauseItems.get(action.lastItemInFirstPartIndex);
	ModelChanger.splitProposition(proposition, item);
	return copyPlainPericope(pericope);
}

/**
 * Restore the standalone state of the indicated proposition part.
 * @param {PlainPericope} state - current state
 * @param {{ partAfterArrowIndex: integer }} action - object indicating proposition part by its index to reset to being a standalone proposition
 * @returns {PlainPericope} new state
 */
function resetStandaloneStateOfPartAfterArrow(state, action) {
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(action.partAfterArrowIndex);
	ModelChanger.resetStandaloneStateOfPartAfterArrow(proposition);
	return copyPlainPericope(pericope);
}

/**
 * Merge the indicated clause item with its preceeding clause item.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating the item to merge with its prior (and their parent proposition)
 * @param {integer} action.parentPropositionIndex - index of the item's parent proposition
 * @param {integer} action.itemToMergeIndex - index in its parent proposition of the item to merge with its prior
 * @returns {PlainPericope} new state
 * @throws {IllegalActionError} no preceeding clause item found
 */
function mergeClauseItemWithPrior(state, action) {
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(action.parentPropositionIndex);
	const item = proposition.clauseItems.get(action.itemToMergeIndex);
	ModelChanger.mergeClauseItemWithPrior(proposition, item);
	return copyPlainPericope(pericope);
}

/**
 * Merge the indicated  clause item with its following clause item.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating the item to merge with its follower (and their parent proposition)
 * @param {integer} action.parentPropositionIndex - index of the item's parent proposition
 * @param {integer} action.itemToMergeIndex - index in its parent proposition of the item to merge with its follower
 * @returns {PlainPericope} new state
 * @throws {IllegalActionError} no following clause item found
 */
function mergeClauseItemWithFollower(state, action) {
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(action.parentPropositionIndex);
	const item = proposition.clauseItems.get(action.itemToMergeIndex);
	ModelChanger.mergeClauseItemWithFollower(proposition, item);
	return copyPlainPericope(pericope);
}

/**
 * Split the indicated clause item after the specified origin text part.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating the clause item to split (and their parent proposition)
 * @param {integer} action.parentPropositionIndex - index of the proposition in which to split the clause item
 * @param {integer} action.itemToSplitIndex - index in its parent proposition of the clause item to split
 * @param {string} action.firstOriginTextPart - leading origin text part after which to split the clause item
 * @returns {PlainPericope} new state
 */
function splitClauseItem(state, action) {
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(action.parentPropositionIndex);
	const item = proposition.clauseItems.get(action.itemToSplitIndex);
	ModelChanger.splitClauseItem(proposition, item, action.firstOriginTextPart);
	return copyPlainPericope(pericope);
}

/**
 * Create a relation over the indicated associates by setting their roles and weights according to the specified template.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating elements to combine under new relation
 * @param {Array.<({ relationIndex: integer }|{ propositionIndex: integer })>} action.associates - indexes of the elements to combine under new relation
 * @param {RelationTempate} action.template - template defining roles and weights for the relation's associates
 * @returns {PlainPericope} new state
 */
function createRelation(state, action) {
	const mutablePericope = copyMutablePericope(state);
	const mutableFlatRelations = getFlatRelations(mutablePericope).cacheResult();
	const mutableFlatText = getFlatText(mutablePericope).cacheResult();
	const mutableAssociates = action.associates.map(associate => {
		if (associate.hasOwnProperty('relationIndex')) {
			return mutableFlatRelations.get(associate.relationIndex);
		}
		return mutableFlatText.get(associate.propositionIndex);
	});
	ModelChanger.createRelation(mutableAssociates, action.template);
	return copyPlainPericope(mutablePericope);
}

/**
 * Rotate the roles (with their weights) between all associates of the indicated relation, by one step from top to bottom.
 * @param {PlainPericope} state - current state
 * @param {{ relationIndex: integer }} action - object indicating the relation by its index in which to rotate all associates' roles
 * @returns {PlainPericope} new state
 */
function rotateAssociateRoles(state, action) {
	const pericope = copyMutablePericope(state);
	const relation = getFlatRelations(pericope).get(action.relationIndex);
	ModelChanger.rotateAssociateRoles(relation);
	return copyPlainPericope(pericope);
}

/**
 * Change the indicated relation's type according to the specified template.
 * @param {PlainPericope} state - current state
 * @param {object} action - object indicating the relation to change and the applicable template
 * @param {integer} action.relationIndex - index of the relation to change
 * @param {RelationTemplate} action.template - template defining roles and weights for the relation's associates
 * @returns {PlainPericope} new state
 */
function alterRelationType(state, action) {
	const pericope = copyMutablePericope(state);
	const relation = getFlatRelations(pericope).get(action.relationIndex);
	ModelChanger.alterRelationType(relation, action.template);
	return copyPlainPericope(pericope);
}

/**
 * Remove the indicated relation and all super ordinated relations, thereby also cleaning up any back references from its associates.
 * @param {PlainPericope} state - current state
 * @param {{ relationIndex: integer }} action - object indicating the relation to remove by its index
 * @returns {PlainPericope} new state
 */
function removeRelation(state, action) {
	const pericope = copyMutablePericope(state);
	const relation = getFlatRelations(pericope).get(action.relationIndex);
	ModelChanger.removeRelation(relation);
	return copyPlainPericope(pericope);
}

/**
 * Add the specified origin text as new propositions in front of the existing ones.
 * @param {PlainPericope} state - current state
 * @param {{ originText: string }} action - object containing the text to prepend to current state
 * @returns {PlainPericope} new state
 */
function prependText(state, action) {
	const pericope = copyMutablePericope(state);
	ModelChanger.prependText(pericope, action.originText);
	return copyPlainPericope(pericope);
}

/**
 * Add the specified origin text as new propositions behind the existing ones on the given pericope.
 * @param {PlainPericope} state - current state
 * @param {{ originText: string }} action - object containing the text to append to current state
 * @returns {PlainPericope} new state
 */
function appendText(state, action) {
	const pericope = copyMutablePericope(state);
	ModelChanger.appendText(pericope, action.originText);
	return copyPlainPericope(pericope);
}

/**
 * Remove the indicated propositions and their super ordinated relations.
 * Propositions must not be subordinated to others and have no child Propositions of their own.
 * @param {PlainPericope} state - current state
 * @param {{ propositionIndexes: Array.<integer> }} action - object indicating the propositions to remove by their indexes
 * @returns {PlainPericope} new state
 */
function removePropositions(state, action) {
	const pericope = copyMutablePericope(state);
	const pericopeFlatText = getFlatText(pericope).cacheResult();
	const propositions = [ ...action.propositionIndexes ].map(index => pericopeFlatText.get(index));
	ModelChanger.removePropositions(pericope, propositions);
	return copyPlainPericope(pericope);
}
