// Reference: https://github.com/awslabs/aws-support-tools/blob/master/Cognito/decode-verify-jwt/decode-verify-jwt.ts

import { promisify } from 'util';
import * as Axios from 'axios';
import * as jsonwebtoken from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';

export interface VerifyResult {
  readonly username: string;
  readonly clientId: string;
  readonly isValid: boolean;
  readonly error?: Error;
}

interface TokenHeader {
  kid: string;
  alg: string;
}
interface PublicKey {
  alg: string;
  e: string;
  kid: string;
  kty: string;
  n: string;
  use: string;
}

type MapOfKidToPublicKey = Record<string, string>;

interface PublicKeys {
  keys: PublicKey[];
}

interface JWT {
  /**
   * Subject Identifier. A locally unique and never reassigned identifier within the Issuer for
   * the End-User.
   */
  sub: string;
  /**
   * Time when the End-User authentication occurred.
   */
  auth_time?: number;
  /**
   * Issuer Identifier for the Issuer of the response.
   */
  iss: string;
  /**
   * Time at which the JWT was issued.
   */
  iat: number;
  /**
   * Expiration time on or after which the ID Token MUST NOT be accepted for processing.
   */
  exp: number;
  /**
   * Cognito specific value.
   */
  token_use: 'id' | 'token';
}

interface AccessToken extends JWT {
  token_use: 'token';
  scope: string;
  client_id: string;
  username: string;
}

interface IdToken extends JWT {
  /**
   * ClientID for ID Token,
   */
  aud: string;
  /**
   * Access Token hash value.
   */
  at_hash?: string;
  token_use: 'id';
  [key: string]: any;
}

type Claim = IdToken | AccessToken;

const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

export default class Verifier {
  private cognitoIssuer: string;

  private cacheKeys: MapOfKidToPublicKey | undefined;

  constructor(issuer: string) {
    this.cognitoIssuer = issuer;
  }

  private getPublicKeys = async (issuer: string): Promise<MapOfKidToPublicKey> => {
    const url = `${issuer}/.well-known/jwks.json`;
    if (!this.cacheKeys) {
      const publicKeys = await Axios.default.get<PublicKeys>(url);
      this.cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
        // eslint-disable-next-line no-param-reassign
        agg[current.kid] = jwkToPem(current);
        return agg;
      }, {} as MapOfKidToPublicKey);
      return this.cacheKeys;
    }
    return this.cacheKeys;
  };

  private async verifyToken(header: TokenHeader, token: string, tokenUse: string): Promise<Claim> {
    let issuer = this.cognitoIssuer;
    // Allow keys issuer to be overriden by token for development.
    if (process.env.NODE_ENV === 'development') {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
      if (payload.iss && payload.iss !== issuer) {
        issuer = payload.iss;
        console.warn(`WARNING: Keys issuer overidden to ${issuer} for development`);
      }
    }
    const keys = await this.getPublicKeys(issuer);
    const key = keys[header.kid];
    if (key === undefined) {
      throw new Error('unable to get keys or claim made for unknown kid');
    }
    const claim = await verifyPromised(token, key) as AccessToken;

    const currentSeconds = Math.floor((new Date()).valueOf() / 1000);
    if (currentSeconds > claim.exp
      || Math.abs(currentSeconds - (claim.auth_time || claim.iat)) > 5) {
      throw new Error('claim is expired or invalid');
    }

    if (claim.iss !== issuer) {
      throw new Error('claim issuer is invalid');
    }

    if (claim.token_use !== tokenUse) {
      throw new Error(`claim use is not ${tokenUse}`);
    }
    return claim;
  }

  public async verifyAccessToken(token: string): Promise<VerifyResult> {
    const tokenSections = (token || '').split('.');
    if (tokenSections.length < 2) {
      throw new Error('requested token is invalid');
    }
    const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
    const header = JSON.parse(headerJSON) as TokenHeader;

    let result: VerifyResult;
    try {
      const claim = await this.verifyToken(header, token, 'token') as AccessToken;
      result = {
        username: claim.username,
        clientId: claim.client_id,
        isValid: true,
      };
    } catch (error) {
      result = {
        username: '', clientId: '', error, isValid: false,
      };
    }
    return result;
  }

  public async verifyIdToken(header: TokenHeader, token: string): Promise<VerifyResult> {
    let result: VerifyResult;
    try {
      const claim = await this.verifyToken(header, token, 'id') as IdToken;
      // TODO: Verify aud
      result = {
        username: claim['cognito:username'],
        clientId: claim.aud,
        isValid: true,
      };
    } catch (error) {
      result = {
        username: '', clientId: '', error, isValid: false,
      };
    }
    return result;
  }
}
