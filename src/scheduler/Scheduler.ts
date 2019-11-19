import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {Plan, TimeTable} from "./TimeTable";
import {ScoreCalculator} from "./ScoreCalculator";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        rooms = [...rooms];
        const calc = new ScoreCalculator(sections);
        const sectionSet = new Set<SchedSection>(sections);

        // try to find the best time table
        let bestTable = new TimeTable();
        while (rooms.length > 0 && sectionSet.size > 0) {
            // add the room with best sections that results in highest score
            if (!this.takeBestRoom(bestTable, rooms, sectionSet, calc)) {
                break;
            }
        }

        // fix conflicts of section time requirements
        this.fixConflicts(bestTable);

        return bestTable.toArray().map((plan: Plan) => {
            return [plan.room, plan.section, plan.slot];
        });
    }

    private takeBestRoom(
        table: TimeTable, roomChoices: SchedRoom[], secChoices: Set<SchedSection>, calc: ScoreCalculator
    ): boolean {
        const oldScore = calc.calcScore(table);
        const self = this;
        const bestRoom = roomChoices.reduce((temp: any, room: SchedRoom) => {
            table.addPlans(self.findBestRoomPlans(table, room, secChoices));
            const score = calc.calcScore(table);
            table.removePlanByRoom(room);

            return (score - oldScore > 0 && score > temp[1]) ? [room, score] : temp;
        }, [null, 0])[0];

        // skip if there no room to add
        if (bestRoom === null) {
            return false;
        }
        table.addPlans(self.findBestRoomPlans(table, bestRoom, secChoices));

        // remove room courses from choices for next round
        roomChoices.splice(roomChoices.indexOf(bestRoom), 1);
        const bestSections = this.findBestRoomPlans(table, bestRoom, secChoices).map((p) => {
            return p.section;
        });
        for (const sec of bestSections) {
            secChoices.delete(sec);
        }
        return true;
    }

    private findBestRoomPlans(table: TimeTable, room: SchedRoom, secChoices: Set<SchedSection>): Plan[] {
        let count = 0;
        return Array.from(secChoices).sort((a, b) => {
            if (Scheduler.secSize(a) === Scheduler.secSize(b)) {
                return 0;
            }
            return Scheduler.secSize(a) < Scheduler.secSize(b) ? 1 : -1;
        }).filter((sec) => {
            return !Scheduler.canFitIn(room, sec);
        }).slice(0, table.slotSize()).map((sec) => {
            return { room: room, section: sec, slot: table._timeSlots[count ++] } as Plan;
        });
    }

    private fixConflicts(table: TimeTable) {
        if (table.getRooms().length < 2) {
            return;
        }
        for (const room of table.getRooms()) {
            let count = 0;
            while (Scheduler.hasConflict(table, room, false)) {
                table.shuffleRoomPlans(room);

                // start to remove the conflicts if impossible
                if (count ++ > 100) {
                    Scheduler.hasConflict(table, room, true);
                    count = 50;
                }
            }
        }
    }

    private static hasConflict(table: TimeTable, target: SchedRoom, remove: boolean): boolean {
        let conflict: Plan = null;
        for (const from of table.getRooms()) {
            if (from === target) {
                continue;
            }
            for (const p1 of table.getPlansByRoom(from)) {
                for (const p2 of table.getPlansByRoom(target)) {
                    if (
                        p1.slot === p2.slot
                        && p1.section.courses_dept === p2.section.courses_dept
                        && p1.section.courses_id === p2.section.courses_id
                    ) {
                        conflict = p1;
                        break;
                    }
                }
            }
        }

        if (remove && conflict !== null) {
            table.removePlan(conflict);
            return true;
        }
        return conflict !== null;
    }

    private static canFitIn(room: SchedRoom, sec: SchedSection): boolean {
        return room.rooms_seats <= Scheduler.secSize(sec);
    }

    private static secSize(sec: SchedSection) {
        return sec.courses_pass + sec.courses_fail + sec.courses_audit;
    }

}
