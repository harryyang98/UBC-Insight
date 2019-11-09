import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {Plan, TimeTable} from "./TimeTable";
import {ScoreCalculator} from "./ScoreCalculator";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        const calc = new ScoreCalculator(sections);
        const sectionSet = new Set<SchedSection>(sections);

        // try to find the best time table
        let bestTable = new TimeTable();
        while (rooms.length > 0 && sectionSet.size > 0) {
            // add the room with best sections that results in highest score
            this.takeBestRoom(bestTable, rooms, sectionSet, calc);
        }

        // fix conflicts of section time requirements

        return bestTable.toArray();
    }

    private takeBestRoom(
        table: TimeTable, roomChoices: SchedRoom[], secChoices: Set<SchedSection>, calc: ScoreCalculator
    ) {
        const oldScore = calc.calcScore(table);
        const self = this;
        const bestRoom = roomChoices.reduce((temp: any, room: SchedRoom) => {
            table.addPlans(self.findBestRoomPlans(table, room, secChoices));
            const score = calc.calcScore(table);
            table.removePlanByRoom(room);

            return (score - oldScore > 0 && score > temp[1]) ? [room, score] : temp;
        }, [null, 0])[0];

        // remove room courses from choices for next round
        roomChoices = roomChoices.filter((room) => {
            return !(room === bestRoom);
        });
        const bestSections = this.findBestRoomPlans(table, bestRoom, secChoices).map((p) => {
            return p.section;
        });
        for (const sec of bestSections) {
            secChoices.delete(sec);
        }
    }

    private findBestRoomPlans(table: TimeTable, room: SchedRoom, secChoices: Set<SchedSection>): Plan[] {
        const self = this;
        let count = 0;
        return Array.from(secChoices).sort((a, b) => {
            if (Scheduler.secSize(a) === Scheduler.secSize(b)) {
                return 0;
            }
            return Scheduler.secSize(a) > Scheduler.secSize(b) ? 1 : -1;
        }).filter((sec) => {
            return !Scheduler.canFitIn(room, sec);
        }).slice(0, table.slotSize()).map((sec) => {
            return { room: room, section: sec, slot: table._timeSlots[count ++] } as Plan;
        });
    }

    private fixConflicts(table: TimeTable) {
        table.getRooms().reduce((r1, r2) => {
            while (this.hasConflict(table, r1, r2)) {
                table.shuffleRoomPlans(r1);
            }
            return r2;
        });
    }

    private hasConflict(table: TimeTable, r1: SchedRoom, r2: SchedRoom): boolean {
        const plans1 = table.getPlansByRoom(r1);
        const plans2 = table.getPlansByRoom(r2);
        for (const p1 of table.getPlansByRoom(r1)) {
            for (const p2 of table.getPlansByRoom(r2)) {
                if (
                    p1.slot === p2.slot
                    && p1.section.courses_dept === p2.section.courses_dept
                    && p1.section.courses_id === p2.section.courses_id
                ) {
                    return false;
                }
            }
        }
        return true;
    }

    private static canFitIn(room: SchedRoom, sec: SchedSection): boolean {
        return room.rooms_seats <= Scheduler.secSize(sec);
    }

    private static secSize(sec: SchedSection) {
        return sec.courses_pass + sec.courses_fail + sec.courses_audit;
    }

}
