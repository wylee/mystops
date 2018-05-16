import { autobind } from 'core-decorators';

import * as React from 'react';
import { connect } from 'react-redux';

import { setMapContextMenuState } from './store';

import BottomSheet from './BottomSheet';
import Map from './map';
import Menu from './Menu';
import ProgressIndicator from './ProgressIndicator';
import Search from './search';

import './App.css';

interface IDispatchProps {
  setMenuStates: (open: boolean) => void;
}

class App extends React.Component<IDispatchProps> {
  render() {
    return (
      <div className="App" onMouseDown={this.closeMenus}>
        <div className="Header">
          <div className="title">
            <a href="/">MyStops</a>
          </div>
        </div>
        <ProgressIndicator />
        <Menu />
        <Search />
        <Map />
        <BottomSheet />
      </div>
    );
  }

  @autobind
  closeMenus() {
    this.props.setMenuStates(false);
  }
}

function mapDispatchToProps(dispatch): IDispatchProps {
  return {
    setMenuStates: open => {
      dispatch(setMapContextMenuState(open));
    },
  };
}

export default connect(undefined, mapDispatchToProps)(App);
