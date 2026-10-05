process.env.DATABASE_URL ??=
  "postgresql://event_planner:event_planner_dev@localhost:5434/event_planner";
process.env.JWT_SECRET ??= "test-secret-at-least-32-characters-long";
process.env.JWT_REFRESH_SECRET ??= "test-refresh-secret-at-least-32-chars";
process.env.JWT_ACCESS_TTL ??= "900";
process.env.JWT_REFRESH_TTL ??= "604800";
