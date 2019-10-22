/* tslint:disable:no-console */

import {InsightError} from "./controller/IInsightFacade";
import {AssertionUtils} from "./utils/AssertionUtils";

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
        AssertionUtils.assertDefined(a);
        AssertionUtils.assertDefined(b);
        if (typeof a === "string") {
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

}
