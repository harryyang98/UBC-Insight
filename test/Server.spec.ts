import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import {expect} from "chai";
import Log from "../src/Util";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    const SERVER_URL: string = "http://localhost:4321/";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);

        return server.start().catch((err) => {
            expect.fail("Cannot start server", err);
        });
    });

    after(function () {
        server.stop();
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    afterEach(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    // TODO: read your courses and rooms datasets here once!
    facade.addDataset("courses", "./test/data/courses.zip", InsightDatasetKind.Courses);
    facade.addDataset("rooms", "./test/data/rooms.zip", InsightDatasetKind.Rooms);

    it("add dataset test - 200", () => {
        try {
            // return chai.request(SERVER_URL)
        } catch (err) {
            Log.error(err);
        }
    });

    // Sample on how to format PUT requests
    /*
    it("PUT test for courses dataset", function () {
        try {
            return chai.request(SERVER_URL)
                .put(ENDPOINT_URL)
                .send(ZIP_FILE_DATA)
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    // some logging here please!
                    expect(res.status).to.be.equal(204);
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });
    */

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
