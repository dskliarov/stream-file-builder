import { injectable, inject } from "inversify";
import "reflect-metadata";
import { LoggerInterface } from '../interfaces/logger.interface';
import { ConfigInterface } from '../interfaces/config.interface';
import { StorageInterface } from '../interfaces/storage.interface';
import { TYPES } from "../utilities/types";
import * as AWS from 'aws-sdk';
import { AWSError } from 'aws-sdk';
import { PutObjectRequest } from 'aws-sdk/clients/s3';

@injectable()
export class Storage implements StorageInterface {

    private _config!: ConfigInterface;
    private _logger!: LoggerInterface;
    private _s3: AWS.S3 = new AWS.S3({apiVersion: '2006-03-01'});

    public constructor(
        @inject(TYPES.IConfig) config: ConfigInterface,
        @inject(TYPES.ILogger) logger: LoggerInterface
    ) {
        this._config = config;
        this._logger = logger;
    }

    public put(key: string, chunks: {partition: number; content: string}[]): Promise<boolean> {
        const params: PutObjectRequest = {
            Body: JSON.stringify(chunks),
            Bucket: this._config.s3Bucket(),
            Key: key,
            ContentType: 'application/json'
        };
        const logger = this._logger;

        return new Promise((resolve, reject) => {
            this._s3.putObject(params).promise().then(() => {
                    logger.info("Success S3 PUT operation", []);
                    resolve(true);

            }).catch((err: AWSError) => {
                    this._logger.error(err.message, []);
                    reject(false);
            });        
          })
    }

    public get(key: string): Promise<{partition: number; content: string}[]> {
        const params = {
            Bucket: this._config.s3Bucket(),
            Key: key,
        };

        return new Promise((resolve, reject) => {
            this._s3.getObject(params).promise().then(data => {
              this._logger.info("Success S3 GET operation", []);
              data.Body
              resolve(data.Body ? JSON.parse(data.Body.toString()) : []);
            }).catch(err => {
                    this._logger.error(err.message, []);
                    reject(false);
            })
        });
    }

    public delete(key: string): Promise<boolean> {
        const params = {
            Bucket: this._config.s3Bucket(),
            Key: key,
        };

        return new Promise((resolve, reject) => {
            this._s3.deleteObject(params).promise().then(() => {
              this._logger.info("Success S3 DELETE operation", []);
              resolve(true);
            }).catch(err => {
              this._logger.error(err.message, []);
              reject(false);
            });
        });
    }
}
