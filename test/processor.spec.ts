import { sampleData } from "../sample_data/records";
import { Processor } from '../src/services/processor.class';
import container from "../src/utilities/ioc.config";
import { StorageInterface } from '../src/interfaces/storage.interface';
import { PublisherInterface } from '../src/interfaces/publisher.interface';

import { TYPES } from "../src/utilities/types";

const PublisherMock = jest.fn<PublisherInterface>(params => ({

  post: jest.fn(() => {
    return new Promise((resolve, reject) => {
      if (params.post.throwError) {
        reject(params.post.error);
      } else {
        resolve(params.post.data);
      }
    })
  }),

}));

const StorageMock = jest.fn<StorageInterface>(params => ({

  put: jest.fn(() => {
    return new Promise((resolve, reject) => {
      if (params.put.throwError) {
        reject(params.write.error);
      } else {
        resolve(params.put.data);
      }
    })

  }),

  get: jest.fn(() => {
    return new Promise((resolve, reject) => {
      if (params.get.throwError) {
        reject(params.write.error);
      } else {
        resolve(params.get.data);
      }
    })
  }),

}));

// Test Scenario: 1
// Process 3 out of 3 kinesis packets
// file must be created and posted to the specified uri
// PersistIncompletedWork, should not call storage.put
it('Test 3 out of 3 chunks (system is empty)', async () => {

  const publisherMock = new PublisherMock({ post: { data: true } });
  const storageMock = new StorageMock({ get: { data: [] } });

  container.rebind(TYPES.IPublisher).toConstantValue(publisherMock);
  container.rebind(TYPES.IStorage).toConstantValue(storageMock);

  const data = sampleData();
  const processor = new Processor(container);

  await processor.run(data[0]);
  await processor.run(data[1]);
  await processor.run(data[2]);

  const result = await processor.persistIncompletedWork();
  expect(result).toBe(true);
  // Try Get previously stored data for the processing key
  // Must be called only once and copy data to local cache
  expect(storageMock.get).toHaveBeenCalledTimes(1);
  // There is no unfinished data left in local cache,
  // so there is nothing to store in S3 
  expect(storageMock.put).toHaveBeenCalledTimes(0);
  // File been published to the URI
  expect(publisherMock.post).toHaveBeenCalledTimes(1);
});

// Test Scenario: 2
// Process 2 out of 3 kinesis packets
// file will not be created and posted to specified uri
// PersistIncompletedWork, must call storage.put
// Publisher.put should not be called
it('Test 2 out of 3 chunks (system is empty)', async () => {

  const publisherMock = new PublisherMock({ post: { data: true } });
  const storageMock = new StorageMock({ get: { data: [] }, put: { data: true} });

  container.rebind(TYPES.IPublisher).toConstantValue(publisherMock);
  container.rebind(TYPES.IStorage).toConstantValue(storageMock);

  const data = sampleData();
  const processor = new Processor(container);

  await processor.run(data[3]);
  await processor.run(data[4]);

  const result = await processor.persistIncompletedWork();
  expect(result).toBe(true);
  // Try Get previously stored data for the processing key
  // Must be called only once and copy data to local cache
  expect(storageMock.get).toHaveBeenCalledTimes(1);
  // There is unfinished chunks present in local cache
  // Store unfinished chunks in S3
  expect(storageMock.put).toHaveBeenCalledTimes(1);
  // Chunks were not finished, so there is nothing to post
  expect(publisherMock.post).toHaveBeenCalledTimes(0);
});

// Test Scenario: 3
// Process 2 out of 3 kinesis packets
// 1 out of 3 chunks, was processed in previous batch and 
// had been stored in S3 storage
// file will be created and posted to specified uri
// PersistIncompletedWork, should not call storage.put
it('Test 2 out of 3 chunks (system process 1 of 3 chunks prior)', async () => {

  const data = sampleData();
  const {partition, content} = data[0];
  const chunk = {partition, content};
  const publisherMock = new PublisherMock({ post: { data: true } });
  const storageMock = new StorageMock({ get: { data: [chunk] }, put: { data: true} });

  container.rebind(TYPES.IPublisher).toConstantValue(publisherMock);
  container.rebind(TYPES.IStorage).toConstantValue(storageMock);

  const processor = new Processor(container);

  await processor.run(data[1]);
  await processor.run(data[2]);

  const result = await processor.persistIncompletedWork();
  expect(result).toBe(true);
  // Try Get previously stored data for the processing key
  // Must be called only once and copy data to local cache
  expect(storageMock.get).toHaveBeenCalledTimes(1);
  // There is no unfinished data eeft in local cache,
  // so there is nothing to store in S3 
  expect(storageMock.put).toHaveBeenCalledTimes(0);
  // File been published to the URI
  expect(publisherMock.post).toHaveBeenCalledTimes(1);
});