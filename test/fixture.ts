import config from 'config';
import path from 'path';
import url from 'url';

console.log('Setting NODE_ENV = test');
process.env.NODE_ENV = 'test';

import app from '../src/app';

const port = config.get<string>('port') || 8998;

const getUrl = (pathname?: string) => url.format({
  hostname: config.get('host') || 'localhost',
  protocol: 'http',
  port,
  pathname
});

const startServer = () => app.listen(port);

export {
  app,
  startServer,
  getUrl,
};
