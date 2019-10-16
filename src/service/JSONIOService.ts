import * as JSZip from "jszip";

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
