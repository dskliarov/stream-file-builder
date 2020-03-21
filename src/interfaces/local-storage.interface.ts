export interface LocalStorageInterface {
    put(key: string, chunkNumber: number, chunk: string): Promise<boolean>;
    get(key: string, chunkNumber: number): Promise<string>;
    delete(key: string, chunkNumber: number): Promise<boolean>;
}
