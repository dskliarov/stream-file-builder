import { injectable, inject } from "inversify";
import "reflect-metadata";
import { TYPES } from "../utilities/types";
import { CacheInterface } from "../interfaces/cache.interface";
import { LoggerInterface } from "../interfaces/logger.interface";

@injectable()
export class Cache implements CacheInterface {

    private _logger!: LoggerInterface;
    private _map!: Map<string, Set<number>>;

    public constructor(
        @inject(TYPES.ILogger) logger: LoggerInterface
    ) {
        this._logger = logger;
        this._map = new Map();
    }

    public push(key: string, chunkNumber: number): Promise<Set<number>> {
        const cacheSet: Set<number> = this.getSet(key).add(chunkNumber);
        this._map.set(key, cacheSet);
        return Promise.resolve(cacheSet);
    }

    public get(key: string): Promise<Set<number>> {
        const cacheSet: Set<number> = this.getSet(key);
        return Promise.resolve(cacheSet);
    }

    public delete(key: string): Promise<boolean> {
        const result = this._map.delete(key);
        return Promise.resolve(result);
    }

    public allKeys(): Promise<string[]> {
        const result = Array.from(this._map.keys());
        return Promise.resolve(result);
    }

    private getSet(key: string): Set<number> {
      let result: Set<number> | undefined = undefined;
      if (this._map.has(key)) {
        result = this._map.get(key);
      } 
      return result || new Set<number>();
    }
}
