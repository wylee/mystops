CREATE TABLE stop_route (
  stop_id   INTEGER         NOT NULL,
  route_id  INTEGER         NOT NULL,
  direction route_direction NOT NULL,

  FOREIGN KEY (stop_id) REFERENCES stop (id),
  FOREIGN KEY (route_id, direction) REFERENCES route (id, direction),
  PRIMARY KEY (stop_id, route_id, direction)
);

-- REVERSE
DROP TABLE stop_route;
