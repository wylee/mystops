import { css, html, LitElement } from "lit-element";
import { customElement, property, query, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import Feature from "ol/Feature";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";

import { getStyleSheet } from "../style";

import { MAPBOX_WORDMARK_IMAGE_DATA } from "../const";
import { appStateContext } from "../context";
import { AppState } from "../interfaces";

import ArrivalsService from "../services/arrivals-service";
import MapService from "../services/map-service";

import "./map-context-menu";

interface MenuState {
  x: number;
  y: number;
  open: boolean;
}

interface Position {
  top: string;
  right: string;
  bottom: string;
  left: string;
}

interface StopInfo {
  id: number;
  name: string;
  direction: string | null;
  routes: Array<any>;
  position: Position;
}

@customElement("mystops-map")
class MapElement extends LitElement {
  static styles = [
    getStyleSheet(document.styleSheets[0]),
    getStyleSheet(document.styleSheets[1]),
    getStyleSheet(document.styleSheets[2]),

    css`
      #map {
        width: 100%;
        height: 100%;
        user-select: none;
        background-color: #c6d7e3;

        > .controls {
          position: absolute;
          z-index: 1;
          display: flex;
          flex-direction: column;

          > * {
            border-radius: 2px;
            box-shadow: 1px 1px 2px;
            margin: var(--half-standard-spacing) 0 0;
          }
        }
      }

      #controls-bottom-left {
        bottom: var(--quarter-standard-spacing);
        left: var(--quarter-standard-spacing);

        @media (min-width: 600px) {
          bottom: var(--half-standard-spacing);
          left: var(--half-standard-spacing);
        }

        #mapbox-wordmark {
          display: flex;
          align-items: center;
          box-shadow: none;
          padding: var(--quarter-standard-spacing);
        }

        #overview-map-container {
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
        }
      }

      #controls-bottom-right {
        bottom: var(--quarter-standard-spacing);
        right: var(--quarter-standard-spacing);
        @media (min-width: 600px) {
          bottom: var(--half-standard-spacing);
          right: var(--half-standard-spacing);
          .base-layer-control {
            display: none;
          }
        }
      }

      #attributions {
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
      }
    `,
  ];

  @consume({ context: appStateContext })
  @property({ attribute: false })
  public appState?: AppState;

  @property() public arrivals: ArrivalsService;
  @property() public map: MapService;

  @query("#map") private mapEl!: HTMLDivElement;
  @query("#overview-map-container") private overviewMapEl!: HTMLDivElement;

  @state() private menuState: MenuState = { x: 0, y: 0, open: false };
  @state() private stopInfo?: StopInfo;

  openMenu(event: any) {
    event.preventDefault();
    event.stopPropagation();
    this.menuState = { x: event.pageX, y: event.pageY, open: true };
  }

  closeMenu(event: Event) {
    event.stopPropagation();
    this.menuState = { x: 0, y: 0, open: false };
  }

  nextBaseLayer() {
    this.map.nextBaseLayer();
  }

  get nextBaseLayerLabel() {
    return this.map.getNextBaseLayer().get("shortLabel");
  }

  locate() {
    const map = this.map;
    const userLocation = map.getUserLocation();
    if (userLocation.position) {
      map.showUserLocation(true);
    } else {
      // TODO: Handle error (could not determine location)
    }
  }

  zoomToFullExtent() {
    this.map.setInitialCenterAndZoom();
  }

  zoomIn() {
    this.map.zoomIn();
  }

  zoomOut() {
    this.map.zoomOut();
  }

  getStopInfo(feature: Feature, pixel: number[]): StopInfo {
    const map = this.map;
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

  firstUpdated() {
    const map = this.map;
    const stopsLayer = map.getLayer("Stops") as VectorLayer<VectorSource>;
    const stopsSource = stopsLayer.getSource() as VectorSource;

    map.setTarget(this.mapEl, this.overviewMapEl);
    map.startTracking();

    map.onFeature(
      "click",
      (_map, feature) => {
        console.log({ type: "TOGGLE_STOP", payload: feature.get("id") });
        console.log({ type: "DO_ARRIVALS_QUERY", payload: true });
      },
      () => console.log({ type: "RESET" }),
      stopsLayer,
    );

    map.onFeature(
      "pointermove",
      (_map, feature, px) => (this.stopInfo = this.getStopInfo(feature, px)),
      () => (this.stopInfo = undefined),
      stopsLayer,
      10,
    );

    map.on("contextmenu", () => (this.stopInfo = undefined));

    // Initial zoom to user location.
    map.addGeolocatorListener(
      "change",
      () => map.showUserLocation(/* zoomTo */ true),
      /* once */ true,
    );

    map.addGeolocatorListener(
      "error",
      (error) => {
        let explanation: string;
        let detail: string | undefined;

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

        console.log({
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
  }

  render() {
    return html`
      <div id="map" @contextmenu="${this.openMenu.bind(this)}">
        <div id="controls-bottom-left" class="controls">
          <a id="mapbox-wordmark" href="https://www.mapbox.com/about/maps/">
            <img
              src="${MAPBOX_WORDMARK_IMAGE_DATA}"
              height="18px"
              alt="Map tiles and styling provided by Mapbox"
            />
          </a>

          <div
            id="overview-map-container"
            aria-label="Change base map"
            @click="${this.nextBaseLayer.bind(this)}"
            @contextmenu="${this.closeMenu.bind(this)}"
          >
            <div class="label">${this.nextBaseLayerLabel}</div>
          </div>
        </div>

        <div id="attributions">
          <div class="mapbox-copyright">
            © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>
          </div>

          <div class="osm-copyright">
            © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
          </div>

          <div class="mapbox-improve">
            <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>
          </div>
        </div>

        <div id="controls-bottom-right" class="controls">
          <icon-button icon="crosshair" title="Find my location" @click="${this.locate.bind(this)}"></icon-button>
          <icon-button icon="globe" title="Zoom to full extent" @click="${this.zoomToFullExtent.bind(this)}"></icon-button>
          <icon-button icon="zoom-in" title="Zoom in" @click="${this.zoomIn.bind(this)}"></icon-button>
          <icon-button icon="zoom-out" title="Zoom out" @click="${this.zoomOut.bind(this)}"></icon-button>
        </div>
        
        <mystops-map-context-menu
          .map="${this.map}"
          .state="${this.menuState}"
        ></mystops-map-context-menu.>
      </div>
    `;
  }
}
