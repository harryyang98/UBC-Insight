import {SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export interface Plan {
    room: SchedRoom;
    slot: TimeSlot;
    section: SchedSection;
}

export class TimeTable {
    private plans: Plan[];
    private timeSlots: string[];

    public get _timeSlots() {
        return this.timeSlots;
    }

    constructor() {
        this.clear();
        this.setupTimeSlots();
    }

    public addPlan(plan: Plan) {
        this.plans.push(plan);
    }

    public addPlans(plans: Plan[]) {
        this.plans.push(...plans);
    }

    public getPlansByRoom(room: SchedRoom) {
        return this.plans.filter((plan) => {
            return plan.room === room;
        });
    }

    public removePlanByRoom(room: SchedRoom) {
        this.plans = this.plans.filter((plan) => {
            return !(plan.room === room);
        });
    }

    public shuffleRoomPlans(room: SchedRoom) {
        const temps = this.plans.filter((plan) => {
            return plan.room === room;
        }).sort((a, b) => {
            return 0.5 - Math.random();
        });
        this.removePlanByRoom(room);
        this.addPlans(temps);
    }

    public getRooms() {
        const rooms: SchedRoom[] = [];
        for (const plan of this.plans) {
            if (!rooms.includes(plan.room)) {
                rooms.push(plan.room);
            }
        }
        return rooms;
    }

    public clear() {
        this.plans = [];
    }

    public toArray(): any {
        return this.plans;
    }

    public slotSize(): number {
        return this.timeSlots.length;
    }

    private setupTimeSlots() {
        this.timeSlots = [
            "MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100",
            "MWF 1100-1200", "MWF 1200-1300", "MWF 1300-1400",
            "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
            "TR  0800-0930", "TR  0930-1100", "TR  1100-1230",
            "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"
        ];
    }
}
