import { ARRIVALS_URL, REFRESH_INTERVAL } from "../const";
import { termToStopIds } from "../utils";

export default class ArrivalsService {
  async query(term: string) {
    let stops: number[];

    try {
      stops = termToStopIds(term);
    } catch (err: any) {
      throw {
        title: err.name,
        explanation: err.message,
        detail: err.detail,
      };
    }

    const url = `${ARRIVALS_URL}?q=${stops.join(",")}`;
    const response = await fetch(url);

    if (!response.ok) {
      let title = "Error";
      let explanation = "An error occurred.";
      let detail = "Please try again later.";

      let data: any;
      try {
        data = await response.json();
      } catch {
        data = undefined;
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

    const result = await response.json();

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
