import * as React from 'react';

interface IResultProps {
  result: any;
}

interface IStopProps {
  stop: any;
}

interface IRouteProps {
  route: any;
}

interface IArrivalProps {
  arrival: any;
}

export default class Result extends React.Component {
  props: IResultProps;

  render() {
    const { result } = this.props;

    return result.count ? (
      <ul className="stops">
        <li className="updateTime">Updated at {result.updateTime}</li>
        {result.stops.map(stop => (
          <Stop key={stop.id} stop={stop} />
        ))}
      </ul>
    ) : null;
  }
}

class Stop extends React.Component {
  props: IStopProps;

  render() {
    const { stop } = this.props;

    return (
      <li className="stop">
        <div className="heading">Stop {stop.id}</div>

        <ul className="routes">
          {stop.routes.map(route => {
            return <Route key={route.id} route={route} />;
          })}
        </ul>
      </li>
    );
  }
}

class Route extends React.Component {
  props: IRouteProps;

  render() {
    const { route } = this.props;

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
  }
}

class Arrival extends React.Component {
  props: IArrivalProps;

  render() {
    const {
      arrival: {
        status,
        distanceAway: { miles },
      },
    } = this.props;
    const milesEss = miles === 1 ? '' : 's';
    return (
      <li className="arrival">
        <div>{status}</div>
        <div>{miles ? `${miles.toFixed(1)} mile${milesEss} away` : '-'}</div>
      </li>
    );
  }
}
