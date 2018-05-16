import { autobind } from 'core-decorators';

import * as React from 'react';
import { connect } from 'react-redux';

import { setCenter, setMapContextMenuState } from '../store';

import OpenLayersMap from './OpenLayersMap';

interface IProps {
  map: OpenLayersMap;
  open: boolean;
  left: number;
  top: number;
  streetLevelZoom: number;
}

interface IDispatchProps {
  centerMap: (map: any, pixel: Array<number>) => void;
  setMapContextMenuState: (open: boolean, top?: number, left?: number) => void;
  zoomIn: (map: any, pixel: Array<number>, zoom: number) => void;
}

class ContextMenu extends React.Component<IProps & IDispatchProps> {
  render() {
    const { open } = this.props;

    return open ? (
      <ul
        className="ContextMenu"
        style={this.getPosition()}
        onClick={this.handleClick}
        onContextMenu={this.handleContextMenu}
        onMouseDown={this.handleMouseDown}
      >
        <li>
          <a href="#center-map" onClick={this.setCenter}>
            {' '}
            Center map here
          </a>
        </li>
        <li>
          <a href="#zoom-in" onClick={this.zoomToStreetLevel}>
            Zoom in here
          </a>
        </li>
      </ul>
    ) : null;
  }

  getPosition() {
    const { map, left: x, top: y } = this.props;
    const [containerWidth, containerHeight] = map.getSize() || [0, 0];
    const threshold = 200;

    let top = `${y}px`;
    let right = 'auto';
    let bottom = 'auto';
    let left = `${x}px`;

    if (containerWidth - x < threshold) {
      left = 'auto';
      right = `${containerWidth - x}px`;
    }

    if (containerHeight - y < threshold) {
      top = 'auto';
      bottom = `${containerHeight - y}px`;
    }

    return { top, right, bottom, left };
  }

  @autobind
  handleClick(event) {
    if (!event.target.classList.contains('regular-link')) {
      event.preventDefault();
    }
    this.props.setMapContextMenuState(false);
  }

  @autobind
  handleContextMenu(event) {
    event.preventDefault();
  }

  @autobind
  handleMouseDown(event) {
    event.stopPropagation();
  }

  @autobind
  setCenter() {
    const { map, left, top } = this.props;
    this.props.centerMap(map, [left, top]);
  }

  @autobind
  zoomToStreetLevel() {
    const { map, left, top, streetLevelZoom } = this.props;
    this.props.zoomIn(map, [left, top], streetLevelZoom);
  }
}

function mapStateToProps(state) {
  return state.map.contextMenu;
}

function mapDispatchToProps(dispatch): IDispatchProps {
  return {
    centerMap: (map, pixel) => {
      const center = map.getCoordinateFromPixel(pixel);
      dispatch(setCenter(center));
    },
    zoomIn: (map, pixel, zoom) => {
      const currentZoom = map.getZoom();
      const center = map.getCoordinateFromPixel(pixel);
      dispatch(setCenter(center, currentZoom >= zoom ? undefined : zoom));
    },
    setMapContextMenuState: (open, top?, left?) => {
      dispatch(setMapContextMenuState(open, top, left));
    },
  };
}

export default connect<{}, {}, IProps>(mapStateToProps, mapDispatchToProps)(
  ContextMenu as any
);
