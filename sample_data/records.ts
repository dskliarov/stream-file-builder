import * as randomstring from "randomstring";
import { Payload } from "../src/interfaces/type";
import { Base64 } from 'js-base64';

const data = (): Payload[] => {
  
    const randomcontent = () => {
        const str = randomstring.generate({
            length: 1024,
            charset: 'hex'
        });
        return Base64.encode(str);
    };

    const sample = (partition: number, partitionCount: number, key: string): Payload => {
        /**
         * Payload schema
         * {
         *   "putEndpoint" : "https://www.example.com/image.jpg",
         *   "partition": partition,
         *   "partitionCount": partitionCount,
         *   "content" : "aGVsbG8gd29ybGQh"
         * }
         */
        return {
            putEndpoint: `https://${key}`,
            partition: partition,
            partitionCount: partitionCount,
            content: randomcontent()
        };
    };

    return [
        sample(1, 3, "key1"),
        sample(2, 3, "key1"),
        sample(3, 3, "key1"),
        sample(1, 3, "key2"),
        sample(3, 3, "key2")
    ];
}

export { data as sampleData };