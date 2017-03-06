import React, { Component, PropTypes } from 'react';

class ClauseItem extends Component {
	render() {
		const { index, originText, syntacticFunction } = this.props;
		const { code, underlined } = syntacticFunction;
		return (
			<li key={index} className='clause-item'>
				<div className='origin-text'>
					<label>{this.props.originText}</label>
				</div>
				<div className={`syntactic-function${underlined ? ' underlined' : ''}`}>
					<label>{code}</label>
				</div>
			</li>
		);
	}
};

ClauseItem.propTypes = {
	index: PropTypes.number.isRequired,
	originText: PropTypes.string.isRequired,
	syntacticFunction: PropTypes.shape({
		code: PropTypes.string.isRequired,
		underlined: PropTypes.bool.isRequired
	})
};

ClauseItem.defaultProps = {
	syntacticFunction: {
		code: '',
		underlined: false
	}
};

export default ClauseItem;
