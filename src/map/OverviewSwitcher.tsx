import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';

export default class OverviewSwitcher {
  map: Map;
  view: View;
  mainMap: Map;
  baseLayers: Array<any>;
  baseLayer: any;

  constructor(mainMap, baseLayers) {
    this.mainMap = mainMap;

    let visible = false;
    this.baseLayers = baseLayers.map(layer => {
      const newLayer = new TileLayer({
        label: layer.get('label'),
        shortLabel: layer.get('shortLabel'),
        visible: visible,
        source: layer.getSource(),
      });
      visible = layer.getVisible();
      return newLayer;
    });
    if (visible) {
      this.baseLayers[0].setVisible(true);
    }

    this.baseLayer = this.baseLayers.find(layer => layer.getVisible());

    this.map = new Map({
      controls: [],
      interactions: [],
      layers: this.baseLayers,
      view: new View(),
    });

    this.view = this.map.getView();
  }

  initialize(target, options) {
    const map = this.map;
    const view = this.view;
    const mainMapView = this.mainMap.getView();

    map.setTarget(target);
    view.setCenter(options.center);
    view.setZoom(options.zoom);

    mainMapView.on('change:center', event => {
      view.setCenter(mainMapView.getCenter());
    });
  }

  setBaseLayerByIndex(index) {
    for (let layer of this.baseLayers) {
      layer.setVisible(false);
    }
    this.baseLayer = this.baseLayers[index];
    this.baseLayer.setVisible(true);
  }
}
