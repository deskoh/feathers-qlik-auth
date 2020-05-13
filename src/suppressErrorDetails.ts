// Sanitize errors for production

export default (suppressDetails = true) => (
  (error: any, _req: any, _res: any, next: any): any => {
    if (!suppressDetails) next(error);

    const newError = {
      ...error,
      code: 404,
      message: 'Not found',
    };
    next(newError);
  }
);
