export interface CacheInterface {
    push(key: string, chunkNumber: number): Promise<Set<number>>;
    get(key: string): Promise<Set<number>>;
    delete(key: string): Promise<boolean>;
    allKeys(): Promise<string[]>;
}
