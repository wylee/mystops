import { css, html, LitElement } from "lit-element";
import { customElement, property, query, state } from "lit/decorators.js";

import { MAPBOX_WORDMARK_IMAGE_DATA } from "../const";
import { getStyleSheet } from "../style";
import MapService from "../services/map-service";
import "./map-context-menu";

interface MenuState {
  x: number;
  y: number;
  open: boolean;
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

  @property() public map: MapService;

  @query("#map") private mapEl!: HTMLDivElement;
  @query("#overview-map-container") private overviewMapEl!: HTMLDivElement;

  @state() private menuState: MenuState = { x: 0, y: 0, open: false };

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

  firstUpdated() {
    this.map.setTarget(this.mapEl, this.overviewMapEl);
    this.map.startTracking();
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
          <icon-button icon="crosshair"></icon-button>
          <icon-button icon="globe"></icon-button>
          <icon-button icon="zoom-out"></icon-button>
          <icon-button icon="zoom-in"></icon-button>
        </div>
        
        <mystops-map-context-menu
          .map="${this.map}"
          .state="${this.menuState}"
        ></mystops-map-context-menu.>
      </div>
    `;
  }
}
