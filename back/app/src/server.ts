import { pg_conn } from "./model";

const server = Bun.serve({
  port: 8080,
  async fetch(req) {
    const url = new URL(req.url);

    // Route: /status
    if (url.pathname === "/status") {
      const tables = await pg_conn`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `;
      return Response.json(tables);
    }

    // Route: /other
    if (url.pathname === "/other") {
      const dbName = await pg_conn`SELECT current_database()`;
      return Response.json(dbName[0]);
    }

    return new Response("Not found", { status: 404 });
  },
});

export { server };
