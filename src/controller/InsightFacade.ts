import Log from "../Util";
import {IInsightFacade, InsightDataset, InsightDatasetKind, ResultTooLargeError} from "./IInsightFacade";
import {InsightError, NotFoundError} from "./IInsightFacade";
import * as JSZip from "jszip";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    private readonly datasets: {[id: string]: any[]};

    constructor() {
        this.datasets = {};
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id.includes("_") || id.length === 0) {
            return Promise.reject(new InsightError("Field id format not valid"));
        } else if (Object.keys(this.datasets).includes(id)) {
            return Promise.reject(new InsightError("Cannot add with duplicated id"));
        }

        this.datasets[id] = [];
        const dataset: any[] = this.datasets[id];
        return new Promise<string[]>((resolve, reject) => {
            // unzip string and read data to courseSets
            JSZip.loadAsync(content, {base64: true}).then((zip) => {
                for (const key of Object.keys(zip.files)) {
                    zip.files[key].async("text").then((text) => {
                        // get result block of json object
                        const results: [] = JSON.parse(text)["result"];

                        // for each sub json object in the result block
                        for (const result of results) {
                            if (kind === InsightDatasetKind.Courses) {
                                const course: {[key: string]: any} = {};
                                course["dept"] = result["Subject"];
                                course["id"] = result["Course"];
                                course["avg"] = result["Avg"];
                                course["instructor"] = result["Professor"];
                                course["title"] = result["Title"];
                                course["pass"] = result["Pass"];
                                course["audit"] = result["Audit"];
                                course["uuid"] = result["id"];
                                course["year"] = result["Year"];

                                // add course to dataset
                                dataset.push(course);
                            } else if (kind === InsightDatasetKind.Rooms) {
                                reject(new InsightError("Rooms not implemented"));
                            } else {
                                reject(new InsightError("Invalid dataset kind"));
                            }
                        }
                    }).catch(
                        (err) => reject(new InsightError("Failed to extract the file"))
                    );
                }
            }).then(
                () => resolve([id])
            ).catch(
                (err) => reject(new InsightError("Failed to extract the file"))
            );
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!Object.keys(this.datasets).includes(id)) {
            return Promise.reject("Dataset not exists");
        }

        delete this.datasets[id];
        return Promise.resolve(id);
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const insightDatasets: InsightDataset[] = [];

        for (const id of Object.keys(this.datasets)) {
            // check dataset kind
            let datasetKind = InsightDatasetKind.Rooms;
            if (Object.keys(this.datasets[id][0]).includes("dept")) {
                datasetKind = InsightDatasetKind.Courses;
            }

            insightDatasets.push({
                id: id,
                kind: datasetKind,
                numRows: this.datasets[id].length
            });
        }

        return Promise.resolve(insightDatasets);
    }

    public performQuery(query: any): Promise <any[]> {
        if (Object.keys(query).length !== 2) {
            return Promise.reject(new InsightError("JSON has more keys than excepted"));
        }

        const self = this;
        return new Promise<any>((resolve, reject) => {
            try {
                // extract dataset id from query
                const id: string = query["OPTIONS"]["COLUMNS"][0].split("_")[0];

                // find all the courses matching where
                const courseSet = self.findCourses(query["WHERE"], id);

                // select specific columns and add to results
                const results: any[] = new Array(0);
                const columns: string[] = query["OPTIONS"]["COLUMNS"];
                for (const course of courseSet) {
                    const result: any = { };
                    for (const column of columns) {
                        result[column] = self.datasets[id][course][column.split("_")[1]];
                    }
                    results.push(result);
                }

                // order the columns
                if (!query["OPTIONS"]["COLUMNS"].includes(query["OPTIONS"]["ORDER"])) {
                    reject(new InsightError("Value of ORDER not exists in COLUMNS"));
                }
                results.sort((a, b) => InsightFacade.sortResults(a, b, query["OPTIONS"]));

                if (results.length > 5000) {
                    reject(new ResultTooLargeError());
                }
                resolve(results);
            } catch (ex) {
                if (ex instanceof InsightError) {
                    reject(ex);
                }

                reject(new InsightError("JSON format error"));
            }
        });
    }

    private findCourses(filter: any, id: string): Set<number> {
        const dataset = this.datasets[id];
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

            if (comparator === "OR") {
                return InsightFacade.union(subSets);
            } else if (comparator === "AND") {
                return InsightFacade.intersecion(subSets);
            }
        } else {
            const filterContent = filter[comparator];
            if (comparator === "NOT") {
                return InsightFacade.complementary(this.findCourses(filterContent, id), allCourses);
            }

            // filter courses
            if (Object.keys(filterContent).length !== 1) {
                throw new InsightError("Filter content should have one and only one key");
            }
            const contentKey = Object.keys(filterContent)[0];
            const contentValue = filterContent[contentKey];
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
            throw new InsightError("Invalid key in filter content");
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
            }

            return InsightFacade.setFilter(
                allCourses,
                (course) => mapping[comparator][1](dataset[course][key], value)
            );
        }

        throw new InsightError("Invalid comparator");
    }

    private static sortResults(a: any, b: any, options: any): number {
        if (Object.keys(options).includes("ORDER")) {
            const order: string = options["ORDER"];
            if (InsightFacade.toComp(a[order]) !== InsightFacade.toComp(b[order])) {
                return InsightFacade.toComp(a[order]) < InsightFacade.toComp(b[order]) ? -1 : 1;
            }
        }
        for (const key of Object.keys(options["COLUMNS"])) {
            if (InsightFacade.toComp(a[key]) !== InsightFacade.toComp(b[key])) {
                return InsightFacade.toComp(a[key]) < InsightFacade.toComp(b[key]) ? -1 : 1;
            }
        }
        return 0;
    }

    private static toComp(obj: any): string | number {
        if (typeof obj === "string") {
            if (obj.length > 0) {
                return -obj.charCodeAt(0);
            }
        }
        return obj;
    }

    private static union(sets: Array<Set<number>>): Set<number> {
        const n = new Set<number>();
        for (const set of sets) {
            set.forEach((e) => n.add(e));
        }
        return n;
    }

    private static intersecion(sets: Array<Set<number>>): Set<number> {
        const n = new Set<number>(sets[0]);
        for (let i = 1; i < sets.length; i ++) {
            for (const e of sets[0]) {
                if (!sets[i].has(e)) {
                    n.delete(e);
                }
            }
        }
        return n;
    }

    private static complementary(a: Set<number>, c: Set<number>): Set<number> {
        const n = new Set<number>(c);
        for (const e of a) {
            n.delete(e);
        }
        return n;
    }

    private static setFilter(set: Set<number>, filter: ((n: number) => boolean)) {
        const n = new Set<number>(set);
        for (const e of set) {
            if (!filter(e)) {
                n.delete(e);
            }
        }
        return n;
    }

}
