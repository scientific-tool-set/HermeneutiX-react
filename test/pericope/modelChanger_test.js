import * as ModelChanger from '../../src/pericope/modelChanger';
import { getFlatText } from '../../src/pericope/modelHelper';
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
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(first, second, syntacticFunction);

			expect(first.parent).toBe(second);
			expect(second.priorChildren.size).toBe(1);
			expect(second.priorChildren.first()).toBe(first);
			expect(getFlatText(pericope).first()).toBe(first);
			expect(first.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to indent Proposition 2 under Proposition 1', () => {
			const syntacticFunction = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);

			expect(second.parent).toBe(first);
			expect(first.laterChildren.size).toBe(1);
			expect(first.laterChildren.first()).toBe(second);
			expect(getFlatText(pericope).get(1)).toBe(second);
			expect(second.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to indent Propositions 2 and 3 under Proposition 1', () => {
			const functionSecond = language.functionGroups.first().get(2).subFunctions.first();
			const functionThird = language.functionGroups.first().get(2).subFunctions.get(1);
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, first, functionThird);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
			expect(first.laterChildren.size).toBe(2);
			expect(first.laterChildren.first()).toBe(second);
			expect(first.laterChildren.get(1)).toBe(third);
			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.get(1)).toBe(second);
			expect(flatText.get(2)).toBe(third);
			expect(second.syntacticFunction).toEqual(functionSecond);
			expect(third.syntacticFunction).toEqual(functionThird);
		});

		it('be able to indent Proposition 2 under Proposition 3 with them being indented under 1 and 4 respectively', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, fourth, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(second, third, syntacticFunction);

			expect(first.laterChildren.size).toBe(0);
			expect(third.priorChildren.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.size).toBe(1);
			expect(fourth.priorChildren.first()).toBe(third);
		});

		it('be able to indent Propositions 1 and 2 under Proposition 3 as its prior children', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, third, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(first, third, syntacticFunction);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(third);
			expect(third.priorChildren.size).toBe(2);
			expect(third.priorChildren.first()).toBe(first);
			expect(third.priorChildren.get(1)).toBe(second);
			expect(first.parent).toBe(third);
			expect(second.parent).toBe(third);
		});

		it('be able to indent Propositions 2 and 3 under Proposition 1 as its later children', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(fourth);
			expect(first.laterChildren.size).toBe(2);
			expect(first.laterChildren.first()).toBe(second);
			expect(first.laterChildren.get(1)).toBe(third);
			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
		});

		it('be able to indent Proposition 3 under Proposition 2 with them being indented under 1 and 4 respectively', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, fourth, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, second, syntacticFunction);

			expect(first.laterChildren.size).toBe(1);
			expect(first.laterChildren.first()).toBe(second);
			expect(second.laterChildren.size).toBe(1);
			expect(second.laterChildren.first()).toBe(third);
			expect(fourth.priorChildren.size).toBe(0);
		});

		it('be able to indent last Proposition (in Pericope) under its prior', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(fourth, third, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(fifth, fourth, syntacticFunction);

			expect(third.laterChildren.size).toBe(1);
			expect(third.laterChildren.first()).toBe(fourth);
			expect(fourth.laterChildren.size).toBe(1);
			expect(fourth.laterChildren.first()).toBe(fifth);
		});

		it('be able to indent already correct Propositions, just updating syntactic function', () => {
			const oldFunction = language.functionGroups.first().first();
			const newFunction = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(third, fourth, oldFunction);
			ModelChanger.indentPropositionUnderParent(third, fourth, newFunction);

			expect(fourth.priorChildren.size).toBe(1);
			expect(fourth.priorChildren.first()).toBe(third);
			expect(third.syntacticFunction).not.toEqual(oldFunction);
			expect(third.syntacticFunction).toEqual(newFunction);
		});

		it('be able to indent enclosed Proposition to parent\'s other part, just updating syntactic function', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);

			expect(first.laterChildren.size).toBe(0);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.get(1)).toBe(third);
			expect(third.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to indent subordinated enclosed Proposition, becoming prior child of parent\'s other part', () => {
			const changedFunction = language.functionGroups.first().get(1);
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.indentPropositionUnderParent(third, second, language.functionGroups.first().first());
			ModelChanger.indentPropositionUnderParent(third, first, changedFunction);

			expect(first.laterChildren.size).toBe(0);
			expect(second.laterChildren.size).toBe(0);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.get(1)).toBe(third);
			expect(third.syntacticFunction).toEqual(changedFunction);
		});

		it('failing to indent Proposition 1 under Proposition 3', () => {
			expect(() => ModelChanger.indentPropositionUnderParent(first, third, language.functionGroups.first().first()))
					.toThrow(new IllegalActionError('Error.Indentation.Create'));
		});

		it('failing to indent Proposition 3 under Proposition 1', () => {
			expect(() => ModelChanger.indentPropositionUnderParent(third, first, language.functionGroups.first().first()))
					.toThrow(new IllegalActionError('Error.Indentation.Create'));
		});

		it('failing to indent non-adjacent Propositions with differing parents', () => {
			const syntacticFunction = language.functionGroups.first().first();
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
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups.first().first());
			expect(ModelChanger.removeOneIndentationAffectsOthers(first)).toBe(false);
			ModelChanger.removeOneIndentation(first);

			expect(first.parent).toBe(pericope);
			expect(second.priorChildren.size).toBe(0);
			expect(first.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of single later child Proposition (without affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups.first().first());
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(false);
			ModelChanger.removeOneIndentation(second);

			expect(second.parent).toBe(pericope);
			expect(first.laterChildren.size).toBe(0);
			expect(second.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of leading prior child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, third, functionSecond);
			ModelChanger.indentPropositionUnderParent(first, third, language.functionGroups.first().get(1));
			expect(ModelChanger.removeOneIndentationAffectsOthers(first)).toBe(false);
			ModelChanger.removeOneIndentation(first);

			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(third);
			expect(third.priorChildren.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(first.syntacticFunction).toBe(null);
			expect(second.syntacticFunction).toEqual(functionSecond);
		});

		it('be able to remove indentation of trailing prior child Proposition (but affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(second, third, language.functionGroups.first().first());
			ModelChanger.indentPropositionUnderParent(first, third, language.functionGroups.first().get(1));
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(true);
			ModelChanger.removeOneIndentation(second);

			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(pericope);
			expect(third.priorChildren.size).toBe(0);
			expect(first.syntacticFunction).toBe(null);
			expect(second.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of trailing later child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, first, language.functionGroups.first().get(1));
			expect(ModelChanger.removeOneIndentationAffectsOthers(third)).toBe(false);
			ModelChanger.removeOneIndentation(third);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(pericope);
			expect(first.laterChildren.size).toBe(1);
			expect(first.laterChildren.first()).toBe(second);
			expect(second.syntacticFunction).toBe(functionSecond);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of leading prior child Proposition (but affecting others)', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups.first().first());
			ModelChanger.indentPropositionUnderParent(third, first, language.functionGroups.first().get(1));
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(true);
			ModelChanger.removeOneIndentation(second);

			expect(second.parent).toBe(pericope);
			expect(third.parent).toBe(pericope);
			expect(first.laterChildren.size).toBe(0);
			expect(second.syntacticFunction).toBe(null);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to remove indentation of prior child Proposition\'s single prior child Proposition (without affecting others)', () => {
			const functionFirst = language.functionGroups.first().first();
			const functionSecond = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(first, second, functionFirst);
			ModelChanger.indentPropositionUnderParent(second, third, functionSecond);
			expect(ModelChanger.removeOneIndentationAffectsOthers(first)).toBe(false);
			ModelChanger.removeOneIndentation(first);

			expect(first.parent).toBe(third);
			expect(second.parent).toBe(third);
			expect(third.priorChildren.size).toBe(2);
			expect(third.priorChildren.first()).toBe(first);
			expect(third.priorChildren.get(1)).toBe(second);
			expect(first.syntacticFunction).toEqual(functionFirst);
			expect(second.syntacticFunction).toEqual(functionSecond);
		});

		it('be able to remove indentation of prior child Proposition\'s single later child Proposition (without affecting others)', () => {
			const functionFirst = language.functionGroups.first().first();
			const functionSecond = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(first, third, functionFirst);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(false);
			ModelChanger.removeOneIndentation(second);

			expect(first.parent).toBe(third);
			expect(second.parent).toBe(third);
			expect(third.priorChildren.size).toBe(2);
			expect(third.priorChildren.first()).toBe(first);
			expect(third.priorChildren.get(1)).toBe(second);
			expect(first.syntacticFunction).toEqual(functionFirst);
			expect(second.syntacticFunction).toEqual(functionSecond);
		});

		it('be able to remove indentation of later child Proposition\'s single prior child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups.first().first();
			const functionThird = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(second, third, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, first, functionThird);
			expect(ModelChanger.removeOneIndentationAffectsOthers(second)).toBe(false);
			ModelChanger.removeOneIndentation(second);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
			expect(first.laterChildren.size).toBe(2);
			expect(first.laterChildren.first()).toBe(second);
			expect(first.laterChildren.get(1)).toBe(third);
			expect(second.syntacticFunction).toEqual(functionSecond);
			expect(third.syntacticFunction).toEqual(functionThird);
		});

		it('be able to remove indentation of later child Proposition\'s single prior child Proposition (without affecting others)', () => {
			const functionSecond = language.functionGroups.first().first();
			const functionThird = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, second, functionThird);
			expect(ModelChanger.removeOneIndentationAffectsOthers(third)).toBe(false);
			ModelChanger.removeOneIndentation(third);

			expect(second.parent).toBe(first);
			expect(third.parent).toBe(first);
			expect(first.laterChildren.size).toBe(2);
			expect(first.laterChildren.first()).toBe(second);
			expect(first.laterChildren.get(1)).toBe(third);
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

			expect(pericope.text.size).toBe(2);
			expect(pericope.text.get(1)).toBe(third);
			expect(getFlatText(pericope).get(2)).toBe(third);
			expect(first.partAfterArrow).toBe(null);
			expect(third.partBeforeArrow).toBe(null);
			expect(third.partAfterArrow).toBe(fifth);
			expect(fifth.partBeforeArrow).toBe(third);
			expect(third.priorChildren.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(fifth.priorChildren.size).toBe(1);
			expect(fifth.priorChildren.first()).toBe(fourth);
		});
	});

	describe('mergePropositions()', () => {
		it('be able to merge Proposition with itself, causing no changes', () => {
			ModelChanger.mergePropositions(first, first);

			expect(pericope.text.size).toBe(5);
		});

		it('be able to merge top-level Propositions 1 and 2', () => {
			ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			const firstLabel = 'A-123';
			first.label = firstLabel;
			second.label = 'B';
			ModelChanger.mergePropositions(first, second);

			expect(pericope.text.size).toBe(4);
			const merged = getFlatText(pericope).first();
			expect(merged.label).toEqual(firstLabel);
			expect(merged.clauseItems.size).toBe(4);
			expect(merged.clauseItems.first().originText).toEqual('1 2');
			expect(merged.clauseItems.get(1).originText).toEqual('3');
			expect(merged.clauseItems.get(2).originText).toEqual('4');
			expect(merged.clauseItems.get(3).originText).toEqual('5');
			expect(merged.superOrdinatedRelation).toBe(null);
		});

		it('be able to merge top-level Propositions 1 and 3 (with enclosed child Proposition 2)', () => {
			ModelChanger.createRelation([ second, third ], defaultRelationTemplate);
			ModelChanger.mergePropositions(first, third);

			expect(pericope.text.size).toBe(3);
			expect(first.partAfterArrow).toBe(third);
			expect(third.partBeforeArrow).toBe(first);
			expect(third.priorChildren.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(getFlatText(pericope).get(2)).toBe(third);
			expect(second.superOrdinatedRelation).toBe(null);
		});

		it('be able to merge single prior child Proposition with its parent Proposition', () => {
			const relation = ModelChanger.createRelation([ second, third ], defaultRelationTemplate);
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups.first().first());
			ModelChanger.mergePropositions(first, second);

			expect(pericope.text.size).toBe(4);
			const merged = getFlatText(pericope).first();
			expect(merged.clauseItems.size).toBe(4);
			expect(merged.clauseItems.first().originText).toEqual('1 2');
			expect(merged.clauseItems.get(1).originText).toEqual('3');
			expect(merged.clauseItems.get(2).originText).toEqual('4');
			expect(merged.clauseItems.get(3).originText).toEqual('5');
			expect(merged.syntacticFunction).toBe(null);
			expect(merged.superOrdinatedRelation).toBe(relation);
		});

		it('be able to merge single later child Proposition 2 with its parent Proposition 1', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);
			const semanticTranslation = 'semantic text...';
			const syntacticTranslation = 'Syntactic Translation';
			first.semanticTranslation = semanticTranslation;
			second.syntacticTranslation = syntacticTranslation;
			ModelChanger.mergePropositions(second, first);

			expect(getFlatText(pericope).count()).toBe(4);
			const merged = getFlatText(pericope).first();
			expect(merged.clauseItems.size).toBe(4);
			expect(merged.clauseItems.first().originText).toEqual('1 2');
			expect(merged.clauseItems.get(1).originText).toEqual('3');
			expect(merged.clauseItems.get(2).originText).toEqual('4');
			expect(merged.clauseItems.get(3).originText).toEqual('5');
			expect(merged.syntacticFunction).toBe(null);
			expect(merged.syntacticTranslation).toEqual(syntacticTranslation);
			expect(merged.semanticTranslation).toEqual(semanticTranslation);
			expect(merged.laterChildren.size).toBe(1);
			expect(merged.laterChildren.first()).toBe(third);
		});

		it('be able to merge first later child Proposition 2 (of two) with its parent Proposition 1', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups.first().first());
			ModelChanger.mergePropositions(second, first);

			expect(pericope.text.size).toBe(4);
			const merged = getFlatText(pericope).first();
			expect(merged.clauseItems.size).toBe(4);
			expect(merged.clauseItems.first().originText).toEqual('1 2');
			expect(merged.clauseItems.get(1).originText).toEqual('3');
			expect(merged.clauseItems.get(2).originText).toEqual('4');
			expect(merged.clauseItems.get(3).originText).toEqual('5');
			expect(merged.syntacticFunction).toBe(null);
		});

		it('be able to merge single later child Proposition 2 with single prior Proposition 3', () => {
			const functionSecond = language.functionGroups.first().get(2).subFunctions.first();
			const functionThird = language.functionGroups.first().get(2).subFunctions.get(1);
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, fourth, functionThird);
			ModelChanger.mergePropositions(second, third);

			expect(pericope.text.size).toBe(3);
			const merged = getFlatText(pericope).get(1);
			expect(merged.clauseItems.size).toBe(3);
			expect(merged.clauseItems.first().originText).toEqual('4');
			expect(merged.clauseItems.get(1).originText).toEqual('5');
			expect(merged.clauseItems.get(2).originText).toEqual('6');
			expect(merged.syntacticFunction).toEqual(functionSecond);
			expect(first.laterChildren.size).toBe(1);
			expect(first.laterChildren.first()).toBe(merged);
			expect(third.priorChildren.size).toBe(0);
		});

		it('be able to merge top level Proposition 3 with single later child 2', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.mergePropositions(third, second);

			expect(pericope.text.size).toBe(3);
			const merged = getFlatText(pericope).get(1);
			expect(merged.clauseItems.size).toBe(3);
			expect(merged.clauseItems.first().originText).toEqual('4');
			expect(merged.clauseItems.get(1).originText).toEqual('5');
			expect(merged.clauseItems.get(2).originText).toEqual('6');
			expect(merged.syntacticFunction).toEqual(syntacticFunction);
			expect(first.laterChildren.size).toBe(1);
			expect(first.laterChildren.first()).toBe(merged);
		});

		it('be able to merge top level Proposition 3 with single prior child 4', () => {
			ModelChanger.indentPropositionUnderParent(fourth, fifth, language.functionGroups.first().first());
			ModelChanger.mergePropositions(third, fourth);

			expect(pericope.text.size).toBe(4);
			const merged = getFlatText(pericope).get(2);
			expect(merged.clauseItems.size).toBe(3);
			expect(merged.clauseItems.first().originText).toEqual('6');
			expect(merged.clauseItems.get(1).originText).toEqual('7');
			expect(merged.clauseItems.get(2).originText).toEqual('8 9');
			expect(merged.syntacticFunction).toBe(null);
			expect(pericope.text.get(2)).toBe(merged);
			expect(pericope.text.get(3)).toBe(fifth);
			expect(fifth.priorChildren.size).toBe(0);
		});

		it('be able to merge top level Propositions 1 and 4 with enclosed children', () => {
			ModelChanger.mergePropositions(first, fourth);

			expect(getFlatText(pericope).count()).toBe(5);
			expect(pericope.text.size).toBe(2);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(fifth);
			expect(first.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(first);
			expect(first.clauseItems.size).toBe(2);
			expect(first.clauseItems.first().originText).toEqual('1 2');
			expect(first.clauseItems.get(1).originText).toEqual('3');
			expect(fourth.clauseItems.size).toBe(2);
			expect(fourth.clauseItems.first().originText).toEqual('7');
			expect(fourth.clauseItems.get(1).originText).toEqual('8 9');
			expect(first.laterChildren.size).toBe(0);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.get(1)).toBe(third);
		});

		it('be able to merge Propositions 1, 3, and 5 with enclosed child Propositions 2 and 4', () => {
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(fifth, first);

			expect(getFlatText(pericope).count()).toBe(5);
			expect(pericope.text.size).toBe(1);
			expect(pericope.text.first()).toBe(first);
			expect(first.partAfterArrow).toBe(third);
			expect(third.partBeforeArrow).toBe(first);
			expect(third.partAfterArrow).toBe(fifth);
			expect(fifth.partBeforeArrow).toBe(third);
			expect(first.laterChildren.size).toBe(0);
			expect(third.priorChildren.size).toBe(1);
			expect(third.priorChildren.first()).toBe(second);
			expect(third.laterChildren.size).toBe(0);
			expect(fifth.priorChildren.size).toBe(1);
			expect(fifth.priorChildren.first()).toBe(fourth);
			expect(first.parent).toBe(pericope);
			expect(second.parent).toBe(third);
			expect(third.parent).toBe(pericope);
			expect(fourth.parent).toBe(fifth);
			expect(fifth.parent).toBe(pericope);
		});

		it('be able to merge Propositions 1 and 4 with enclosed and previously subordinated child Propositions 2 and 3', () => {
			const functionSecond = language.functionGroups.first().first();
			const functionThird = language.functionGroups.first().get(1);
			ModelChanger.indentPropositionUnderParent(second, first, functionSecond);
			ModelChanger.indentPropositionUnderParent(third, fourth, functionThird);
			ModelChanger.mergePropositions(first, fourth);

			expect(getFlatText(pericope).count()).toBe(5);
			expect(pericope.text.size).toBe(2);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(fifth);
			expect(first.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(first);
			expect(first.laterChildren.size).toBe(0);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.get(1)).toBe(third);
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

			expect(getFlatText(pericope).count()).toBe(5);
			expect(pericope.text.size).toBe(1);
			expect(pericope.text.first()).toBe(first);
			expect(first.partAfterArrow).toBe(fifth);
			expect(fifth.partBeforeArrow).toBe(first);
			expect(second.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(second);
			expect(first.laterChildren.size).toBe(0);
			expect(fifth.priorChildren.size).toBe(1);
			expect(fifth.priorChildren.first()).toBe(second);
			expect(second.laterChildren.size).toBe(0);
			expect(fourth.priorChildren.size).toBe(1);
			expect(fourth.priorChildren.first()).toBe(third);
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

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(3);
			expect(pericope.text.size).toBe(1);
			const mergedBeforeArrow = flatText.first();
			expect(mergedBeforeArrow.clauseItems.size).toBe(4);
			expect(mergedBeforeArrow.clauseItems.first().originText).toEqual('1 2');
			expect(mergedBeforeArrow.clauseItems.get(1).originText).toEqual('3');
			expect(mergedBeforeArrow.clauseItems.get(2).originText).toEqual('4');
			expect(mergedBeforeArrow.clauseItems.get(3).originText).toEqual('5');
			const mergedAfterArrow = flatText.get(2);
			expect(mergedAfterArrow.clauseItems.size).toBe(3);
			expect(mergedAfterArrow.clauseItems.first().originText).toEqual('7');
			expect(mergedAfterArrow.clauseItems.get(1).originText).toEqual('8 9');
			expect(mergedAfterArrow.clauseItems.get(2).originText).toEqual('10');
			expect(mergedBeforeArrow.partAfterArrow).toBe(mergedAfterArrow);
			expect(mergedAfterArrow.partBeforeArrow).toBe(mergedBeforeArrow);
			expect(mergedAfterArrow.priorChildren.size).toBe(1);
			expect(mergedAfterArrow.priorChildren.first()).toBe(third);
		});

		it('be able to merge combined Proposition 1+6 with its enclosed child Proposition 2+4, preserving nested Propositions 3 and 5', () => {
			ModelChanger.appendText(pericope, '11');
			const sixth = getFlatText(pericope).last();
			ModelChanger.mergePropositions(first, sixth);
			ModelChanger.mergePropositions(second, fourth);
			ModelChanger.mergePropositions(first, second);

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(5);
			const mergedPartOne = flatText.first();
			expect(mergedPartOne.clauseItems.size).toBe(4);
			expect(mergedPartOne.clauseItems.first().originText).toEqual('1 2');
			expect(mergedPartOne.clauseItems.get(1).originText).toEqual('3');
			expect(mergedPartOne.clauseItems.get(2).originText).toEqual('4');
			expect(mergedPartOne.clauseItems.get(3).originText).toEqual('5');
			// mergedPartOne:partAfterArrow
			expect(mergedPartOne.partAfterArrow).toBe(fourth);
			expect(fourth.clauseItems.size).toBe(2);
			expect(fourth.clauseItems.first().originText).toEqual('7');
			expect(fourth.clauseItems.get(1).originText).toEqual('8 9');
			expect(fourth.priorChildren.size).toBe(1);
			expect(fourth.priorChildren.first()).toBe(third);
			// mergedPartOne:partAfterArrow.partAfterArrow
			expect(fourth.partAfterArrow).toBe(sixth);
			expect(sixth.clauseItems.size).toBe(1);
			expect(sixth.clauseItems.first().originText).toEqual('11');
			expect(sixth.priorChildren.size).toBe(1);
			expect(sixth.priorChildren.first()).toBe(fifth);
		});

		it('be able to merge Propositions 1 and 4 with the Proposition 2 being 1\'s single later child', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.mergePropositions(first, fourth);

			expect(getFlatText(pericope).count()).toBe(5);
			expect(first.partAfterArrow).toBe(fourth);
			expect(fourth.partBeforeArrow).toBe(first);
			expect(first.laterChildren.size).toBe(0);
			expect(fourth.priorChildren.size).toBe(2);
			expect(fourth.priorChildren.first()).toBe(second);
			expect(fourth.priorChildren.get(1)).toBe(third);
			expect(second.syntacticFunction).toEqual(syntacticFunction);
			expect(third.syntacticFunction).toBe(null);
		});

		it('be able to merge combined Proposition 1+3 with its single enclosed child Proposition 2', () => {
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(first, second);

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(3);
			const merged = flatText.first();
			expect(merged.clauseItems.size).toBe(5);
			expect(merged.clauseItems.first().originText).toEqual('1 2');
			expect(merged.clauseItems.get(1).originText).toEqual('3');
			expect(merged.clauseItems.get(2).originText).toEqual('4');
			expect(merged.clauseItems.get(3).originText).toEqual('5');
			expect(merged.clauseItems.get(4).originText).toEqual('6');
			expect(flatText.get(1)).toBe(fourth);
		});

		it('be able to merge combined Proposition 1+3 with its single enclosed and previously subordinated child Proposition 2', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups.first().first());
			ModelChanger.mergePropositions(first, third);
			ModelChanger.mergePropositions(first, second);

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(3);
			const merged = flatText.first();
			expect(merged.clauseItems.size).toBe(5);
			expect(merged.clauseItems.first().originText).toEqual('1 2');
			expect(merged.clauseItems.get(1).originText).toEqual('3');
			expect(merged.clauseItems.get(2).originText).toEqual('4');
			expect(merged.clauseItems.get(3).originText).toEqual('5');
			expect(merged.clauseItems.get(4).originText).toEqual('6');
			expect(flatText.get(1)).toBe(fourth);
		});

		it('be able to merge combined Proposition 1+4 with its first enclosed child Proposition 2', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.mergePropositions(first, second);

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(4);
			const mergedPartOne = flatText.first();
			expect(mergedPartOne.clauseItems.size).toBe(4);
			expect(mergedPartOne.clauseItems.first().originText).toEqual('1 2');
			expect(mergedPartOne.clauseItems.get(1).originText).toEqual('3');
			expect(mergedPartOne.clauseItems.get(2).originText).toEqual('4');
			expect(mergedPartOne.clauseItems.get(3).originText).toEqual('5');
			expect(mergedPartOne.laterChildren.size).toBe(0);
			expect(mergedPartOne.partAfterArrow).toBe(fourth);
			expect(fourth.clauseItems.size).toBe(2);
			expect(fourth.clauseItems.first().originText).toEqual('7');
			expect(fourth.clauseItems.get(1).originText).toEqual('8 9');
			expect(fourth.priorChildren.size).toBe(1);
			expect(fourth.priorChildren.first()).toBe(third);
			expect(third.syntacticFunction).toEqual(syntacticFunction);
		});

		it('be able to merge combined Proposition 1+4 with its last enclosed Proposition 3', () => {
			const syntacticFunction = language.functionGroups.first().first();
			ModelChanger.indentPropositionUnderParent(second, first, syntacticFunction);
			ModelChanger.indentPropositionUnderParent(third, first, syntacticFunction);
			ModelChanger.mergePropositions(first, fourth);
			ModelChanger.mergePropositions(first, third);

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(4);
			const mergedPartOne = flatText.first();
			expect(mergedPartOne.clauseItems.size).toBe(2);
			expect(mergedPartOne.clauseItems.first().originText).toEqual('1 2');
			expect(mergedPartOne.clauseItems.get(1).originText).toEqual('3');
			const mergedPartTwo = mergedPartOne.partAfterArrow;
			expect(mergedPartTwo).not.toBe(null);
			expect(mergedPartTwo.partBeforeArrow).toBe(mergedPartOne);
			expect(mergedPartTwo.clauseItems.size).toBe(3);
			expect(mergedPartTwo.clauseItems.first().originText).toEqual('6');
			expect(mergedPartTwo.clauseItems.get(1).originText).toEqual('7');
			expect(mergedPartTwo.clauseItems.get(2).originText).toEqual('8 9');
			expect(mergedPartTwo.priorChildren.size).toBe(1);
			expect(mergedPartTwo.priorChildren.first()).toBe(second);
		});

		it('be able to merge enclosed child Propositions 2 and 3 within combined Proposition 1+4', () => {
			ModelChanger.mergePropositions(first, fourth);
			const relation = ModelChanger.createRelation([ third, fifth ], defaultRelationTemplate);
			const syntacticFunction = language.functionGroups.first().first();
			third.syntacticFunction = syntacticFunction;
			ModelChanger.mergePropositions(second, third);

			const flatText = getFlatText(pericope).cacheResult();
			expect(flatText.count()).toBe(4);
			const merged = flatText.get(1);
			expect(merged.clauseItems.size).toBe(3);
			expect(merged.clauseItems.first().originText).toEqual('4');
			expect(merged.clauseItems.get(1).originText).toEqual('5');
			expect(merged.clauseItems.get(2).originText).toEqual('6');
			expect(merged.syntacticFunction).toEqual(syntacticFunction);
			expect(merged.superOrdinatedRelation).toBe(relation);
			expect(fifth.superOrdinatedRelation).toBe(relation);
		});

		it('failing to merge unconnected Propositions 1 and 3, while 3 is 2\'s single later child Proposition', () => {
			ModelChanger.indentPropositionUnderParent(third, second, language.functionGroups.first().first());
			expect(() => ModelChanger.mergePropositions(first, third))
					.toThrow(new IllegalActionError('Error.MergePropositions'));
		});

		it('failing to merge unconnected Propositions 1 and 3, with both being children of the intermediate Proposition 2', () => {
			const syntacticFunction = language.functionGroups.first().first();
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
			const leadingItemFirst = first.clauseItems.first();
			const trailingItemFirst = first.clauseItems.get(1);
			first.syntacticTranslation = syntacticTranslation;
			first.semanticTranslation = semanticTranslation;
			first.comment = comment;
			ModelChanger.splitProposition(first, leadingItemFirst);

			expect(pericope.text.size).toBe(6);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(2)).toBe(second);
			const split = pericope.text.get(1);
			expect(first.syntacticTranslation).toEqual(syntacticTranslation);
			expect(first.semanticTranslation).toEqual(semanticTranslation);
			expect(first.comment).toEqual(comment);
			expect(first.clauseItems.size).toBe(1);
			expect(first.clauseItems.first()).toBe(leadingItemFirst);
			expect(split.syntacticTranslation).toEqual('');
			expect(split.semanticTranslation).toEqual('');
			expect(split.comment).toEqual('');
			expect(split.clauseItems.size).toBe(1);
			expect(split.clauseItems.first()).toBe(trailingItemFirst);
		});

		it('be able to split Proposition between its two Clause Items, handling super ordinated Relations', () => {
			const leadingItemSecond = second.clauseItems.first();
			const trailingItemSecond = second.clauseItems.get(1);
			const relation12 = ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			ModelChanger.createRelation([ relation12, third ], defaultRelationTemplate);
			ModelChanger.splitProposition(second, leadingItemSecond);

			expect(getFlatText(pericope).count()).toBe(6);
			expect(pericope.text.get(1)).toBe(second);
			expect(pericope.text.get(3)).toBe(third);
			const split = pericope.text.get(2);
			expect(second.clauseItems.size).toBe(1);
			expect(second.clauseItems.first()).toBe(leadingItemSecond);
			expect(split.clauseItems.size).toBe(1);
			expect(split.clauseItems.first()).toBe(trailingItemSecond);
			expect(first.superOrdinatedRelation).toBe(relation12);
			expect(second.superOrdinatedRelation).toBe(relation12);
			expect(split.superOrdinatedRelation).toBe(null);
			// the relation not-ending at the now split proposition 2 is no longer valid and was therefore removed
			expect(relation12.superOrdinatedRelation).toBe(null);
			expect(third.superOrdinatedRelation).toBe(null);
		});

		it('be able to split Proposition with partAfterArrow', () => {
			ModelChanger.mergePropositions(first, third);
			ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			ModelChanger.splitProposition(first, first.clauseItems.first());

			expect(getFlatText(pericope).count()).toBe(6);
			expect(pericope.text.first().partAfterArrow).toBe(null);
			expect(pericope.text.first().clauseItems.size).toBe(1);
			expect(pericope.text.first().clauseItems.first().originText).toEqual('1 2');
			expect(pericope.text.get(1).partAfterArrow).toBe(third);
			expect(pericope.text.get(1).clauseItems.size).toBe(1);
			expect(pericope.text.get(1).clauseItems.first().originText).toEqual('3');
			// the relation spanning over the new proposition is no longer valid and was therefore removed
			expect(second.superOrdinatedRelation).toBe(null);
			expect(third.partBeforeArrow).toBe(pericope.text.get(1));
		});

		it('be able to split Proposition with partAfterArrow after first part\'s last Clause Item', () => {
			ModelChanger.mergePropositions(first, third);
			const relation45 = ModelChanger.createRelation([ fourth, fifth ], defaultRelationTemplate);
			ModelChanger.createRelation([ second, relation45 ], defaultRelationTemplate);
			ModelChanger.splitProposition(first, first.clauseItems.last());

			expect(getFlatText(pericope).count()).toBe(5);
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
			expect(() => ModelChanger.splitProposition(first, first.clauseItems.last()))
					.toThrow(new IllegalActionError('Error.SplitProposition'));
		});

		it('failing to split Proposition after null Clause Item', () => {
			expect(() => ModelChanger.splitProposition(first, null))
					.toThrowError();
		});
	});

	describe('mergeClauseItemWithPrior()', () => {
		it('be able to merge second Clause Item with its prior, preserving single syntactic function', () => {
			const trailingItemFirst = first.clauseItems.last();
			const trailingFunction = language.functionGroups.first().first();
			trailingItemFirst.syntacticFunction = trailingFunction;
			ModelChanger.mergeClauseItemWithPrior(first, trailingItemFirst);

			expect(first.clauseItems.size).toBe(1);
			expect(first.clauseItems.first().originText).toEqual('1 2 3');
			expect(first.clauseItems.first().syntacticFunction).toEqual(trailingFunction);
		});

		it('be able to merge second Clause Item with its prior, preferring leading syntactic function', () => {
			const leadingItemFirst = first.clauseItems.first();
			const trailingItemFirst = first.clauseItems.last();
			const leadingFunction = language.functionGroups.first().first();
			leadingItemFirst.syntacticFunction = leadingFunction;
			trailingItemFirst.syntacticFunction = language.functionGroups.first().get(1);
			ModelChanger.mergeClauseItemWithPrior(first, trailingItemFirst);

			expect(first.clauseItems.size).toBe(1);
			expect(first.clauseItems.first().originText).toEqual('1 2 3');
			expect(first.clauseItems.first().syntacticFunction).toEqual(leadingFunction);
		});

		it('failing to merge first Clause Item with its prior', () => {
			expect(() => ModelChanger.mergeClauseItemWithPrior(first, first.clauseItems.first()))
					.toThrow(new IllegalActionError('Error.MergeClauseItems.NoPrior'));
		});
	});

	describe('mergeClauseItemWithFollower()', () => {
		it('be able to merge first Clause Item with its follower, preserving single syntactic function', () => {
			const trailingItemFirst = first.clauseItems.last();
			const trailingFunction = language.functionGroups.first().first();
			trailingItemFirst.syntacticFunction = trailingFunction;
			ModelChanger.mergeClauseItemWithFollower(first, first.clauseItems.first());

			expect(first.clauseItems.size).toBe(1);
			expect(first.clauseItems.first().originText).toEqual('1 2 3');
			expect(first.clauseItems.first().syntacticFunction).toEqual(trailingFunction);
		});

		it('be able to merge first Clause Item with its follower, preferring leading syntactic function', () => {
			const leadingItemFirst = first.clauseItems.first();
			const leadingFunction = language.functionGroups.first().first();
			leadingItemFirst.syntacticFunction = leadingFunction;
			first.clauseItems.get(1).syntacticFunction = language.functionGroups.first().get(1);
			ModelChanger.mergeClauseItemWithFollower(first, leadingItemFirst);

			expect(first.clauseItems.size).toBe(1);
			expect(first.clauseItems.first().originText).toEqual('1 2 3');
			expect(first.clauseItems.first().syntacticFunction).toEqual(leadingFunction);
		});

		it('failing to merge last Clause Item with its follower', () => {
			expect(() => ModelChanger.mergeClauseItemWithFollower(first, first.clauseItems.last()))
					.toThrow(new IllegalActionError('Error.MergeClauseItems.NoFollower'));
		});
	});

	describe('splitClauseItem()', () => {
		it('be able to split Clause Item between its two tokens', () => {
			const syntacticFunction = language.functionGroups.first().first();
			first.clauseItems.first().syntacticFunction = syntacticFunction;
			ModelChanger.splitClauseItem(first, first.clauseItems.first(), '1');

			expect(first.clauseItems.size).toBe(3);
			expect(first.clauseItems.first().originText).toEqual('1');
			expect(first.clauseItems.get(1).originText).toEqual('2');
			expect(first.clauseItems.get(2).originText).toEqual('3');
			expect(first.clauseItems.first().syntacticFunction).toEqual(syntacticFunction);
			expect(first.clauseItems.get(1).syntacticFunction).toBe(null);
		});

		it('failing to split Clause Item after empty string', () => {
			expect(() => ModelChanger.splitClauseItem(first, first.clauseItems.first(), ''))
					.toThrowError();
		});

		it('failing to split Clause Item after full item text', () => {
			expect(() => ModelChanger.splitClauseItem(first, first.clauseItems.first(), '1 2'))
					.toThrowError();
		});

		it('failing to split Clause Item after uncontained string', () => {
			expect(() => ModelChanger.splitClauseItem(first, first.clauseItems.first(), 'X'))
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
			expect(upperRelation.associates.size).toBe(3);
			expect(upperRelation.associates.first()).toBe(first);
			expect(upperRelation.associates.get(1)).toBe(lowerRelation);
			expect(upperRelation.associates.get(2)).toBe(fourth);
			expect(lowerRelation.associates.size).toBe(2);
			expect(lowerRelation.associates.first()).toBe(second);
			expect(lowerRelation.associates.get(1)).toBe(third);
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
			expect(relation.associates.size).toBe(2);
			expect(relation.associates.first()).toBe(first);
			expect(relation.associates.get(1)).toBe(second);

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
			expect(relation.associates.size).toBe(3);
			expect(relation.associates.first()).toBe(first);
			expect(relation.associates.get(1)).toBe(second);
			expect(relation.associates.get(2)).toBe(third);

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

			expect(pericope.text.size).toBe(3);
			expect(pericope.text.first()).toBe(first);
			expect(pericope.text.get(1)).toBe(fourth);
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
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups.first().first());
			expect(() => ModelChanger.removePropositions(pericope, [ first ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});

		it('failing to remove Proposition with prior child', () => {
			ModelChanger.indentPropositionUnderParent(first, second, language.functionGroups.first().first());
			expect(() => ModelChanger.removePropositions(pericope, [ second ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});

		it('failing to remove Proposition with later child', () => {
			ModelChanger.indentPropositionUnderParent(second, first, language.functionGroups.first().first());
			expect(() => ModelChanger.removePropositions(pericope, [ first ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});

		it('failing to remove Proposition with partAfterArrow', () => {
			ModelChanger.mergePropositions(first, third);
			expect(() => ModelChanger.removePropositions(pericope, [ first ]))
					.toThrow(new IllegalActionError('Error.DeletePropositions.ConditionsNotMet'));
		});
	});

	describe('removeRelation()', () => {
		it('be able to remove single Relation without removing its associate Relations', () => {
			const relation12 = ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			const relationToRemove = ModelChanger.createRelation([ relation12, third ], defaultRelationTemplate);
			ModelChanger.removeRelation(relationToRemove);

			expect(first.superOrdinatedRelation).toBe(relation12);
			expect(second.superOrdinatedRelation).toBe(relation12);
			expect(third.superOrdinatedRelation).toBe(null);
			expect(relation12.superOrdinatedRelation).toBe(null);
		});

		it('be able to remove Relation and its superOrdinatedRelations', () => {
			const relation12 = ModelChanger.createRelation([ first, second ], defaultRelationTemplate);
			const relation34 = ModelChanger.createRelation([ third, fourth ], defaultRelationTemplate);
			const relation1to4 = ModelChanger.createRelation([ relation12, relation34 ], defaultRelationTemplate);
			ModelChanger.createRelation([ relation1to4, fifth ], defaultRelationTemplate);
			ModelChanger.removeRelation(relation34);

			expect(first.superOrdinatedRelation).toBe(relation12);
			expect(second.superOrdinatedRelation).toBe(relation12);
			expect(relation12.superOrdinatedRelation).toBe(null);
			expect(third.superOrdinatedRelation).toBe(null);
			expect(fourth.superOrdinatedRelation).toBe(null);
			expect(fifth.superOrdinatedRelation).toBe(null);
		});
	});

	describe('prependText()', () => {
		it('be able to prepend Proposition as text', () => {
			ModelChanger.prependText(pericope, ' 0\n\t\n');

			expect(pericope.text.size).toBe(6);
			expect(pericope.text.first().parent).toBe(pericope);
			expect(pericope.text.first().clauseItems.size).toBe(1);
			expect(pericope.text.first().clauseItems.first().originText).toBe('0');
		});
	});

	describe('appendText()', () => {
		it('be able to append Propositions as text', () => {
			ModelChanger.appendText(pericope, '11\n \t\n12\t\t 13    14');

			expect(pericope.text.size).toBe(7);
			expect(pericope.text.get(5).parent).toBe(pericope);
			expect(pericope.text.get(6).parent).toBe(pericope);
			expect(pericope.text.get(5).clauseItems.size).toBe(1);
			expect(pericope.text.get(5).clauseItems.first().originText).toBe('11');
			expect(pericope.text.get(6).clauseItems.size).toBe(3);
			expect(pericope.text.get(6).clauseItems.first().originText).toBe('12');
			expect(pericope.text.get(6).clauseItems.get(1).originText).toBe('13');
			expect(pericope.text.get(6).clauseItems.get(2).originText).toBe('14');
		});
	});
});
