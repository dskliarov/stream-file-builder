import { injectable, inject } from "inversify";
import "reflect-metadata";
import { LoggerInterface } from '../interfaces/logger.interface';
import { PublisherInterface } from '../interfaces/publisher.interface';
import { TYPES } from "../utilities/types";
import rp = require('request-promise');

@injectable()
export class Publisher implements PublisherInterface {

    private _logger!: LoggerInterface;

    public constructor( @inject(TYPES.ILogger) logger: LoggerInterface) {
        this._logger = logger;
    }

    public post(uri: string, body: object): Promise<boolean> {
      const logger = this._logger;
        const options = {
          method: 'POST',
          uri: uri,
          body: body,
          headers: {
            'content-type': null
            }
        };
        return rp(options)
            .then(function (body) {
                logger.info(body, []);
                return true;
            })
            .catch(function (err) {
                logger.error(err, []);
                return false;
            });
    }
}
