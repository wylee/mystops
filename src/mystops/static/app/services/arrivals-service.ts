import { ARRIVALS_URL, REFRESH_INTERVAL } from "../const";
import MyStopsElement from "../element";
import { termToStopIds } from "../utils";
import { Result } from "../interfaces";

export default class ArrivalsService {
  private element: MyStopsElement;
  private intervalId?: number;

  constructor(element: MyStopsElement) {
    this.element = element;
  }

  reset() {
    clearInterval(this.intervalId);
  }

  start(term: string) {
    console.log("TERM:", term);
    this.reset();
    term = term.trim();
    if (term) {
      const handler = async () => {
        try {
          const result = await this.query(term);
          this.element.dispatch("set-result", result);
        } catch (err) {
          this.element.dispatch("set-error", err);
        }
      };
      handler().then(() => {
        this.intervalId = setInterval(handler, REFRESH_INTERVAL);
      });
    } else {
      this.element.dispatch("set-result", undefined);
    }
  }

  async query(term: string) {
    let stopIds: number[];

    try {
      stopIds = termToStopIds(term);
    } catch (err) {
      throw {
        title: err.name,
        explanation: err.message,
        detail: err.detail,
      };
    }

    const url = `${ARRIVALS_URL}?q=${stopIds.join(",")}`;

    let response: Response;

    try {
      response = await fetch(url);
    } catch (err) {
      throw {
        title: err.name,
        explanation: err.message,
        detail: err.detail,
      };
    }

    if (!response.ok) {
      let title = `Error (${response.status})`;
      let explanation = "An error occurred.";
      let detail = "Please try again later.";

      let data: any;
      try {
        data = await response.json();
      } catch (err) {
        data = {
          title: err.name,
          explanation: err.message,
          detail: err.detail,
        };
      }

      if (data) {
        if (data.title) {
          title = data.title;
        }
        if (data.explanation) {
          explanation = data.explanation;
        }
        if (data.detail) {
          detail = data.detail;
        }
      }

      throw { title, explanation, detail };
    }

    let result: Result;

    try {
      result = await response.json();
    } catch (err) {
      throw {
        title: err.name,
        explanation: err.message,
        detail: err.detail,
      };
    }

    if (!result?.count) {
      throw {
        title: "No Arrivals Found",
        explanation: "No arrivals were found for those stop IDs.",
        detail: "Please try again later.",
      };
    }

    return result;
  }
}
