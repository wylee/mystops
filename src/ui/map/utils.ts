import { boundingExtent } from "ol/extent";
import { transform as _transform, transformExtent as _transformExtent } from "ol/proj";

import { GEOGRAPHIC_PROJECTION, NATIVE_PROJECTION } from "./const";

export function getExtentOfCoordinates(coordinates, native = true) {
  let extent = boundingExtent(coordinates);
  if (!native) {
    extent = transformExtent(extent, true);
  }
  return extent;
}

/* Transform */

/**
 * Transform native coordinate to geographic.
 */
export function transform(coordinate, reverse = false) {
  const { source, destination } = getTransformProjections(reverse);
  return _transform(coordinate, source, destination);
}

/**
 * Transform native extent to geographic.
 */
export function transformExtent(extent, reverse = false) {
  const { source, destination } = getTransformProjections(reverse);
  return _transformExtent(extent, source, destination);
}

function getTransformProjections(
  reverse = false,
  source = NATIVE_PROJECTION,
  destination = GEOGRAPHIC_PROJECTION
) {
  return reverse ? { source: destination, destination: source } : { source, destination };
}
