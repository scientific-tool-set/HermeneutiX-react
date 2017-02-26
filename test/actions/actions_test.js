import * as ActionCreator from '../../src/actions/index';
import SyntacticFunction from '../../src/pericope/model/syntacticFunction';
import RelationTemplate from '../../src/pericope/model/relationTemplate';
import AssociateRole from '../../src/pericope/model/associateRole';

describe('ActionCreator', () => {
	it('create START_ANALYSIS action', () => {
		const originText = 'Some text';
		const languageName = 'Greek';
		const font = { type: 'Times New Roman', size: 16 };
		const action = ActionCreator.startAnalysis(originText, languageName, font);

		expect(action.type).toEqual(ActionCreator.START_ANALYSIS);
		expect(action.originText).toEqual(originText);
		expect(action.languageName).toEqual(languageName);
		expect(action.font).toEqual(font);
	});

	it('create INDENT_PROPOSITION action', () => {
		const targetIndex = 1;
		const parentIndex = 2;
		const syntacticFunction = new SyntacticFunction('F', 'SomeFunction');
		const action = ActionCreator.indentPropositionUnderParent({ index: targetIndex }, { index: parentIndex }, syntacticFunction);

		expect(action.type).toEqual(ActionCreator.INDENT_PROPOSITION);
		expect(action.targetIndex).toBe(targetIndex);
		expect(action.parentIndex).toBe(parentIndex);
		expect(action.syntacticFunction).toEqual(syntacticFunction);
	});

	it('create MERGE_PROPOSITIONS action', () => {
		const propOneIndex = 1;
		const propTwoIndex = 2;
		const action = ActionCreator.mergePropositions({ index: propOneIndex }, { index: propTwoIndex });

		expect(action.type).toEqual(ActionCreator.MERGE_PROPOSITIONS);
		expect(action.propOneIndex).toBe(propOneIndex);
		expect(action.propTwoIndex).toBe(propTwoIndex);
	});

	it('create REMOVE_INDENTATION action', () => {
		const propositionIndex = 1;
		const action = ActionCreator.removeOneIndentation({ index: propositionIndex });

		expect(action.type).toEqual(ActionCreator.REMOVE_INDENTATION);
		expect(action.propositionIndex).toBe(propositionIndex);
	});

	it('create SPLIT_PROPOSITION action', () => {
		const propositionIndex = 1;
		const itemIndex = 2;
		const action = ActionCreator.splitProposition({ parentIndex: propositionIndex, index: itemIndex });

		expect(action.type).toEqual(ActionCreator.SPLIT_PROPOSITION);
		expect(action.propositionIndex).toBe(propositionIndex);
		expect(action.lastItemInFirstPartIndex).toBe(itemIndex);
	});

	it('create RESET_STANDALONE_STATE action', () => {
		const propositionIndex = 1;
		const action = ActionCreator.resetStandaloneStateOfPartAfterArrow({ index: propositionIndex });

		expect(action.type).toEqual(ActionCreator.RESET_STANDALONE_STATE);
		expect(action.partAfterArrowIndex).toBe(propositionIndex);
	});

	it('create MERGE_CLAUSE_ITEM_WITH_PRIOR action', () => {
		const propositionIndex = 1;
		const itemIndex = 2;
		const action = ActionCreator.mergeClauseItemWithPrior({ parentIndex: propositionIndex, index: itemIndex });

		expect(action.type).toEqual(ActionCreator.MERGE_CLAUSE_ITEM_WITH_PRIOR);
		expect(action.parentPropositionIndex).toBe(propositionIndex);
		expect(action.itemToMergeIndex).toBe(itemIndex);
	});

	it('create MERGE_CLAUSE_ITEM_WITH_FOLLOWER action', () => {
		const propositionIndex = 1;
		const itemIndex = 2;
		const action = ActionCreator.mergeClauseItemWithFollower({ parentIndex: propositionIndex, index: itemIndex });

		expect(action.type).toEqual(ActionCreator.MERGE_CLAUSE_ITEM_WITH_FOLLOWER);
		expect(action.parentPropositionIndex).toBe(propositionIndex);
		expect(action.itemToMergeIndex).toBe(itemIndex);
	});

	it('create SPLIT_CLAUSE_ITEM action', () => {
		const propositionIndex = 1;
		const itemIndex = 2;
		const firstOriginTextPart = 'Word';
		const action = ActionCreator.splitClauseItem({ parentIndex: propositionIndex, index: itemIndex }, firstOriginTextPart);

		expect(action.type).toEqual(ActionCreator.SPLIT_CLAUSE_ITEM);
		expect(action.parentPropositionIndex).toBe(propositionIndex);
		expect(action.itemToSplitIndex).toBe(itemIndex);
		expect(action.firstOriginTextPart).toEqual(firstOriginTextPart);
	});

	it('create CREATE_RELATION action', () => {
		const propositionIndexOne = 0;
		const relationIndexTwo = 0;
		const propositionIndexThree = 4;
		const relationIndexFour = 1;
		const role = new AssociateRole('A', true);
		const template = new RelationTemplate(role, role, role);
		const action = ActionCreator.createRelation([
			{ index: propositionIndexOne },
			{ index: relationIndexTwo, associates: [] },
			{ index: propositionIndexThree },
			{ index: relationIndexFour, associates: [] }
		], template);

		expect(action.type).toEqual(ActionCreator.CREATE_RELATION);
		expect(action.associates.length).toBe(4);
		expect(action.associates[0].propositionIndex).toBe(propositionIndexOne);
		expect(action.associates[1].relationIndex).toBe(relationIndexTwo);
		expect(action.associates[2].propositionIndex).toBe(propositionIndexThree);
		expect(action.associates[3].relationIndex).toBe(relationIndexFour);
		expect(action.template).toEqual(template);
	});

	it('create ROTATE_ASSOCIATE_ROLES action', () => {
		const relationIndex = 1;
		const action = ActionCreator.rotateAssociateRoles({ index: relationIndex });

		expect(action.type).toEqual(ActionCreator.ROTATE_ASSOCIATE_ROLES);
		expect(action.relationIndex).toBe(relationIndex);
	});

	it('create ALTER_RELATION_TYPE action', () => {
		const relationIndex = 1;
		const role = new AssociateRole('A', true);
		const template = new RelationTemplate(role, role, role);
		const action = ActionCreator.alterRelationType({ index: relationIndex }, template);

		expect(action.type).toEqual(ActionCreator.ALTER_RELATION_TYPE);
		expect(action.relationIndex).toBe(relationIndex);
		expect(action.template).toEqual(template);
	});

	it('create REMOVE_RELATION action', () => {
		const relationIndex = 1;
		const action = ActionCreator.removeRelation({ index: relationIndex });

		expect(action.type).toEqual(ActionCreator.REMOVE_RELATION);
		expect(action.relationIndex).toBe(relationIndex);
	});

	it('create PREPEND_TEXT action', () => {
		const originText = 'text to prepend';
		const action = ActionCreator.prependText(originText);

		expect(action.type).toEqual(ActionCreator.PREPEND_TEXT);
		expect(action.originText).toEqual(originText);
	});

	it('create APPEND_TEXT action', () => {
		const originText = 'text to append';
		const action = ActionCreator.appendText(originText);

		expect(action.type).toEqual(ActionCreator.APPEND_TEXT);
		expect(action.originText).toEqual(originText);
	});

	it('create REMOVE_PROPOSITIONS action', () => {
		const propositionIndexOne = 0;
		const propositionIndexTwo = 1;
		const propositionIndexThree = 4;
		const propositionIndexFour = 5;
		const action = ActionCreator.removePropositions([
			{ index: propositionIndexOne },
			{ index: propositionIndexTwo },
			{ index: propositionIndexThree },
			{ index: propositionIndexFour }
		]);

		expect(action.type).toEqual(ActionCreator.REMOVE_PROPOSITIONS);
		expect(action.propositionIndexes.length).toBe(4);
		expect(action.propositionIndexes[0]).toBe(propositionIndexOne);
		expect(action.propositionIndexes[1]).toBe(propositionIndexTwo);
		expect(action.propositionIndexes[2]).toBe(propositionIndexThree);
		expect(action.propositionIndexes[3]).toBe(propositionIndexFour);
	});
});
