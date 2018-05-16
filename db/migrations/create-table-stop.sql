CREATE TABLE stop (
  id         INTEGER PRIMARY KEY,
  name       TEXT                  NOT NULL,
  direction  TEXT                  NOT NULL,
  location   GEOMETRY(Point, 4326) NOT NULL,
  created_at TIMESTAMP             NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP             NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_stop_updated_at
  BEFORE UPDATE
  ON stop
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- REVERSE
DROP TRIGGER update_stop_updated_at ON stop;
DROP TABLE stop;
