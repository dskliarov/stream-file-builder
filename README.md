# Streaming File Builder

Given file contents written to a Kinesis Stream in partitioned chunks, derive an AWS Lambda
backed solution for aggregating all partitions to a single file and uploading it to a specified
destination.

# Sample Payload Format

```json
{
  // the endpoint you’ll use to upload the file via HTTP PUT
  // when uploading the file, explicitly set the content type to null
  // this endpoint will also act as a unique identifier for a file
  "putEndpoint" : "https://www.example.com/image.jpg",
  // partition number of the current chunk
  "partition": 0,
  // total partition count
  "partitionCount": 10,
  // base64 encoded bytes for current chunk
  "content" : "aGVsbG8gd29ybGQh"
}
```

# Solution explained

Kinesis records will be buffered to avoid invoking lambda function for every record. Described architecture will work for processing only one batch and will not work in case of multiple shards and parallel processing batches. Changes required to support multiple shards will be described below.

## The brief description of the solution architecture

Lambda package will contain following components:

  * Request validator
  * Cache
  * Local storage
  * Remote storage 
  * Config 
  * Logger

Let's describe each component

### Request validator
Request validator, process JSON schema validation of received payload.

### Cache component
Cache component is in-memory key/value store.

"putEndpoint" will serve as a Key;
Object stored is a Set<number>, which will contain processed partition numbers.

#### Component API
    Push partition number to the Set stored with processed "putEndpoint" key
  * push(key: string, chunkNumber: number): Promise<Set<number>>;

    Retreive Set object stored with "putEndpoint" key
  * get(key: string): Promise<Set<number>>;

    Delete object stored with "putEndpoint" key
  * delete(key: string): Promise<boolean>;

    Retrieve all "putEndpoint" keys, stored in cache    
  * allKeys(): Promise<string[]>;

## Local storage
Local storage will save payload content in a local file system in a file with "putEndpoint"-partition filename
Files will be stored in /temp directory of lambda container. Data will survive between invokes as soon as contaner
is "warm". Function is not relying on local data and will store all uprocessed data in AWS S3.

#### Component API
    "putEndpoint" will be sanitize to remove incompatible characters

    Store content in a file for "putEndpoint" and partition number
  * put(key: string, chunkNumber: number, chunk: string): Promise<boolean>;

    Read content from file with "putEndpoint"-partition filename
  * get(key: string, chunkNumber: number): Promise<string>;
  
    Delete file with "putEndpoint"-partition filename
  * delete(key: string, chunkNumber: number): Promise<boolean>;

## Remote storage
Remote storage is an AWS S3 object store. List of objects with a model {partition: number, content: string} will be stored per "putEndpoint" as a key

#### Component API
    Store objects with "putEndpoint" key
  * put(key: string, chunks: Chunk[]): Promise<boolean>;

    Read object stored with the "putEndpoint" key
  * get(key: string): Promise<Chunk[]>;

    Remove object stored with "putEndpoint" key
  * delete(key: string): Promise<boolean>;


## Config
Configuration component is a helper component, which read configuration from Environment Variables setup for the lambda. One of the option and recommendation for large IAC infrastructure is to use parameter store for convenient and centralised configuration.

#### Component API

    S3 Bucket name, setup in S3_BUCKET Environment variable
  * s3Bucket(): string;

    Log level, setup in LOG_LEVEL Environment variable. Setting will allow to change Log Level to enable tracing and debugging and avoid the noise in production 
  * logLevel(): Level;


## Basic flow description
Upon receiving kinesis record, payload will be extracted and passed to the processor. Processor will validate payload against JSON schema and in case of an error, will reject the record and move to the next one. 
If payload is valid, Cache component will be queried to retriev a Set stored for the "putEndpoint", in case if other chunks with the same "putEndpoint" were processed previously. Cache component always will return a Set object. Set object could be an empty in case if other chunks were not have been processed or been processed during another batch and container was recycled. In case of an empty Set, remote storage(AWS S3) will be queried. If other chunks were processed and uncompleted chunks were stored, remote storage will return a list of {partition, content} object and load into the Cache and the local storage. 
After processing the current chunk, the Set object, stored in the Cache will be avaluated and if a size of the object is equal to the partition count,  
all chunks of the object had been received and are ready for construction of an object and posting to the URI.
As soon as all batch items would be processed, all incompleted chunks will be stored to the AWS S3

## Pros and Cons of implemented solution
As been sad previously, this solution will not work in case of multiple shards and parallel batch processing. 
On a positive side, this solution will minimize calls to the AWS S3. This is very inexpensive solution and in case, if perfomance will satisfy to the recieving stream, we can use this implementation.

## Suggested improvements for scalable, multi-shards solution
In case of parallel batch processing, Cache and local storage as it implemented in current solution must be refactored to use Dynamo DB or Redis. The maximum size of the Kinesis packet will not exceed 1MB, so the data volume will not be a concerne. In case of object with large amount partitions, we can use multi-part S3 uploads. 


## Available commands

#### Build the project
```
yarn install
yarn build
```

#### Apply the linter
```
yarn lint
```

#### Run test
```
yarn test
```

#### Relise package
```
yarn package
```