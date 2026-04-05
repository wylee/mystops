import { css, html } from "lit-element";
import { customElement, property, state } from "lit/decorators.js";
import { consume } from "@lit/context";

import MyStopsElement from "../element";
import { appStateContext } from "../context";
import { AppState } from "../interfaces";

@customElement("mystops-search")
class ResultElement extends MyStopsElement {
  static get styles() {
    return [
      MyStopsElement.styles,

      css`
        #search {
          position: absolute;
          width: var(--panel-width);
          z-index: 30;

          @media (max-width: 599px) {
            width: 100%;
          }
        }

        #search form {
          display: flex;
          flex-direction: row;
          align-items: center;

          position: absolute;
          top: var(--quarter-standard-spacing);
          left: var(--quarter-standard-spacing);
          right: var(--quarter-standard-spacing);
          width: auto;
          z-index: 10;

          margin: 0;
          padding: 0;

          background-color: white;
          border: 1px solid #f0f0f0;
          border-radius: 2px;
          box-shadow: 1px 1px 2px;

          @media (min-width: 600px) {
            top: var(--standard-spacing);
            left: var(--standard-spacing);
            right: auto;
            width: calc(var(--panel-width) - var(--twice-standard-spacing));
          }

          input {
            border: none;
            flex: 1;
            font-size: 14px;
            line-height: 22px;
            height: 40px;
            min-width: 10em;
            outline: 0;
            margin: 0;
            padding: 0 var(--quarter-standard-spacing) 0
              calc(32px + var(--half-standard-spacing));

            @media (min-width: 600px) {
              font-size: 16px;
            }
          }

          span {
            color: gray;
            font-size: 22px;
            line-height: 1;
            margin: 4px 0;
          }
        }
      `,
    ];
  }

  @consume({ context: appStateContext, subscribe: true })
  @property({ attribute: false })
  public appState: AppState;

  handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    const term = target.value;
    if (term) {
      this.dispatch("set-term", term);
    } else {
      this.dispatch("reset");
    }
  }

  handleSubmit(event: Event) {
    console.log("submit");
    event.preventDefault();
    this.dispatch("query-arrivals");
  }

  handleReset() {
    this.dispatch("reset");
  }

  render() {
    const { term, error } = this.appState;

    return html`
      <div id="search">
        <form @submit="${this.handleSubmit}">
          <input
            name="term"
            type="text"
            title="Enter a stop ID"
            placeholder="Enter a stop ID"
            autofocus
            .value="${term}"
            @input="${this.handleInput}"
          />

          <button
            type="submit"
            title="Search"
            class="icon-button"
            .disabled="${!term.trim()}"
          >
            <i class="bi bi-search"></i>
          </button>

          <button
            type="reset"
            title="Clear"
            class="icon-button"
            .disabled="${!(term || error)}"
            @click="${this.handleReset}"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </form>
      </div>
    `;
  }
}
