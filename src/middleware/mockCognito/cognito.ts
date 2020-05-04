/* eslint-disable @typescript-eslint/camelcase */
import { BadRequest } from '@feathersjs/errors';
import { Application } from '@feathersjs/express';

import jwt from './createJwt';

interface MockOidcServerOptions {
  path?: string;
  authorize?: string;
  token?: string;
  profile?: string;
  atPayload: any;
  idPayload: any;
  userInfo: any;
}

export default (options?: MockOidcServerOptions): (app: Application) => void => {
  const opts: Required<MockOidcServerOptions> = {
    path: '/mockCognito',
    authorize: 'oauth2/authorize',
    token: 'oauth2/token',
    profile: 'oauth2/userInfo',
    atPayload: {},
    idPayload: {},
    userInfo: {},
    ...options,
  };

  return (app: Application): void => {
    app.get(`${opts.path}/${opts.authorize}`, (req, res, next) => {
      const {
        query: {
          client_id, response_type, redirect_uri, scope, nounce,
        },
      } = req;
      console.log(client_id, response_type, redirect_uri, scope, nounce);
      if (!redirect_uri) {
        next(new BadRequest('redirect_uri not sepecified'));
        return;
      }
      res.redirect(`${redirect_uri}?code=dummy_access_code`);
    });

    app.post(`${opts.path}/${opts.token}`, (req, res) => {
      const {
        body: {
          grant_type, code, client_id, client_secret, redirect_uri,
        },
      } = req;
      console.log(grant_type, code, client_id, client_secret, redirect_uri);

      const expiry = 60 * 60;
      const iss = `${req.protocol}://${req.hostname}:${req.socket.localPort}${opts.path}`;
      const access_token = jwt.createAccessToken({
        ...opts.atPayload,
        scope: 'openid',
        client_id,
        iss,
        jti: '???',
      }, expiry);

      const id_token = jwt.createIdToken({
        ...opts.idPayload,
        at_hash: '???',
        aud: client_id,
        iss,
      }, expiry);

      res.json({
        access_token,
        expires_in: expiry,
        id_token,
        token_type: 'Bearer',
      });
    });

    app.get(`${opts.path}/${opts.profile}`, (req, res) => {
      const { headers: { authorization } } = req;
      console.log(authorization);
      res.json(opts.userInfo);
    });

    app.get(`${opts.path}/.well-known/jwks.json`, (req, res) => {
      res.json({ keys: [jwt.jwk] });
    });
  };
};
