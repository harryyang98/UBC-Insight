import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, ResultTooLargeError} from "./IInsightFacade";
import {SetUtils} from "../utils/SetUtils";
import {Datasets} from "../model/Datasets";
import {JSONIOService} from "../service/JSONIOService";
import Util from "../Util";
import {QueryObject} from "../model/QueryObject";
import {CourseIOService} from "../service/CourseIOService";
import {RoomIOService} from "../service/RoomIOService";
import {Operations} from "./Operations";

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

    public addDataset(id: string, zip: string, kind: InsightDatasetKind): Promise<string[]> {
        if (!Datasets.isIdValid(id) || this.datasets.containsDataset(id)) {
            return Promise.reject(new InsightError("Invalid id"));
        }

        // choose approximate service
        let ioService: JSONIOService;
        if (kind === InsightDatasetKind.Courses) {
            ioService = new CourseIOService();
        } else {
            ioService = new RoomIOService();
        }

        return ioService.getJSONData(zip).then((entries: any[]) => {
            if (entries.length === 0) {
                return Promise.reject(new InsightError("The zip must contain at least one elements"));
            }

            this.datasets.addDataset(id, entries);
            return Promise.resolve(this.datasets.getIds());
        }).catch((err) => {
            throw new InsightError(err.message);
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (!Datasets.isIdValid(id)) {
            return Promise.reject(new InsightError("Id format not right"));
        }

        const self = this;
        return new Promise((rs, rj) => {
            try {
                self.datasets.removeDataset(id);
            } catch (err) {
                return rs(err);
            }

            rj(id);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const datasets = this.datasets;
        return new Promise<InsightDataset[]>((resolve) => {
            resolve(datasets.getIds().map((id) => {
                // check dataset kind
                let datasetKind = InsightDatasetKind.Rooms;
                if (datasets.getDataset(id)[0].hasOwnProperty("dept")) {
                    datasetKind = InsightDatasetKind.Courses;
                }

                return {
                    id: id,
                    kind: datasetKind,
                    numRows: datasets.getDataset(id).length
                };
            }));
        });
    }

    public performQuery(query: any): Promise <any[]> {
        const self = this;
        return new Promise<any>((resolve, reject) => {
            try {
                const queryObj = new QueryObject(query, this.datasets.getIds());

                // extract dataset id from query
                const columns = queryObj.columns_;
                const id: string = queryObj.queryId_;
                if (!self.datasets.containsDataset(id)) {
                    return reject(new InsightError("Dataset not exists"));
                }

                // find all the courses matching where
                let courseSet: Set<number>;
                const where = queryObj.where_;
                if (Object.keys(where).length === 0) {
                    courseSet = new Set(Array.from(Array(self.datasets.getDataset(id).length).keys()));
                } else {
                    courseSet = self.findEntries(where, id);
                }

                // select specific columns
                let results = this.selectColumns(courseSet, columns, id);

                // apply transformation to columns
                if (queryObj.groupCols_ !== null) {
                    self.applyTransformation(queryObj.groupCols_, queryObj.apply_, results, id);
                }

                // sort the results
                const orderKeys: string[] = queryObj.orderKeys_;
                const dirCoefficient: number = (queryObj.isDirUp_ ? 1 : 0) * 2 - 1;
                if (orderKeys.length > 0) {
                    results.sort((a, b) => {
                        return dirCoefficient * orderKeys.map((key) => {
                            return Util.compareValues(a[key], b[key]);
                        }).reduce((c1, c2) => {
                            return c1 !== 0 ? c1 : c2;
                        });
                    });
                }

                // resolve results
                results.length > 5000 ? reject(new ResultTooLargeError()) : resolve(results);
            } catch (err) {
                reject(new InsightError("Caught: " + err.message));
            }
        });
    }

    private findEntries(filter: any, id: string): Set<number> {
        const dataset = this.datasets.getDataset(id);
        const allCourses = new Set(Array.from(Array(dataset.length).keys()));
        if (!(Object.keys(filter).length === 1)) {
            throw new InsightError("There cannot be more than one or no objects in filter");
        }

        const comparator: string = Object.keys(filter)[0];
        if (filter[comparator] instanceof Array) {
            const subSets: Array<Set<number>> = [];
            for (const subFilter of filter[comparator]) {
                subSets.push(this.findEntries(subFilter, id));
            }

            if (subSets.length === 0) {
                throw new InsightError("AND and OR must have at least one element");
            } else if (comparator === "OR") {
                return SetUtils.union(subSets);
            } else if (comparator === "AND") {
                return SetUtils.intersecion(subSets);
            }
        } else {
            const filterContent = filter[comparator];
            if (comparator === "NOT") {
                return SetUtils.complementary(this.findEntries(filterContent, id), allCourses);
            }

            // filter courses
            if (!(Object.keys(filterContent).length === 1)) {
                throw new InsightError("Filter content should have one and only one key");
            }
            const contentKey = Object.keys(filterContent)[0];
            const contentValue = filterContent[contentKey];
            if (!/^[^_]+_[^_]+$/.test(contentKey) || contentKey.split("_")[0] !== id) {
                throw new InsightError("Invalid key format in filter content or query two datasets");
            }
            const datasetKey = contentKey.split("_")[1];
            return InsightFacade.filterEntries(dataset, allCourses, datasetKey, contentValue, comparator);
        }

        throw new InsightError("Invalid comparator when finding courses");
    }

    private static filterEntries(
        dataset: any[], allCourses: Set<number>, key: string, value: any, comparator: string
    ): Set<number> {
        if (!dataset[0].hasOwnProperty(key)) {
            throw new InsightError("Key in filter content not found in dataset");
        }

        const ops = Operations.filterOps;
        if (!ops.hasOwnProperty(comparator)) {
            throw new InsightError("Invalid comparator");
        }

        const type = ops[comparator][0];
        if (typeof value !== type || typeof dataset[0][key] !== type) {
            throw new InsightError("Filter content type not valid");
        }

        const comp = ops[comparator][1];
        return SetUtils.setFilter(allCourses, (course) => {
            return comp(dataset[course][key], value);
        });
    }

    private selectColumns(courseSet: Set<number>, columns: string[], id: string): any[] {
        for (const column of columns) {
            if (!this.datasets.getDataset(id)[0].hasOwnProperty(column.split("_")[1])) {
                throw new InsightError("Cannot query from two datasets or key does not exist");
            }
        }
        return Array.from(courseSet.values()).map((idx) => {
            const result: any = {};
            for (const column of columns) {
                result[column] = this.datasets.getDataset(id)[idx][column.split("_")[1]];
            }
            return result;
        });
    }

    private applyTransformation(groupCols: string[], apply: any, entries: any[], id: string): any[] {
        // assign group to entry and label it
        const groupMap: any = {};
        let count = 0;
        for (const entry of entries) {
            const groupVal: string = groupCols.map((key: string) => {
                return entry[key];
            }).toString();

            if (groupMap[groupVal] === undefined) {
                groupMap[groupVal] = count ++;
            }
            entry["group"] = groupMap[groupVal];
        }

        const results: any[] = [];
        for (const group of Object.values(groupMap)) {
            // get entries for current group and delete label
            const groupEntries = entries.filter((entry) => {
                if (entry["group"] === group) {
                    delete entry["group"];
                    return true;
                }
                return false;
            });

            // calculate the overall value
            results.push(...apply.reduce((temps: any[], rule: any) => {
                const name: string = Object.keys(rule)[0];
                const op: string = Object.keys(rule[name])[0];
                const col: string = rule[name][op];
                const overall = Operations.applyOps[op](temps.map((entry) => {
                    return entry[col];
                }));
                return temps.map((entry) => {
                    entry[name] = overall;
                    return entry;
                });
            }, groupEntries));
        }

        return results;
    }

}
