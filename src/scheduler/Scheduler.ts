import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";
import {TimeTable} from "./TimeTable";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        // remove course and room id from array
        const pureSections = this.removeIds(sections);
        const pureRooms = this.removeIds(rooms);

        // try all combination and find the highest score
        let max = 0;
        const timeTable = new TimeTable();

        // add course and room id back
        return [];
    }

    private removeIds(arr: any): any {
        return arr.map((obj: any) => {
            return Object.keys(obj).reduce((pObj: any, key: string) => {
                const newKey: string = key.split("_")[0];
                pObj[newKey] = obj[key];
                return pObj;
            }, {});
        });
    }

}
