import { Container } from "inversify";
import { TYPES } from "./types";
import { CacheInterface } from '../interfaces/cache.interface';
import { ConfigInterface } from '../interfaces/config.interface';
import { LoggerInterface } from '../interfaces/logger.interface';
import { PublisherInterface } from '../interfaces/publisher.interface';
import { ValidatorInterface } from '../interfaces/request-validator.interface';
import { StorageInterface } from '../interfaces/storage.interface';
import { LocalStorageInterface } from '../interfaces/local-storage.interface';
import { Cache } from "../services/cache.class";
import { Config } from "../services/config.class";
import { Logger } from "../services/logger.class"
import { Publisher } from "../services/publisher.class"
import { RequestValidator } from "../services/request-validator.class"
import { Storage } from "../services/storage.class"
import { LocalStorage } from "../services/local-storage.class"

const container = new Container();
container.bind<CacheInterface>(TYPES.ICache).to(Cache);
container.bind<ConfigInterface>(TYPES.IConfig).to(Config);
container.bind<LoggerInterface>(TYPES.ILogger).to(Logger);
container.bind<PublisherInterface>(TYPES.IPublisher).to(Publisher);
container.bind<ValidatorInterface>(TYPES.IValidator).to(RequestValidator);
container.bind<StorageInterface>(TYPES.IStorage).to(Storage);
container.bind<LocalStorageInterface>(TYPES.ILocalStorage).to(LocalStorage);

export default container;
