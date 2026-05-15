import postgres from "postgres";

// Connection configuration using environment variables with defaults for local development
const config = {
  hostname: process.env.DB_HOST || "localhost",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "postgres",
};

export const pg_conn = postgres({
  host: config.hostname,
  user: config.username,
  password: config.password,
  database: config.database,
  port: config.port,
});
