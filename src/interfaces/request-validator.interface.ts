
import { ValidatorResult } from "jsonschema";

export interface ValidatorInterface {
    checkAgainstSchema(body: object): ValidatorResult;
}
