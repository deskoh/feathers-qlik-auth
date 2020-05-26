import { BadRequest, GeneralError } from '@feathersjs/errors';
import config from 'config';
import { Express } from 'express';
import grant from 'grant-express';

import QlikTicket from './authentication-cognito/QlikTicket';
import { Verifier } from './authentication-cognito';

interface GrantResponse {
  access_token: string;
  id_token?: string;
  refresh_token?: string;
  error?: string;
}

export default (app: Express): void => {
  const authConfig = config.get<any>('authentication');
  const { cognito: cognitoConfig } = authConfig;

  const isNonProduction = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
  const protocol = (isNonProduction) ? 'http' : 'https';
  let host = config.get<string>('host');
  const port = config.get<string>('port');
  if (port !== '80') {
    host += `:${port}`;
  }
  const origin = `${protocol}://${host}`;

  const grantConfig = {
    ...authConfig,
    defaults: {
      origin,
      ...authConfig.defaults,
    },
  };

  console.log(`Login URL: ${grantConfig.defaults.prefix}/cognito`);
  console.log(`Callback URL: ${origin}${grantConfig.defaults.prefix}/cognito/callback`);

  const issuer = `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`;
  const verifier = new Verifier(issuer);

  const qlikConfig = config.get<any>('qlik');
  const ticket = new QlikTicket(qlikConfig);

  app.get(`${grantConfig.defaults.prefix}/cognito/callback`, (req, res, next) => {
    // Handle case where login takes too long
    if (!req.session?.grant) {
      next(new GeneralError('No valid session data'));
      return;
    }
    next();
  });

  app.get(grantConfig.cognito.callback, async (req, res, next) => {
    try {
      // Throw 400 as URL is accessed directly since Grant session checked before redirect
      if (!req.session?.grant) throw new BadRequest();

      const { proxyRestUri, targetId } = req.session;

      console.debug('Verifying tokens');

      const { response } = req.session.grant as { response: GrantResponse };

      if (!response) throw new BadRequest('No valid session data');

      if (response.error) throw new GeneralError(`Grant error: ${response.error}`);
      if (!response.id_token) throw new BadRequest('No ID Token.');

      const result = await verifier.verifyIdToken(response.id_token);
      if (result.isValid) {
        console.log(`token verified for ${result.username}`);
      } else {
        const error = result.error ?? new Error('Invalid token signature.');
        throw error;
      }

      const redirect = await ticket.getRedirectUrl(result.username, proxyRestUri, targetId);
      res.redirect(redirect);
    } catch (error) {
      next(error);
    }
  });

  const grantApp = grant(grantConfig);
  app.use(grantApp);
};
