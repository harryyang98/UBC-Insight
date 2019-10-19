import {InsightError} from "./IInsightFacade";
import {Decimal} from "decimal.js";

export class Operations {

    public static readonly filterOps: any = {
        IS: ["string", (a: string, regex: string) => {
            if (!regex.includes("*")) {
                return a === regex;
            } else if (!/^\*?[^\*]*\*?$/.test(regex)) {
                throw new InsightError("Invalid regex filter value");
            }
            return new RegExp("^" + regex.split("*").join(".*") + "$").test(a);
        }],
        EQ: ["number", (a: number, b: number) => {
            return a === b;
        }],
        LT: ["number", (a: number, b: number) => {
            return a < b;
        }],
        GT: ["number", (a: number, b: number) => {
            return a > b;
        }]
    };

    public static readonly applyOps: any = {
        SUM: (x: number[]) => {
            return Number((x.reduce((a: number, b: number) => {
                return a + b;
            })).toFixed(2));
        },
        AVG: (x: number[]) => {
            return Number((x.reduce((a: Decimal, b: number) => {
                return a.add(new Decimal(b));
            }, new Decimal(0)).toNumber() / x.length).toFixed(2));
        },
        MAX: (x: number[]) => {
            return Math.max(...x);
        },
        MIN: (x: number[]) => {
            return Math.min(...x);
        },
        COUNT: (x: any[]) => {
            const temp: any[] = [];
            for (const t of x) {
                if (!temp.includes(t)) {
                    temp.push(t);
                }
            }
            return temp.length;
        }
    };

}
