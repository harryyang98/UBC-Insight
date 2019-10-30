import * as Http from "http";
import {InsightError} from "../controller/IInsightFacade";

export class HttpService {

    public static requestCoordinate(address: string): Promise<any> {
        // prepare request variables
        // const url = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team059/";
        const options = {
            host: "cs310.students.cs.ubc.ca",
            path: "/api/v1/project_team059/" + address.split(" ").join("%20"),
            headers: {"User-Agent": "request"},
            port: 11316
        };

        return new Promise<any>((rs, rj) => {
            Http.get(options, (res) => {
                let result = "";

                res.on("data", (d) => {
                    result += d;
                });

                res.on("end", () => {
                    if (res.statusCode === 200) {
                        rs(JSON.parse(result));
                    }
                    rj(new InsightError("Http request failed"));
                });
            }).on("error", (ex) => {
                rj(ex);
            });
        });
    }


}
