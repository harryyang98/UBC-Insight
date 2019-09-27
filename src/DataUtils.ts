import {InsightError} from "./controller/IInsightFacade";

export class DataUtils {

    public static isFileValid(file: any): boolean {
        const name: string = file.name;
        if (file.dir && name !== "courses/") {
            return false;
        } else if (!name.includes("courses/") || name.split("/").length > 2) {
            return false;
        }

        return true;
    }

}
