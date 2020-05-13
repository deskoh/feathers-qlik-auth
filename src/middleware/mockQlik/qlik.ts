/* eslint-disable @typescript-eslint/camelcase */
import { Express } from 'express';

interface MockQlikServerOptions {
  path?: string;
}

export default (options?: MockQlikServerOptions): (app: Express) => void => {
  const opts: Required<MockQlikServerOptions> = {
    path: '/mockQlik',
    ...options,
  };

  return (app: Express): void => {
    app.post(`${opts.path}/ticket`, (req, res) => {
      const {
        query: { xrfkey },
      } = req;
      console.log('[MockQlik] xrfkey:', xrfkey);
      res.status(201).json({
        Ticket: 'dummyTicket',
        TargetUri: 'http://localhost:3030/',
      });
    });

    console.log('Mock Qlik configured.');
  };
};
