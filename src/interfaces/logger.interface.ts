import { LogTag } from "../interfaces/type";

export enum Level {
    DEBUG,
    INFO,
    AUDIT,
    ERROR,
    FATAL,
}

export interface LoggerInterface {
    log(level: Level, message: string, tags: LogTag[]): void;
    debug(message: string, tags: LogTag[]): void;
    info(message: string, tags: LogTag[]): void;
    audit(message: string, tags: LogTag[]): void;
    error(message: string, tags: LogTag[]): void;
    fatal(message: string, tags: LogTag[]): void;
}
