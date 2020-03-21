import { Level } from "../interfaces/logger.interface"

export interface ConfigInterface {
    s3Bucket(): string;
    logLevel(): Level;
}
