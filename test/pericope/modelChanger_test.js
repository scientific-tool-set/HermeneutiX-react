import * as ModelChanger from '../../src/pericope/modelChanger';
import { getPropositionAt } from '../../src/pericope/modelHelper';
import LanguageModel from '../../src/pericope/model/languageModel';
import SyntacticFunction from '../../src/pericope/model/syntacticFunction';
import SyntacticFunctionGroup from '../../src/pericope/model/syntacticFunctionGroup';
import Pericope from '../../src/pericope/model/pericope';
import Proposition from '../../src/pericope/model/proposition';
import ClauseItem from '../../src/pericope/model/clauseItem';
import RelationTemplate from '../../src/pericope/model/relationTemplate';
import AssociateRole from '../../src/pericope/model/associateRole';
import IllegalActionError from '../../src/pericope/illegalActionError';

describe('ModelChanger', () => {
	const language = new LanguageModel('SomeLanguage', true, [
		[
			new SyntacticFunction('A', 'A Function'),
			new SyntacticFunction('B', 'Second Function', true, 'some description'),
			new SyntacticFunctionGroup('Group', null, [
				new SyntacticFunction('C', 'Nested Function'),
				new SyntacticFunction('D', 'Other Sub Function', false, 'The last one')
			])
		]
	]);
	const defaultRelationTemplate = new RelationTemplate(new AssociateRole('A', true), null, new AssociateRole('B', false), 'something');
	let pericope, first, second, third, fourth, fifth;

	beforeEach(function() {
		first = new Proposition([ new ClauseItem('1 2'), new ClauseItem('3') ]);
		second = new Proposition([ new ClauseItem('4'), new ClauseItem('5') ]);
		third = new Proposition([ new ClauseItem('6') ]);
		fourth = new Proposition([ new ClauseItem('7'), new ClauseItem('8 9') ]);
		fifth = new Proposition([ new ClauseItem('10') ]);
		pericope = new Pericope([ first, second, third, fourth, fifth ], language);
	});

	describe('indentPropositionUnderParent()', () => {
		it('be able to indent Proposition 1 under Proposition 2', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(first, second, syntacticFunction);

			expect(first.parent).toBe(second);
			expect(second.priorChildren.length).toBe(1);
			expect(second.priorChildren[0]).toBe(first);
			expect(getPropositionAt(pericope, 0)).toBe(first);
			expect(first.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to indent Proposition 2 under Proposition 1', () => {
			const syntacticFunction = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);

			expect(second.parent).toBe(first);
			expect(first.laterChildren.length).toBe(1);
			expect(first.laterChildren[0]).toBe(second);
			expect(getPropositionAt(pericope, 1)).toBe(second);
			expect(second.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to indent Propositions 2 and 3 under Proposition 1', () => {
			const functionSecond = language.functionGroups[0][2].subFunctions[0];
			const functionThird = language.functionGroups[0][2].subFunctions[1];
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, first, functionThird);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
			expect(first.laterChildren.length).toBe(2);
			expect(first.laterChildren[0]).toBe(second);
			expect(first.laterChildren[1]).toBe(third);
			expect(getPropositionAt(pericope, 1)).toBe(second);
			expect(getPropositionAt(pericope, 2)).toBe(third);
			expect(second.syntacticFunction).toEqual(functionSecond);
			expect(third.syntacticFunction).toEqual(functionThird);
		});

		it('be able to indent Proposition 2 under Proposition 3 with them being indented under 1 and 4 respectively', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, fourth, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(second, third, syntacticFunction);

			expect(first.laterChildren.length).toBe(0);
			expect(third.priorChildren.length).toBe(1);
			expect(third.priorChildren[0]).toBe(second);
			expect(fourth.priorChildren.length).toBe(1);
			expect(fourth.priorChildren[0]).toBe(third);
		});

		it('be able to indent Propositions 1 and 2 under Proposition 3 as its prior children', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, third, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(first, third, syntacticFunction);

			expect(pericope.text.length).toBe(3);
			expect(pericope.text[0]).toBe(third);
			expect(third.priorChildren.length).toBe(2);
			expect(third.priorChildren[0]).toBe(first);
			expect(third.priorChildren[1]).toBe(second);
			expect(first.parent).toBe(third);
			expect(second.parent).toBe(third);
		});

		it('be able to indent Propositions 2 and 3 under Proposition 1 as its later children', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);

			expect(pericope.text.length).toBe(3);
			expect(pericope.text[0]).toBe(first);
			expect(pericope.text[1]).toBe(fourth);
			expect(first.laterChildren.length).toBe(2);
			expect(first.laterChildren[0]).toBe(second);
			expect(first.laterChildren[1]).toBe(third);
			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
		});

		it('be able to indent Proposition 3 under Proposition 2 with them being indented under 1 and 4 respectively', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, fourth, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, second, syntacticFunction);

			expect(first.laterChildren.length).toBe(1);
			expect(first.laterChildren[0]).toBe(second);
			expect(second.laterChildren.length).toBe(1);
			expect(second.laterChildren[0]).toBe(third);
			expect(fourth.priorChildren.length).toBe(0);
		});

		it('be able to indent last Proposition (in Pericope) under its prior', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(fourth, third, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(fifth, fourth, syntacticFunction);

			expect(third.laterChildren.length).toBe(1);
			expect(third.laterChildren[0]).toBe(fourth);
			expect(fourth.laterChildren.length).toBe(1);
			expect(fourth.laterChildren[0]).toBe(fifth);
		});

		it('be able to indent already correct Propositions, just updating syntactic function', () => {
			const oldFunction = language.functionGroups[0][0];
			const newFunction = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(third, fourth, oldFunction);
			ModelChanger.indentPropositionUnderParent(third, fourth, newFunction);

			expect(fourth.priorChildren.length).toBe(1);
			expect(fourth.priorChildren[0]).toBe(third);
			expect(third.syntacticFunction).not.toEqual(oldFunction);
			expect(third.syntacticFunction).toEqual(newFunction);
		});

		it('be able to indent enclosed Proposition to parent\'s other part, just updating syntactic function', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);

			expect(first.laterChildren.length).toBe(0);
			expect(fourth.priorChildren.length).toBe(2);
			expect(fourth.priorChildren[0]).toBe(second);
			expect(fourth.priorChildren[1]).toBe(third);
			expect(third.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to indent subordinated enclosed Proposition, becoming prior child of parent\'s other part', () => {
			const changedFunction = language.functionGroups[0][1];
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.indentPropositionUnderParent(third, second, language.functionGroups[0][0]);
			ModelChanger.indentPropositionUnderParent(third, first, changedFunction);

			expect(first.laterChildren.length).toBe(0);
			expect(second.laterChildren.length).toBe(0);
			expect(fourth.priorChildren.length).toBe(2);
			expect(fourth.priorChildren[0]).toBe(second);
			expect(fourth.priorChildren[1]).toBe(third);
			expect(third.syntacticFunction).toEqual(changedFunction);
		});

		it('failing to indent Proposition 1 under Proposition 3', () => {
			expect(() => ModelChanger.indentPropositionUnderParent(first, third, language.functionGroups[0][0]))
					.toThrow(new IllegalActionError('Error.Indentation.Create'));
		});

		it('failing to indent Proposition 3 under Proposition 1', () => {
			expect(() => ModelChanger.indentPropositionUnderParent(third, first, language.functionGroups[0][0]))
					.toThrow(new IllegalActionError('Error.Indentation.Create'));
		});

		it('failing to indent non-adjacent Propositions with differing parents', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(first, third, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(fourth, fifth, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(fifth, third, syntacticFunction);

			expect(() => ModelChanger.indentPropositionUnderParent(second, fourth, syntacticFunction))
					.toThrow(new IllegalActionError('Error.Indentation.Create'));
		});
	});

	describe('removeOneIndentation() and removeOneIndentationAffectsOthers()', () => {
		it('be able to remove indentation of single prior child Proposition (without affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups[0][0]);
			expect(ModelChanger.removeOneIndentationAffectsOthers(first)).toBe(false);
			ModelChanger.removeOneIndentation(first);

			expect(first.parent).toBe(pericope);
			expect(second.priorChildren.length).toBe(0);
			expect(first.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of single later child Proposition (without affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups[0][0]);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(false);
			ModelChanger.removeOneIndentation(second);

			expect(second.parent).toBe(pericope);
			expect(first.laterChildren.length).toBe(0);
			expect(second.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of leading prior child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, third, functionSecond);
			ModelChanger.indentPropositionUnderParent(first, third, language.functionGroups[0][1]);
			expect(ModelChanger.removeOneIndentationAffectsOthers(first)).toBe(false);
			ModelChanger.removeOneIndentation(first);

			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(third);
			expect(third.priorChildren.length).toBe(1);
			expect(third.priorChildren[0]).toBe(second);
			expect(first.syntacticFunction).toBe(null);
			expect(second.syntacticFunction).toEqual(functionSecond);
		});

		it('be able to remove indentation of trailing prior child Proposition (but affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(second, third, language.functionGroups[0][0]);
			ModelChanger.indentPropositionUnderParent(first, third, language.functionGroups[0][1]);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(true);
			ModelChanger.removeOneIndentation(second);

			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(pericope);
			expect(third.priorChildren.length).toBe(0);
			expect(first.syntacticFunction).toBe(null);
			expect(second.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of trailing later child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, first, language.functionGroups[0][1]);
			expect(ModelChanger.removeOneIndentationAffectsOthers(third)).toBe(false);
			ModelChanger.removeOneIndentation(third);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(pericope);
			expect(first.laterChildren.length).toBe(1);
			expect(first.laterChildren[0]).toBe(second);
			expect(second.syntacticFunction).toBe(functionSecond);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of leading prior child Proposition (but affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups[0][0]);
			ModelChanger.indentPropositionUnderParent(third, first, language.functionGroups[0][1]);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(true);
			ModelChanger.removeOneIndentation(second);

			expect(second.parent).toBe(pericope);
			expect(third.parent).toBe(pericope);
			expect(first.laterChildren.length).toBe(0);
			expect(second.syntacticFunction).toBe(null);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of prior child Proposition\'s single prior child Proposition (without affecting others)', () => {
			const functionFirst = language.functionGroups[0][0];
			const functionSecond = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(first, second, functionFirst);
			ModelChanger.indentPropositionUnderParent(second, third, functionSecond);
			expect(ModelChanger.removeOneIndentationAffectsOthers(first)).toBe(false);
			ModelChanger.removeOneIndentation(first);

			expect(first.parent).toBe(third);
			expect(second.parent).toBe(third);
			expect(third.priorChildren.length).toBe(2);
			expect(third.priorChildren[0]).toBe(first);
			expect(third.priorChildren[1]).toBe(second);
			expect(first.syntacticFunction).toEqual(functionFirst);
			expect(second.syntacticFunction).toEqual(functionSecond);
		});

		it('be able to remove indentation of prior child Proposition\'s single later child Proposition (without affecting others)', () => {
			const functionFirst = language.functionGroups[0][0];
			const functionSecond = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(first, third, functionFirst);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(false);
			ModelChanger.removeOneIndentation(second);

			expect(first.parent).toBe(third);
			expect(second.parent).toBe(third);
			expect(third.priorChildren.length).toBe(2);
			expect(third.priorChildren[0]).toBe(first);
			expect(third.priorChildren[1]).toBe(second);
			expect(first.syntacticFunction).toEqual(functionFirst);
			expect(second.syntacticFunction).toEqual(functionSecond);
		});

		it('be able to remove indentation of later child Proposition\'s single prior child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups[0][0];
			const functionThird = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(second, third, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, first, functionThird);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(false);
			ModelChanger.removeOneIndentation(second);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
			expect(first.laterChildren.length).toBe(2);
			expect(first.laterChildren[0]).toBe(second);
			expect(first.laterChildren[1]).toBe(third);
			expect(second.syntacticFunction).toEqual(functionSecond);
			expect(third.syntacticFunction).toEqual(functionThird);
		});

		it('be able to remove indentation of later child Proposition\'s single prior child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups[0][0];
			const functionThird = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, second, functionThird);
			expect(ModelChanger.removeOneIndentationAffectsOthers(third)).toBe(false);
			ModelChanger.removeOneIndentation(third);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
			expect(first.laterChildren.length).toBe(2);
			expect(first.laterChildren[0]).toBe(second);
			expect(first.laterChildren[1]).toBe(third);
			expect(second.syntacticFunction).toEqual(functionSecond);
			expect(third.syntacticFunction).toEqual(functionThird);
		});

		it('failing to remove indentation of top level Proposition, on removeOneIndentation()', () => {
			expect(() => ModelChanger.removeOneIndentation(first))
					.toThrow(new IllegalActionError('Error.Indentation.Remove.PericopeReached'));
		});

		it('failing to remove indentation of top level Proposition, on removeOneIndentationAffectsOthers()', () => {
			expect(() => ModelChanger.removeOneIndentationAffectsOthers(first))
					.toThrow(new IllegalActionError('Error.Indentation.Remove.PericopeReached'));
		});

		it('failing to remove indentation of enclosed Proposition 2 withing combined Proposition 1+3, on removeOneIndentation()', () => {
			ModelChanger.mergePropositions(first, third);
			expect(() => ModelChanger.removeOneIndentation(second))
					.toThrow(new IllegalActionError('Error.Indentation.Remove.Enclosed'));
		});

		it('failing to remove indentation of enclosed Proposition 2 withing combined Proposition 1+3, on removeOneIndentationAffectsOthers()', () => {
			ModelChanger.mergePropositions(first, third);
			expect(() => ModelChanger.removeOneIndentationAffectsOthers(second))
					.toThrow(new IllegalActionError('Error.Indentation.Remove.Enclosed'));
		});
	});

	describe('resetStandaloneStateOfPartAfterArrow()', () => {
		it('be able to reset standalone state of a Proposition part 3 in combined Proposition 1+3+5', () => {
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(third, fifth);
			ModelChanger.resetStandaloneStateOfPartAfterArrow(third);

			expect(pericope.text.length).toBe(2);
			expect(pericope.text[1]).toBe(third);
			expect(getPropositionAt(pericope, 2)).toBe(third);
			expect(first.partAfterArrow).toBe(null);
			expect(third.partBeforeArrow).toBe(null);
			expect(third.partAfterArrow).toBe(fifth);
			expect(fifth.partBeforeArrow).toBe(third);
			expect(third.priorChildren.length).toBe(1);
			expect(third.priorChildren[0]).toBe(second);
			expect(fifth.priorChildren.length).toBe(1);
			expect(fifth.priorChildren[0]).toBe(fourth);
		});
	});

	describe('mergePropositions()', () => {
		it('be able to merge Proposition with itself, causing no changes', () => {
			ModelChanger.mergePropositions(first, first);

			expect(pericope.text.length).toBe(5);
		});

		it('be able to merge top-level Propositions 1 and 2', () => {
			ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			const firstLabel = 'A-123';
			first.label = firstLabel;
			second.label = 'B';
			ModelChanger.mergePropositions(first, second);

			expect(pericope.text.length).toBe(4);
			const merged = getPropositionAt(pericope, 0);
			expect(merged.label).toEqual(firstLabel);
			expect(merged.clauseItems.length).toBe(4);
			expect(merged.clauseItems[0].originText).toEqual('1 2');
			expect(merged.clauseItems[1].originText).toEqual('3');
			expect(merged.clauseItems[2].originText).toEqual('4');
			expect(merged.clauseItems[3].originText).toEqual('5');
			expect(merged.superOrdinatedRelation).toBe(null);
		});

		it('be able to merge top-level Propositions 1 and 3 (with enclosed child Proposition 2)', () => {
			ModelChanger.createRelation([ second, third ], defaultRelationTemplate);
			ModelChanger.mergePropositions(first, third);

			expect(pericope.text.length).toBe(3);
			expect(first.partAfterArrow).toBe(third);
			expect(third.partBeforeArrow).toBe(first);
			expect(third.priorChildren.length).toBe(1);
			expect(third.priorChildren[0]).toBe(second);
			expect(getPropositionAt(pericope, 2)).toBe(third);
			expect(second.superOrdinatedRelation).toBe(null);
		});

		it('be able to merge single prior child Proposition with its parent Proposition', () => {
			const relation = ModelChanger.createRelation([ second, third ], defaultRelationTemplate);
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups[0][0]);
			ModelChanger.mergePropositions(first, second);

			expect(pericope.text.length).toBe(4);
			const merged = getPropositionAt(pericope, 0);
			expect(merged.clauseItems.length).toBe(4);
			expect(merged.clauseItems[0].originText).toEqual('1 2');
			expect(merged.clauseItems[1].originText).toEqual('3');
			expect(merged.clauseItems[2].originText).toEqual('4');
			expect(merged.clauseItems[3].originText).toEqual('5');
			expect(merged.syntacticFunction).toBe(null);
			expect(merged.superOrdinatedRelation).toBe(relation);
		});

		it('be able to merge single later child Proposition 2 with its parent Proposition 1', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);
			const semanticTranslation = 'semantic text...';
			const syntacticTranslation = 'Syntactic Translation';
			first.semanticTranslation = semanticTranslation;
			second.syntacticTranslation = syntacticTranslation;
			ModelChanger.mergePropositions(second, first);

			expect(pericope.flatText.length).toBe(4);
			const merged = getPropositionAt(pericope, 0);
			expect(merged.clauseItems.length).toBe(4);
			expect(merged.clauseItems[0].originText).toEqual('1 2');
			expect(merged.clauseItems[1].originText).toEqual('3');
			expect(merged.clauseItems[2].originText).toEqual('4');
			expect(merged.clauseItems[3].originText).toEqual('5');
			expect(merged.syntacticFunction).toBe(null);
			expect(merged.syntacticTranslation).toEqual(syntacticTranslation);
			expect(merged.semanticTranslation).toEqual(semanticTranslation);
			expect(merged.laterChildren.length).toBe(1);
			expect(merged.laterChildren[0]).toBe(third);
		});

		it('be able to merge first later child Proposition 2 (of two) with its parent Proposition 1', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups[0][0]);
			ModelChanger.mergePropositions(second, first);

			expect(pericope.text.length).toBe(4);
			const merged = getPropositionAt(pericope, 0);
			expect(merged.clauseItems.length).toBe(4);
			expect(merged.clauseItems[0].originText).toEqual('1 2');
			expect(merged.clauseItems[1].originText).toEqual('3');
			expect(merged.clauseItems[2].originText).toEqual('4');
			expect(merged.clauseItems[3].originText).toEqual('5');
			expect(merged.syntacticFunction).toBe(null);
		});

		it('be able to merge single later child Proposition 2 with single prior Proposition 3', () => {
			const functionSecond = language.functionGroups[0][2].subFunctions[0];
			const functionThird = language.functionGroups[0][2].subFunctions[1];
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, fourth, functionThird);
			ModelChanger.mergePropositions(second, third);

			expect(pericope.text.length).toBe(3);
			const merged = getPropositionAt(pericope, 1);
			expect(merged.clauseItems.length).toBe(3);
			expect(merged.clauseItems[0].originText).toEqual('4');
			expect(merged.clauseItems[1].originText).toEqual('5');
			expect(merged.clauseItems[2].originText).toEqual('6');
			expect(merged.syntacticFunction).toEqual(functionSecond);
			expect(first.laterChildren.length).toBe(1);
			expect(first.laterChildren[0]).toBe(merged);
			expect(third.priorChildren.length).toBe(0);
		});

		it('be able to merge top level Proposition 3 with single later child 2', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.mergePropositions(third, second);

			expect(pericope.text.length).toBe(3);
			const merged = getPropositionAt(pericope, 1);
			expect(merged.clauseItems.length).toBe(3);
			expect(merged.clauseItems[0].originText).toEqual('4');
			expect(merged.clauseItems[1].originText).toEqual('5');
			expect(merged.clauseItems[2].originText).toEqual('6');
			expect(merged.syntacticFunction).toEqual(syntacticFunction);
			expect(first.laterChildren.length).toBe(1);
			expect(first.laterChildren[0]).toBe(merged);
		});

		it('be able to merge top level Proposition 3 with single prior child 4', () => {
			ModelChanger.indentPropositionUnderParent(fourth, fifth, language.functionGroups[0][0]);
			ModelChanger.mergePropositions(third, fourth);

			expect(pericope.text.length).toBe(4);
			const merged = getPropositionAt(pericope, 2);
			expect(merged.clauseItems.length).toBe(3);
			expect(merged.clauseItems[0].originText).toEqual('6');
			expect(merged.clauseItems[1].originText).toEqual('7');
			expect(merged.clauseItems[2].originText).toEqual('8 9');
			expect(merged.syntacticFunction).toBe(null);
			expect(pericope.text[2]).toBe(merged);
			expect(pericope.text[3]).toBe(fifth);
			expect(fifth.priorChildren.length).toBe(0);
		});

		it('be able to merge top level Propositions 1 and 4 with enclosed children', () => {
			ModelChanger.mergePropositions(first, fourth);

			expect(pericope.flatText.length).toBe(5);
			expect(pericope.text.length).toBe(2);
			expect(pericope.text[0]).toBe(first);
			expect(pericope.text[1]).toBe(fifth);
			expect(first.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(first);
			expect(first.clauseItems.length).toBe(2);
			expect(first.clauseItems[0].originText).toEqual('1 2');
			expect(first.clauseItems[1].originText).toEqual('3');
			expect(fourth.clauseItems.length).toBe(2);
			expect(fourth.clauseItems[0].originText).toEqual('7');
			expect(fourth.clauseItems[1].originText).toEqual('8 9');
			expect(first.laterChildren.length).toBe(0);
			expect(fourth.priorChildren.length).toBe(2);
			expect(fourth.priorChildren[0]).toBe(second);
			expect(fourth.priorChildren[1]).toBe(third);
		});

		it('be able to merge Propositions 1, 3, and 5 with enclosed child Propositions 2 and 4', () => {
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(fifth, first);

			expect(pericope.flatText.length).toBe(5);
			expect(pericope.text.length).toBe(1);
			expect(pericope.text[0]).toBe(first);
			expect(first.partAfterArrow).toBe(third);
			expect(third.partBeforeArrow).toBe(first);
			expect(third.partAfterArrow).toBe(fifth);
			expect(fifth.partBeforeArrow).toBe(third);
			expect(first.laterChildren.length).toBe(0);
			expect(third.priorChildren.length).toBe(1);
			expect(third.priorChildren[0]).toBe(second);
			expect(third.laterChildren.length).toBe(0);
			expect(fifth.priorChildren.length).toBe(1);
			expect(fifth.priorChildren[0]).toBe(fourth);
			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(third);
			expect(third.parent).toBe(pericope);
			expect(fourth.parent).toBe(fifth);
			expect(fifth.parent).toBe(pericope);
		});

		it('be able to merge Propositions 1 and 4 with enclosed and previously subordinated child Propositions 2 and 3', () => {
			const functionSecond = language.functionGroups[0][0];
			const functionThird = language.functionGroups[0][1];
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, fourth, functionThird);
			ModelChanger.mergePropositions(first, fourth);

			expect(pericope.flatText.length).toBe(5);
			expect(pericope.text.length).toBe(2);
			expect(pericope.text[0]).toBe(first);
			expect(pericope.text[1]).toBe(fifth);
			expect(first.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(first);
			expect(first.laterChildren.length).toBe(0);
			expect(fourth.priorChildren.length).toBe(2);
			expect(fourth.priorChildren[0]).toBe(second);
			expect(fourth.priorChildren[1]).toBe(third);
			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(fourth);
			expect(third.parent).toBe(fourth);
			expect(fourth.parent).toBe(pericope);
			expect(second.syntacticFunction).toEqual(functionSecond);
			expect(third.syntacticFunction).toEqual(functionThird);
		});

		it('be able to merge enclosed child Propositions 2 and 4 within combined Proposition 1+5, enclosing Proposition 3 twice', () => {
			ModelChanger.mergePropositions(first, fifth);
			ModelChanger.mergePropositions(fourth, second);

			expect(pericope.flatText.length).toBe(5);
			expect(pericope.text.length).toBe(1);
			expect(pericope.text[0]).toBe(first);
			expect(first.partAfterArrow).toBe(fifth);
			expect(fifth.partBeforeArrow).toBe(first);
			expect(second.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(second);
			expect(first.laterChildren.length).toBe(0);
			expect(fifth.priorChildren.length).toBe(1);
			expect(fifth.priorChildren[0]).toBe(second);
			expect(second.laterChildren.length).toBe(0);
			expect(fourth.priorChildren.length).toBe(1);
			expect(fourth.priorChildren[0]).toBe(third);
			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(fifth);
			expect(third.parent).toBe(fourth);
			expect(fourth.parent).toBe(fifth);
			expect(fifth.parent).toBe(pericope);
		});

		it('be able to merge combined Proposition 1+5 with its enclosed child Proposition 2+4, preserving nested Proposition 3', () => {
			ModelChanger.mergePropositions(fourth, second);
			ModelChanger.mergePropositions(first, fifth);
			ModelChanger.mergePropositions(fourth, fifth);

			expect(pericope.flatText.length).toBe(3);
			expect(pericope.text.length).toBe(1);
			const mergedBeforeArrow = getPropositionAt(pericope, 0);
			expect(mergedBeforeArrow.clauseItems.length).toBe(4);
			expect(mergedBeforeArrow.clauseItems[0].originText).toEqual('1 2');
			expect(mergedBeforeArrow.clauseItems[1].originText).toEqual('3');
			expect(mergedBeforeArrow.clauseItems[2].originText).toEqual('4');
			expect(mergedBeforeArrow.clauseItems[3].originText).toEqual('5');
			const mergedAfterArrow = getPropositionAt(pericope, 2);
			expect(mergedAfterArrow.clauseItems.length).toBe(3);
			expect(mergedAfterArrow.clauseItems[0].originText).toEqual('7');
			expect(mergedAfterArrow.clauseItems[1].originText).toEqual('8 9');
			expect(mergedAfterArrow.clauseItems[2].originText).toEqual('10');
			expect(mergedBeforeArrow.partAfterArrow).toBe(mergedAfterArrow);
			expect(mergedAfterArrow.partBeforeArrow).toBe(mergedBeforeArrow);
			expect(mergedAfterArrow.priorChildren.length).toBe(1);
			expect(mergedAfterArrow.priorChildren[0]).toBe(third);
		});

		it('be able to merge combined Proposition 1+6 with its enclosed child Proposition 2+4, preserving nested Propositions 3 and 5', () => {
			const sixth = new Proposition([ new ClauseItem('11') ]);
			pericope.appendPropositions([ sixth ]);
			ModelChanger.mergePropositions(first, sixth);
			ModelChanger.mergePropositions(second, fourth);
			ModelChanger.mergePropositions(first, second);

			expect(pericope.flatText.length).toBe(5);
			const mergedPartOne = getPropositionAt(pericope, 0);
			expect(mergedPartOne.clauseItems.length).toBe(4);
			expect(mergedPartOne.clauseItems[0].originText).toEqual('1 2');
			expect(mergedPartOne.clauseItems[1].originText).toEqual('3');
			expect(mergedPartOne.clauseItems[2].originText).toEqual('4');
			expect(mergedPartOne.clauseItems[3].originText).toEqual('5');
			// mergedPartOne:partAfterArrow
			expect(mergedPartOne.partAfterArrow).toBe(fourth);
			expect(fourth.clauseItems.length).toBe(2);
			expect(fourth.clauseItems[0].originText).toEqual('7');
			expect(fourth.clauseItems[1].originText).toEqual('8 9');
			expect(fourth.priorChildren.length).toBe(1);
			expect(fourth.priorChildren[0]).toBe(third);
			// mergedPartOne:partAfterArrow.partAfterArrow
			expect(fourth.partAfterArrow).toBe(sixth);
			expect(sixth.clauseItems.length).toBe(1);
			expect(sixth.clauseItems[0].originText).toEqual('11');
			expect(sixth.priorChildren.length).toBe(1);
			expect(sixth.priorChildren[0]).toBe(fifth);
		});

		it('be able to merge Propositions 1 and 4 with the Proposition 2 being 1\'s single later child', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.mergePropositions(first, fourth);

			expect(pericope.flatText.length).toBe(5);
			expect(first.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(first);
			expect(first.laterChildren.length).toBe(0);
			expect(fourth.priorChildren.length).toBe(2);
			expect(fourth.priorChildren[0]).toBe(second);
			expect(fourth.priorChildren[1]).toBe(third);
			expect(second.syntacticFunction).toEqual(syntacticFunction);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to merge combined Proposition 1+3 with its single enclosed child Proposition 2', () => {
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(first, second);

			expect(pericope.flatText.length).toBe(3);
			const merged = getPropositionAt(pericope, 0);
			expect(merged.clauseItems.length).toBe(5);
			expect(merged.clauseItems[0].originText).toEqual('1 2');
			expect(merged.clauseItems[1].originText).toEqual('3');
			expect(merged.clauseItems[2].originText).toEqual('4');
			expect(merged.clauseItems[3].originText).toEqual('5');
			expect(merged.clauseItems[4].originText).toEqual('6');
			expect(getPropositionAt(pericope, 1)).toBe(fourth);
		});

		it('be able to merge combined Proposition 1+3 with its single enclosed and previously subordinated child Proposition 2', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups[0][0]);
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(first, second);

			expect(pericope.flatText.length).toBe(3);
			const merged = getPropositionAt(pericope, 0);
			expect(merged.clauseItems.length).toBe(5);
			expect(merged.clauseItems[0].originText).toEqual('1 2');
			expect(merged.clauseItems[1].originText).toEqual('3');
			expect(merged.clauseItems[2].originText).toEqual('4');
			expect(merged.clauseItems[3].originText).toEqual('5');
			expect(merged.clauseItems[4].originText).toEqual('6');
			expect(getPropositionAt(pericope, 1)).toBe(fourth);
		});

		it('be able to merge combined Proposition 1+4 with its first enclosed child Proposition 2', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.mergePropositions(first, second);

			expect(pericope.flatText.length).toBe(4);
			const mergedPartOne = getPropositionAt(pericope, 0);
			expect(mergedPartOne.clauseItems.length).toBe(4);
			expect(mergedPartOne.clauseItems[0].originText).toEqual('1 2');
			expect(mergedPartOne.clauseItems[1].originText).toEqual('3');
			expect(mergedPartOne.clauseItems[2].originText).toEqual('4');
			expect(mergedPartOne.clauseItems[3].originText).toEqual('5');
			expect(mergedPartOne.laterChildren.length).toBe(0);
			expect(mergedPartOne.partAfterArrow).toBe(fourth);
			expect(fourth.clauseItems.length).toBe(2);
			expect(fourth.clauseItems[0].originText).toEqual('7');
			expect(fourth.clauseItems[1].originText).toEqual('8 9');
			expect(fourth.priorChildren.length).toBe(1);
			expect(fourth.priorChildren[0]).toBe(third);
			expect(third.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to merge combined Proposition 1+4 with its last enclosed Proposition 3', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.mergePropositions(first, third);

			expect(pericope.flatText.length).toBe(4);
			const mergedPartOne = getPropositionAt(pericope, 0);
			expect(mergedPartOne.clauseItems.length).toBe(2);
			expect(mergedPartOne.clauseItems[0].originText).toEqual('1 2');
			expect(mergedPartOne.clauseItems[1].originText).toEqual('3');
			const mergedPartTwo = mergedPartOne.partAfterArrow;
			expect(mergedPartTwo).not.toBe(null);
			expect(mergedPartTwo.partBeforeArrow).toBe(mergedPartOne);
			expect(mergedPartTwo.clauseItems.length).toBe(3);
			expect(mergedPartTwo.clauseItems[0].originText).toEqual('6');
			expect(mergedPartTwo.clauseItems[1].originText).toEqual('7');
			expect(mergedPartTwo.clauseItems[2].originText).toEqual('8 9');
			expect(mergedPartTwo.priorChildren.length).toBe(1);
			expect(mergedPartTwo.priorChildren[0]).toBe(second);
		});

		it('be able to merge enclosed child Propositions 2 and 3 within combined Proposition 1+4', () => {
			ModelChanger.mergePropositions(first, fourth);
			const relation = ModelChanger.createRelation([ third, fifth ], defaultRelationTemplate);
			const syntacticFunction = language.functionGroups[0][0];
			third.syntacticFunction = syntacticFunction;
			ModelChanger.mergePropositions(second, third);

			expect(pericope.flatText.length).toBe(4);
			const merged = getPropositionAt(pericope, 1);
			expect(merged.clauseItems.length).toBe(3);
			expect(merged.clauseItems[0].originText).toEqual('4');
			expect(merged.clauseItems[1].originText).toEqual('5');
			expect(merged.clauseItems[2].originText).toEqual('6');
			expect(merged.syntacticFunction).toEqual(syntacticFunction);
			expect(merged.superOrdinatedRelation).toBe(relation);
			expect(fifth.superOrdinatedRelation).toBe(relation);
		});

		it('failing to merge unconnected Propositions 1 and 3, while 3 is 2\'s single later child Proposition', () => {
			ModelChanger.indentPropositionUnderParent(third, second, language.functionGroups[0][0]);
			expect(() => ModelChanger.mergePropositions(first, third))
					.toThrow(new IllegalActionError('Error.MergePropositions'));
		});

		it('failing to merge unconnected Propositions 1 and 3, with both being children of the intermediate Proposition 2', () => {
			const syntacticFunction = language.functionGroups[0][0];
			ModelChanger.indentPropositionUnderParent(first, second, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, second, syntacticFunction);
			expect(() => ModelChanger.mergePropositions(first, third))
					.toThrow(new IllegalActionError('Error.MergePropositions'));
		});
	});

	describe('splitProposition()', () => {
		it('be able to split Proposition 1 between its two Clause Items, handling Proposition attributes', () => {
			const syntacticTranslation = 'I II III';
			const semanticTranslation = 'One Two Three';
			const comment = 'count to three';
			const leadingItemFirst = first.clauseItems[0];
			const trailingItemFirst = first.clauseItems[1];
			first.syntacticTranslation = syntacticTranslation;
			first.semanticTranslation = semanticTranslation;
			first.comment = comment;
			ModelChanger.splitProposition(first, leadingItemFirst);

			expect(pericope.text.length).toBe(6);
			expect(pericope.text[0]).toBe(first);
			expect(pericope.text[2]).toBe(second);
			const split = pericope.text[1];
			expect(first.syntacticTranslation).toEqual(syntacticTranslation);
			expect(first.semanticTranslation).toEqual(semanticTranslation);
			expect(first.comment).toEqual(comment);
			expect(first.clauseItems.length).toBe(1);
			expect(first.clauseItems[0]).toBe(leadingItemFirst);
			expect(split.syntacticTranslation).toEqual('');
			expect(split.semanticTranslation).toEqual('');
			expect(split.comment).toEqual('');
			expect(split.clauseItems.length).toBe(1);
			expect(split.clauseItems[0]).toBe(trailingItemFirst);
		});

		it('be able to split Proposition between its two Clause Items, handling super ordinated Relations', () => {
			const leadingItemSecond = second.clauseItems[0];
			const trailingItemSecond = second.clauseItems[1];
			const relation12 = ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			ModelChanger.createRelation([ relation12, third ], defaultRelationTemplate);
			ModelChanger.splitProposition(second, leadingItemSecond);

			expect(pericope.flatText.length).toBe(6);
			expect(pericope.text[1]).toBe(second);
			expect(pericope.text[3]).toBe(third);
			const split = pericope.text[2];
			expect(second.clauseItems.length).toBe(1);
			expect(second.clauseItems[0]).toBe(leadingItemSecond);
			expect(split.clauseItems.length).toBe(1);
			expect(split.clauseItems[0]).toBe(trailingItemSecond);
			expect(first.superOrdinatedRelation).toBe(relation12);
			expect(second.superOrdinatedRelation).toBe(relation12);
			// the relation not-ending at the now split proposition 2 is no longer valid and was therefore removed
			expect(relation12.superOrdinatedRelation).toBe(null);
			expect(third.superOrdinatedRelation).toBe(null);
		});

		it('be able to split Proposition with partAfterArrow after first part\'s last Clause Item', () => {
			ModelChanger.mergePropositions(first, third);
			const relation45 = ModelChanger.createRelation([ fourth, fifth ], defaultRelationTemplate);
			ModelChanger.createRelation([ second, relation45 ], defaultRelationTemplate);
			ModelChanger.splitProposition(first, first.clauseItems[1]);

			expect(pericope.flatText.length).toBe(5);
			// third proposition was reset to its standalone state
			expect(first.partAfterArrow).toBe(null);
			expect(third.partBeforeArrow).toBe(null);
			expect(fourth.superOrdinatedRelation).toBe(relation45);
			expect(fifth.superOrdinatedRelation).toBe(relation45);
			// the relation spanning over the now standalone proposition 3 is no longer valid and was therefore removed
			expect(relation45.superOrdinatedRelation).toBe(null);
			expect(second.superOrdinatedRelation).toBe(null);
		});

		it('failing to split Proposition after its last Clause Item', () => {
			expect(() => ModelChanger.splitProposition(first, first.clauseItems[1]))
					.toThrow(new IllegalActionError('Error.SplitProposition'));
		});

		it('failing to split Proposition after null Clause Item', () => {
			expect(() => ModelChanger.splitProposition(first, null))
					.toThrowError();
		});
	});

	describe('mergeClauseItemWithPrior()', () => {
		it('be able to merge second Clause Item with its prior, preserving single syntactic function', () => {
			const trailingItemFirst = first.clauseItems[1];
			const trailingFunction = language.functionGroups[0][0];
			trailingItemFirst.syntacticFunction = trailingFunction;
			ModelChanger.mergeClauseItemWithPrior(trailingItemFirst);

			expect(first.clauseItems.length).toBe(1);
			expect(first.clauseItems[0].originText).toEqual('1 2 3');
			expect(first.clauseItems[0].syntacticFunction).toEqual(trailingFunction);
		});

		it('be able to merge second Clause Item with its prior, preferring leading syntactic function', () => {
			const leadingItemFirst = first.clauseItems[0];
			const trailingItemFirst = first.clauseItems[1];
			const leadingFunction = language.functionGroups[0][0];
			leadingItemFirst.syntacticFunction = leadingFunction;
			trailingItemFirst.syntacticFunction = language.functionGroups[0][1];
			ModelChanger.mergeClauseItemWithPrior(trailingItemFirst);

			expect(first.clauseItems.length).toBe(1);
			expect(first.clauseItems[0].originText).toEqual('1 2 3');
			expect(first.clauseItems[0].syntacticFunction).toEqual(leadingFunction);
		});

		it('failing to merge first Clause Item with its prior', () => {
			expect(() => ModelChanger.mergeClauseItemWithPrior(first.clauseItems[0]))
					.toThrow(new IllegalActionError('Error.MergeClauseItems.NoPrior'));
		});
	});

	describe('mergeClauseItemWithFollower()', () => {
		it('be able to merge first Clause Item with its follower, preserving single syntactic function', () => {
			const trailingItemFirst = first.clauseItems[1];
			const trailingFunction = language.functionGroups[0][0];
			trailingItemFirst.syntacticFunction = trailingFunction;
			ModelChanger.mergeClauseItemWithFollower(first.clauseItems[0]);

			expect(first.clauseItems.length).toBe(1);
			expect(first.clauseItems[0].originText).toEqual('1 2 3');
			expect(first.clauseItems[0].syntacticFunction).toEqual(trailingFunction);
		});

		it('be able to merge first Clause Item with its follower, preferring leading syntactic function', () => {
			const leadingItemFirst = first.clauseItems[0];
			const leadingFunction = language.functionGroups[0][0];
			leadingItemFirst.syntacticFunction = leadingFunction;
			first.clauseItems[1].syntacticFunction = language.functionGroups[0][1];
			ModelChanger.mergeClauseItemWithFollower(leadingItemFirst);

			expect(first.clauseItems.length).toBe(1);
			expect(first.clauseItems[0].originText).toEqual('1 2 3');
			expect(first.clauseItems[0].syntacticFunction).toEqual(leadingFunction);
		});

		it('failing to merge last Clause Item with its follower', () => {
			expect(() => ModelChanger.mergeClauseItemWithFollower(first.clauseItems[1]))
					.toThrow(new IllegalActionError('Error.MergeClauseItems.NoFollower'));
		});
	});

	describe('splitClauseItem()', () => {
		it('be able to split Clause Item between its two tokens', () => {
			const syntacticFunction = language.functionGroups[0][0];
			first.clauseItems[0].syntacticFunction = syntacticFunction;
			ModelChanger.splitClauseItem(first.clauseItems[0], '1');

			expect(first.clauseItems.length).toBe(3);
			expect(first.clauseItems[0].originText).toEqual('1');
			expect(first.clauseItems[1].originText).toEqual('2');
			expect(first.clauseItems[2].originText).toEqual('3');
			expect(first.clauseItems[0].syntacticFunction).toEqual(syntacticFunction);
			expect(first.clauseItems[1].syntacticFunction).toBe(null);
		});

		it('failing to split Clause Item after empty string', () => {
			expect(() => ModelChanger.splitClauseItem(first.clauseItems[0], ''))
					.toThrowError();
		});

		it('failing to split Clause Item after full item text', () => {
			expect(() => ModelChanger.splitClauseItem(first.clauseItems[0], '1 2'))
					.toThrowError();
		});

		it('failing to split Clause Item after uncontained string', () => {
			expect(() => ModelChanger.splitClauseItem(first.clauseItems[0], 'X'))
					.toThrowError();
		});
	});

	describe('createRelation()', () => {
		it('be able to create Relation over the first 4 Propositions', () => {
			const leadingRole = new AssociateRole('Lead', true);
			const repetitiveRole = new AssociateRole('Repeat', false);
			const template = new RelationTemplate(leadingRole, repetitiveRole, repetitiveRole, 'some text');
			const relation = ModelChanger.createRelation([ first, second, third, fourth ], template);

			expect(first.superOrdinatedRelation).toBe(relation);
			expect(second.superOrdinatedRelation).toBe(relation);
			expect(third.superOrdinatedRelation).toBe(relation);
			expect(fourth.superOrdinatedRelation).toBe(relation);
			expect(first.role).toEqual(leadingRole);
			expect(second.role).toEqual(repetitiveRole);
			expect(third.role).toEqual(repetitiveRole);
			expect(fourth.role).toEqual(repetitiveRole);
		});

		it('be able to create Relation over a Relation and the surrounding Propositions', () => {
			const leading = new AssociateRole('Second', false);
			const trailing = new AssociateRole('Third', true);
			const lowerTemplate = new RelationTemplate(leading, null, trailing);
			const singleRole = new AssociateRole('Single', true);
			const upperTemplate = new RelationTemplate(singleRole, singleRole, singleRole);
			const lowerRelation = ModelChanger.createRelation([ second, third ], lowerTemplate);
			const upperRelation = ModelChanger.createRelation([ first, lowerRelation, fourth ], upperTemplate);

			expect(first.superOrdinatedRelation).toBe(upperRelation);
			expect(lowerRelation.superOrdinatedRelation).toBe(upperRelation);
			expect(fourth.superOrdinatedRelation).toBe(upperRelation);
			expect(upperRelation.associates.length).toBe(3);
			expect(upperRelation.associates[0]).toBe(first);
			expect(upperRelation.associates[1]).toBe(lowerRelation);
			expect(upperRelation.associates[2]).toBe(fourth);
			expect(lowerRelation.associates.length).toBe(2);
			expect(lowerRelation.associates[0]).toBe(second);
			expect(lowerRelation.associates[1]).toBe(third);
			expect(first.role).toEqual(singleRole);
			expect(second.role).toEqual(leading);
			expect(third.role).toEqual(trailing);
			expect(lowerRelation.role).toEqual(singleRole);
			expect(fourth.role).toEqual(singleRole);
		});

		it('failing to create Relation over unconnected Propositions 1 and 3', () => {
			expect(() => ModelChanger.createRelation([ first, third ], defaultRelationTemplate))
					.toThrow(new IllegalActionError('Error.CreateRelation.NotConnected'));
		});

		it('failing to create Relation over single Propositions 2', () => {
			expect(() => ModelChanger.createRelation([ second ], defaultRelationTemplate))
					.toThrowError('invalid number of associates for relation: 1');
		});

		it('failing to create Relation over a Relation and one of its associate Propositions', () => {
			const relation = ModelChanger.createRelation([ second, third ], defaultRelationTemplate);
			expect(() => ModelChanger.createRelation([ relation, second ], defaultRelationTemplate))
					.toThrow(new IllegalActionError('Error.CreateRelation.NotConnected'));
		});
	});

	describe('rotateAssociateRoles()', () => {
		it('be able to rotate roles for a Relation with two associates', () => {
			const leadingRole = new AssociateRole('Start', false);
			const trailingRole = new AssociateRole('End', true);
			const relation = ModelChanger.createRelation([ first, second ],
					new RelationTemplate(leadingRole, null, trailingRole));
			ModelChanger.rotateAssociateRoles(relation);

			expect(first.role).toEqual(trailingRole);
			expect(second.role).toEqual(leadingRole);
			expect(relation.associates.length).toBe(2);
			expect(relation.associates[0]).toBe(first);
			expect(relation.associates[1]).toBe(second);

			ModelChanger.rotateAssociateRoles(relation);

			expect(first.role).toEqual(leadingRole);
			expect(second.role).toEqual(trailingRole);
		});

		it('be able to rotate roles for a Relation with three associates', () => {
			const leadingRole = new AssociateRole('Start', false);
			const repeatingRole = new AssociateRole('Repeat', true);
			const relation = ModelChanger.createRelation([ first, second, third ],
					new RelationTemplate(leadingRole, repeatingRole, repeatingRole, 'hint'));
			ModelChanger.rotateAssociateRoles(relation);

			expect(first.role).toEqual(repeatingRole);
			expect(second.role).toEqual(leadingRole);
			expect(third.role).toEqual(repeatingRole);
			expect(relation.associates.length).toBe(3);
			expect(relation.associates[0]).toBe(first);
			expect(relation.associates[1]).toBe(second);
			expect(relation.associates[2]).toBe(third);

			ModelChanger.rotateAssociateRoles(relation);

			expect(first.role).toEqual(repeatingRole);
			expect(second.role).toEqual(repeatingRole);
			expect(third.role).toEqual(leadingRole);

			ModelChanger.rotateAssociateRoles(relation);

			expect(first.role).toEqual(leadingRole);
			expect(second.role).toEqual(repeatingRole);
			expect(third.role).toEqual(repeatingRole);
		});
	});

	describe('alterRelationType()', () => {
		it('be able to alter the type of a Relation with two associates (new type supporting only two associates)', () => {
			const leadingRole = new AssociateRole('Start', false);
			const trailingRole = new AssociateRole('End', true);
			const relation = ModelChanger.createRelation([ first, second ],
					new RelationTemplate(leadingRole, null, trailingRole));
			const singleRole = new AssociateRole('Single', true);
			ModelChanger.alterRelationType(relation, new RelationTemplate(singleRole, null, singleRole));

			expect(first.role).toEqual(singleRole);
			expect(second.role).toEqual(singleRole);
		});

		it('be able to alter the type of a Relation with two associates (new type supporting 2+ associates)', () => {
			const leadingRole = new AssociateRole('Start', false);
			const trailingRole = new AssociateRole('End', true);
			const relation = ModelChanger.createRelation([ first, second ],
					new RelationTemplate(leadingRole, null, trailingRole));
			const singleRole = new AssociateRole('Single', true);
			ModelChanger.alterRelationType(relation, new RelationTemplate(singleRole, singleRole, singleRole));

			expect(first.role).toEqual(singleRole);
			expect(second.role).toEqual(singleRole);
		});

		it('be able to alter the type of a Relation with three associates (new type supporting 2+ associates)', () => {
			const singleRole = new AssociateRole('Single', true);
			const relation = ModelChanger.createRelation([ first, second, third ],
					new RelationTemplate(singleRole, singleRole, singleRole));
			const leadingRole = new AssociateRole('Start', false);
			const repeatingRole = new AssociateRole('Repeat', true);
			ModelChanger.alterRelationType(relation, new RelationTemplate(leadingRole, repeatingRole, repeatingRole));

			expect(first.role).toEqual(leadingRole);
			expect(second.role).toEqual(repeatingRole);
			expect(third.role).toEqual(repeatingRole);
		});

		it('failing to alter the type of a Relation with three associates (new type supporting only two associates)', () => {
			const singleRole = new AssociateRole('Single', true);
			const relation = ModelChanger.createRelation([ first, second, third ],
					new RelationTemplate(singleRole, singleRole, singleRole));
			const leadingRole = new AssociateRole('Start', true);
			const trailingRole = new AssociateRole('End', false);
			expect(() => ModelChanger.alterRelationType(relation, new RelationTemplate(leadingRole, null, trailingRole)))
					.toThrowError();
		});
	});

	describe('removePropositions()', () => {
		it('be able to remove top level Propositions 2 and 3', () => {
			ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			ModelChanger.removePropositions(pericope, [ second, third ]);

			expect(pericope.text.length).toBe(3);
			expect(pericope.text[0]).toBe(first);
			expect(pericope.text[1]).toBe(fourth);
			expect(first.superOrdinatedRelation).toBe(null);
		});

		it('failing to remove empty list of Propositions', () => {
			expect(() => ModelChanger.removePropositions(pericope, [ ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.NoneSelected'));
		});

		it('failing to remove all Propositions', () => {
			expect(() => ModelChanger.removePropositions(pericope, pericope.text))
					.toThrow(new IllegalActionError('Error.DeletePropositions.AllSelected'));
		});

		it('failing to remove subordinated Proposition', () => {
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups[0][0]);
			expect(() => ModelChanger.removePropositions(pericope, [ first ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});

		it('failing to remove Proposition with prior child', () => {
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups[0][0]);
			expect(() => ModelChanger.removePropositions(pericope, [ second ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});

		it('failing to remove Proposition with later child', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups[0][0]);
			expect(() => ModelChanger.removePropositions(pericope, [ first ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});

		it('failing to remove Proposition with partAfterArrow', () => {
			ModelChanger.mergePropositions(first, third);
			expect(() => ModelChanger.removePropositions(pericope, [ first ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});
	});

	describe('prependText()', () => {
		it('be able to prepend Proposition as text', () => {
			ModelChanger.prependText(pericope, ' 0\n\t\n');

			expect(pericope.text.length).toBe(6);
			expect(pericope.text[0].clauseItems.length).toBe(1);
			expect(pericope.text[0].clauseItems[0].originText).toBe('0');
		});
	});

	describe('appendText()', () => {
		it('be able to prepend Proposition as text', () => {
			ModelChanger.appendText(pericope, '11\n \t\n12\t\t 13    14');

			expect(pericope.text.length).toBe(7);
			expect(pericope.text[5].clauseItems.length).toBe(1);
			expect(pericope.text[5].clauseItems[0].originText).toBe('11');
			expect(pericope.text[6].clauseItems.length).toBe(3);
			expect(pericope.text[6].clauseItems[0].originText).toBe('12');
			expect(pericope.text[6].clauseItems[1].originText).toBe('13');
			expect(pericope.text[6].clauseItems[2].originText).toBe('14');
		});
	});
});
