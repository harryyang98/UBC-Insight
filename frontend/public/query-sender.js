/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function (query) {
    return new Promise(function (fulfill, reject) {
        const server_url = "http://localhost:4321/query";

        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange(() => {
            if (this.readyState === 4 && this.status === 200) {
                fulfill(this.responseText);
            }
            reject(this.responseText);
        });

        xhttp.open("POST", server_url);
        xhttp.setRequestHeader("Content-Type", "application/json");
        xhttp.send(query);
    });
};
