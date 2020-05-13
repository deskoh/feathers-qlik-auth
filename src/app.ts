import { FeathersError } from '@feathersjs/errors';
import compress from 'compression';
import helmet from 'helmet';
import cors from 'cors';

import express, { Express } from 'express';

import middleware from './middleware';
import authentication from './authentication';
import errorLogger from './errorLogger';
import suppressErrorDetails from './suppressErrorDetails';
// Don't remove this comment. It's needed to format import lines nicely.

const app: Express = express();

// TODO: Load app configuration
// app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure other middleware (see `middleware/index.js`)
middleware(app);
authentication(app);

// Configure a middleware for 404s and the error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((_req, res, _next) => {
  res.status(404).send('Not found.');
});

// Log full errors before suppressed
const isDevelopment = process.env.NODE_ENV === 'development';
app.use(errorLogger(isDevelopment));
// Remove error details in production mode.
const isProduction = process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test';
if (isProduction) {
  app.use(suppressErrorDetails());
}

app.use((err: FeathersError, _req: any, res: any, next: any): void => {
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(err.code || 500).json({ error: err.message });
});

export default app;
