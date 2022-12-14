/**
 * Split `term` into a list of sorted stop IDs.
 *
 * For example, if `term` is `"4, 2"`, the result will be `[2, 4]`.
 *
 * @param term A string of comma-separated stop IDs
 * @throws InvalidStopIdError If any of the stops isn't an int
 */
export function termToStopIds(term: string): number[] {
  const trimmed = term.replace(/^[ ,]+/, "").replace(/[ ,]+$/, "");
  if (!trimmed) {
    return [];
  }
  const items = trimmed.split(",");
  const stops: number[] = [];
  const bad: string[] = [];
  for (const item of items) {
    const stopID = parseInt(item.trim(), 10);
    if (isNaN(stopID)) {
      bad.push(item);
    } else if (stops.indexOf(stopID) === -1) {
      stops.push(stopID);
    }
  }
  if (bad.length) {
    throw new InvalidStopIdError(bad);
  }
  stops.sort((a, b) => a - b);
  return stops;
}

class InvalidStopIdError extends Error {
  name = "Bad Stop ID";
  stopIDs: string[];

  constructor(stopIDs: string[]) {
    const ess = stopIDs.length === 1 ? "" : "s";
    const verb = stopIDs.length === 1 ? "is" : "are";
    const string = stopIDs.join(", ");
    const message = `The following stop ID${ess} ${verb} not valid: ${string}`;
    super(message);
    this.stopIDs = stopIDs;
  }
}
