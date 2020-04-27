// Reference: https://github.com/awslabs/aws-support-tools/blob/master/Cognito/decode-verify-jwt/decode-verify-jwt.ts

import {promisify} from 'util';
import * as Axios from 'axios';
import * as jsonwebtoken from 'jsonwebtoken';
const jwkToPem = require('jwk-to-pem');

export interface ClaimVerifyRequest {
  readonly token?: string;
}

export interface ClaimVerifyResult {
  readonly userName: string;
  readonly clientId: string;
  readonly isValid: boolean;
  readonly error?: any;
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
interface PublicKeyMeta {
  instance: PublicKey;
  pem: string;
}

interface PublicKeys {
  keys: PublicKey[];
}

interface MapOfKidToPublicKey {
  [key: string]: PublicKeyMeta;
}

interface Claim {
  token_use: string;
  auth_time: number;
  iss: string;
  exp: number;
  username: string;
  client_id: string;
}

const verifyPromised = promisify(jsonwebtoken.verify.bind(jsonwebtoken));

export default class Verifier {
  private cognitoIssuer: string;
  private cacheKeys: MapOfKidToPublicKey | undefined;

  constructor(userPoolId: string, region: string) {
    this.cognitoIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  }

  public verifyAccessToken = (token: string) => this.verify(token, 'access');

  public verifyIdToken = (token: string) => this.verify(token, 'id');

  private getPublicKeys = async (): Promise<MapOfKidToPublicKey> => {
    if (!this.cacheKeys) {
      const url = `${this.cognitoIssuer}/.well-known/jwks.json`;
      const publicKeys = await Axios.default.get<PublicKeys>(url);
      this.cacheKeys = publicKeys.data.keys.reduce((agg, current) => {
        const pem = jwkToPem(current);
        agg[current.kid] = {instance: current, pem};
        return agg;
      }, {} as MapOfKidToPublicKey);
      return this.cacheKeys;
    } else {
      return this.cacheKeys;
    }
  };

  private verify = async (token: string, tokenUse: 'id' | 'access'): Promise<ClaimVerifyResult> => {
    let result: ClaimVerifyResult;
    try {
      const tokenSections = (token || '').split('.');
      if (tokenSections.length < 2) {
        throw new Error('requested token is invalid');
      }
      const headerJSON = Buffer.from(tokenSections[0], 'base64').toString('utf8');
      const header = JSON.parse(headerJSON) as TokenHeader;
      const keys = await this.getPublicKeys();
      const key = keys[header.kid];
      if (key === undefined) {
        throw new Error('claim made for unknown kid');
      }
      const claim = await verifyPromised(token, key.pem) as Claim;
      const currentSeconds = Math.floor( (new Date()).valueOf() / 1000);
      if (currentSeconds > claim.exp || Math.abs(currentSeconds - claim.auth_time) > 1) {
        throw new Error('claim is expired or invalid');
      }
      if (claim.iss !== this.cognitoIssuer) {
        throw new Error('claim issuer is invalid');
      }
      if (claim.token_use !== tokenUse) {
        throw new Error(`claim use is not ${tokenUse}`);
      }
      console.log(`claim confirmed for ${claim.username}`);
      result = {userName: claim.username, clientId: claim.client_id, isValid: true};
    } catch (error) {
      console.error(error);
      result = {userName: '', clientId: '', error, isValid: false};
    }
    return result;
  };
};
