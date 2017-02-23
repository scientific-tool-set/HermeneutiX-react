import { NEW_PROJECT, START_ANALYSIS, PREPEND_TEXT, APPEND_TEXT, REMOVE_PROPOSITIONS,
		INDENT_PROPOSITION, MERGE_PROPOSITIONS, REMOVE_INDENTATION, SPLIT_PROPOSITION, RESET_STANDALONE_STATE,
		MERGE_CLAUSE_ITEM_WITH_PRIOR, MERGE_CLAUSE_ITEM_WITH_FOLLOWER, SPLIT_CLAUSE_ITEM,
		CREATE_RELATION, ROTATE_ASSOCIATE_ROLES, ALTER_RELATION_TYPE
		} from '../actions/index';
import * as ModelChanger from './modelChanger';
import { buildPropositionsFromText, copyPlainPericope, copyMutablePericope, getFlatText, getFlatRelations } from './modelHelper';
import Pericope from './model/pericope';
import LanguageModel from './model/languageModel';

/**
 * A single ClauseItem converted to a frozen data-only structure.
 * @typedef {object} PlainClauseItem
 * @property {string} originText - the represented part of the origin text
 * @property {?SyntacticFunction} syntacticFunction - th associated syntactic function with its parent proposition
 * @property {?string} comment - additional comment text
 */
/**
 * A single Proposition converted to a frozen structure without circular references (i.e. no back references to objects).
 * @typedef {object} PlainProposition
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
 * @property {?AssociateRole} role - role and weight of this proposition in its super ordinated relation
 */
/**
 * A single Relation converted to a frozen structure without a circular back reference to its super ordinated relation, in the plain connectable subtree.
 * @typedef {object} PlainRelation
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
 * @param {{type: string}} action - action to apply, additional fields can be expected depending on the action's type
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
 * Subordinate the given target proposition under the specified parent and set its indentation function.
 * This may influence indentations of propositions between the given two (target and parent).
 * @param {PlainPericope} state - current state
 * @param {{target: PlainProposition, parent: PlainProposition, syntacticFunction: SyntacticFunction}} action - object containing additional payload for executing action
 * @returns {PlainPericope} new state
 */
function indentPropositionUnderParent(state, action) {
	const plainFlatText = getFlatText(state).cacheResult();
	const targetIndex = indexOfPropositionInSeq(plainFlatText, action.target);
	const parentIndex = indexOfPropositionInSeq(plainFlatText, action.parent);
	const pericope = copyMutablePericope(state);
	const pericopeFlatText = getFlatText(pericope).cacheResult();
	const targetProposition = pericopeFlatText.get(targetIndex);
	const parentProposition = pericopeFlatText.get(parentIndex);
	ModelChanger.indentPropositionUnderParent(targetProposition, parentProposition, action.syntacticFunction);
	return copyPlainPericope(pericope);
}

/**
 * Merge the two given propositions, which need to be the same kind of children to the same parent or at least adjacent to oneanother.
 * @param {PlainPericope} state - current state
 * @param {{propOne: PlainProposition, propTwo: PlainProposition}} action - object containing additional payload for executing action
 * @returns {PlainPericope} new state
 */
function mergePropositions(state, action) {
	const plainFlatText = getFlatText(state).cacheResult();
	const propOneIndex = indexOfPropositionInSeq(plainFlatText, action.propOne);
	const propTwoIndex = indexOfPropositionInSeq(plainFlatText, action.propTwo);
	const pericope = copyMutablePericope(state);
	const pericopeFlatText = getFlatText(pericope).cacheResult();
	const propOneProposition = pericopeFlatText.get(propOneIndex);
	const propTwoProposition = pericopeFlatText.get(propTwoIndex);
	ModelChanger.mergePropositions(propOneProposition, propTwoProposition);
	return copyPlainPericope(pericope);
}

function removeOneIndentation(state, action) {
	const index = indexOfPropositionInSeq(getFlatText(state), action.proposition);
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(index);
	ModelChanger.removeOneIndentation(proposition);
	return copyPlainPericope(pericope);
}

function splitProposition(state, action) {
	const flatText = getFlatText(state).cacheResult();
	const propositionIndex = indexOfPropositionInSeq(flatText, action.proposition);
	const itemIndex = indexOfClauseItemInProposition(flatText.get(propositionIndex), action.lastItemInFirstPart);
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(propositionIndex);
	ModelChanger.splitProposition(proposition, proposition.clauseItems.get(itemIndex));
	return copyPlainPericope(pericope);
}

function resetStandaloneStateOfPartAfterArrow(state, action) {
	const index = indexOfPropositionInSeq(getFlatText(state), action.proposition);
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(index);
	ModelChanger.resetStandaloneStateOfPartAfterArrow(proposition);
	return copyPlainPericope(pericope);
}

function mergeClauseItemWithPrior(state, action) {
	const flatText = getFlatText(state).cacheResult();
	const propositionIndex = indexOfClauseItemParentInSeq(flatText, action.itemToMerge);
	const itemIndex = indexOfClauseItemInProposition(flatText.get(propositionIndex), action.itemToMerge);
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(propositionIndex);
	ModelChanger.mergeClauseItemWithPrior(proposition, proposition.clauseItems.get(itemIndex));
	return copyPlainPericope(pericope);
}

function mergeClauseItemWithFollower(state, action) {
	const flatText = getFlatText(state).cacheResult();
	const propositionIndex = indexOfClauseItemParentInSeq(flatText, action.itemToMerge);
	const itemIndex = indexOfClauseItemInProposition(flatText.get(propositionIndex), action.itemToMerge);
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(propositionIndex);
	ModelChanger.mergeClauseItemWithFollower(proposition, proposition.clauseItems.get(itemIndex));
	return copyPlainPericope(pericope);
}

function splitClauseItem(state, action) {
	const flatText = getFlatText(state).cacheResult();
	const propositionIndex = indexOfClauseItemParentInSeq(flatText, action.itemToSplit);
	const itemIndex = indexOfClauseItemInProposition(flatText.get(propositionIndex), action.itemToSplit);
	const pericope = copyMutablePericope(state);
	const proposition = getFlatText(pericope).get(propositionIndex);
	ModelChanger.splitClauseItem(proposition, proposition.clauseItems.get(itemIndex), action.firstOriginTextPart);
	return copyPlainPericope(pericope);
}

function createRelation(state, action) {
	const plainFlatRelations = getFlatRelations(state).cacheResult();
	const plainFlatText = getFlatText(state, true).cacheResult();
	const mutablePericope = copyMutablePericope(state);
	const mutableFlatRelations = getFlatRelations(mutablePericope).cacheResult();
	const mutableFlatText = getFlatText(mutablePericope, true).cacheResult();
	const mutableAssociates = action.associates.map(associate => {
		if (associate.associates) {
			// append respective Relation
			return mutableFlatRelations.get(indexOfRelationInSeq(plainFlatRelations, associate));
		}
		// append respective Proposition
		return mutableFlatText.get(indexOfPropositionInSeq(plainFlatText, associate));
	});
	ModelChanger.createRelation(mutableAssociates, action.template);
	return copyPlainPericope(mutablePericope);
}

function rotateAssociateRoles(state, action) {
	const relationIndex = indexOfRelationInSeq(getFlatRelations(state), action.relation);
	const pericope = copyMutablePericope(state);
	const relation = getFlatRelations(pericope).get(relationIndex);
	ModelChanger.rotateAssociateRoles(relation);
	return copyPlainPericope(pericope);
}

function alterRelationType(state, action) {
	const relationIndex = indexOfRelationInSeq(getFlatRelations(state), action.relation);
	const pericope = copyMutablePericope(state);
	const relation = getFlatRelations(pericope).get(relationIndex);
	ModelChanger.alterRelationType(relation, action.template);
	return copyPlainPericope(pericope);
}

function prependText(state, action) {
	const pericope = copyMutablePericope(state);
	ModelChanger.prependText(pericope, action.originText);
	return copyPlainPericope(pericope);
}

function appendText(state, action) {
	const pericope = copyMutablePericope(state);
	ModelChanger.appendText(pericope, action.originText);
	return copyPlainPericope(pericope);
}

function removePropositions(state, action) {
	const plainFlatText = getFlatText(state).cacheResult();
	const pericope = copyMutablePericope(state);
	const pericopeFlatText = getFlatText(pericope).cacheResult();
	const propositions = action.propositions.map(prop => indexOfPropositionInSeq(plainFlatText, prop)).map(index => pericopeFlatText.get(index));
	ModelChanger.removePropositions(pericope, propositions);
	return copyPlainPericope(pericope);
}

/**
 * Find the index of the given proposition in the provided flat sequence.
 * @param {Seq.<(Proposition|PlainProposition)>} flatText - flat sequence of all propositions
 * @param {Proposition|PlainProposition} proposition - element to determine index for
 * @returns {integer} index of given proposition
 */
function indexOfPropositionInSeq(flatText, proposition) {
	return flatText.findIndex(prop => prop === proposition);
}

/**
 * Find the index of the given clause item's parent proposition in the provided flat sequence.
 * @param {Seq.<(Proposition|PlainProposition)>} flatText - flat sequence of all propositions
 * @param {ClauseItem|PlainClauseItem} clauseItem - element to determine index for
 * @returns {integer} index of given clause item's parent proposition
 */
function indexOfClauseItemParentInSeq(flatText, clauseItem) {
	return flatText.findIndex(prop => prop.clauseItems.some(item => item === clauseItem));
}

/**
 * Find the index of the given clause item in the given parent proposition.
 * @param {Proposition|PlainProposition} proposition - proposition to find clause item in
 * @param {ClauseItem|PlainClauseItem} clauseItem - element to determine index for
 * @returns {integer} index of given clause item in the given parent proposition
 */
function indexOfClauseItemInProposition(proposition, clauseItem) {
	return proposition.clauseItems.findIndex(item => item === clauseItem);
}

/**
 * Find the index of the given relation in the provided flat sequence.
 * @param {Seq.<(Relation|PlainRelation)>} flatRelations - flat sequence of all relations
 * @param {Relation|PlainRelation} relation - element to determine index for
 * @returns {integer} index of given relation
 */
function indexOfRelationInSeq(flatRelations, relation) {
	return flatRelations.findIndex(rel => rel === relation);
}
