export class SetUtils {

    public static union(sets: Array<Set<number>>): Set<number> {
        const n = new Set<number>();
        for (const set of sets) {
            set.forEach((e) => {
                return n.add(e);
            });
        }
        return n;
    }

    public static intersecion(sets: Array<Set<number>>): Set<number> {
        const n = new Set<number>(sets[0]);
        for (let i = 1; i < sets.length; i ++) {
            for (const e of sets[0]) {
                if (!sets[i].has(e)) {
                    n.delete(e);
                }
            }
        }
        return n;
    }

    public static complementary(a: Set<number>, c: Set<number>): Set<number> {
        const n = new Set<number>(c);
        for (const e of a) {
            n.delete(e);
        }
        return n;
    }

    public static setFilter(set: Set<number>, filter: ((n: number) => boolean)) {
        const n = new Set<number>(set);
        for (const e of set) {
            if (!filter(e)) {
                n.delete(e);
            }
        }
        return n;
    }

}
