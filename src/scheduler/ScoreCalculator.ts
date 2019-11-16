import {SchedRoom, SchedSection} from "./IScheduler";
import {Plan, TimeTable} from "./TimeTable";

export class ScoreCalculator {
    private readonly totalEnrollment: number;

    public constructor(sections: SchedSection[]) {
        this.totalEnrollment = sections.reduce((num, c2) => {
            return num + c2.courses_fail + c2.courses_pass + c2.courses_audit;
        }, 0);
    }

    public calcScore(timeTable: TimeTable): number {
        const plans = timeTable.toArray();
        if (plans.length === 0) {
            return 0;
        }

        const enrollScore = 0.7 * ScoreCalculator.calcEnrollment(plans) / this.totalEnrollment;
        const distanceScore = 0.3 * (1 - (ScoreCalculator.findMaxDistance(plans) / 1372));
        return enrollScore + distanceScore;
    }

    // public only for test
    public static distance(room1: SchedRoom, room2: SchedRoom): number {
        const z1 = ScoreCalculator.toRad(room1.rooms_lat);
        const z2 = ScoreCalculator.toRad(room2.rooms_lat);
        const dz = ScoreCalculator.toRad(room2.rooms_lat - room1.rooms_lat);
        const dl = ScoreCalculator.toRad(room2.rooms_lon - room1.rooms_lon);

        const a =
            Math.sin(dz / 2) * Math.sin(dz / 2) + Math.cos(z1) * Math.cos(z2) * Math.sin(dl / 2) * Math.sin(dl / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        const r = 6317e3;
        return r * c;
    }

    private static toRad(x: number): number {
        return x * Math.PI / 180;
    }

    private static calcEnrollment(plans: Plan[]): number {
        return plans.reduce((num, p2) => {
            return num + p2.section.courses_pass + p2.section.courses_audit + p2.section.courses_fail;
        }, 0);
    }

    private static findMaxDistance(plans: Plan[]): number {
        return Math.max(...plans.map((p1) => {
            return Math.max(...plans.map((p2) => {
                return ScoreCalculator.distance(p1.room, p2.room);
            }));
        }));
    }
}
