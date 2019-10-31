import {InsightError} from "../controller/IInsightFacade";
import {AssertionUtils} from "../utils/AssertionUtils";

export class QueryObject {

    private where: any;
    private columns: string[];
    private orderKeys: string[];
    private isDirUp: boolean;
    private groupCols: string[];
    private applies: any[];

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

    public get groupCols_(): string[] {
        return this.groupCols;
    }

    public get apply_(): any[] {
        return this.applies;
    }

    constructor(query: any, datasetIds: string[]) {
        // this.datasetIds = datasetIds;
        this.orderKeys = [];

        AssertionUtils.assertObjectByKeysWithOption(query, ["OPTIONS", "WHERE"], "TRANSFORMATIONS");
        this.where = query["WHERE"];
        const options = query["OPTIONS"];

        // check where
        try {
            AssertionUtils.assertObjectByLength(this.where, 1);
        } catch (err) {
            AssertionUtils.assertObjectByLength(this.where, 0);
        }

        // check order
        AssertionUtils.assertObjectByKeysWithOption(options, ["COLUMNS"], "ORDER");
        const order = options["ORDER"];
        this.isDirUp = true;
        if (typeof order === "string") {
            this.orderKeys.push(order);
        } else if (!(order === undefined)) {
            AssertionUtils.assertObjectByKeys(order, ["dir", "keys"]);
            this.orderKeys = order["keys"];
            AssertionUtils.assertArray(this.orderKeys, false);
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
        AssertionUtils.assertArray(this.columns, false);

        // check transformations
        this.setupTransformations(query["TRANSFORMATIONS"]);
    }

    public getId(): string {
        for (const column of this.columns) {
            if (column.includes("_")) {
                return column.split("_")[0];
            }
        }
        const app = this.applies[0];
        let temp = app[Object.keys(app)[0]];
        temp = temp[Object.keys(temp)[0]];
        return temp.split("_")[0];
    }

    private setupTransformations(trans: any) {
        this.groupCols = null;
        this.applies = null;
        if (trans !== undefined) {
            AssertionUtils.assertObjectByKeys(trans, ["GROUP", "APPLY"]);
            this.groupCols = trans["GROUP"];
            AssertionUtils.assertArray(this.groupCols, false);
            this.applies = trans["APPLY"];
            AssertionUtils.assertArray(this.applies, true);

            // applies keys should not contain _ and every sub objects should have one column
            const applyKeys: string[] = [];
            for (const app of this.applies) {
                AssertionUtils.assertObjectByLength(app, 1);
                const applyKey = Object.keys(app)[0];
                AssertionUtils.assertObjectByLength(app[applyKey], 1);
                if (applyKey.includes("_") || applyKey.length === 0) {
                    throw new InsightError("Apply key format invalid");
                } else if (applyKeys.includes(applyKey)) {
                    throw new InsightError("Duplicated apply keys");
                }
                applyKeys.push(applyKey);
            }

            // all columns should be found in group
            for (const column of this.columns) {
                if (!this.groupCols.includes(column) && column.includes("_")) {
                    throw new InsightError("Column must be able to be found in group");
                }
            }
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
