import Style from 'ol/style/Style';
import Circle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import RegularShape from 'ol/style/RegularShape';
import Stroke from 'ol/style/Stroke';

import { DEBUG } from './const';

/* Base */

export const STOP_STYLE = new Style({
  image: new Circle({
    radius: DEBUG ? 14 : 16,
    fill: new Fill({
      color: DEBUG ? 'white' : 'rgba(255, 255, 255, 0.05)',
    }),
    stroke: DEBUG ? new Stroke({ color: '#084c8d', width: 2 }) : undefined,
  }),
});

/* Selected */

export const STOP_STYLE_SELECTED = new Style({
  image: new RegularShape({
    points: 5,
    radius: 12,
    radius2: 5,
    fill: new Fill({
      color: 'white',
    }),
    stroke: new Stroke({
      color: 'red',
      width: 2,
    }),
  }),
});
