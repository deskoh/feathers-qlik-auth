import crypto from 'crypto';
import jose from 'jose';
import jws from 'jws';

import { AccessToken, IdToken } from '../../authentication-cognito';

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 4096,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

const jwk = jose.JWK.asKey(publicKey);

const createJwt = (payload: any, expiry: number): any => {
  const authTime = Math.floor(Date.now() / 1000);
  return jws.sign({
    header: { typ: 'JWT', alg: 'RS256', kid: jwk.kid },
    payload: {
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: authTime + expiry,
      auth_time: authTime,
    },
    secret: privateKey,
  });
};

const createAccessToken = (
  payload: Partial<AccessToken>, expiry: number,
): AccessToken => createJwt({ ...payload, token_use: 'access' }, expiry);

const createIdToken = (
  payload: Partial<IdToken>, expiry: number,
): IdToken => createJwt({ ...payload, token_use: 'id' }, expiry);

export default {
  createAccessToken,
  createIdToken,
  jwk,
};
