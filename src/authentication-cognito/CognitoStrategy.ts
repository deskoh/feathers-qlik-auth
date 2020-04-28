import { OAuthStrategy } from '@feathersjs/authentication-oauth';
import { Params } from '@feathersjs/feathers';
import { AuthenticationRequest, AuthenticationResult } from '@feathersjs/authentication';

import Verifier from './Verifier';
import QlikTicket, { QlikTicketConfig } from './QlikTicket';

export default class CognitoStrategy extends OAuthStrategy {
  private verifier: Verifier;

  private ticket: QlikTicket;

  constructor(userPoolId: string, region: string, qlikConfig: QlikTicketConfig) {
    super();
    this.verifier = new Verifier(userPoolId, region);
    this.ticket = new QlikTicket(qlikConfig);
  }

  async getRedirect(data: AuthenticationResult | Error, params: Params) {
    const { redirect } = this.authentication?.configuration?.oauth;
    if (!redirect) {
      return null as any;
    }

    const authResult: AuthenticationResult = data;
    if (authResult.accessToken) {
      return this.ticket.getRedirectUrl(authResult.user.username, 'SomeDomain', params.proxyRestUri, params.targetId);
    }
    console.error(data.message || 'OAuth Authentication not successful');
    return null as any;
  }

  async authenticate(authentication: AuthenticationRequest) {
    if (authentication.error) throw new Error(authentication.error);
    const result = await this.verifier.verifyAccessToken(authentication.access_token);
    if (result.isValid) {
      return {
        authentication: { strategy: this.name || '' },
        user: { username: result.userName },
      };
    }
    throw new Error('Invalid token signature.');
  }
}
