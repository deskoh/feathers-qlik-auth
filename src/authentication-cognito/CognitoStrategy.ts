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
    const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    this.verifier = new Verifier(issuer);
    this.ticket = new QlikTicket(qlikConfig);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async getRedirect(data: AuthenticationResult | Error, params: Params): Promise<string> {
    const { redirect } = this.authentication?.configuration?.oauth;
    if (!redirect) {
      return null as any;
    }

    const authResult: AuthenticationResult = data;
    if (authResult.accessToken) {
      return this.ticket.getRedirectUrl(
        authResult.user.username, params.proxyRestUri, params.targetId,
      ) as any;
    }
    console.error(data.message || 'OAuth Authentication not successful');
    return null as any;
  }

  async authenticate(authentication: AuthenticationRequest): Promise<any> {
    if (authentication.error) throw new Error(JSON.stringify(authentication.error));
    const result = await this.verifier.verifyIdToken(
      authentication.id_token.header, authentication.raw.id_token,
    );
    if (result.isValid) {
      console.log(`token verified for ${result.username}`);
      return {
        authentication: { strategy: this.name || '' },
        user: { username: result.username },
      };
    }
    throw result.error ?? new Error('Invalid token signature.');
  }
}
