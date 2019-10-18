import {InsightError} from "../controller/IInsightFacade";

export class QueryObject {

    private where: any;
    private columns: string[];
    private orderKeys: string[];
    private queryId: string;
    // private datasetIds: string[];
    private isDirUp: boolean;
    private groupCols: string[];
    private apply: any;

    public get where_(): any {
        return this.where;
    }

    public get columns_(): string[] {
        return this.columns;
    }

    public get orderKeys_(): string[] {
        return this.orderKeys;
    }

    public get isDirUp_(): boolean {
        return this.isDirUp;
    }

    public get queryId_(): string {
        return this.queryId;
    }

    public get groupCols_(): string[] {
        return this.groupCols;
    }

    public get apply_(): any[] {
        return this.apply;
    }

    constructor(query: any, datasetIds: string[]) {
        // this.datasetIds = datasetIds;
        this.orderKeys = [];

        QueryObject.assertObjectByKeysWithOption(query, ["OPTIONS", "WHERE"], "TRANSFORMATIONS");
        this.where = query["WHERE"];
        const options = query["OPTIONS"];

        // check where
        // TODO: should add seperated where object
        try {
            QueryObject.assertObjectByLength(this.where, 1);
        } catch (err) {
            QueryObject.assertObjectByLength(this.where, 0);
        }

        // check order
        QueryObject.assertObjectByKeysWithOption(options, ["COLUMNS"], "ORDER");
        const order = options["ORDER"];
        this.isDirUp = true;
        if (typeof order === "string") {
            this.orderKeys.push(order);
        } else if (!(order === undefined)) {
            QueryObject.assertObjectByKeys(order, ["dir", "keys"]);
            this.orderKeys = order["keys"];
            QueryObject.assertArray(this.orderKeys, false);
            if (order["dir"] === "DOWN") {
                this.isDirUp = false;
            } else if (!(order["dir"] === "UP")) {
                throw new InsightError("Dir value not valid");
            }
        }
        this.columns = options["COLUMNS"];
        for (const orderKey of this.orderKeys) {
            if (!this.columns.includes(orderKey)) {
                throw new InsightError("Order key must be found in columns");
            }
        }

        // check columns
        QueryObject.assertArray(this.columns, false);
        this.queryId = this.columns[0].split("_")[0];

        // check group columns
        const trans = query["TRANSFORMATIONS"];
        this.groupCols = null;
        this.apply = null;
        if (trans !== undefined) {
            this.groupCols = trans["GROUP"];
            this.apply = trans["APPLY"];
        }
    }

    private static assertType(val: any, type: string) {
        if (!(typeof val === type)) {
            throw new InsightError("Value Type mismatch");
        }
    }

    private static assertObjectByKeys(obj: any, keys: string[]) {
        if (!(Object.keys(obj).length === keys.length)) {
            throw new InsightError("Object contains too many keys");
        }
        for (const key of keys) {
            if (!obj.hasOwnProperty(key)) {
                throw new InsightError("JSON structure error");
            }
        }
    }

    private static assertObjectByKeysWithOption(obj: any, keys: string[], option: string) {
        try {
            this.assertObjectByKeys(obj, keys);
        } catch (err) {
            keys.push(option);
            this.assertObjectByKeys(obj, keys);
        }
    }

    private static assertObjectByLength(obj: any, length: number) {
        if (!(Object.keys(obj).length === length)) {
            throw new InsightError("Object not contains right amount of keys");
        }
    }

    private static assertArray(arr: any, canBeEmpty: boolean) {
        if (!(arr instanceof Array)) {
            throw new InsightError("Unexpected non-array in JSON");
        } else if (arr.length === 0 && !canBeEmpty) {
            throw new InsightError("Array Cannot be empty");
        }
    }

    // private static assertString(str: any): string {
    //     if (!(typeof str === "string")) {
    //         throw new InsightError("Field should be string");
    //     }
    //     return str;
    // }
    //
    // private assertKeyValid(key: string) {
    //     if (!/^[^_]+_[^_]+$/.test(key)) {
    //         throw new InsightError("Format of key not right");
    //     } else if (!this.datasetIds.includes(key.split("_")[0])) {
    //         throw new InsightError("Dataset not exists");
    //     }
    // }
    //
    // private static assertRegexValid(regex: string) {
    //     if (!/^\*?[^\*]*\*?$/.test(regex)) {
    //         throw new InsightError("WildCard format not right");
    //     }
    // }
}
