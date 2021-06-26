export function termToStopIDs(term, throwError = false): number[] {
  const trimmed = term.trim();
  if (!trimmed) {
    return [];
  }
  const items = trimmed.split(",");
  const stopIDs: number[] = [];
  for (let item of items) {
    const stopID = parseInt(item.trim(), 10);
    if (isNaN(stopID)) {
      if (throwError) {
        throw new Error(item);
      }
    } else if (stopIDs.indexOf(stopID) === -1) {
      stopIDs.push(stopID);
    }
  }
  stopIDs.sort((a, b) => a - b);
  return stopIDs;
}
