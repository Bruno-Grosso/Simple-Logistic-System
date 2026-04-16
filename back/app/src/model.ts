import { SQL } from "bun";

interface conn {
  adapter: string,
  hostname: string,
  username: string,
  password: string,
  port: string,
  database: string
}

const conn_data: conn = {
  adapter: "postgres",
  hostname: "postgresdb",
  username: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: process.env.DB_DOCKER_PORT!,
  database: process.env.DB_DATABASE!
}

export const pg_conn = new SQL({
  url: `${conn_data.adapter}://${conn_data.hostname}`,
  username: conn_data.username,
  password: conn_data.password,
  database: conn_data.database,
  port: conn_data.port
})
