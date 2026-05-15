import { serve } from "@hono/node-server";
import { fetchHandler } from './src/server'

serve({
  fetch: fetchHandler,
  port: 8080,
  hostname: '0.0.0.0'
}, (info) => {
  console.log(`Server is listening on http://${info.address}:${info.port}`);
});
