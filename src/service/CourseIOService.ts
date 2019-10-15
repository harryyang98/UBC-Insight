import {JSONIOService} from "./JSONIOService";
import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";


export class CourseIOService extends JSONIOService {

    protected getRawData(zip: JSZip): Promise<any[]> {
        const threads: any[] = [];
        let hasRoot: boolean = false;
        for (const key in zip.files) {
            // check if file or folder is valid
            const name = zip.files[key].name;
            if ((!name.includes("courses/") || name.split("/").length > 2) && name !== "courses/") {
                return Promise.reject(new InsightError("Zip format not right"));
            }

            // add every results in every files
            threads.push(
                zip.files[key].async("text").then((text) => {
                    return Promise.resolve(JSON.parse(text)["result"]);
                }).catch((err) => {
                    return Promise.resolve([]);
                })
            );
        }
        return Promise.all(threads);
    }


    protected processRawData(rawData: any): any[] {
        // push results to array
        const courses = [];
        for (const elementList of rawData) {
            try {
                courses.push(...elementList.map((json: any) => {
                    return CourseIOService.convertCourseJSON(json);
                }));
            } catch (err) {
                // skip any file with invalid raw data
            }
        }

        return courses;
    }

    private static convertCourseJSON(result: any): any {
        let year = 1900;
        if (result["Section"] !== "overall") {
            year = parseInt(result["Year"], 10);
        }
        return {
            dept: result["Subject"],
            id: result["Course"],
            avg: result["Avg"],
            instructor: result["Professor"],
            title: result["Title"],
            pass: result["Pass"],
            fail: result["Fail"],
            audit: result["Audit"],
            uuid: result["id"] + "",
            year: year
        };
    }

}
