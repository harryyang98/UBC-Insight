import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {TimeTable} from "./TimeTable";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // add course and room id back
        return [];
    }

    public calcScore(plans: any[], allCourses: any[]): number {
        const totalEnroll = allCourses.reduce((c1, c2) => {
            return c1.pass + c2.pass + c1.fail + c2.fail + c1.audit + c2.audit;
        });
        return 0.7 * Scheduler.calcEnrollment(plans) / totalEnroll + 0.3 * (1 - Scheduler.findMaxDistance(plans) / 2);
    }

    private static canFit(room: SchedRoom, course: SchedSection): boolean {
        return room.rooms_seats <= course.courses_pass + course.courses_fail + course.courses_audit;
    }

    private static distance(room1: SchedRoom, room2: SchedRoom): number {
        const z1 = Scheduler.toRad(room1.rooms_lat);
        const z2 = Scheduler.toRad(room2.rooms_lat);
        const dz = Scheduler.toRad(room2.rooms_lat - room1.rooms_lat);
        const dl = Scheduler.toRad(room2.rooms_lon - room1.rooms_lon);

        const a =
            Math.sin(dz / 2) * Math.sin(dz / 2) + Math.cos(z1) * Math.cos(z2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const r = 6317e3;
        return r * c;
    }

    private static toRad(x: number): number {
        return x * Math.PI / 180;
    }

    private static calcEnrollment(plans: any[]): number {
        return plans.reduce((p1: any, p2: any) => {
            return p1 + p2[0].seats;
        }, 0);
    }

    private static findMaxDistance(plans: any[]): number {
        return Math.max(...plans.map((p1: any) => {
            return Math.max(...plans.map((p2: any) => {
                return Scheduler.distance(p1[0], p2[0]);
            }));
        }));
    }

    // private removeIds(arr: any): any {
    //     return arr.map((obj: any) => {
    //         return Object.keys(obj).reduce((pObj: any, key: string) => {
    //             const newKey: string = key.split("_")[0];
    //             pObj[newKey] = obj[key];
    //             return pObj;
    //         }, {});
    //     });
    // }

    // public hasOptSpace(courses: any[], allCourses: any[], oldScore: number): boolean {
    //     const bestEnroll = courses.reduce((c1, c2) => {
    //         return c1.pass + c2.pass + c1.fail + c2.fail + c1.audit + c2.audit;
    //     });
    //     const totalEnroll = allCourses.reduce((c1, c2) => {
    //         return c1.pass + c2.pass + c1.fail + c2.fail + c1.audit + c2.audit;
    //     });
    //     return 0.7 * bestEnroll / totalEnroll + 0.3 > oldScore;
    // }

}
