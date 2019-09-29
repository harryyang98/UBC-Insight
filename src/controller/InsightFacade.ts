import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";
import {SetUtils} from "../SetUtils";
import {DataUtils} from "../DataUtils";
import {Datasets} from "../model/Datasets";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private readonly datasets: Datasets;

    constructor() {
        this.datasets = new Datasets();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id.includes("_") || id.trim().length === 0 || typeof id !== "string") {
            return Promise.reject(new InsightError("Field id format not valid"));
        } else if (Object.keys(this.datasets).includes(id)) {
            return Promise.reject(new InsightError("Cannot add with duplicated id"));
        } else if (kind !== InsightDatasetKind.Courses) {
            return Promise.reject(new InsightError("Invalid or not implemented dataset kind"));
        }

        const dataset: any[] = [];
        return new Promise((resolve, reject) => {
            // unzip string and read data to courseSets
            JSZip.loadAsync(content, {base64: true}).then<JSZip>((zip) => {
                return Promise.resolve(zip);
            }).then<any[]>((zip) => {
                return DataUtils.extractZip(zip);
            }).then((courseLists) => {
                for (const courseList of courseLists) {
                    const temp: any[] = [];
                    try {
                        for (const result of courseList) {
                            // add result to dataset
                            temp.push(DataUtils.convertData(result));
                        }
                    } catch (err) { continue; }
                    dataset.push(...temp);
                }

                if (dataset.length === 0) {
                    return Promise.reject(new InsightError("The zip must contain at least one course"));
                }
                this.datasets.addDataset(id, dataset);
                resolve(Object.keys(this.datasets));
            }).catch((err) => reject(new InsightError(err.message)));
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (id.trim().length === 0 || typeof id !== "string") {
            return Promise.reject(new InsightError("Id format not right"));
        }

        const self = this;
        return new Promise((resolve, reject) => {
            try {
                self.datasets.removeDataset(id);
            } catch (err) { return reject(err); }

            resolve(id);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const datasets = this.datasets;
        return new Promise<InsightDataset[]>((resolve, reject) => {
            const insightDatasets: InsightDataset[] = [];

            for (const id of datasets.getKeys()) {
                // check dataset kind
                let datasetKind = InsightDatasetKind.Rooms;
                if (Object.keys(datasets.getDataset(id)[0]).includes("dept")) {
                    datasetKind = InsightDatasetKind.Courses;
                }

                insightDatasets.push({
                    id: id,
                    kind: datasetKind,
                    numRows: datasets.getDataset(id).length
                });
            }

            resolve(insightDatasets);
        });
    }

    public performQuery(query: any): Promise <any[]> {
        const queryKeys = Object.keys(query);
        if (queryKeys.length !== 2 || !queryKeys.includes("OPTIONS") || !queryKeys.includes("WHERE")) {
            return Promise.reject(new InsightError("JSON has more keys than excepted"));
        }

        const self = this;
        return new Promise<any>((resolve, reject) => {
            try {
                // extract dataset id from query
                const id: string = query["OPTIONS"]["COLUMNS"][0].split("_")[0];
                if (!Object.keys(self.datasets).includes(id)) {
                    return reject(new InsightError("Dataset not exists"));
                }

                // find all the courses matching where
                const courseSet = self.findCourses(query["WHERE"], id);

                // select specific columns and add to results
                const results: any[] = new Array(0);
                const columns: string[] = query["OPTIONS"]["COLUMNS"];
                for (const column of columns) {
                    if (!/^[^_]+_[^_]+$/.test(column)) {
                        return reject(new InsightError("Invalid key format in columns"));
                    }
                }
                for (const course of courseSet) {
                    const result: any = { };
                    for (const column of columns) {
                        if (Object.keys(self.datasets.getDataset(id)[course]).includes(column.split("_")[1])) {
                            result[column] = self.datasets.getDataset(id)[course][column.split("_")[1]];
                        } else {
                            return reject(new InsightError("Key in columns not exists in dataset: " + column));
                        }
                    }
                    results.push(result);
                }

                // order the column
                if (Object.keys(query["OPTIONS"]).includes("ORDER")) {
                    if (!query["OPTIONS"]["COLUMNS"].includes(query["OPTIONS"]["ORDER"])) {
                        return reject(new InsightError("Value of ORDER not exists in COLUMNS"));
                    }
                    results.sort((a, b) => InsightFacade.compareResults(a, b, query["OPTIONS"]));
                }

                if (results.length > 5000) {
                    return reject(new ResultTooLargeError());
                }
                resolve(results);
            } catch (err) { reject(new InsightError(err.message)); }
        });
    }

    private findCourses(filter: any, id: string): Set<number> {
        const dataset = this.datasets.getDataset(id);
        const allCourses = new Set(Array.from(Array(dataset.length).keys()));
        if (Object.keys(filter).length === 0) {
            return allCourses;
        } else if (Object.keys(filter).length > 1) {
            throw new InsightError("There cannot be more than one object in WHERE");
        }

        const comparator: string = Object.keys(filter)[0];
        if (filter[comparator] instanceof Array) {
            const subSets: Array<Set<number>> = [];
            for (const subFilter of filter[comparator]) {
                subSets.push(this.findCourses(subFilter, id));
            }
            if (subSets.length === 0) {
                throw new InsightError("AND and OR must have at least one element");
            }

            if (comparator === "OR") {
                return SetUtils.union(subSets);
            } else if (comparator === "AND") {
                return SetUtils.intersecion(subSets);
            }
        } else {
            const filterContent = filter[comparator];
            if (comparator === "NOT") {
                return SetUtils.complementary(this.findCourses(filterContent, id), allCourses);
            }

            // filter courses
            if (!(Object.keys(filterContent).length === 1)) {
                throw new InsightError("Filter content should have one and only one key");
            }
            const contentKey = Object.keys(filterContent)[0];
            const contentValue = filterContent[contentKey];
            if (!/^[^_]+_[^_]+$/.test(contentKey)) {
                throw new InsightError("Invalid key format in filter content");
            } else if (contentKey.split("_")[0] !== id) {
                throw new InsightError("Cannot query from two datasets");
            }
            const datasetKey = contentKey.split("_")[1];
            return InsightFacade.filterCourses(dataset, allCourses, datasetKey, contentValue, comparator);
        }

        throw new InsightError("Invalid comparator when finding courses");
    }

    private static filterCourses(
        dataset: any[],
        allCourses: Set<number>,
        key: string,
        value: any,
        comparator: string
    ): Set<number> {
        if (!Object.keys(dataset[0]).includes(key)) {
            throw new InsightError("Key in filter content not found in dataset");
        }

        const mapping: any = { };
        mapping["IS"] = ["string", (a: any, regex: any) => {
            if (!regex.includes("*")) {
                return a === regex;
            }
            if (!/^\*?[^\*]*\*?$/.test(regex)) {
                throw new InsightError("Invalid regex filter value");
            }
            return new RegExp("^" + regex.split("*").join(".*") + "$").test(a);
        }];
        mapping["EQ"] = ["number", (a: any, b: any) => a === b];
        mapping["LT"] = ["number", (a: any, b: any) => a < b];
        mapping["GT"] = ["number", (a: any, b: any) => a > b];

        if (Object.keys(mapping).includes(comparator)) {
            if (typeof value !== mapping[comparator][0]) {
                throw new InsightError("Filter content type not valid");
            } else if (typeof dataset[0][key] !== mapping[comparator][0]) {
                throw new InsightError("Filter content type not match");
            }

            return SetUtils.setFilter(
                allCourses,
                (course) => mapping[comparator][1](dataset[course][key], value)
            );
        }

        throw new InsightError("Invalid comparator");
    }

    private static compareResults(a: any, b: any, options: any): number {
        const order: string = options["ORDER"];
        return InsightFacade.rule(a[order], b[order]);
    }

    private static rule(a: any, b: any): number {
        if (typeof a === "string") {
            for (let i = 0; i < Math.min(a.length, b.length); i ++) {
                if (a.charCodeAt(i) !== b.charCodeAt(i)) {
                    return a.charCodeAt(i) > b.charCodeAt(i) ? 1 : -1;
                }
            }
            if (a.length === b.length) {
                return 0;
            }
            return a.length > b.length ? 1 : -1;
        }

        if (a === b) {
            return 0;
        }
        return a > b ? 1 : -1;
    }
}
