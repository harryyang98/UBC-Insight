import {InsightError} from "./IInsightFacade";

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
            return x.reduce((a: number, b: number) => {
                return a + b;
            });
        },
        AVG: (x: number[]) => {
            return x.reduce((a: number, b: number) => {
                return a + b;
            }) / x.length;
        },
        MAX: (x: number[]) => {
            return Math.max(...x);
        },
        MIN: (x: number[]) => {
            return Math.min(...x);
        },
        COUNT: (x: any[]) => {
            return x.length;
        }
    };

}
