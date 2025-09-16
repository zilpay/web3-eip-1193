const server = Bun.serve({
  port: 8080,
  hostname: '0.0.0.0',
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    try {
      if (path === '/' || path === '/index.html') {
        const html = await Bun.file('./test/index.html').text();
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      } 
      else if (path === '/dist/index.js') {
        const js = await Bun.file('./dist/index.js').text();
        return new Response(js, {
          headers: { 'Content-Type': 'application/javascript' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      return new Response('Server Error', { status: 500 });
    }
  }
});

console.log(`Server running at http://${server.hostname}:${server.port}`);
