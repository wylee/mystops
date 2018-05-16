import * as React from 'react';

import OpenLayersMap from './OpenLayersMap';

interface IProps {
  map: OpenLayersMap;
  layer: any;
}

interface IPosition {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface IInfo {
  name: string;
  direction: string;
  routes: Array<any>;
  position: IPosition;
  id: number;
}

interface IState {
  infoStop: IInfo | null;
}

export default class StopInfo extends React.Component<IProps, IState> {
  state: IState = {
    infoStop: null,
  };

  render() {
    const { infoStop } = this.state;

    return infoStop ? (
      <div className="stop-info" style={{ ...infoStop.position }}>
        <div className="stop-info-title">Stop {infoStop.id}</div>
        <div>{infoStop.name}</div>
        <div>{infoStop.direction}</div>
        <div>Routes: {infoStop.routes}</div>
      </div>
    ) : null;
  }

  componentDidMount() {
    const { map, layer } = this.props;

    map.addListener('movestart', () => {
      if (this.state.infoStop) {
        this.clearStopInfo();
      }
    });

    map.addFeatureListener(
      'pointermove',
      (feature, layer, event) => {
        if (event.dragging) {
          if (this.state.infoStop) {
            this.clearStopInfo();
          }
        } else {
          this.showStopInfo(feature);
        }
      },
      () => {
        if (this.state.infoStop) {
          this.clearStopInfo();
        }
      },
      layer,
      10
    );

    map.addFeatureListener(
      'singleclick',
      () => this.clearStopInfo(),
      undefined,
      layer
    );
  }

  showStopInfo(feature) {
    const { map } = this.props;
    const [width, height] = map.getSize();
    const [x, y] = [width / 2, height / 2];
    const buffer = 10;
    const pixel = map.getPixelFromFeature(feature);

    let left: any = pixel[0];
    let top: any = pixel[1];
    let right: any = 'auto';
    let bottom: any = 'auto';

    if (left > x) {
      [left, right] = ['auto', width - left];
    }

    if (top > y) {
      [top, bottom] = ['auto', height - top];
    }

    [top, right, bottom, left] = [top, right, bottom, left].map(value => {
      return value === 'auto' ? value : `${value + buffer}px`;
    });

    this.setState({
      infoStop: {
        ...feature.getProperties(),
        position: { top, right, bottom, left },
      },
    });
  }

  clearStopInfo() {
    this.setState({ infoStop: null });
  }
}
