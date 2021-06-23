import { useAppSelector } from "../hooks";

import { selectResult } from "./slice";

const Result = () => {
  const result = useAppSelector(selectResult);

  return result.count ? (
    <ul className="stops">
      <li className="updateTime">Updated at {result.updateTime}</li>
      {result.stops.map((stop) => (
        <Stop key={stop.id} stop={stop} />
      ))}
    </ul>
  ) : null;
};

export default Result;

const Stop = ({ stop }) => {
  return (
    <li className="stop">
      <div className="heading">Stop {stop.id}</div>
      <ul className="routes">
        {stop.routes.map((route) => {
          return <Route key={route.id} route={route} />;
        })}
      </ul>
    </li>
  );
};

const Route = ({ route }) => {
  return (
    <li className="route">
      <div className="heading">{route.name}</div>

      <ul className="arrivals">
        {route.arrivals.map((arrival, i) => (
          <Arrival key={i} arrival={arrival} />
        ))}
      </ul>
    </li>
  );
};

const Arrival = ({ arrival }) => {
  const {
    status,
    distanceAway: { miles },
  } = arrival;
  const milesEss = miles === 1 ? "" : "s";
  return (
    <li className="arrival">
      <div>{status}</div>
      <div>{miles ? `${miles.toFixed(1)} mile${milesEss} away` : "-"}</div>
    </li>
  );
};
