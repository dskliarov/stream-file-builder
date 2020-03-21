import { injectable } from "inversify";
import { ConfigInterface } from '../interfaces/config.interface';
import { Level } from "../interfaces/logger.interface"

@injectable()
export class Config implements ConfigInterface {
    private _s3Bucket: string | undefined;
    private _logLevel: Level;

    public constructor() {
        this._s3Bucket = process.env.S3_BUCKET;
        this._logLevel = this.translateLogLevel(process.env.LOG_LEVEL);
    }

    public s3Bucket(): string { return this._s3Bucket ? this._s3Bucket : "stream-builder"; }
    public logLevel(): Level { return this._logLevel; }

    private translateLogLevel(level: string | undefined): Level {
      const defaultValue = Level.ERROR;
      if (!level) return defaultValue;
      switch (level.toUpperCase()) {
        case "DEBUG": {
          return Level.DEBUG;
        }
        case "INFO": {
          return Level.INFO;
        }
        case "AUDIT": {
          return Level.AUDIT;
        }
        case "ERROR": {
          return Level.ERROR;
        }
        case "FATAL": {
          return Level.FATAL;
        }
        default: {
          return defaultValue;
        }
      }
    }
}
