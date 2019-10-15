import {InsightError} from "../controller/IInsightFacade";

export class QueryObject {

    private where: any;
    private columns: string[];
    private order: string | null;
    private queryId: string;
    private datasetIds: string[];

    public get where_(): any {
        return this.where;
    }

    public get columns_(): string[] {
        return this.columns;
    }

    public get order_(): string | null {
        return this.order;
    }

    public get queryId_(): string {
        return this.queryId;
    }

    constructor(query: any, datasetIds: string[]) {
        this.datasetIds = datasetIds;
        this.order = null;

        QueryObject.assertObjectByKeys(query, ["OPTIONS", "WHERE"]);
        this.where = query["WHERE"];
        const options = query["OPTIONS"];

        try {
            QueryObject.assertObjectByLength(this.where, 1);
        } catch (err) {
            QueryObject.assertObjectByLength(this.where, 0);
        }

        try {
            QueryObject.assertObjectByKeys(options, ["COLUMNS", "ORDER"]);
            this.order = options["ORDER"];
            QueryObject.assertType(this.order, "string");
        } catch (err) {
            QueryObject.assertObjectByKeys(options, ["COLUMNS"]);
        }
        this.columns = options["COLUMNS"];

        this.assertArray(this.columns, false);
        this.queryId = this.columns[0].split("_")[0];
        this.columns.forEach((c) => {
            this.assertKeyValid(c);
            if (this.queryId !== c.split("_")[0]) {
                throw new InsightError("Cannot query from two datasets");
            }
        });

        if (!this.columns.includes(this.order) && this.order !== null) {
            throw new InsightError("Columns does not contains order");
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

    private static assertObjectByLength(obj: any, length: number) {
        if (!(Object.keys(obj).length === length)) {
            throw new InsightError("Object not contains right amount of keys");
        }
    }

    private assertArray(arr: any, canBeEmpty: boolean) {
        if (!(arr instanceof Array)) {
            throw new InsightError("Unexpected non-array in JSON");
        } else if (arr.length === 0 && !canBeEmpty) {
            throw new InsightError("Array Cannot be empty");
        }
    }

    private assertKeyValid(key: string) {
        if (!/^[^_]+_[^_]+$/.test(key)) {
            throw new InsightError("Format of key not right");
        } else if (!this.datasetIds.includes(key.split("_")[0])) {
            throw new InsightError("Dataset not exists");
        }
    }

    private static assertRegexValid(regex: string) {
        if (!/^\*?[^\*]*\*?$/.test(regex)) {
            throw new InsightError("WildCard format not right");
        }
    }
}
