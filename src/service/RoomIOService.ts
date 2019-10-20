import {JSONIOService} from "./JSONIOService";
import * as JSZip from "jszip";
import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {HttpService} from "./HttpService";
const Parse5 = require("parse5");

export class RoomIOService extends JSONIOService {

    protected getRawData(zip: JSZip): Promise<any[]> {
        // read index.htm
        const self = this;
        return zip.files["rooms/index.htm"].async("text").then((html) => {
            return RoomIOService.getBuildingData(html);
        }).then((buildings: any[]) => {
            return RoomIOService.addRoomData(buildings, zip);
        });
    }

    protected processRawData(roomLists: any): any[] {
        const rooms = [];
        for (const roomList of roomLists) {
            rooms.push(...roomList["roomInfos"].map((room: any) => {
                for (const key in roomList["buildingInfo"]) {
                    room[key] = roomList["buildingInfo"][key];
                }

                return room;
            }));
        }

        return rooms;
    }

    private static getBuildingData(html: string): Promise<any[]> {
        const buildings = RoomIOService.findTableEntries(Parse5.parse(html));

        return Promise.all(buildings.map((building: any) => {
            // find table of building
            const address = RoomIOService.extractText(building.childNodes[7]);

            // find coordinate with http
            return HttpService.requestCoordinate(address).then((coord) => {
                if (coord.hasOwnProperty("error")) {
                    throw new InsightError(coord["error"]);
                }
                return Promise.resolve({
                    fullname: RoomIOService.extractText(building.childNodes[5]),
                    shortname: RoomIOService.extractText(building.childNodes[3]),
                    address: address,
                    lat: coord["lat"],
                    lon: coord["lon"]
                });
            });
        }));
    }

    private static addRoomData(buildings: any[], zip: JSZip) {
        return Promise.all(buildings.map((building) => {
            // find file for the building
            const fileName = "rooms/campus/discover/buildings-and-classrooms/" + building.shortname;

            // add room information
            return zip.files[fileName].async("text").then((fileHtml) => {
                try {
                    const rooms = RoomIOService.findTableEntries(Parse5.parse(fileHtml));
                    return Promise.resolve(rooms.map((room: any) => {
                        const num = RoomIOService.extractText(room.childNodes[1]);
                        return {
                            number: num,
                            name: building.shortname + "_" + num,
                            seats: parseInt(RoomIOService.extractText(room.childNodes[3]), 10),
                            type: RoomIOService.extractText(room.childNodes[7]),
                            furniture: RoomIOService.extractText(room.childNodes[5]),
                            href: room.childNodes[9].childNodes[1].attrs[0].value.trim()
                        };
                    }));
                } catch (err) {
                    return Promise.resolve([]);
                }
            }).then((roomInfos) => {
                // add building information back
                return Promise.resolve({
                    buildingInfo: building,
                    roomInfos: roomInfos
                });
            });
        }));
    }

    private static findTableEntries(document: any): any {
        if (document.nodeName.includes("tbody")) {
            return document;
        } else if (document.hasOwnProperty("childNodes")) {
            const results: any[] = [];
            for (const node of document.childNodes) {
                const sub = this.findTableEntries(node);
                if (sub !== false) {
                    if (sub instanceof Array) {
                        return sub;
                    }
                    results.push(...sub.childNodes.filter((n: any) => {
                        return n.nodeName.includes("tr");
                    }));
                }
            }
            return results;
        }

        return false;
    }

    private static extractText(node: any): string {
        if (node.childNodes.length === 1) {
            return node.childNodes[0].value.trim();
        }
        return node.childNodes[1].childNodes[0].value.trim();
    }

}
