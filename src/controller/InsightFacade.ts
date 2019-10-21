import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, ResultTooLargeError} from "./IInsightFacade";
import {SetUtils} from "../utils/SetUtils";
import {Datasets} from "../model/Datasets";
import {JSONIOService} from "../service/JSONIOService";
import Util from "../Util";
import {QueryObject} from "../model/QueryObject";
import {CourseIOService} from "../service/CourseIOService";
import {RoomIOService} from "../service/RoomIOService";
import {Operations} from "./Operations";
import {AssertionUtils} from "../utils/AssertionUtils";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
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
                return rj(err);
            }
            rs(id);
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
                const id: string = queryObj.getId();
                if (!self.datasets.containsDataset(id)) {
                    return reject(new InsightError("Dataset not exists"));
                }

                // find all the courses matching where
                let entrySet: Set<number>;
                const where = queryObj.where_;
                if (Object.keys(where).length === 0) {
                    entrySet = SetUtils.makeIdxSet(self.datasets.getDataset(id).length);
                } else {
                    entrySet = self.findEntrySets(where, id);
                }

                // get all entries in dataset
                let entries = self.getEntries(entrySet, id);

                // apply transformation to columns
                if (queryObj.groupCols_ !== null) {
                    entries = self.applyTransformation(queryObj.groupCols_, queryObj.apply_, entries, id);
                }

                // select the certain columns required
                entries = self.selectColumns(entries, columns);

                // sort the results
                const dirCoefficient: number = (queryObj.isDirUp_ ? 1 : 0) * 2 - 1;
                if (queryObj.orderKeys_.length > 0) {
                    entries.sort((a, b) => {
                        return dirCoefficient * queryObj.orderKeys_.map((key) => {
                            return Util.compareValues(a[key], b[key]);
                        }).reduce((c1, c2) => {
                            return c1 !== 0 ? c1 : c2;
                        });
                    });
                }

                // resolve results
                entries.length > 5000 ? reject(new ResultTooLargeError()) : resolve(entries);
            } catch (err) {
                reject(new InsightError("Caught: " + err.message));
            }
        });
    }

    private findEntrySets(filter: any, id: string): Set<number> {
        const dataset = this.datasets.getDataset(id);
        const allCourses = SetUtils.makeIdxSet(dataset.length);
        AssertionUtils.assertObjectByLength(filter, 1);

        const comparator: string = Object.keys(filter)[0];
        if (filter[comparator] instanceof Array) {
            const subSets: Array<Set<number>> = [];
            for (const subFilter of filter[comparator]) {
                subSets.push(this.findEntrySets(subFilter, id));
            }

            AssertionUtils.assertArray(subSets, false);
            if (comparator === "OR") {
                return SetUtils.union(subSets);
            } else if (comparator === "AND") {
                return SetUtils.intersecion(subSets);
            }
        } else {
            const filterContent = filter[comparator];
            if (comparator === "NOT") {
                return SetUtils.complementary(this.findEntrySets(filterContent, id), allCourses);
            }

            // filter courses
            AssertionUtils.assertObjectByLength(filterContent, 1);
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
        AssertionUtils.assertType(value, type);
        AssertionUtils.assertType(dataset[0][key], type);

        const comp = ops[comparator][1];
        return SetUtils.setFilter(allCourses, (course) => {
            return comp(dataset[course][key], value);
        });
    }

    private getEntries(entrySet: Set<number>, id: string): any[] {
        const dataset = this.datasets.getDataset(id);
        return Array.from(entrySet.values()).map((idx) => {
            const entry: any = {};
            for (const key in dataset[idx]) {
                entry[id + "_" + key] = dataset[idx][key];
            }
            return entry;
        });
    }

    private selectColumns(entries: any[], columns: string[]): any[] {
        return entries.map((entry) => {
            const result: any = {};
            for (const column of columns) {
                if (!entry.hasOwnProperty(column)) {
                    throw new InsightError("Invalid column");
                }
                result[column] = entry[column];
            }
            return result;
        });
    }

    private applyTransformation(groupCols: string[], applies: any, entries: any[], id: string): any[] {
        // assign group to entry and label it
        const groupMap: any = {};
        let count = 0;
        for (const entry of entries) {
            const groupKey: string = groupCols.map((key: string) => {
                if (entry[key] === undefined) {
                    throw new InsightError("Group key not valid");
                }
                return entry[key];
            }).toString();

            if (groupMap[groupKey] === undefined) {
                groupMap[groupKey] = count ++;
            }
            entry["group"] = groupMap[groupKey];
        }

        return Object.values(groupMap).map((group) => {
            // get entries for current group and delete label
            const groupEntries = entries.filter((entry) => {
                if (entry["group"] === group) {
                    delete entry["group"];
                    return true;
                }
                return false;
            });

            return applies.reduce((temp: any, rule: any) => {
                const name: string = Object.keys(rule)[0];
                const op: string = Object.keys(rule[name])[0];
                const col: string = rule[name][op];

                // calculate the overall value
                if (!col.includes("_") || !Object.keys(temp).includes(col)) {
                    throw new InsightError("Invalid apply key");
                } else if (op !== "COUNT") {
                    AssertionUtils.assertType(temp[col], "number");
                }
                temp[name] = Operations.applyOps[op](groupEntries.map((entry) => {
                    return entry[col];
                }));
                return temp;
            }, groupEntries[0]);
        });
    }

}
