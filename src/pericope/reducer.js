import { NEW_PROJECT, START_ANALYSIS, PREPEND_TEXT, APPEND_TEXT, REMOVE_PROPOSITIONS,
		INDENT_PROPOSITION, MERGE_PROPOSITIONS, REMOVE_INDENTATION, SPLIT_PROPOSITION, RESET_STANDALONE_STATE,
		MERGE_CLAUSE_ITEM_WITH_PRIOR, MERGE_CLAUSE_ITEM_WITH_FOLLOWER, SPLIT_CLAUSE_ITEM,
		CREATE_RELATION, ROTATE_ASSOCIATE_ROLES, ALTER_RELATION_TYPE
		} from '../actions/index';
import * as ModelChanger from './modelChanger';
import { buildPropositionsFromText, copyPlainPericope, copyMutablePericope, getFlatText, getFlatRelations } from './modelHelper';
import Pericope from './model/pericope';
import LanguageModel from './model/languageModel';

const INITIAL_STATE = {
	language: new LanguageModel('', true, [ [ ] ]),
	propositions: [ ],
	connectables: [ ]
};

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
	const mutableAssociates = [ ];
	action.associates.forEach(associate => {
		if (associate.associates) {
			// append respective Relation
			mutableAssociates.push(mutableFlatRelations.get(plainFlatRelations.indexOf(associate)));
		} else {
			// append respective Proposition
			mutableAssociates.push(mutableFlatText.get(plainFlatText.indexOf(associate)));
		}
	});
	ModelChanger.createRelation(mutableAssociates, action.template);
	return copyPlainPericope(mutablePericope);
}

function rotateAssociateRoles(state, action) {
	const relationIndex = getFlatRelations(state).indexOf(action.relation);
	const pericope = copyMutablePericope(state);
	const relation = getFlatRelations(pericope).get(relationIndex);
	ModelChanger.rotateAssociateRoles(relation);
	return copyPlainPericope(pericope);
}

function alterRelationType(state, action) {
	const relationIndex = getFlatRelations(state).indexOf(action.relation);
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

function indexOfPropositionInSeq(flatText, proposition) {
	return flatText.findIndex(prop => prop === proposition);
}

function indexOfClauseItemParentInSeq(flatText, clauseItem) {
	return flatText.findIndex(prop => prop.clauseItems.some(item => item === clauseItem));
}

function indexOfClauseItemInProposition(proposition, clauseItem) {
	return proposition.clauseItems.findIndex(item => item === clauseItem);
}
