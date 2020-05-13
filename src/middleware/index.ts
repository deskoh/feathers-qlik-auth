import config from 'config';
import { Express } from 'express';

import session from '../sessionHandler';
import mockCognito from './mockCognito';
import mockQlik from './mockQlik';
// Don't remove this comment. It's needed to format import lines nicely.

export default (app: Express): void => {
  app.use(session);

  app.get('/', (_req, res) => {
    res.send('OK');
  });

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


  const isNonProduction = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  if (isNonProduction && config.has('mockCognito')) {
    mockCognito(config.get<any>('mockCognito'))(app);
    mockQlik()(app);
  }
};
