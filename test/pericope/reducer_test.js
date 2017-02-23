import * as ActionTypes from '../../src/actions/index';
import PericopeReducer from '../../src/pericope/reducer';
import LanguageModel from '../../src/pericope/model/languageModel';

describe('PericopeReducer', () => {

	const createAction = function(type, payload) {
		return { type, ...payload };
	};

	describe('on NEW_PROJECT action', () => {
		it('reset to initial state', () => {
			const action = createAction(ActionTypes.NEW_PROJECT);
			const initialState = {
				language: new LanguageModel('', true, [ [ ] ]),
				text: [ ],
				connectables: [ ]
			};

			expect(PericopeReducer(null, action)).toEqual(initialState);
		});
	});

	describe('on START_ANALYSIS action', () => {
		it('create Pericope from origin text', () => {
			const action = createAction(ActionTypes.START_ANALYSIS, { originText: ' 1\n 2 \n\n3.1    3.2\t3.3   \t  \n  \n4\n  ' });
			const pericope = PericopeReducer(null, action);

			expect(pericope.text.length).toBe(4);
			expect(pericope.text[0].clauseItems.length).toBe(1);
			expect(pericope.text[0].clauseItems[0].originText).toEqual('1');
			expect(pericope.text[1].clauseItems.length).toBe(1);
			expect(pericope.text[1].clauseItems[0].originText).toEqual('2');
			expect(pericope.text[2].clauseItems.length).toBe(3);
			expect(pericope.text[2].clauseItems[0].originText).toEqual('3.1');
			expect(pericope.text[2].clauseItems[1].originText).toEqual('3.2');
			expect(pericope.text[2].clauseItems[2].originText).toEqual('3.3');
			expect(pericope.text[3].clauseItems.length).toBe(1);
			expect(pericope.text[3].clauseItems[0].originText).toEqual('4');
		});
	});
});
