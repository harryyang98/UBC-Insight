import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {TimeTable} from "./TimeTable";
import {ScoreCalculator} from "./ScoreCalculator";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        const calc = new ScoreCalculator(sections);
        const sectionSet = new Set<SchedSection>(sections);
        const roomSet = new Set<SchedRoom>(rooms);

        // try to find the best time table
        let bestTable = new TimeTable();
        let bestScore = 0;
        while (rooms.length > 0 && sectionSet.size > 0) {
            // add the room with best sections that results in highest score
            // const bestRoom = rooms.sort((r1, r2) => {
            // });

            // remove room from choices for next round
        }

        // fix conflicts of section time requirements

        return bestTable.toArray();
    }

    // private findBestRoom(table: TimeTable, rooms: SchedRoom[]) {
    // }
    //
    // private findBestCourses() {
    // }

    private static canFit(room: SchedRoom, course: SchedSection): boolean {
        return room.rooms_seats <= course.courses_pass + course.courses_fail + course.courses_audit;
    }

}
