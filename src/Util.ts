/* tslint:disable:no-console */

import {InsightError} from "./controller/IInsightFacade";

/**
 * Collection of logging methods. Useful for making the output easier to read and understand.
 */
export default class Log {

    public static trace(...msg: any[]): void {
            console.log(`<T> ${new Date().toLocaleString()}:`, ...msg);
    }

    public static info(...msg: any[]): void {
            console.info(`<I> ${new Date().toLocaleString()}:`, ...msg);
    }

    public static warn(...msg: any[]): void {
            console.warn(`<W> ${new Date().toLocaleString()}:`, ...msg);
    }

    public static error(...msg: any[]): void {
            console.error(`<E> ${new Date().toLocaleString()}:`, ...msg);
    }

    public static test(...msg: any[]): void {
            console.log(`<X> ${new Date().toLocaleString()}:`, ...msg);
    }

    public static compareValues(a: any, b: any): number {
        if (a === undefined || b === undefined) {
            throw new InsightError("Cannot compare undefined value");
        } else if (typeof a === "string") {
            for (let i = 0; i < Math.min(a.length, b.length); i ++) {
                if (a.charCodeAt(i) !== b.charCodeAt(i)) {
                    return a.charCodeAt(i) > b.charCodeAt(i) ? 1 : -1;
                }
            }
            if (a.length === b.length) {
                return 0;
            }
            return a.length > b.length ? 1 : -1;
        }
        if (a === b) {
            return 0;
        }
        return a > b ? 1 : -1;
    }

    public static cartesianProduct(a: any[], b: any[]) {
        const results = [];
        for (const x of a) {
            for (const y of b) {
                results.push([x, y]);
            }
        }
        return results;
    }

}
