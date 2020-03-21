export interface PublisherInterface {
    post(uri: string, body: object): Promise<boolean>;
}
