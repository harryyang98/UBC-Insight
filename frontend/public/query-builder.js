function dataToQuery(data, toKey) {
    // add WHERE
    const query = {};
    const whereArr = data["conditions"].map((cond) => {
        const comp = {};
        comp[toKey(cond.field)] = cond.op === "IS" ? cond.term : parseInt(cond.term, 10);
        const atom = {};
        atom[cond.op] = comp;
        return cond.not ? { NOT: atom } : atom;
    });
    const typeOp = {
        all: (x) => ({AND: x}),
        any: (x) => ({OR: x}),
        none: (x) => ({NOT: {OR: x}})
    };
    if (whereArr.length === 0) {
        query["WHERE"] = {};
    } else {
        query["WHERE"] = whereArr.length > 1 ? typeOp[data["conditions_type"]](whereArr) : whereArr[0];
    }

    // add OPTION
    const options = {};
    options["COLUMNS"] = data["columns"].map(toKey);
    options["COLUMNS"].push(...data["transformations"].map((x) => x.term));
    const order = data["order"];
    if (order.length > 0) {
        options["ORDER"] = {
            keys: order.map(toKey),
            dir: data["order_descending"] ? "DOWN" : "UP"
        };
        if (options["ORDER"].keys.length === 1 && options["ORDER"].dir === "UP") {
            options["ORDER"] = options["ORDER"].keys[0];
        }
    }
    query["OPTIONS"] = options;

    // add TRANSFORMATION
    if (data["groups"].length > 0 || data["transformations"].length > 0) {
        const transformations = {};
        transformations["GROUP"] = data["groups"].map(toKey);
        transformations["APPLY"] = data["transformations"].map((app) => {
            const trans = {};
            trans[app.op] = toKey(app.field);
            const atom = {};
            atom[app.term] = trans;
            return atom;
        });
        query["TRANSFORMATIONS"] = transformations;
    }

    return query;
}

function getFormData() {
    // add entries
    const data = {};
    data["conditions"] = queryArray(".conditions-container .condition").map((cond) => {
        return {
            not: cond.children[0].children[0].checked,
            field: cond.children[1].children[0].value,
            op: cond.children[2].children[0].value,
            term: cond.children[3].children[0].value
        };
    });
    data["transformations"] = queryArray(".transformations-container .transformation").map((trans) => {
        return {
            term: trans.children[0].children[0].value,
            op: trans.children[1].children[0].value,
            field: trans.children[2].children[0].value
        }
    });

    // add options
    data["conditions_type"] =  extractOptions(queryArray(".condition-type input"))[0];
    data["order"] = extractSelections(queryArray(".order option"));
    data["order_descending"] = document.querySelector(".descending input").checked;
    data["columns"] = extractOptions(queryArray(".columns .field input"));
    data["groups"] = extractOptions(queryArray(".groups .field input"));

    return data;
}

function getId() {
    return getKind();
}

function getKind() {
    return document.querySelector("div.tab-panel.active").getAttribute("data-type");
}

function extractOptions(options) {
    return options.filter((o) => o.checked).map((o) => o.value);
}

function extractSelections(selections) {
    return selections.filter((o) => o.selected).map((o) => o.value);
}

function queryArray(query) {
    return [...document.querySelectorAll(query)];
}

/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
CampusExplorer.buildQuery = function () {
    const query = dataToQuery(getFormData(), (x) => getId() + "_" + x);
    console.log("Query building complete:");
    console.log(query);
    return query;
};

