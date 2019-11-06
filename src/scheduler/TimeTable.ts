import {TimeSlot} from "./IScheduler";

export class TimeTable {

    private plans: any[];
    private registered: string[];

    constructor() {
        this.clear();
    }

    public addPlan(slot: TimeSlot, course: any, room: any) {
        // check availablity
        const regRoom = "room: " + slot + room.shortname + room.number;
        const regSection = "section: " + slot + course.dept + course.id;
        if (this.registered.includes(regRoom) || this.registered.includes(regSection)) {
            throw new Error("Conflicting when adding the course");
        } else if (!TimeTable.canFit(room, course)) {
            throw new Error("The room is too small for the course");
        }

        // add course to timetable
        this.plans.push([room, course]);

        // add slot-room combination to registered for quick checking
        this.registered.push(regRoom, regSection);
    }

    public calcScore(allCourses: any[]): number {
        const totalEnroll = allCourses.reduce((c1, c2) => {
            return c1.pass + c2.pass + c1.fail + c2.fail + c1.audit + c2.audit;
        });
        return 0.7 * this.calcEnrollment() / totalEnroll + 0.3 * (1 - this.findMaxDistance() / 2);
    }

    public hasOptSpace(courses: any[], allCourses: any[], oldScore: number): boolean {
        const bestEnroll = courses.reduce((c1, c2) => {
            return c1.pass + c2.pass + c1.fail + c2.fail + c1.audit + c2.audit;
        });
        const totalEnroll = allCourses.reduce((c1, c2) => {
            return c1.pass + c2.pass + c1.fail + c2.fail + c1.audit + c2.audit;
        });
        return 0.7 * bestEnroll / totalEnroll + 0.3 > oldScore;
    }

    public clear() {
        this.plans = [];
        this.registered = [];
    }

    public toJson(): any {
        return this.plans;
    }

    private calcEnrollment(): number {
        return this.plans.reduce((p1, p2) => {
            return p1 + p2[0].seats;
        }, 0);
    }

    private findMaxDistance(): number {
        const self = this;
        return Math.max(...this.plans.map((p1) => {
            return Math.max(...this.plans.map((p2) => {
                return TimeTable.distance(p1[0], p2[0]);
            }));
        }));
    }

    private static canFit(room: any, course: any): boolean {
        return room.seats <= course.pass + course.fail + course.audit;
    }

    private static distance(room1: any, room2: any): number {
        const z1 = TimeTable.toRad(room1.lat);
        const z2 = TimeTable.toRad(room2.lat);
        const dz = TimeTable.toRad(room2.lat - room1.lat);
        const dl = TimeTable.toRad(room2.lon - room1.lon);

        const a =
            Math.sin(dz / 2) * Math.sin(dz / 2) + Math.cos(z1) * Math.cos(z2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const r = 6317e3;
        return r * c;
    }

    private static toRad(x: number): number {
        return x * Math.PI / 180;
    }

}
