import Axios from 'axios';
import rnd from 'crypto-random-string';
import fs from 'fs';
import https from 'https';

const readFileIfExists = (fileOrString: string | undefined): Buffer | string => {
  if (!fileOrString) throw new Error('readFileIfExists requires a file path or string');
  if (fs.existsSync(fileOrString)) {
    console.info(`Loading file ${fileOrString}`);
    return fs.readFileSync(fileOrString);
  }
  return fileOrString;
};

export interface QlikTicketConfig {
  rootCa: string;
  clientKey: string;
  clientCert: string;
  userDirectory: string;
  /**
   * Optional for overidding original proxyRestUri query parameters.
   */
  proxyRestUri?: string;
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
      rejectUnauthorized: false,
    });
  }

  public async getRedirectUrl(
    userId: string, proxyRestUri: string, targetId: string,
  ): Promise<string> {
    const randomString = rnd({ length: 16 });

    let proxyUri = proxyRestUri;
    if (this.options.proxyRestUri) {
      proxyUri = this.options.proxyRestUri;
      console.log(`proxyRestUri overidden to ${proxyUri}`);
    }
    const url = `${proxyUri}/ticket?xrfkey=${randomString}`;
    try {
      const response = await Axios.post(url, {
        UserDirectory: this.options.userDirectory,
        UserId: userId,
        Attributes: [],
        TargetId: targetId,
      }, {
        headers: {
          'content-type': 'application/json',
          'X-Qlik-xrfkey': randomString,
          'X-Qlik-user': `UserDirectory=${this.options.userDirectory};UserId=${userId}`,
        },
        httpsAgent: this.httpsAgent,
      });
      if (response.status === 201) {
        console.log(`Ticket: ${response.data.Ticket}, TargetUri: ${response.data.TargetUri}`);
        return `${response.data.TargetUri}?QlikTicket=${response.data.Ticket}`;
      }
      throw new Error(`Unable to get Ticket(${response.status}):, ${response.data}`);
    } catch (error) {
      throw new Error(`Unable to get Ticket. ${error.message}`);
    }
  }
}
