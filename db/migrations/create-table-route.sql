CREATE TYPE route_direction AS ENUM ('outbound', 'inbound');
CREATE TYPE route_type AS ENUM (
  'bus', 'shuttle', 'light-rail', 'streetcar', 'aerial-tram', 'commuter-rail');

CREATE TABLE route (
  id          INTEGER,
  direction   route_direction NOT NULL,
  type        route_type      NOT NULL,
  name        TEXT            NOT NULL,
  short_name  TEXT            NOT NULL,
  description TEXT            NOT NULL,
  created_at  TIMESTAMP       NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP       NOT NULL DEFAULT NOW(),

  PRIMARY KEY (id, direction)
);

CREATE TRIGGER update_route_updated_at
  BEFORE UPDATE
  ON route
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- REVERSE
DROP TRIGGER update_route_updated_at ON route;
DROP TABLE route;
DROP type route_direction;
DROP type route_type;
