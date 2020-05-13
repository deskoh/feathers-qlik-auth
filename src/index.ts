import config from 'config';

import logger from './logger';
import app from './app';

const port = config.get<string>('port');
const server = app.listen(port);

process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Rejection at: Promise ', p, reason));

server.on('listening', () => logger.info('Application started on http://%s:%d', config.get<string>('host'), port));
