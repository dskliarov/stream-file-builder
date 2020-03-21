import { injectable, inject } from "inversify";
import "reflect-metadata";
import { TYPES } from "../utilities/types";
import { LocalStorageInterface } from '../interfaces/local-storage.interface';
import { LoggerInterface } from '../interfaces/logger.interface';
import * as fs from "fs";
import sanitize = require("sanitize-filename");

@injectable()
export class LocalStorage implements LocalStorageInterface {

    private _logger!: LoggerInterface;

    public constructor( @inject(TYPES.ILogger) logger: LoggerInterface) {
        this._logger = logger;
    }

    public put(key: string, chunkNumber: number, chunk: string): Promise<boolean> {
        const filename = this.filename(key, chunkNumber);
        const logger = this._logger;

        return new Promise((resolve, reject) => {
            fs.writeFile(filename, chunk,  function(err) {
                if ( err ) {
                    logger.error(err.message, []);
                    reject(err);
                }
                logger.info("File ${filename} created", []);
                resolve(true);
            });
        });
    }

    public get(key: string, chunkNumber: number): Promise<string> {
        const filename = this.filename(key, chunkNumber);
        const logger = this._logger;

        return new Promise((resolve, reject) => {
            fs.readFile(filename, function (err, data) {
                if ( err ) {
                    logger.error(err.message, []);
                    reject(err);
                }
                logger.info("File ${filename} read", []);
                resolve(data.toString());
            });
        });
    }

    public delete(key: string, chunkNumber: number): Promise<boolean> {
        const filename = this.filename(key, chunkNumber);
        const logger = this._logger;

        return new Promise((resolve, reject) => {
            fs.unlink(filename, function (err) {
                if ( err ) {
                    logger.error(err.message, []);
                    reject(err);
                }
                logger.info("File ${filename} have been deleted", []);
                resolve(true);
            });
        });
    }

    private filename(key: string, chunkNumber: number): string {
      const sanitizeKey = sanitize(key);
      return `${sanitizeKey}-${chunkNumber}`
    }

}
