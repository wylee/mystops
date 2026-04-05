import { css, html } from "lit-element";
import { customElement, property } from "lit/decorators.js";
import { consume } from "@lit/context";

import MyStopsElement from "../element";
import { appStateContext } from "../context";
import { AppState, Arrival, Route, Stop } from "../interfaces";

@customElement("mystops-result")
class ResultElement extends MyStopsElement {
  static get styles() {
    return [
      MyStopsElement.styles,

      css`
        #result {
          animation: fade-in 0.5s;
          max-height: 400px;
          overflow-x: hidden;

          ul {
            list-style: none;
            margin: 0;
            padding-left: 0;
          }
        }

        ul#stops {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          z-index: 20;

          background-color: white;
          box-shadow: 2px 2px 4px;
          padding-top: calc(40px + var(--half-standard-spacing));

          @media (min-width: 600px) {
            padding-top: calc(40px + var(--twice-standard-spacing));
            right: auto;
            width: var(--panel-width);
          }
        }

        #stops > li {
          > .heading {
            background-color: #e0e0e0;
            border-top: 1px solid #a0a0a0;
            border-bottom: 1px solid #a0a0a0;
            font-size: 105%;
            font-weight: bold;
            padding: var(--half-standard-spacing) var(--standard-spacing);
          }
        }

        .updated-at {
          border-top: 1px solid var(--menu-item-border-color);
          padding: var(--half-standard-spacing) var(--standard-spacing);
          text-align: right;
        }

        #routes > li {
          border-bottom: 1px solid var(--menu-item-border-color);
          padding: var(--half-standard-spacing) var(--standard-spacing);
          &:last-child {
            border-bottom: none;
          }
          > .heading {
            font-weight: bold;
          }
        }

        #arrivals > li {
          display: flex;
          flex-direction: row;
          padding: var(--quarter-standard-spacing) 0;
          > div {
            flex: 50%;
          }
          &.designation-red,
          &.designation-orange,
          &.designation-yellow {
            padding-left: 2px;
            padding-right: 2px;
            border-radius: 2px;
          }
          &.designation-red {
            background-color: rgb(252, 192, 192);
          }
          &.designation-orange {
            background-color: rgb(253, 192, 124);
          }
          &.designation-yellow {
            background-color: rgb(252, 252, 124);
          }
        }
      `,
    ];
  }

  @consume({ context: appStateContext, subscribe: true })
  @property({ attribute: false })
  public appState?: AppState;

  milesAway(arrival: Arrival) {
    const { distanceAway } = arrival;
    const { miles, feet } = distanceAway;
    if (!miles) {
      return "N/A";
    }
    if (feet <= 300) {
      const unit = feet === 1 ? "foot" : "feet";
      return `${Math.round(feet).toFixed(1)} ${unit} away`;
    }
    const ess = miles === 1 ? "" : "s";
    return `${miles.toFixed(1)} mile${ess} away`;
  }

  kilometersAway(arrival: Arrival) {
    const { distanceAway } = arrival;
    const { kilometers, meters } = distanceAway;
    if (!kilometers) {
      return "N/A";
    }
    if (meters <= 100) {
      return `${Math.round(meters).toFixed(0)} m away`;
    }
    return `${kilometers.toFixed(1)} km away`;
  }

  render() {
    const result = this.appState?.result;

    if (!result) {
      return null;
    }

    return html`
      <div id="result">
        <ul id="stops">
          <li class="updated-at">Updated at ${result.updateTime}</li>

          ${result.stops.map(
            (stop: Stop) => html`
              <li class="stop">
                <div class="heading">Stop ${stop.id}</div>

                <ul id="routes">
                  ${stop.routes.map(
                    (route: Route) => html`
                      <li class="route">
                        <div class="heading">${route.name}</div>

                        <ul id="arrivals">
                          ${route.arrivals.map(
                            (arrival: Arrival) => html`
                              <li
                                class="${`designation-${arrival.designation || "none"}`}"
                              >
                                <div>${arrival.status}</div>
                                <div title="${this.kilometersAway(arrival)}">
                                  ${this.milesAway(arrival)}
                                </div>
                              </li>
                            `,
                          )}
                        </ul>
                      </li>
                    `,
                  )}
                </ul>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }
}
