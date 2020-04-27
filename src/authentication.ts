import { ServiceAddons } from '@feathersjs/feathers';
import { AuthenticationService } from '@feathersjs/authentication';
import { expressOauth } from '@feathersjs/authentication-oauth';

import { Application } from './declarations';
import { CognitoStrategy, updateConfig } from './authentication-cognito';

declare module './declarations' {
  interface ServiceTypes {
    'authentication': AuthenticationService & ServiceAddons<any>;
  }
}

export default function(app: Application) {
  const authentication = new AuthenticationService(app);

  const cognitoConfig = updateConfig(app.get('authentication').oauth.cognito);
  const qlikConfig = app.get('qlik');
  authentication.register('cognito', new CognitoStrategy(cognitoConfig.userPoolId, cognitoConfig.region, qlikConfig) as any);

  app.use('/authentication', authentication);
  app.configure(expressOauth());
}
