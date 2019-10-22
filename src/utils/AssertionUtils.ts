import {InsightError} from "../controller/IInsightFacade";

export class AssertionUtils {

    public static assertObjectByKeys(obj: any, keys: string[]) {
        if (!(Object.keys(obj).length === keys.length)) {
            throw new InsightError("Object contains too many keys");
        }
        for (const key of keys) {
            if (!obj.hasOwnProperty(key)) {
                throw new InsightError("JSON structure error");
            }
        }
    }

    public static assertObjectByKeysWithOption(obj: any, keys: string[], option: string) {
        try {
            this.assertObjectByKeys(obj, keys);
        } catch (err) {
            keys.push(option);
            this.assertObjectByKeys(obj, keys);
        }
    }

    public static assertObjectByLength(obj: any, length: number) {
        if (!(Object.keys(obj).length === length)) {
            throw new InsightError("Object not contains right amount of keys");
        }
    }

    public static assertArray(arr: any, canBeEmpty: boolean) {
        if (!(arr instanceof Array)) {
            throw new InsightError("Unexpected non-array in JSON");
        } else if (arr.length === 0 && !canBeEmpty) {
            throw new InsightError("Array Cannot be empty");
        }
    }

    public static assertType(val: any, type: string) {
        if (typeof val !== type) {
            throw new InsightError("Type mismatch");
        }
    }

    public static assertDefined(val: any) {
        if (val === undefined) {
            throw new InsightError("Data not defined");
        }
    }

}
