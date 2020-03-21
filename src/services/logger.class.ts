import { injectable, inject } from "inversify"
import "reflect-metadata";
import { LoggerInterface, Level } from '../interfaces/logger.interface';
import { ConfigInterface } from "../interfaces/config.interface";
import { TYPES } from "../utilities/types";
import { LogTag } from "../interfaces/type";

@injectable()
export class Logger implements LoggerInterface {
  private _config: ConfigInterface;

  public constructor(
    @inject(TYPES.IConfig) config: ConfigInterface
  ) {
    this._config = config;
  }

  public log(level: Level, message: string, tags: LogTag[]): void {
    if (level < this._config.logLevel()) return;
    const tagsString = this.tags(tags);
    const levelString = level.toString();
    console.log('level=%s, message=%s, tags: %s', levelString, message, tagsString);
  }

  public debug(message: string, tags: LogTag[]): void {
    this.log(Level.DEBUG, message, tags);
  }

  public info(message: string, tags: LogTag[]): void {
    this.log(Level.INFO, message, tags);
  }

  public audit(message: string, tags: LogTag[]): void {
    this.log(Level.AUDIT, message, tags);
  }

  public error(message: string, tags: LogTag[]): void {
    this.log(Level.ERROR, message, tags);
  }

  public fatal(message: string, tags: LogTag[]): void {
    return this.log(Level.FATAL, message, tags);
  }

  private tags(tags: LogTag[]): string {
    return tags.map((tag: LogTag) => {
      return `${tag.key}=${tag.value}`;
    }).join(", ");
  }

}
