"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Util_1 = require("../../src/Util");
const Scheduler_1 = require("../../src/scheduler/Scheduler");
const TimeTable_1 = require("../../src/scheduler/TimeTable");
describe("scheduler", () => {
    let sections = [
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "1319",
            courses_pass: 101,
            courses_fail: 7,
            courses_audit: 2
        },
        {
            courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0
        },
        {
            courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0
        }
    ];
    let rooms = [
        {
            rooms_shortname: "AERL",
            rooms_number: "120",
            rooms_seats: 144,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
        {
            rooms_shortname: "AERL",
            rooms_number: "121",
            rooms_seats: 140,
            rooms_lat: 49.26372,
            rooms_lon: -123.25099
        },
        {
            rooms_shortname: "ALRD",
            rooms_number: "105",
            rooms_seats: 94,
            rooms_lat: 49.2699,
            rooms_lon: -123.25318
        },
        {
            rooms_shortname: "ANGU",
            rooms_number: "098",
            rooms_seats: 260,
            rooms_lat: 49.26486,
            rooms_lon: -123.25364
        },
        {
            rooms_shortname: "BUCH",
            rooms_number: "A101",
            rooms_seats: 275,
            rooms_lat: 49.26826,
            rooms_lon: -123.25468
        }
    ];
    let scheduler = null;
    let slotSize = 15;
    before(() => {
        scheduler = new Scheduler_1.default();
        const tc = new TimeTable_1.TimeTable();
        tc.addPlan(null);
    });
    it("show its result as example", () => {
        const res = scheduler.schedule(sections, rooms);
        Util_1.default.trace(res);
    });
    it("test section conflicts --- normal case", () => {
        const secs = [];
        for (let i = 0; i < slotSize; i++) {
            secs.push({
                courses_dept: "cpsc",
                courses_id: "31" + i,
                courses_uuid: String(1000 + i),
                courses_pass: 120 - i,
                courses_fail: 11,
                courses_audit: 5
            });
        }
        secs.push({
            courses_dept: "cpsc",
            courses_id: "310",
            courses_uuid: "2000",
            courses_pass: 100,
            courses_fail: 10,
            courses_audit: 5
        });
        const res = scheduler.schedule(secs, rooms);
        const temp = res.filter((p) => {
            return p[1].courses_id === "310";
        });
        Util_1.default.trace(temp);
    });
    it("test section conflicts --- impossible case", () => {
        const secs = [];
        for (let i = 0; i < slotSize + 1; i++) {
            secs.push({
                courses_dept: "cpsc",
                courses_id: "310",
                courses_uuid: String(1000 + i),
                courses_pass: 100,
                courses_fail: 10,
                courses_audit: 5
            });
        }
        const res = scheduler.schedule(secs, rooms);
        Util_1.default.trace(res.filter((p) => {
            return p[1].courses_id === "310";
        }));
    });
});
//# sourceMappingURL=Scheduler.spec.js.map