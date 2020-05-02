import compress from 'compression';
import helmet from 'helmet';
import cors from 'cors';

import feathers from '@feathersjs/feathers';
import configuration from '@feathersjs/configuration';
import express from '@feathersjs/express';

import { Application } from './declarations';
import middleware from './middleware';
import authentication from './authentication';
import errorLogger from './errorLogger';
import suppressErrorDetails from './suppressErrorDetails';
// Don't remove this comment. It's needed to format import lines nicely.

const app: Application = express(feathers());

// Load app configuration
app.configure(configuration());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet());
app.use(cors());
app.use(compress());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Plugins and providers
app.configure(express.rest());


// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
app.configure(authentication);

// Configure a middleware for 404s and the error handler
app.use(express.notFound());

// Log full errors before suppressed
app.use(errorLogger());
// Rempve verbose error message in production mode.
if (process.env.NODE_ENV !== 'development') {
  app.use(suppressErrorDetails());
}

app.use(express.errorHandler({
  logger: undefined,
  html: false,
} as any));

export default app;
