import session from 'express-session';
import { Application } from '../declarations';
// Don't remove this comment. It's needed to format import lines nicely.


export default function (app: Application) {
  const expressSession = session({
    secret: Math.random().toString(36).substring(7),
    saveUninitialized: false,
    resave: true,
  });
  app.use(expressSession);

  app.get('/', (_req, res) => {
    res.send('OK');
  });

  app.get('/qlik/login', (req, res) => {
    const proxyRestUri = app.get('qlik').proxyRestUri || req.query.proxyRestUri;
    if (!req.query.targetId) {
      res.send('Required params missing');
    } else {
      console.log(`proxyRestUri: ${proxyRestUri}`);
      console.log(`targetId: ${req.query.targetId}`);
    }
    req.session!.proxyRestUri = req.query.proxyRestUri;
    req.session!.targetId = req.query.targetId;
    res.redirect('/qlik/oauth/cognito');
  });

  app.get('/qlik/oauth/cognito/authenticate', (req, res, next) => {
    // Inject qlik info from session into feathers params.
    req.feathers = req.feathers || {};
    req.feathers.targetId = req.session!.targetId;
    req.feathers.proxyRestUri = req.session!.proxyRestUri;
    next();
  });
}