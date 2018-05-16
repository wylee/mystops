import { autobind } from 'core-decorators';

import * as React from 'react';
import { connect } from 'react-redux';

import debounce from 'lodash/debounce';

import {
  doSearch,
  resetSearchState,
  setSearchTerm,
  setActiveStops,
  setCenter,
  ISearchError,
} from '../store';

import Error from './Error';
import Result from './Result';

import './Search.css';

interface IProps {
  term?: string;
  result?: any;
  error?: ISearchError;
}

interface IDispatchProps {
  onChange: (string) => void;
  onReset: () => void;
  onSubmit: () => void;
  setCenter: (center, zoom?) => void;
}

class Search extends React.Component<IProps & IDispatchProps> {
  render() {
    const { error, result, term } = this.props;

    return (
      <div className="Search">
        <form onSubmit={this.onSubmit}>
          <input
            type="text"
            title="Enter a stop ID or name"
            placeholder="Enter a stop ID or name"
            value={term}
            onChange={this.onChange}
          />

          <button type="submit" title="Search" className="material-icons" disabled={!term}>
            search
          </button>

          <button
            type="reset"
            title="Clear"
            className="material-icons"
            disabled={!(term || error)}
            onClick={this.onReset}
          >
            close
          </button>
        </form>

        {result ? <Result result={result} /> : null}
        {error ? <Error error={error} /> : null}
      </div>
    );
  }

  @autobind
  onChange(event) {
    this.props.onChange(event.target.value);
  }

  @autobind
  onReset() {
    this.props.onReset();
  }

  @autobind
  onSubmit(event) {
    event.preventDefault();
    this.props.onSubmit();
  }
}

function mapStateToProps(state): IProps {
  return {
    ...state.map,
    ...state.search,
  };
}

function mapDispatchToProps(dispatch): IDispatchProps {
  const debouncedOnChange = debounce(term => {
    if (!term) {
      dispatch(resetSearchState());
      dispatch(setActiveStops([]));
    }
  }, 250);

  return {
    onChange: term => {
      dispatch(setSearchTerm(term));
      debouncedOnChange(term);
    },
    onReset: () => {
      dispatch(resetSearchState());
      dispatch(setActiveStops([]));
    },
    onSubmit: () => {
      dispatch(doSearch());
    },
    setCenter: (center, zoom?) => {
      dispatch(setCenter(center, zoom));
    },
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Search);
