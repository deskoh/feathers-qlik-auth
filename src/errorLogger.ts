import logger from './logger';

export default (errorStack = false) => (
  (error: any, _req: any, _res: any, next: any): any => {
    const { message, data } = error;
    logger.info({
      message,
      data,
    });
    if (errorStack && error.code !== 404) logger.error(error.stack);
    next(error);
  }
);
