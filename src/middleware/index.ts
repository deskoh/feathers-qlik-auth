import { Application } from '../declarations';
import session from '../sessionHandler';
// Don't remove this comment. It's needed to format import lines nicely.

export default function (app: Application): void {
  app.use(session);

  app.get('/', (_req, res) => {
    console.log(_req.session);
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

  app.get('/qlik/oauth/cognito/authenticate', (req, res, next) => {
    // Inject qlik info from session into feathers params.
    req.feathers = req.feathers || {};
    if (req.session) {
      req.feathers.targetId = req.session.targetId;
      req.feathers.proxyRestUri = req.session.proxyRestUri;
    } else {
      throw new Error('Session not available');
    }
    next();
  });
}
