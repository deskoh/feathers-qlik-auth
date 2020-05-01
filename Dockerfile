ARG DOCKER_REGISTRY
FROM ${DOCKER_REGISTRY}node:12-alpine

WORKDIR /opt/app-root/src

ARG NPM_MIRROR=https://registry.npmjs.org
RUN npm config set registry $NPM_MIRROR

COPY package.json package-lock.json ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run compile

ENV NODE_ENV=production

ENV HOST=localhost \
    PORT=3030 \
    SESSION_EXPIRY=5m \
    COGNITO_CLIENT_ID= \
    COGNITO_SECRET= \
    COGNITO_BASEURL= \
    COGNITO_USER_POOL_ID= \
    QLIK_DOMAIN=SomeDomain \
    QLIK_ROOT_CA=../certs/ca.pem \
    QLIK_CLIENT_KEY=../certs/client_key.pem \
    QLIK_CLIENT_CERT=../certs/client_cert.pem

CMD ["node", "lib"]
