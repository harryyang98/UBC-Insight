import * as fs from "fs-extra";
import {InsightError, NotFoundError} from "../controller/IInsightFacade";

export class Datasets {

    private readonly caches: {[id: string]: any[]}; // memory caches datasets
    private readonly path: string = "./data/";

    public constructor() {
        this.caches = { };
    }

    public addDataset(id: string, data: any[]) {
        if (this.containsDataset(id)) {
            throw new InsightError("Cannot add datasets with duplicated ids");
        }
        // save to memory cache
        this.caches[id] = data;

        // save to disk
        fs.writeFileSync(this.path + id, new Uint8Array(Buffer.from(JSON.stringify(data))));
    }

    public getDataset(id: string): any[] {
        // if (!this.containsDataset(id)) {
        //     throw new InsightError("Dataset not found");
        // }

        this.loadDataset(id);
        return this.caches[id];
    }

    public removeDataset(id: string) {
        if (!this.containsDataset(id)) {
            throw new NotFoundError("Dataset not exists");
        }

        // remove from memory cache
        if (Object.keys(this.caches).includes(id)) {
            delete this.caches[id];
        }

        // remove from disk
        fs.removeSync(this.path + id);
    }

    public containsDataset(id: string): boolean {
        if (Object.keys(this.caches).includes(id)) {
            return true;
        }

        return fs.existsSync(this.path + id);
    }

    public getIds(): string[] {
        const keys = Object.keys(this.caches);
        for (const key of fs.readdirSync(this.path)) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }

        return keys;
    }

    private loadDataset(id: string) {
        if (Object.keys(this.caches).includes(id)) {
            return;
        }

        this.caches[id] = JSON.parse(fs.readFileSync(this.path + id, "utf-8"));
    }

    public static isIdValid(id: string): boolean {
        if (typeof id !== "string") {
            return false;
        } else if (id.includes("_")) {
            return false;
        }
        for (const c of id) {
            if (c !== " ") {
                return true;
            }
        }
        return false;
    }
}
