CREATE DATABASE IF NOT EXISTS clickgame;
CREATE TABLE IF NOT EXISTS clickgame.clicks (
  user String,
  clicks Int32
) ENGINE = MergeTree() ORDER BY ts;
