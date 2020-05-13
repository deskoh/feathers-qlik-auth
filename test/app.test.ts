import assert from 'assert';
import { Server } from 'http';
import axios from 'axios';

import { startServer, getUrl } from './fixture';

describe('Application tests', () => {
  let server: Server;

  before(function(done) {
    server = startServer();
    server.once('listening', () => done());
  });

  after(function(done) {
    server.close(done);
  });

  it('starts and shows the index page', async () => {
    const { data } = await axios.get(getUrl());
    assert.strictEqual(data, 'OK');
  });

  it('shows a 404 message only', async () => {
    try {
      await axios.get(getUrl('path/to/nowhere'), {
        headers: {
          'Accept': 'text/html'
        }
      });
      assert.fail('should never get here');
    } catch (error) {
      const { response } = error;

      assert.equal(response.status, 404);
      assert.strictEqual(response.data, 'Not found.');
    }
  });
});
