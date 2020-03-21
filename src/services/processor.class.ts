import { Container } from "inversify";

import { TYPES } from "../utilities/types"
import { Payload, Chunk } from "../interfaces/type";

import { CacheInterface } from '../interfaces/cache.interface';
import { LoggerInterface } from '../interfaces/logger.interface';
import { PublisherInterface } from '../interfaces/publisher.interface';
import { ValidatorInterface } from '../interfaces/request-validator.interface';
import { StorageInterface } from '../interfaces/storage.interface';
import { LocalStorageInterface } from '../interfaces/local-storage.interface';

export class Processor {

    private _cache!: CacheInterface;
    private _logger!: LoggerInterface;
    private _publisher!: PublisherInterface;
    private _validator!: ValidatorInterface;
    private _storage!: StorageInterface;
    private _localStorage!: LocalStorageInterface;

    constructor(container: Container) {
        this._cache = container.get<CacheInterface>(TYPES.ICache);
        this._logger = container.get<LoggerInterface>(TYPES.ILogger);
        this._publisher = container.get<PublisherInterface>(TYPES.IPublisher);
        this._validator = container.get<ValidatorInterface>(TYPES.IValidator);
        this._storage = container.get<StorageInterface>(TYPES.IStorage);
        this._localStorage = container.get<LocalStorageInterface>(TYPES.ILocalStorage);
    }

   /**
    * Payload schema
    * {
    *   "putEndpoint" : "https://www.example.com/image.jpg",
    *   "partition": 1,
    *   "partitionCount": 10,
    *   "content" : "aGVsbG8gd29ybGQh"
    * }
    */
  public async run(payload: Payload): Promise<boolean> {
        const validationResult = this._validator.checkAgainstSchema(payload);
        
        if (!validationResult.valid) {
          this._logger.info(validationResult.errors.toString(), []);
          return Promise.resolve(false);
        }

        const {putEndpoint: key,
               partition: partition,
               partitionCount: partitionCount,
               content: content} = payload;

        const loadCurrentChunk = (): Promise<Set<number>> => {
          return this.loadChunkIntoCache(key, partition, content);
        };

        const updateCacheIfEmpty = ((cacheSet: Set<number>): Promise<Set<number>> => {
          if (cacheSet.size > 0) return loadCurrentChunk();
          // This chunk belongs to file which has not been yet processed
          // in current batch. Check if file was processed previously
          // and load chunks from S3
          return this.loadFromStorage(key).then(loadCurrentChunk);
        });

        const publishIfCompleted = ((cacheSet: Set<number>): Promise<boolean> => {
          // finish if file not yet completed
          if (cacheSet.size < partitionCount) return Promise.resolve(true);

          const publishBuffer = ((buffer: Buffer): Promise<boolean> => {
            return this._publisher.post(key, buffer)
          });

          const clean = (): Promise<boolean> => {
            return this.cleanKey(key, cacheSet)
          };

          return this.readChunksFromBuffer({ key, cacheSet })
            .then(publishBuffer)
            .then(clean);
        });

        const errorHandler = (err: { message: string }): Promise<never> => {
          this._logger.error(err.message, []);
          return Promise.reject(err);
        };

    const updatedCacheSet = await this._cache.get(key).then(updateCacheIfEmpty);

    return publishIfCompleted(updatedCacheSet)
      .catch(errorHandler);
  }

  public persistIncompletedWork(): Promise<boolean> {

    const readChunkInfo = async (key: string, partition: number): Promise<Chunk> => {
      const content = await this._localStorage.get(key, partition);
      return { partition, content };
    }

    const processKey = ((key: string): Promise<boolean> => {
      return this._cache.get(key).then(cacheSet => {
        if (cacheSet) {
          const promisesChunks = Array.from(cacheSet).map(partition => {
              return readChunkInfo(key, partition);
          });

          return Promise.all(promisesChunks).then(chunkToStore => {
            return this._storage.put(key, chunkToStore);
          });

        }
        
        return false;
      })
    });

    const iterateOverKeys = (keys: string[]): Promise<boolean> => {
      const promises = keys.map(processKey);
      return Promise.all(promises).then((): boolean => {
        return true;
      })
    };

    const errorHandler = (err: { message: string }): Promise<boolean> => {
      this._logger.error(err.message, []);
      return Promise.reject(err);
    };

    return this._cache.allKeys()
      .then(iterateOverKeys)
      .catch(errorHandler);
  }

  private loadChunkIntoCache(key: string, partition: number, content: string): Promise<Set<number>> {
    this._localStorage.put(key, partition, content);
    return this._cache.push(key, partition);
  }

  private loadFromStorage(key: string): Promise<Set<number>> {

    const loadChunks = (chunks: Chunk[]): Promise<Set<number>> => {
      for (const { partition, content } of chunks) {
        this.loadChunkIntoCache(key, partition, content);
      }
      return this._cache.get(key);
    };

    return this._storage.get(key).then(loadChunks);
  }

  private readChunksFromBuffer({ key, cacheSet }: { key: string; cacheSet: Set<number> }): Promise<Buffer> {
    const decodeBuffer = (chunk: string): Buffer => {
      return Buffer.from(chunk, "base64")
    };

    const getObject = (partition: number): Promise<Buffer> => {
      return this._localStorage.get(key, partition).then(decodeBuffer)
    };

    const promises = Array.from(cacheSet).map(getObject);

    return Promise.all(promises).then(chunks => {
      return Buffer.concat(chunks)
    });
  }

  private cleanKey(key: string, cacheSet: Set<number> | undefined): Promise<boolean> {

    const deleteChunk = (chunkNumber: number): Promise<boolean> => { return this._localStorage.delete(key, chunkNumber) };

    if (cacheSet) {
      const promises = Array.from(cacheSet).map(deleteChunk);
      return Promise.all(promises).then(() => this._cache.delete(key));
    }

    return Promise.resolve(true);
  }
}
