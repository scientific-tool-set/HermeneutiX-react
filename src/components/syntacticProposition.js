import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';

import { togglePropositionSelection, setPropositionLabel, setSyntacticTranslation } from '../actions/index';
import ClauseItem from './clauseItem';

class SynProposition extends Component {
	render() {
		return (
			<li key={this.props.index} className='proposition'>
				{ this.renderUpperPart() }
				{ this.renderLowerPart() }
			</li>
		);
	}

	renderUpperPart() {
		const { index, checked, label, clauseItems, toggleSelection, setLabel } = this.props;
		const checkedFlag = !!checked;
		const labelText = label ? label : '';
		return (
			<div className='proposition-details'>
				<div className='proposition-checkbox'>
					<input
						type='checkbox'
						checked={checkedFlag}
						onChange={() => toggleSelection(index)}
					/>
				</div>
				<div className='proposition-label'>
					<input
						type='text'
						maxLength={5}
						value={labelText}
						onChange={e => setLabel(index, e.target.value)}
					/>
				</div>
				<ul className='clause-item-container'>
					{clauseItems.map((item, itemIndex) => (
						<ClauseItem
							index={itemIndex}
							{ ...item }
						/>
					))}
				</ul>
			</div>
		);
	}

	renderLowerPart() {
		const { index, syntacticTranslation, setTranslation } = this.props;
		const translationText = syntacticTranslation ? syntacticTranslation : '';
		return (
			<div className='proposition-translation'>
				<div className='checkbox-placeholder'>
					<label></label>
				</div>
				<div className='proposition-label-placeholder'>
					<label></label>
				</div>
				<div className='syntactic-translation'>
					<input
						type='text'
						value={translationText}
						onChange={e => setTranslation(index, e.target.value)}
					/>
				</div>
			</div>
		);
	}
};

SynProposition.propTypes = {
	index: PropTypes.number.isRequired,
	checked: PropTypes.bool,
	label: PropTypes.string,
	syntacticTranslation: PropTypes.string,
	clauseItems: PropTypes.arrayOf(PropTypes.shape({
		originText: PropTypes.string.isRequired,
		syntacticFunction: PropTypes.shape({
			code: PropTypes.string.isRequired,
			underlined: PropTypes.bool.isRequired
		})
	})).isRequired,
	toggleSelection: PropTypes.func.isRequired,
	setLabel: PropTypes.func.isRequired,
	setTranslation: PropTypes.func.isRequired
};

export default connect(null, {
	toggleSelection: togglePropositionSelection,
	setLabel: setPropositionLabel,
	setTranslation: setSyntacticTranslation
})(SynProposition);
