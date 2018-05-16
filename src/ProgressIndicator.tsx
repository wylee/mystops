import * as React from 'react';
import { connect } from 'react-redux';

import { IState } from './store';

interface IProps {
  progressCounter: number;
}

const ProgressIndicator = ({ progressCounter }: IProps) => {
  return progressCounter > 0 ? <div className="ProgressIndicator" /> : null;
};

export default connect((state: IState) => ({
  progressCounter: state.main.progressCounter,
}))(ProgressIndicator);
