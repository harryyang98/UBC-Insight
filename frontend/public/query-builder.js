function dataToQuery(data, toKey) {
    // add WHERE
    const query = {};
    const whereArr = data["conditions"].map((cond) => {
        const comp = {};
        comp[toKey(cond.field)] = cond.op === "IS" ? cond.term : Number(cond.term);
        const atom = {};
        atom[cond.op] = comp;
        return cond.not ? { NOT: atom } : atom;
    });
    const typeOp = {
        all: (x) => ({AND: x}),
        any: (x) => ({OR: x}),
        none: (x) => ({ AND: x.map((e) => Object.keys(e).includes("NOT") ? e["NOT"] : { NOT: e }) })
    };
    if (whereArr.length === 0) {
        query["WHERE"] = {};
    } else if (whereArr.length === 1) {
        if (data["conditions_type"] === "none") {
            query["WHERE"] = data["conditions"][0].not ? whereArr[0]["NOT"] : { NOT: whereArr[0] };
        }
        query["WHERE"] = whereArr[0];
    } else {
        query["WHERE"] = typeOp[data["conditions_type"]](whereArr);
    }

    // add OPTION
    const options = {};
    options["COLUMNS"] = data["columns"].map(toKey);
    options["COLUMNS"].push(...data["columns_trans"]);
    const order = data["order"];
    if (order.length > 0) {
        options["ORDER"] = {
            keys: order.map(toKey),
            dir: data["order_descending"] ? "DOWN" : "UP"
        };
        options["ORDER"].keys.push(...data["order_trans"]);
        if (options["ORDER"].keys.length === 1 && options["ORDER"].dir === "UP") {
            options["ORDER"] = options["ORDER"].keys[0];
        }
    }
    query["OPTIONS"] = options;

    // add TRANSFORMATION
    if (data["groups"].length > 0) {
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
    data["conditions"] = queryArray(getKindClass() + ".conditions-container .condition").map((cond) => {
        return {
            not: cond.children[0].children[0].checked,
            field: cond.children[1].children[0].value,
            op: cond.children[2].children[0].value,
            term: cond.children[3].children[0].value
        };
    });
    data["transformations"] = queryArray(getKindClass() + ".transformations-container .transformation").map((trans) => {
        return {
            term: trans.children[0].children[0].value,
            op: trans.children[1].children[0].value,
            field: trans.children[2].children[0].value
        }
    });

    // add options
    data["conditions_type"] =  extractOptions(queryArray(getKindClass() + ".condition-type input"))[0];
    data["order"] = extractSelections(queryArray(getKindClass() + ".order option:not(.transformation)"));
    data["order_trans"] = extractSelections(queryArray(getKindClass() + ".order option.transformation"));
    data["order_descending"] = document.querySelector(getKindClass() + ".descending input").checked;
    data["columns"] = extractOptions(queryArray(getKindClass() + ".columns .field input"));
    data["columns_trans"] = extractOptions(queryArray(getKindClass() + ".columns .transformation input"));
    data["groups"] = extractOptions(queryArray(getKindClass() + ".groups .field input"));

    return data;
}

function getKindClass() {
    return "div.tab-panel.active ";
}

function getId() {
    return getKind();
}

function getKind() {
    return document.querySelector(getKindClass()).getAttribute("data-type");
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

