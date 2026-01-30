var http = require("http");
var https = require("https");

function fetchText(url, callback) {
    https.get(url, function (res) {

        var data = "";

        res.on("data", function (chunk) {
            data += chunk;
        });

        res.on("end", function () {
            callback(null, data);
        });

    }).on("error", function (err) {
        callback(err);
    });
}

function extractSpotCodes(svgText) {

    var spots = [];
    var regex = /<g[^>]*id="([^"]+)"[^>]*class="spot"|<g[^>]*class="spot"[^>]*id="([^"]+)"/g;
    var match;

    while ((match = regex.exec(svgText)) !== null) {
        spots.push(match[1] || match[2]);
    }

    return spots;
}

/* ============================= */
/* CREATE SERVER */
/* ============================= */

var server = http.createServer(function (req, res) {

    if (req.method === "POST" && req.url === "/extract-spots") {

        var body = "";

        req.on("data", function (chunk) {
            body += chunk;
        });

        req.on("end", function () {

            try {

                var data = JSON.parse(body);
                var url = data.map_layout_url;

                fetchText(url, function (err, svgText) {

                    if (err) {
                        res.writeHead(500, { "Content-Type": "text/plain" });
                        return res.end("Failed to fetch SVG");
                    }

                    var spots = extractSpotCodes(svgText);

                    res.writeHead(200, {
                        "Content-Type": "application/json"
                    });

                    res.end(JSON.stringify({
                        success: true,
                        spots: spots
                    }));

                });

            } catch (e) {
                res.writeHead(400, { "Content-Type": "text/plain" });
                res.end("Invalid JSON");
            }

        });

        return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");

});

/* ============================= */
/* START SERVER  (THIS WAS MISSING) */
/* ============================= */

var PORT = process.env.PORT || 3000;

server.listen(PORT, function () {
    console.log("Server running on port", PORT);
});