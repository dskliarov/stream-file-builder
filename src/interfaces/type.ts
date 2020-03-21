type Payload = {putEndpoint: string; partition: number; partitionCount: number; content: string}
type Chunk = {partition: number; content: string};  

type LogTag = {key: string; value: object};

export { Payload, Chunk, LogTag };