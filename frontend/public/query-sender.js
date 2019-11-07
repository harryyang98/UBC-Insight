/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        console.log("Ready to post query: \n" );
        const server_url = "http://localhost:4321/query";

        let xhttp = new XMLHttpRequest();
        xhttp.onload = () => {
            console.log(xhttp.response);
            fulfill(xhttp.response)
        };
        xhttp.onerror = () => {
            console.log(xhttp.response);
            reject(xhttp.response)
        };

        xhttp.open("POST", server_url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(JSON.stringify(query));
    });
};
