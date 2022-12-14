import styled from "styled-components";

import { useStateContext } from "../state";

const Container = styled.div`
  animation: fade-in 0.5s;
  max-height: 400px;
  overflow-x: hidden;

  ul {
    list-style: none;
    margin: 0;
    padding-left: 0;
  }
`;

const UpdateTime = styled.li`
  border-top: 1px solid var(--menu-item-border-color);
  padding: var(--half-standard-spacing) var(--standard-spacing);
  text-align: right;
`;

const Stops = styled.ul`
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
`;

const Stop = styled.li`
  > .heading {
    background-color: #e0e0e0;
    border-top: 1px solid #a0a0a0;
    border-bottom: 1px solid #a0a0a0;
    font-size: 105%;
    font-weight: bold;
    padding: var(--half-standard-spacing) var(--standard-spacing);
  }
`;

const Route = styled.li`
  border-bottom: 1px solid var(--menu-item-border-color);
  padding: var(--half-standard-spacing) var(--standard-spacing);
  &:last-child {
    border-bottom: none;
  }
  > .heading {
    font-weight: bold;
  }
`;

const Arrival = styled.li`
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
`;

export default function ResultComponent() {
  const { state } = useStateContext();
  const { result } = state;

  if (!result) {
    return null;
  }

  return (
    <Container id="result">
      <Stops id="stops">
        <UpdateTime>Updated at {result.updateTime}</UpdateTime>

        {result.stops.map((stop) => {
          return (
            <Stop key={stop.id} className="stop">
              <div className="heading">Stop {stop.id}</div>

              <ul id="routes">
                {stop.routes.map((route) => {
                  return (
                    <Route key={route.id} className="route">
                      <div className="heading">{route.name}</div>

                      <ul id="arrivals">
                        {route.arrivals.map((arrival, i) => {
                          return (
                            <Arrival
                              key={i}
                              className={`designation-${
                                arrival.designation || "none"
                              }`}
                            >
                              <div>{arrival.status}</div>
                              <div title={kilometersAway(arrival)}>
                                {milesAway(arrival)}
                              </div>
                            </Arrival>
                          );
                        })}
                      </ul>
                    </Route>
                  );
                })}
              </ul>
            </Stop>
          );
        })}
      </Stops>
    </Container>
  );
}

function milesAway(arrival: any) {
  const {
    distanceAway: { miles, feet },
  } = arrival;
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

function kilometersAway(arrival: any) {
  const {
    distanceAway: { kilometers, meters },
  } = arrival;
  if (!kilometers) {
    return "N/A";
  }
  if (meters <= 100) {
    return `${Math.round(meters).toFixed(0)} m away`;
  }
  return `${kilometers.toFixed(1)} km away`;
}
