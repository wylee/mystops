import * as React from 'react';

import { ISearchError } from '../store';

interface IProps {
  error: ISearchError;
}

export default class Error extends React.Component<IProps> {
  render() {
    const { error } = this.props;

    return (
      <div className="results error">
        <div className="error-title">{error.title || 'Whoops!'}</div>
        <div className="error-message">
          <p>{error.message}</p>
          <p>{error.detail}</p>
        </div>
      </div>
    );
  }
}
