import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {DataUtils} from "../utils/DataUtils";
import Log from "../Util";
import {ParsedPath} from "path";

export abstract class JSONIOService {

    public getJSONData(fileContent: string): Promise<any[]> {
        // read jsons from zips
        const self = this;
        return JSZip.loadAsync(fileContent, {base64: true}).then<JSZip>((zip) => {
            return Promise.resolve(zip);
        }).then<any[]>((zip) => {
            return self.getRawData(zip);
        }).then((rawData) => {
            return Promise.resolve(self.processRawData(rawData));
        });
    }

    protected abstract getRawData(zip: JSZip): Promise<any[]>;

    protected abstract processRawData(rawData: any): any[];

}
