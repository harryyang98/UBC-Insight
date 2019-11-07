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
        // if (this.registered.includes(regRoom) || this.registered.includes(regSection)) {
        //     throw new Error("Conflicting when adding the course");
        // } else if (!TimeTable.canFit(room, course)) {
        //     throw new Error("The room is too small for the course");
        // }

        // add course to timetable
        this.plans.push([room, course]);

        // add slot-room combination to registered for quick checking
        this.registered.push(regRoom, regSection);
    }

    public clear() {
        this.plans = [];
        this.registered = [];
    }

    public toArray(): any {
        return this.plans;
    }


}
