import fs from 'fs';
import https from 'https';
import rnd from 'crypto-random-string';

import * as Axios from 'axios';

const readFileIfExists = (fileOrString: string | undefined) => {
  if (!fileOrString) throw new Error('readFileIfExists requires a file path or string');
  if (fs.existsSync(fileOrString)) {
    console.info(`Loading file ${fileOrString}`);
    return fs.readFileSync(fileOrString);
  }
  return fileOrString;
};

export interface QlikTicketConfig {
  rootCa?: string;
  clientKey?: string;
  clientCert?: string;
}

export default class QlikTicket {
  private options: QlikTicketConfig;

  private httpsAgent: https.Agent;

  public constructor(options: QlikTicketConfig) {
    this.options = {
      ...options,
    };

    this.httpsAgent = new https.Agent({
      ca: readFileIfExists(this.options.rootCa),
      key: readFileIfExists(this.options.clientKey),
      cert: readFileIfExists(this.options.clientCert),
      rejectUnauthorized: false
    });
  }

  public async getRedirectUrl(userId: string, userDirectory: string, proxyRestUri: string, targetId: string) {
    const randomString = rnd({length: 16});
    const url = `${proxyRestUri}/ticket?xrfkey=${randomString}`;
    const response = await Axios.default.post(url, {
      "UserDirectory": userDirectory,
      "UserId": userId,
      "Attributes": [],
      "TargetId": targetId,
    }, {
      headers: {
        'content-type': 'application/json',
        'X-Qlik-xrfkey': randomString,
        'X-Qlik-user': `UserDirectory=${userDirectory};UserId=${userId}`
      },
      httpsAgent: this.httpsAgent,
    });

    console.log(response.status);

    if (response.status < 400) {
      // TODO: verify XRF string
      console.log("== Got a ticket ==");
      console.log("Ticket: " + response.data.Ticket);
      console.log("TargetUri: " + response.data.TargetUri);

      return response.data.TargetUri + "?QlikTicket=" + response.data.Ticket;
    } else {
      console.error(response.status, response.statusText, response.data);
      return null;
    }
  }
}
