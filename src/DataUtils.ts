import {InsightError} from "./controller/IInsightFacade";
import * as JSZip from "jszip";

export class DataUtils {

    public static extractZip(zip: JSZip): Promise<any[]> {
        if (Object.keys(zip.files).length === 0) {
            return Promise.reject(new InsightError("Zip must contain one or more files"));
        }

        const threads: any[] = [];
        let hasRoot: boolean = false;
        for (const key of Object.keys(zip.files)) {
            // check if file or folder is valid
            const name = zip.files[key].name;
            if (name === "courses/") {
                hasRoot = true;
            } else if (!name.includes("courses/") || name.split("/").length > 2) {
                continue;
            }

            // add every results in every files
            threads.push(new Promise((rs, rj) => {
                zip.files[key].async("text").then((text) => {
                    rs(JSON.parse(text)["result"]);
                }).catch((err) => rs([]));
            }));
        }
        if (!hasRoot) {
            return Promise.reject(new InsightError("The zip must contain an root"));
        }
        return Promise.all(threads);
    }

    public static convertData(result: any): any {
        const course: {[key: string]: any} = {};
        course["dept"] = result["Subject"];
        course["id"] = result["Course"];
        course["avg"] = result["Avg"];
        course["instructor"] = result["Professor"];
        course["title"] = result["Title"];
        course["pass"] = result["Pass"];
        course["fail"] = result["Fail"];
        course["audit"] = result["Audit"];
        course["uuid"] = result["id"] + "";
        if (result["Section"] === "overall") {
            course["year"] = 1900;
        } else {
            course["year"] = parseInt(result["Year"], 10);
        }

        for (const key of Object.keys(course)) {
            if (course[key] === undefined) {
                throw new InsightError("File JSON Format not okay");
            }
        }
        return course;
    }

}
