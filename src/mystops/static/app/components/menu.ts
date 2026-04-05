import { css, html } from "lit-element";
import { customElement, property, state } from "lit/decorators.js";
import MapService from "../services/map-service";
import MyStopsElement from "../element";

@customElement("mystops-menu")
class MenuElement extends MyStopsElement {
  static get styles() {
    return [
      MyStopsElement.styles,

      css`
        /* Container */
        #main-menu {
          position: absolute;
          top: 0;
          right: auto;
          bottom: 0;
          left: 0;
          z-index: 40;
        }

        #main-menu.open {
          right: 0;
        }

        #main-menu.closed {
          right: auto;
        }

        /* Toggle button */
        .icon-button.toggle-button {
          position: absolute;
          top: var(--quarter-standard-spacing);
          left: var(--quarter-standard-spacing);
          z-index: 3;

          @media (min-width: 600px) {
            top: var(--standard-spacing);
            left: var(--standard-spacing);
          }
        }

        /* Backdrop */
        #backdrop {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 1;
          animation: fade-in 0.5s;
          background-color: rgba(0, 0, 0, 0.25);
        }

        /* Menu Items */
        ul {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: var(--menu-width);
          overflow: auto;
          z-index: 2;

          margin: 0;
          padding-left: 0;

          animation: fade-in 0.5s;
          background-color: white;
          border-radius: 2px;
          box-shadow: 2px 2px 4px;
          list-style: none;

          & > li {
            border-bottom: 1px solid #e0e0e0;

            margin: 0;
            padding: 0;

            &:hover {
              background-color: #f8f8f8;
            }

            &:last-child {
              border-bottom: none;
            }

            /* Each menu item must contain a top level wrapper element */
            & > * {
              background-color: transparent;
              color: var(--text-color);

              border: none;

              display: flex;
              flex-direction: row;
              align-items: center;
              width: 100%;

              line-height: 24px;
              margin: 0;
              padding: var(--standard-spacing);
              text-decoration: none;

              & > * {
                margin-right: var(--half-standard-spacing);
                &:last-child {
                  margin-right: 0;
                }
              }
            }

            a {
              color: var(--link-color);
            }

            &.title {
              color: lighten(var(--text-color), 10%);
              font-size: 16px;
              font-weight: normal;
              line-height: 1;
              margin: 0;
              padding: var(--standard-spacing);
              text-shadow: 1px 1px 2px;

              a {
                color: lighten(var(--text-color), 10%);
                text-decoration: none;
              }

              @media (min-width: 600px) {
                font-size: 24px;
                padding: calc(var(--standard-spacing) + var(--half-standard-spacing))
                  var(--standard-spacing);
              }

              text-align: right;

              &:hover {
                background-color: white;
              }
            }

            &.section {
              font-weight: bold;
              background-color: #f0f0f0;
              &:hover {
                background-color: #f0f0f0;
              }
            }

            &.info {
              color: gray;
              font-size: 90%;
              font-style: italic;

              &:hover {
                background-color: white;
              }

              > * {
                flex-direction: column;
                align-items: flex-start;
                line-height: 1.25;
                > * {
                  margin: 0 0 var(--standard-spacing) 0;
                  &:last-child {
                    margin-bottom: 0;
                  }
                }
              }
            }
          }
        }
      `,
    ];
  }

  @property() public map: MapService;

  @state() private open: boolean = false;

  toggle() {
    this.open = !this.open;
  }

  close() {
    this.open = false;
  }

  makeSetBaseLayerHandler(layer: number) {
    return (event: Event) => {
      event.preventDefault();
      this.setBaseLayer(layer);
    };
  }

  setBaseLayer(layer: number) {
    this.map.setBaseLayer(layer);
    this.close();
  }

  render() {
    return html`
      <div id="main-menu" class="${this.open ? "open" : "closed"}">
        <button
          type="button"
          class="icon-button toggle-button"
          title="${this.open ? "Close menu" : "Open menu"}"
          @click="${this.toggle}"
        >
          <i class="bi bi-${this.open ? "x-lg" : "list"}"></i>
        </button>

        ${this.open
          ? html`
              <div id="backdrop" @click="${this.close}"></div>

              <ul>
                <li class="title">MyStops</li>

                <li class="section">
                  <span>Map Layers</span>
                </li>

                ${this.map.getBaseLayers().map((layer, i) => {
                  const icon = html`<i class="bi bi-map"></i>`;
                  const label = html`<span>${layer.get("label")}</span>`;

                  return html`
                    <li>
                      ${i === this.map.baseLayer
                        ? html`<div>${icon}${label}</div>`
                        : html`<button
                            type="button"
                            @click="${this.makeSetBaseLayerHandler(i)}"
                          >
                            ${icon}${label}
                          </button>`}
                    </li>
                  `;
                })}

                <li class="section">
                  <span>Links</span>
                </li>

                <li>
                  <a href="https://trimet.org/" class="regular-link">
                    <i class="bi bi-link"></i>
                    <span>TriMet</span>
                  </a>
                </li>

                <li class="section">
                  <span>Info</span>
                </li>

                <li class="info">
                  <div>
                    <p>
                      Arrival data provided by
                      <a href="https://developer.trimet.org/">TriMet</a>
                    </p>

                    <p>
                      Map data &copy; <a href="https://mapbox.com/">Mapbox</a> and
                      <a href="https://openstreetmap.org/">OpenStreetMap</a>
                    </p>

                    <p>
                      This application is currently in the initial stages of development
                      and <em>should not</em> be considered a reliable source for TriMet
                      arrival times or any other information. Arrival times and other
                      information <em>should</em> be verified via
                      <a href="https://trimet.org/">
                        TriMet's official TransitTracker™
                      </a>
                      or by other means.
                    </p>

                    <p>
                      Contact:
                      <a href="mailto:contact@mystops.io">contact@mystops.io</a>
                    </p>

                    <p>&copy; mystops.io</p>
                  </div>
                </li>
              </ul>
            `
          : null}
      </div>
    `;
  }
}
