import 'zone.js/node';
import * as express from 'express';
import { join } from 'path';
import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr/node';
import { processPages } from './process-pages';
import { REQUEST, RESPONSE_INIT } from '@angular/core';

// Express server
const app = express();

const PORT = process.env.PORT || 4001;
const DIST_FOLDER = join(process.cwd(), 'dist/browser');

/**
 * In Webpack-based Angular SSR, the main.server.ts is bundled into a single file.
 * We require it here. Note that in Angular 18, we use CommonEngine 
 * instead of the old ngExpressEngine.
 */
const bootstrap = require('./dist/server/main').default;

const commonEngine = new CommonEngine();

app.set('view engine', 'html');
app.set('views', DIST_FOLDER);

// Serve static files
app.get('*.*', express.static(DIST_FOLDER, {
  maxAge: '1y'
}));

// All regular routes use the new Angular CommonEngine
app.get('*', (req, res, next) => {
  const { protocol, originalUrl, baseUrl, headers } = req;

  commonEngine
    .render({
      bootstrap,
      documentFilePath: join(DIST_FOLDER, 'index.html'),
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: DIST_FOLDER,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        { provide: REQUEST, useValue: req },
        { provide: RESPONSE_INIT, useValue: res },
      ],
    })
    .then((html) => res.send(html))
    .catch((err) => {
      console.error('Error during SSR rendering', err);
      next(err);
    });
});

// Start up the Node server
const server = app.listen(PORT, () => {
  console.log(`Node Express server listening on http://localhost:${PORT}`);

  console.log('Pre-rendering app...');

  processPages({
    baseUrl: `http://localhost:${PORT}`,
    distFolder: DIST_FOLDER,
    ssrPagesFilename: 'ssr-pages.json',
  })
  .then(() => {
    console.log('Done!');
    // If this is a build-time script, we exit. 
    // If this is a live server, you might want to remove process.exit.
    server.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('Pre-rendering failed', err);
    process.exit(1);
  });
});