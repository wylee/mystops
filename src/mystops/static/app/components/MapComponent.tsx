import { useContext, useEffect, useRef, useState } from "react";
import styled from "styled-components";

import {
  FaGlobe,
  FaLocationArrow,
  FaMap,
  FaMinus,
  FaPlus,
} from "react-icons/fa";

import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import { MAPBOX_WORDMARK_IMAGE_DATA, STREET_LEVEL_ZOOM } from "../const";
import { useStateContext } from "../state";

import IconButton from "./IconButton";
import MapContext from "./MapContext";
import MapContextMenu from "./MapContextMenu";
import MapService from "./MapService";
import { STOP_STYLE_SELECTED } from "./map-styles";

const MapContainer = styled.div<{
  width: string;
  height: string;
}>`
  width: ${({ width }) => width};
  height: ${({ height }) => height};
  user-select: none;
  background-color: #c6d7e3;

  > .controls {
    position: absolute;
    z-index: 1;
  }
`;

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  z-index: 1;
  > * {
    border-radius: 2px;
    box-shadow: 1px 1px 2px;
    margin: var(--quarter-standard-spacing) 0 0;
  }
`;

const ControlsBL = styled(Controls)`
  bottom: var(--quarter-standard-spacing);
  left: var(--quarter-standard-spacing);
  @media (min-width: 600px) {
    bottom: var(--half-standard-spacing);
    left: var(--half-standard-spacing);
  }
`;

const ControlsBR = styled(Controls)`
  bottom: var(--quarter-standard-spacing);
  right: var(--quarter-standard-spacing);
  @media (min-width: 600px) {
    bottom: var(--half-standard-spacing);
    right: var(--half-standard-spacing);
    .base-layer-control {
      display: none;
    }
  }
`;

const MapboxWordmark = styled.a`
  display: flex;
  align-items: center;
  box-shadow: none;
  padding: var(--quarter-standard-spacing);
`;

const OverviewMapContainer = styled.div`
  display: none;
  width: 128px;
  height: 128px;
  z-index: 1;
  background-color: white;
  border: 1px solid #f0f0f0;
  border-radius: 2px;
  box-shadow: 1px 1px 2px;
  cursor: pointer;

  @media (min-width: 600px) {
    display: block;
  }

  > .label {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 1;
    padding: var(--quarter-standard-spacing) 0;
    background-color: rgba(255, 255, 255, 0.75);
    font-weight: bold;
    line-height: 1;
    text-align: center;
  }
`;

const Attributions = styled.div`
  position: absolute;
  z-index: 1;
  bottom: var(--half-standard-spacing);
  right: calc(var(--half-standard-spacing) + 40px);

  display: none;
  flex-direction: row;
  align-items: center;

  background-color: white;
  border-radius: 2px;
  box-shadow: 1px 1px 2px;

  line-height: 1;
  padding: var(--half-standard-spacing) var(--quarter-standard-spacing);
  white-space: nowrap;

  .mapbox-improve a {
    font-weight: bold;
  }

  > div {
    display: inline-block;
    margin-right: var(--quarter-standard-spacing);
    &:last-child {
      margin-right: 0;
    }
  }

  @media (min-width: 600px) {
    display: flex;
  }
`;

interface Props {
  width?: string;
  height?: string;
}

export default function MapComponent({
  width = "100%",
  height = "100%",
}: Props) {
  const { state, dispatch } = useStateContext();

  const map = useContext(MapContext);
  const mapRef = useRef(null);
  const overviewMapRef = useRef(null);

  // Map context menu state.
  const [menuState, setMenuState] = useState({ x: 0, y: 0, open: false });

  // Info for stop feature mouse is hovering over, if any.
  const [stopInfo, setStopInfo] = useState<StopInfo | null>(null);

  // Map context menu controls.
  const openMenu = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setMenuState({ x: event.pageX, y: event.pageY, open: true });
  };
  const closeMenu = (event) => {
    event.stopPropagation();
    setMenuState({ x: 0, y: 0, open: false });
  };

  // Map controls.
  const zoomIn = () => map?.zoomIn();
  const zoomOut = () => map?.zoomOut();
  const nextBaseLayer = () => map?.nextBaseLayer();
  const setInitialCenterAndZoom = () => map?.setInitialCenterAndZoom();
  const zoomToUserLocation = () => {
    if (map) {
      const userLocation = map.getUserLocation();
      if (userLocation.position) {
        map.showUserLocation(/*zoomTo*/ true);
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: {
            title: "Location Error",
            explanation: "Could not determine your location.",
            detail: "Check your browser location settings and try again.",
          },
        });
      }
    }
  };

  // Set up map and map listeners.
  useEffect(() => {
    if (!(map && mapRef.current && overviewMapRef.current)) {
      return;
    }

    const stopsLayer = map.getLayer("Stops") as VectorLayer<VectorSource>;

    map.setTarget(mapRef.current, overviewMapRef.current);
    map.startTracking();

    map.onFeature(
      "click",
      (map, feature) => {
        dispatch({ type: "TOGGLE_STOP", payload: feature.get("id") });
        dispatch({ type: "DO_ARRIVALS_QUERY", payload: true });
      },
      () => dispatch({ type: "RESET" }),
      stopsLayer,
    );

    map.onFeature(
      "pointermove",
      (map, feature, px) => setStopInfo(getStopInfo(map, feature, px)),
      () => setStopInfo(null),
      map.getLayer("Stops"),
      10,
    );

    map.on("contextmenu", () => setStopInfo(null));

    // Initial zoom to user location.
    map.addGeolocatorListener(
      "change",
      () => map.showUserLocation(/* zoomTo */ true),
      /* once */ true,
    );

    // Subsequent changes to user location.
    map.addGeolocatorListener("change", () => map.showUserLocation());

    map.addGeolocatorListener(
      "error",
      (error) => {
        let explanation;
        let detail;

        switch (error.code) {
          case 1: // GeolocationPositionError.PERMISSION_DENIED
            explanation =
              "Access to location services have been disabled for this site.";
            detail = "Check your browser location settings and try again.";
            break;
          case 3: // GeolocationPositionError.TIMEOUT
            // NOTE: If a position has been set, then presumably there's
            //       not actually a timeout error. I think this only
            //       happens on desktop because there's no sensor and
            //       therefore tracking isn't possible.
            if (map.getUserLocation().position) {
              return;
            }
            explanation = "Could not find your location after 30 seconds.";
            break;
          default: // GeolocationPositionError.POSITION_UNAVAILABLE (or other)
            explanation = "Could not determine your location.";
        }

        dispatch({
          type: "SET_ERROR",
          payload: {
            title: "Location Error",
            explanation,
            detail,
          },
        });
      },
      /*once */ true,
    );
  }, [dispatch, map]);

  // Highlight selected stops.
  useEffect(() => {
    if (!(map && mapRef.current)) {
      return;
    }

    if (!(state.selectedStops.length || state.deselectedStops.length)) {
      return;
    }

    const stopsLayer = map.getLayer("Stops") as VectorLayer<VectorSource>;
    const stopsSource = stopsLayer.getSource() as VectorSource;

    if (state.deselectedStops.length) {
      state.deselectedStops.forEach((stop: any) => {
        const feature = stopsSource.getFeatureById(`stop.${stop.id}`);
        if (feature) {
          feature.setStyle(undefined);
        }
      });
    }

    if (state.selectedStops?.length) {
      const newExtent = map.extentOf(state.selectedStops, true);
      const setStyle = () => {
        state.selectedStops.forEach((stop: any) => {
          const feature = stopsSource.getFeatureById(`stop.${stop.id}`);
          if (feature) {
            feature.setStyle(STOP_STYLE_SELECTED);
          }
        });
      };
      if (!map.containsExtent(newExtent) || map.getZoom() < STREET_LEVEL_ZOOM) {
        map.setExtent(newExtent, () => map.once("rendercomplete", setStyle));
      } else {
        setStyle();
      }
    }
  }, [map, state.selectedStops, state.deselectedStops]);

  return (
    <MapContainer
      id="map"
      ref={mapRef}
      width={width}
      height={height}
      onContextMenu={openMenu}
    >
      <MapContextMenu state={menuState} setState={setMenuState} />

      <ControlsBL>
        <MapboxWordmark
          onContextMenu={closeMenu}
          href="https://www.mapbox.com/about/maps/"
          title="Map tiles and styling provided by Mapbox"
        >
          <img src={MAPBOX_WORDMARK_IMAGE_DATA} height="18px" alt="Mapbox" />
        </MapboxWordmark>

        <OverviewMapContainer
          ref={overviewMapRef}
          title="Change base map"
          onClick={() => map?.nextBaseLayer()}
          onContextMenu={closeMenu}
        >
          <div className="label">
            {map?.getNextBaseLayer().get("shortLabel")}
          </div>
        </OverviewMapContainer>
      </ControlsBL>

      <Attributions onContextMenu={closeMenu}>
        <div className="mapbox-copyright">
          © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>
        </div>

        <div className="osm-copyright">
          © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
        </div>

        <div className="mapbox-improve">
          <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>
        </div>
      </Attributions>

      <ControlsBR>
        <IconButton
          title="Find my location"
          onClick={zoomToUserLocation}
          onContextMenu={closeMenu}
        >
          <FaLocationArrow />
        </IconButton>

        <IconButton
          title="Zoom to full extent"
          onClick={setInitialCenterAndZoom}
        >
          <FaGlobe />
        </IconButton>

        <IconButton
          type="button"
          title="Zoom in"
          onClick={zoomIn}
          onContextMenu={closeMenu}
        >
          <FaPlus />
        </IconButton>

        <IconButton
          type="button"
          title="Zoom out"
          onClick={zoomOut}
          onContextMenu={closeMenu}
        >
          <FaMinus />
        </IconButton>

        <IconButton
          type="button"
          title="Change base map"
          className="base-layer-control"
          onClick={nextBaseLayer}
          onContextMenu={closeMenu}
        >
          <FaMap />
        </IconButton>
      </ControlsBR>

      {stopInfo ? (
        <StopInfo id="stop-info" style={{ ...stopInfo.position }}>
          <div className="stop-info-title">Stop {stopInfo.id}</div>
          <div>{stopInfo.name}</div>
          <div>{stopInfo.direction}</div>
          <div>Routes: {stopInfo.routes}</div>
        </StopInfo>
      ) : null}
    </MapContainer>
  );
}

const StopInfo = styled.div`
  position: absolute;
  z-index: 40;

  padding: var(--quarter-standard-spacing);

  color: #084c8d;
  background-color: white;
  box-shadow: 2px 2px 4px 2px #084c8d;

  animation: fade-in 0.5s;

  > * {
    line-height: 1.2;
  }

  > .stop-info-title {
    font-size: 110%;
    font-weight: bold;
    margin-bottom: var(--quarter-standard-spacing);
  }
`;

interface StopInfo {
  id: number;
  name: string;
  direction: string | null;
  routes: Array<any>;
  position: Position;
}

interface Position {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

function getStopInfo(
  map: MapService,
  feature: Feature,
  pixel: number[],
): StopInfo {
  const [width, height] = map.getSize();
  const [x, y] = [width / 2, height / 2];
  const buffer = 10;
  const properties = feature.getProperties();

  let left: any = pixel[0];
  let top: any = pixel[1];
  let right: any = "auto";
  let bottom: any = "auto";

  if (left > x) {
    [left, right] = ["auto", width - left];
  }

  if (top > y) {
    [top, bottom] = ["auto", height - top];
  }

  [top, right, bottom, left] = [top, right, bottom, left].map((value) => {
    return value === "auto" ? value : `${value + buffer}px`;
  });

  return {
    id: properties.id,
    name: properties.name,
    direction: properties.direction || "N/A",
    routes: properties.routes || "N/A",
    position: { top, right, bottom, left },
  };
}
