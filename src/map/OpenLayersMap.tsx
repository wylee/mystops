import debounce from 'lodash/debounce';

import { containsCoordinate, containsExtent } from 'ol/extent';
import { bbox as bboxLoadingStrategy } from 'ol/loadingstrategy';

import Geolocation from 'ol/Geolocation';
import Map from 'ol/Map';
import View from 'ol/View';

import OSMSource from 'ol/source/OSM';
import TileDebugSource from 'ol/source/TileDebug';
import VectorSource from 'ol/source/Vector';
import XYZSource from 'ol/source/XYZ';

import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';

import GeoJSONFormat from 'ol/format/GeoJSON';

import {
  ANIMATION_DURATION,
  API_URL,
  DEBUG,
  GEOGRAPHIC_PROJECTION,
  MAPBOX_ACCESS_TOKEN,
  MAX_ZOOM,
  MIN_ZOOM,
  FEATURE_LAYER_MAX_RESOLUTION,
} from './const';

import { STOP_STYLE } from './styles';
import { transform, transformExtent } from './utils';
import OverviewSwitcher from './OverviewSwitcher';

export default class OpenLayersMap {
  baseLayers: Array<TileLayer>;
  baseLayer: any;
  featureLayers: Array<VectorLayer>;
  map: Map;
  view: View;
  overviewSwitcher: OverviewSwitcher;
  _geolocator: any;

  constructor() {
    let baseLayers = [
      this.makeBaseLayer('wylee/cjgpolk6s00002rpi4xovx6tc', 'Map', null, true),
      this.makeBaseLayer('wylee/cjgpp7kso000c2smgd2hji3j8', 'Satellite'),
      this.makeOSMLayer(),
    ];

    if (DEBUG) {
      baseLayers[0].setVisible(false);
      baseLayers = [this.makeDebugLayer('Debug', null, true)].concat(baseLayers);
    }

    let featureLayers = [
      this.makeFeatureLayer('Stops', 'stops', {
        style: STOP_STYLE,
      }),
    ];

    const allLayers = baseLayers.concat(featureLayers);

    const map = new Map({
      controls: [],
      layers: allLayers,
      view: new View({
        minZoom: MIN_ZOOM,
        maxZoom: MAX_ZOOM,
      }),
    });

    this.baseLayers = baseLayers;
    this.baseLayer = baseLayers.find(layer => layer.getVisible());
    this.featureLayers = featureLayers;
    this.map = map;
    this.view = map.getView();
    this.overviewSwitcher = new OverviewSwitcher(map, baseLayers);
  }

  initialize(target, overviewMapTarget, options) {
    this.map.setTarget(target);
    return this.setCenter(options.center, options.zoom).then(() => {
      this.overviewSwitcher.initialize(overviewMapTarget, {
        center: this.view.getCenter(),
        zoom: 12,
      });
    });
  }

  addListener(type, listener, once = false) {
    return once ? this.map.once(type, listener) : this.map.on(type, listener);
  }

  addFeatureListener(type, callback, noFeatureCallback?, onlyLayer?, debounceTime?: number) {
    const map = this.map;
    let listener = event => {
      const options = {
        layerFilter: onlyLayer ? layer => layer === onlyLayer : undefined,
      };

      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature, layer) => {
          callback(feature, layer, event);
          return feature;
        },
        options
      );

      if (!feature && noFeatureCallback) {
        noFeatureCallback(event);
      }
    };
    if (debounceTime) {
      listener = debounce(listener, debounceTime);
    }
    return map.on(type, listener);
  }

  getCoordinateFromPixel(pixel, native = true) {
    let coordinate = this.map.getCoordinateFromPixel(pixel);
    if (!native) {
      coordinate = transform(coordinate);
    }
    return coordinate;
  }

  getPixelFromFeature(feature) {
    const coordinates = feature.getGeometry().getCoordinates();
    const pixel = this.map.getPixelFromCoordinate(coordinates);
    return pixel;
  }

  getResolution() {
    return this.view.getResolution();
  }

  getSize() {
    return this.map.getSize();
  }

  /* Center */

  getCenter(native = true) {
    let center = this.view.getCenter();
    if (!native) {
      center = transform(center);
    }
    return center;
  }

  setCenter(
    center,
    zoom = undefined,
    native = true,
    duration = ANIMATION_DURATION,
    bypassIfVisible = false
  ) {
    if (!native) {
      center = transform(center, true);
    }

    const bypass = bypassIfVisible && containsCoordinate(this.getExtent(), center);
    const doZoom = typeof zoom !== 'undefined';

    return new Promise((resolve, reject) => {
      if (bypass) {
        return resolve(this);
      }

      if (duration && duration > 0) {
        const options = { center, duration, zoom: doZoom ? zoom : undefined };
        const callback = completed => (completed ? resolve(this) : reject(this));
        this.view.animate(options, callback);
      } else {
        this.view.setCenter(center);
        if (doZoom) {
          this.view.setZoom(zoom);
        }
        resolve(this);
      }
    });
  }

  /* Extent */

  getExtent(native = true) {
    let extent = this.view.calculateExtent(this.getSize());
    if (!native) {
      extent = transformExtent(extent);
    }
    return extent;
  }

  fitExtent(
    newExtent,
    native = true,
    options: any = {},
    duration = ANIMATION_DURATION,
    bypassIfVisible = false
  ) {
    if (!native) {
      newExtent = transformExtent(newExtent, true);
    }

    const bypass = bypassIfVisible && containsExtent(this.getExtent(), newExtent);

    return new Promise((resolve, reject) => {
      if (bypass) {
        return resolve(this);
      }

      if (duration && duration > 0) {
        options.callback = completed => {
          setTimeout(() => (completed ? resolve(this) : reject(this)), 500);
        };
        options.duration = duration;
        this.view.fit(newExtent, options);
      } else {
        this.view.fit(newExtent, options);
        resolve(this);
      }
    });
  }

  /* Layers */

  makeBaseLayer(name, label, shortLabel = null, visible = false) {
    shortLabel = shortLabel || label;
    const source = new XYZSource({
      url: `https://api.mapbox.com/styles/v1/${name}/tiles/256/{z}/{x}/{y}?access_token=${MAPBOX_ACCESS_TOKEN}`,
    });
    return new TileLayer({ label, shortLabel, source, visible });
  }

  makeOSMLayer(label = 'OpenStreetMap', shortLabel = 'OSM', visible = false) {
    const source = new OSMSource();
    return new TileLayer({ label, shortLabel, source, visible });
  }

  makeDebugLayer(label, shortLabel, visible = false) {
    const osmSource = new OSMSource();
    const source = new TileDebugSource({
      projection: osmSource.getProjection(),
      tileGrid: osmSource.getTileGrid(),
    });
    shortLabel = shortLabel || label;
    return new TileLayer({ label, shortLabel, source, visible });
  }

  makeFeatureLayer(label, path, options: any = {}) {
    const url = `${API_URL}/${path}`;
    const baseParams = 'format=geojson';
    const source = new VectorSource({
      format: new GeoJSONFormat(),
      strategy: bboxLoadingStrategy,
      url: extent => {
        const bbox = transformExtent(extent).join(',');
        return `${url}?${baseParams}&bbox=${bbox}`;
      },
    });
    options.maxResolution = options.maxResolution || FEATURE_LAYER_MAX_RESOLUTION;
    options.projection = options.projection || GEOGRAPHIC_PROJECTION;
    return new VectorLayer({ label, source, ...options });
  }

  setBaseLayer(newLayer) {
    const baseLayers = this.baseLayers;
    const numBaseLayers = baseLayers.length;

    if (typeof newLayer === 'string') {
      newLayer = baseLayers.find(layer => layer.get('label') === newLayer);
    }

    let nextLayerIndex = 0;
    baseLayers.forEach((layer, i) => {
      layer.setVisible(false);
      if (layer === newLayer) {
        nextLayerIndex = (i + 1) % numBaseLayers;
      }
    });

    this.overviewSwitcher.setBaseLayerByIndex(nextLayerIndex);

    this.baseLayer = newLayer;
    this.baseLayer.setVisible(true);
  }

  getFeatureLayer(label) {
    return this.featureLayers.find(layer => layer.get('label') === label);
  }

  /* Zoom */

  getZoom() {
    return this.view.getZoom();
  }

  setZoom(zoom, duration = ANIMATION_DURATION) {
    return new Promise((resolve, reject) => {
      if (duration && duration > 0) {
        const options = { zoom, duration };
        this.view.animate(options, completed => (completed ? resolve(this) : reject(this)));
      } else {
        this.view.setZoom(zoom);
        resolve(this);
      }
    });
  }

  zoomIn() {
    return this.setZoom(this.getZoom() + 1);
  }

  zoomOut() {
    return this.setZoom(this.getZoom() - 1);
  }

  /* Geolocation */

  get geolocator() {
    if (!this._geolocator) {
      this._geolocator = new Geolocation({
        projection: this.view.getProjection(),
        tracking: true,
        trackingOptions: {
          maximumAge: 2 * 1000,
          enableHighAccuracy: true,
          timeout: 30 * 1000,
        },
      });
    }

    return this._geolocator;
  }
}
