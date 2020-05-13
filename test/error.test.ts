import assert from 'assert';
import { Server } from 'http';
import axios from 'axios';

import { startServer, getUrl } from './fixture';

describe('Authentication tests', () => {
  let server: Server;

  before(function(done) {
    server = startServer();
    server.once('listening', () => done());
  });

  after(function(done) {
    server.close(done);
  });

  it('callback url return 500 error', async () => {
    console.log(getUrl('/qlik/cognito/callback?code=dummy_access_code'));
    try {
      await axios.get(getUrl('/qlik/cognito/callback'));
    } catch (error) {
      const { response } = error;
      assert.equal(response.status, 500);
      assert.equal(response.data.error, 'No valid session data');
    }
  });


});
