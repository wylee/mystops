import { autobind } from 'core-decorators';

import * as React from 'react';
import { connect } from 'react-redux';

import isEqual from 'lodash/isEqual';

import {
  doSearch,
  setActiveStops,
  setBaseLayer,
  setBottomSheetContent,
  setMapContextMenuState,
  setMapState,
  setMenuState,
  setSearchTerm,
  trackUserLocation,
  zoomIn,
  zoomOut,
  zoomToFullExtent,
  zoomToUserLocation,
} from '../store';

import { DEBUG, MAPBOX_WORDMARK_IMAGE_DATA, STREET_LEVEL_ZOOM } from './const';
import { STOP_STYLE, STOP_STYLE_SELECTED } from './styles';

import Attributions from './Attributions';
import ContextMenu from './ContextMenu';
import OpenLayersMap from './OpenLayersMap';
import StopInfo from './StopInfo';

import './Map.css';

interface IProps {
  activeStops: Array<number>;
  baseLayer: string;
  nextBaseLayer: string;
}

interface IDispatchProps {
  setActiveStops: (stops: Array<number>) => void;
  setBaseLayer: (label: string) => void;
  setBottomSheetContent: (content) => void;
  setMapState: (state: {}) => void;
  setMapContextMenuState: (open: boolean, top: number, left: number) => void;
  setMenuState: (open: boolean) => void;
  setSearchTerm: (term: string) => void;
  trackUserLocation: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToUserLocation: () => void;
  zoomToFullExtent: () => void;
}

class Map extends React.Component<IProps & IDispatchProps> {
  map: OpenLayersMap;
  stopLayer: any;
  stopSource: any;

  mapRef: any = React.createRef();
  overviewMapRef: any = React.createRef();

  constructor(props) {
    super(props);
    this.map = new OpenLayersMap();
    this.stopLayer = this.map.getFeatureLayer('Stops');
    this.stopSource = this.stopLayer.getSource();
  }

  render() {
    const { map, props } = this;
    const { nextBaseLayer } = props;

    return (
      <div
        ref={this.mapRef}
        className="Map"
        onContextMenu={this.handleContextMenu}
      >
        <div
          className="controls bottom-right column"
          onContextMenu={this.disableContextMenu}
        >
          <button
            type="button"
            title="Find my location"
            className="material-icons"
            onClick={props.zoomToUserLocation}
          >
            my_location
          </button>

          <button
            title="Zoom to full extent"
            className="material-icons hidden-xs"
            onClick={props.zoomToFullExtent}
          >
            public
          </button>

          <button
            title="Zoom in"
            className="material-icons"
            onClick={props.zoomIn}
          >
            add
          </button>

          <button
            title="Zoom out"
            className="material-icons"
            onClick={props.zoomOut}
          >
            remove
          </button>

          <button
            title="Map info"
            className="material-icons visible-sm"
            onClick={this.showBottomSheet}
          >
            info
          </button>
        </div>

        <div
          className="controls bottom-left column"
          title={`Show ${nextBaseLayer} layer`}
          onClick={this.selectNextBaseLayer}
          onContextMenu={this.disableContextMenu}
        >
          <div className="mapbox-wordmark">
            <a
              href="https://www.mapbox.com/about/maps/"
              title="Map tiles and styling provided by Mapbox"
            >
              <img src={MAPBOX_WORDMARK_IMAGE_DATA} height="18" />
            </a>
          </div>

          <div ref={this.overviewMapRef} className="overview-map">
            <div className="label">{nextBaseLayer}</div>
          </div>
        </div>

        <Attributions />
        <ContextMenu
          map={map}
          open={false}
          left={0}
          top={0}
          streetLevelZoom={STREET_LEVEL_ZOOM}
        />
        <StopInfo map={map} layer={this.stopLayer} />
      </div>
    );
  }

  componentDidMount() {
    const { map, stopLayer } = this;
    const props = this.props;

    // This keeps the Redux map state in sync with changes made to
    // the map via its internal interactions (panning, scroll-wheel
    // zooming, etc).
    map.addListener('moveend', () => {
      props.setMapState({
        center: map.getCenter(),
        extent: map.getExtent(),
        resolution: map.getResolution(),
        zoom: map.getZoom(),
      });

      if (DEBUG) {
        console.debug('CENTER:', map.getCenter());
        console.debug('EXTENT:', map.getExtent());
        console.debug('RESOLUTION:', map.view.getResolution());
        console.debug('ZOOM:', map.getZoom());
      }
    });

    map.addFeatureListener(
      'singleclick',
      feature => {
        const id = feature.get('id');
        const { activeStops } = this.props;
        const index = activeStops.indexOf(id);
        const newActiveStops =
          index > -1
            ? [...activeStops.slice(0, index), ...activeStops.slice(index + 1)]
            : [...activeStops, id];
        newActiveStops.sort((a, b) => a - b);
        props.setActiveStops(newActiveStops);
        props.setSearchTerm(newActiveStops.join(', '));
      },
      () => {
        props.setActiveStops([]);
        props.setSearchTerm('');
      },
      stopLayer
    );

    map
      .initialize(this.mapRef.current, this.overviewMapRef.current, props)
      .then(() => {
        props.setMapState({ map });
        props.trackUserLocation();
        props.zoomToUserLocation();
      });
  }

  componentDidUpdate(prevProps) {
    const { map, props } = this;
    const { activeStops, baseLayer } = props;
    const {
      activeStops: prevActiveStops,
      baseLayer: prevBaseLayer,
    } = prevProps;

    if (baseLayer !== prevBaseLayer) {
      map.setBaseLayer(baseLayer);
    }

    if (!isEqual(activeStops, prevActiveStops)) {
      const source = this.stopSource;
      prevActiveStops.forEach(id => {
        const feature = source.getFeatureById(`stop.${id}`);
        if (feature) {
          feature.setStyle(STOP_STYLE);
        }
      });
      activeStops.forEach(id => {
        const feature = source.getFeatureById(`stop.${id}`);
        feature.setStyle([STOP_STYLE, STOP_STYLE_SELECTED]);
      });
    }
  }

  @autobind
  disableContextMenu(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  @autobind
  handleContextMenu(event) {
    event.preventDefault();
    const top = event.pageY;
    const left = event.pageX;
    this.props.setMenuState(false);
    this.props.setMapContextMenuState(true, top, left);
  }

  @autobind
  selectNextBaseLayer() {
    this.props.setBaseLayer(this.props.nextBaseLayer);
  }

  @autobind
  showBottomSheet() {
    this.props.setBottomSheetContent(
      <div style={{ textAlign: 'center' }}>
        <div>Site © 2018 mystops.io</div>

        <div>
          <Attributions title="Map data and tiles" />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state): IProps {
  return {
    ...state.main,
    ...state.map,
  };
}

function mapDispatchToProps(dispatch): IDispatchProps {
  return {
    setBaseLayer: label => dispatch(setBaseLayer(label)),
    setBottomSheetContent: content => dispatch(setBottomSheetContent(content)),
    setMapState: state => dispatch(setMapState(state)),
    setMenuState: open => dispatch(setMenuState(open)),
    setMapContextMenuState: (open, top, left) =>
      dispatch(setMapContextMenuState(open, top, left)),
    setActiveStops: stops => dispatch(setActiveStops(stops)),
    setSearchTerm: term => {
      dispatch(setSearchTerm(term));
      dispatch(doSearch());
    },
    trackUserLocation: () => dispatch(trackUserLocation()),
    zoomToUserLocation: () => dispatch(zoomToUserLocation()),
    zoomIn: () => dispatch(zoomIn()),
    zoomOut: () => dispatch(zoomOut()),
    zoomToFullExtent: () => dispatch(zoomToFullExtent()),
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Map);
