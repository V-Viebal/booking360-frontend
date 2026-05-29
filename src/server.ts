import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine({
  allowedHosts: [
    'book360.hmz.one',
    'api-book360.hmz.one',
    'localhost',
    '127.0.0.1',
  ],
  // Traefik forwards X-Forwarded-Server in addition to the 5 standard
  // X-Forwarded-* headers. `trustProxyHeaders: true` only covers the
  // standard set, so we pass an explicit allowlist that includes
  // x-forwarded-server; otherwise Angular SSR deopts to CSR and ships
  // the empty shell. Order matches @angular/ssr trust list + Traefik.
  trustProxyHeaders: [
    'x-forwarded-host',
    'x-forwarded-proto',
    'x-forwarded-port',
    'x-forwarded-for',
    'x-forwarded-prefix',
    'x-forwarded-server',
  ],
});

/**
 * Trust the reverse proxy (Traefik) so that req.protocol and req.ip reflect
 * the original client request. Required when running behind Traefik with
 * X-Forwarded-* headers.
 */
app.set('trust proxy', true);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);