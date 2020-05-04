import { BadRequest } from '@feathersjs/errors';

import { Application } from '../declarations';
import session from '../sessionHandler';
import mockCognito from './mockCognito';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.use(session);

  app.get('/', (_req, res) => {
    res.send('OK');
  });

  const oauthPath = app.get('authentication').oauth.defaults?.path || '/oauth';

  app.get('/qlik/login', (req, res) => {
    if (!req.query.targetId || !req.query.proxyRestUri) {
      res.send('Required params missing');
    } else {
      console.log(`proxyRestUri: ${req.query.proxyRestUri}, targetId: ${req.query.targetId}`);
      if (req.session) {
        req.session.proxyRestUri = req.query.proxyRestUri;
        req.session.targetId = req.query.targetId;
      } else {
        throw new Error('Session not available');
      }
      res.redirect('/qlik/oauth/cognito');
    }
  });

  app.get(`${oauthPath}/cognito/authenticate`, (req, res, next) => {
    // Inject qlik info from session into feathers params.
    req.feathers = req.feathers || {};
    if (req.session) {
      req.feathers.targetId = req.session.targetId;
      req.feathers.proxyRestUri = req.session.proxyRestUri;
    }
    next();
  });

  app.get(`${oauthPath}/cognito/callback`, (req, res, next) => {
    // Handle case where login takes too long
    if (!req.session?.grant) {
      throw new BadRequest('Login session expired');
    }
    next();
  });

  if (process.env.NODE_ENV === 'development' && app.get('mockCognito')) {
    app.configure(mockCognito(app.get('mockCognito')));
    console.log('Mock Cognito configured.');
  }
}
