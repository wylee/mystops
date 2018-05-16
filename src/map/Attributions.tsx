import * as React from 'react';

interface IProps {
  title?: string;
}

const Attributions = ({ title }: IProps) => {
  return (
    <div className="Attributions" onContextMenu={handleContextMenu}>
      {title ? <div>{title}</div> : null}

      <div className="mapbox-copyright">
        © <a href="https://www.mapbox.com/about/maps/">Mapbox</a>
      </div>

      <div className="osm-copyright">
        © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>
      </div>

      <div className="mapbox-improve">
        • <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>
      </div>
    </div>
  );
};

const handleContextMenu = event => {
  event.stopPropagation();
};

export default Attributions;
