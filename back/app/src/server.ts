const server = Bun.serve({
  port: 8080,
  routes: {
    '/status': new Response('OK')
  },

  fetch(_) { return new Response('Not found', { status: 404 }) }
})

export { server }
