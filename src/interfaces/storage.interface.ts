import { Chunk } from "../interfaces/type"

export interface StorageInterface {
    put(key: string, chunks: Chunk[]): Promise<boolean>;
    get(key: string): Promise<Chunk[]>;
    delete(key: string): Promise<boolean>;
}
