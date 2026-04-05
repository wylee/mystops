import { css, html } from "lit-element";
import { customElement, property } from "lit/decorators.js";

import { STREET_LEVEL_ZOOM } from "../const";
import MapService from "../services/map-service";
import MyStopsElement from "../element";

interface State {
  x: number;
  y: number;
  open: boolean;
}

@customElement("mystops-map-context-menu")
class MapContextMenuElement extends MyStopsElement {
  static get styles() {
    return [
      MyStopsElement.styles,

      css`
        ul {
          position: absolute;
          z-index: 13;

          margin: 0;
          padding: 0;

          animation: fade-in 0.5s;
          background-color: white;
          border-radius: 2px;
          box-shadow: 2px 2px 4px;
          list-style: none;

          & > li {
            padding: var(--half-standard-spacing);

            &:hover {
              background-color: #f8f8f8;
              color: var(--link-color-hover);
              cursor: pointer;
            }
          }
        }
      `,
    ];
  }

  @property() public map: MapService;
  @property() public state: State;

  getCoord() {
    const map = this.map;
    const { x, y } = this.state;
    return map.getCoordinateFromPixel([x, y]);
  }

  getStyle() {
    const { x, y, open } = this.state;

    if (!open) {
      return `display: none; top: auto; right: auto; bottom: auto; left: auto;`;
    }

    const [containerWidth, containerHeight] = this.map.getSize();
    const threshold = 200;

    let top = `${y}px`;
    let right = "auto";
    let bottom = "auto";
    let left = `${x}px`;

    if (containerWidth - x < threshold) {
      left = "auto";
      right = `${containerWidth - x}px`;
    }

    if (containerHeight - y < threshold) {
      top = "auto";
      bottom = `${containerHeight - y}px`;
    }

    return `display: block; top: ${top}; right: ${right}; bottom: ${bottom}; left: ${left};`;
  }

  setCenter(event: Event) {
    event.preventDefault();
    this.map.setCenter(this.getCoord());
  }

  setCenterAndZoom(event: Event) {
    event.preventDefault();
    const map = this.map;
    const coord = this.getCoord();
    if (map.getZoom() > STREET_LEVEL_ZOOM) {
      map.setCenter(coord);
    } else {
      map.setCenterAndZoom(coord, STREET_LEVEL_ZOOM);
    }
  }

  clickListener = () => (this.state = { x: 0, y: 0, open: false });
  boundClickListener = this.clickListener.bind(this);

  firstUpdated() {
    // Close the menu on any click.
    document.addEventListener("click", this.boundClickListener);
    document.addEventListener("contextmenu", this.boundClickListener);
  }

  disconnectedCallback() {
    document.removeEventListener("click", this.boundClickListener);
    document.removeEventListener("contextmenu", this.boundClickListener);
  }

  render() {
    const style = this.getStyle();
    return html`
      <ul style="${style}">
        <li @click="${this.setCenter.bind(this)}">Center map here</li>
        <li @click="${this.setCenterAndZoom.bind(this)}">Zoom in here</li>
      </ul>
    `;
  }
}
