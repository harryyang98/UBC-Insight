import * as fs from "fs";
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
        fs.writeFileSync(this.path + id, new Uint8Array(Buffer.from(data.toString())));
    }

    public getDataset(id: string): any[] {
        if (!this.containsDataset(id)) {
            throw new InsightError("Dataset not found");
        }

        if (Object.keys(this.caches).includes(id)) {
            return this.caches[id];
        }

        return JSON.parse(fs.readFileSync(this.path + id, "utf-8"));
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
        fs.unlinkSync(this.path + id);
    }

    public containsDataset(id: string): boolean {
        if (Object.keys(this.caches).includes(id)) {
            return true;
        }

        return fs.existsSync(this.path + id);
    }

    public getKeys(): string[] {
        const keys = Object.keys(this.caches);
        for (const key of fs.readdirSync(this.path)) {
            if (!keys.includes(key)) {
                keys.push(key);
            }
        }

        return keys;
    }

}
