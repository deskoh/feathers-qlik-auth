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

  it.only('login redirects to oidc provider', async () => {
    const client = axios.create({
      withCredentials: true,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 600;
      },
    });

    let url = getUrl('/qlik/cognito');
    let response = await client.get(url);
    assert.equal(response.status, 302);
    assert.ok(response.headers.location.startsWith('http://localhost:3030/mockCognito/oauth2/authorize'));
    assert.ok(response.headers['set-cookie'].length)
    url = response.headers.location;
    const cookies = response.headers['set-cookie'];

    response = await client.get(url);
    assert.equal(response.status, 302);
    assert.ok(response.headers.location.startsWith('http://localhost:3030/qlik/cognito/callback?code='));
    url = response.headers.location;

    response = await client.get(url, {
      headers: { cookie: cookies.map(c => c.split(';')[0]).join(';') },
    });
    assert.equal(response.status, 302);
    assert.ok(response.headers.location.startsWith('/qlik/callback'));
    url = response.headers.location;

    response = await client.get(getUrl(url), {
      headers: { cookie: cookies.map(c => c.split(';')[0]).join(';') },
    });
    assert.equal(response.status, 302);
    assert.ok(response.headers.location, 'http://localhost:3030/?QlikTicket=dummyTicket');
  });
});
