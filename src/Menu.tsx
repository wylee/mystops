import { autobind } from 'core-decorators';

import * as React from 'react';
import { connect } from 'react-redux';

import { setBaseLayer, setMapContextMenuState, setMenuState } from './store';

import { DISCLAIMER } from './const';

import './Menu.css';
import { BASE_LAYER_LABELS } from './map';

interface IProps {
  menuOpen?: boolean;
  baseLayer?: string;
}

interface IDispatchProps {
  setBaseLayer: (label: string) => void;
  setMenuState: (open?: boolean) => void;
}

class Menu extends React.Component<IProps & IDispatchProps> {
  menuRef: any = React.createRef();

  render() {
    const props = this.props;
    const { menuOpen } = props;

    return (
      <div className="Menu" style={{ right: menuOpen ? 0 : 'auto' }}>
        <button
          type="button"
          title={menuOpen ? 'Hide menu' : 'Show menu'}
          className="material-icons"
          onClick={this.toggleMenu}
        >
          {menuOpen ? 'close' : 'menu'}
        </button>

        <div
          className="menu-backdrop"
          onClick={this.closeMenu}
          style={{ display: menuOpen ? 'block' : 'none' }}
        />

        <ul
          className="menu"
          ref={this.menuRef}
          onClick={this.handleClick}
          style={{ display: menuOpen ? 'block' : 'none' }}
        >
          <li className="title">MyStops</li>

          <li>
            <a href="/" className="regular-link">
              <span className="material-icons">home</span>
              <span>Home</span>
            </a>
          </li>

          {BASE_LAYER_LABELS.map(label => {
            return (
              <li key={label}>
                {label === props.baseLayer ? (
                  <div>
                    <span className="material-icons">layers</span>
                    <span>{label}</span>
                  </div>
                ) : (
                  <a
                    href="#switch-base-layer"
                    onClick={this.setBaseLayer.bind(this, label)}
                  >
                    <span className="material-icons">layers</span>
                    <span>{label}</span>
                  </a>
                )}
              </li>
            );
          })}

          <li className="section-heading">
            <span>Links</span>
          </li>

          <li>
            <a href="https://trimet.org/" className="regular-link">
              <span className="material-icons">link</span>
              <span>TriMet</span>
            </a>
          </li>

          <li className="section-heading">
            <span>Info</span>
          </li>

          <li className="info">
            <div>
              <p dangerouslySetInnerHTML={{ __html: DISCLAIMER }} />
              <p>&copy; 2018 mystops.io</p>
            </div>
          </li>
        </ul>
      </div>
    );
  }

  @autobind
  closeMenu() {
    this.props.setMenuState(false);
  }

  @autobind
  toggleMenu() {
    this.props.setMenuState(!this.props.menuOpen);
  }

  @autobind
  handleClick(event) {
    let target = event.target;
    while (target.tagName !== 'A') {
      target = target.parentNode;
      if (target === null || target === this.menuRef.current) {
        return false;
      }
    }
    if (!target.classList.contains('regular-link')) {
      event.preventDefault();
    }
    this.props.setMenuState(false);
    return true;
  }

  @autobind
  setBaseLayer(label) {
    this.props.setBaseLayer(label);
  }
}

function mapStateToProps(state) {
  return {
    ...state.main,
    ...state.map,
  };
}

function mapDispatchToProps(dispatch): IDispatchProps {
  return {
    setBaseLayer: label => {
      dispatch(setBaseLayer(label));
    },
    setMenuState: open => {
      dispatch(setMenuState(open));
      dispatch(setMapContextMenuState(false));
    },
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(Menu as any);
