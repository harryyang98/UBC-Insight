import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import {expect} from "chai";
import Log from "../src/Util";
import {InsightDatasetKind} from "../src/controller/IInsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import * as fs from "fs";

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
    const courses = fs.readFileSync("./test/data/courses.zip");
    const rooms = fs.readFileSync("./test/data/rooms.zip");

    it("put dataset - 200", () => {
        try {
            return chai.request(SERVER_URL)
                .put("dataset/courses/courses")
                .send(courses)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                    Log.trace(res);
                    expect(res.status).to.be.equal(200);
                }).catch((err) => {
                    Log.error(err);
                    expect.fail(err);
                });
        } catch (err) {
            Log.error(err);
            expect.fail(err);
        }
    });

    it("put dataset - 200 - rooms", () => {
        try {
            return chai.request(SERVER_URL)
                .put("dataset/myrooms/rooms")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                    Log.trace(res);
                    expect(res.status).to.be.equal(200);
                }).catch((err) => {
                    Log.error(err);
                    expect.fail(err);
                });
        } catch (err) {
            Log.error(err);
            expect.fail(err);
        }
    });

    it("put dataset - 400", () => {
        try {
            return chai.request(SERVER_URL)
                .put("dataset/myc__ourses/courses")
                .send(rooms)
                .set("Content-Type", "application/x-zip-compressed")
                .then((res) => {
                    Log.trace(res);
                    expect.fail("Should not passed.");
                }).catch((err) => {
                    Log.error(err);
                });
        } catch (err) {
            Log.error(err);
            expect.fail(err);
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
});
