import { SQL } from "bun";

// Connection configuration using environment variables with defaults for local development
const config = {
  adapter: "postgres",
  hostname: process.env.DB_HOST || "localhost",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  port: process.env.DB_PORT || "5432",
  database: process.env.DB_NAME || "postgres",
};

export const pg_conn = new SQL({
  url: `${config.adapter}://${config.hostname}`,
  username: config.username,
  password: config.password,
  database: config.database,
  port: config.port,
});
