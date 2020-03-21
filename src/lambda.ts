import container from "./utilities/ioc.config";

import { TYPES } from "./utilities/types"

import { LoggerInterface } from "./interfaces/logger.interface";
import { Processor } from "./services/processor.class";

exports.handler = async (event: { Records: any[] }): Promise<any> => {
    const logger = container.get<LoggerInterface>(TYPES.ILogger);
    const processor = new Processor(container);

    logger.info("handle kinesis message. Start processing", []);

    const processRecord = async (record: { data: string }): Promise<boolean> => {
        const buffer = Buffer.from(record.data, 'base64').toString('utf-8');
        const payload = JSON.parse(buffer);
        return processor.run(payload);
    }

    // Process batch of records
    for (const record of event.Records) {
      await processRecord(record);
    }

    logger.info("Finins processing kinesis message. Persisting incompleted chunks", []);

    // Persist all incompleted chunks for future processing
    processor.persistIncompletedWork();
}
