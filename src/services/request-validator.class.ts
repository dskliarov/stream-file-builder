import { injectable, inject } from "inversify";
import "reflect-metadata";
import { LoggerInterface } from '../interfaces/logger.interface';
import { ValidatorInterface } from '../interfaces/request-validator.interface';
import { TYPES } from "../utilities/types";
import { Validator, ValidatorResult } from "jsonschema";

@injectable()
export class RequestValidator implements ValidatorInterface {

    private _logger!: LoggerInterface;
    private _validator!: Validator;

    /**
     * Payload schema
     * {
     *   "putEndpoint" : "https://www.example.com/image.jpg",
     *   "partitionCount": 10,
     *   "content" : "aGVsbG8gd29ybGQh"
     * }
     */
    private _schema: object = { "putEndpoint": "string",
                                "partition": "number",
                                "partitionCount": "number",
                                "content": "string"
                              };

    public constructor(
        @inject(TYPES.ILogger) logger: LoggerInterface
    ) {
        this._logger = logger;
        this._validator = new Validator();
    }

    public checkAgainstSchema(body: object): ValidatorResult  {
        const validationResult = this._validator.validate(body, this._schema);
        this._logger.info(validationResult.toString(), []);
        return validationResult;
    }
}
