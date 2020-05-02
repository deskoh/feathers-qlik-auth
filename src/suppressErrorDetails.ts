// Sanitize errors for production

export default (suppressMessage = true) => (
  (error: any, _req: any, _res: any, next: any): any => {
    // eslint-disable-next-line no-param-reassign
    if (suppressMessage) delete error.message;
    // eslint-disable-next-line no-param-reassign
    delete error.data;
    next(error);
  }
);
