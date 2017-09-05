/*jslint
    es6 maxlen:80 node
*/
"use strict";
const Config = require("config.js");
const Fs = require("fs");
const Http = require("http");
const Path = require("path");
const Url = require("url");

const contentType = function (path) {
    switch (Path.extname(path)) {
    case ".css":
        return "text/css";
    case ".html":
        return "text/html";
    case ".js":
        return "application/javascript";
    default:
        return "text/plain";
    }
};

const partApply = function (fn, ...fixed) {
    return (...args) => fn.apply(null, [...fixed, ...args]);
};

const responseData = (status, body) => ({body, status});

// >>> readRequestedFile
const readRequestedFileCallback = function (spec, error, content) {
    const {path, promise} = spec;
    const data = error === null
        ? responseData(200, content)
        : responseData(404, "Not Found");

    promise.resolve({data, path});
};

const readRequestedFileExecutor = function (path, resolve/*, reject*/) {
    Fs.readFile(
        path,
        partApply(readRequestedFileCallback, {path, promise: {resolve}})
    );
};

const readRequestedFile = function (path) {
    return new Promise(partApply(readRequestedFileExecutor, path));
};
// readRequestedFile <<<

// validate extension
const requestedFileExt = function (name) {
    const ext = Path.extname(name);
    return ext.length === 0
        ? ".html"
        : (/^\.(?:css|html|js)$/).test(ext)
            ? ext
            : ".404";
};

// protect against path injection
const requestedFileName = function (name) {
    const basename = Path.basename(name, Path.extname(name));

    return (/[^a-zA-Z0-9\-]/).test(basename)
        ? `_404`
        : basename;
};

const requestedFilePath = function (url) {
    const pathname = Url.parse(url).pathname.substring(1);
    const name = requestedFileName(pathname);
    const ext = requestedFileExt(pathname);
    const dir = `${Config.applicationRoot}public`;
    return Path.format({dir, ext, name});
};

const writeResponse = function (response, {data, path}) {
    const {body, status} = data;

    response.writeHead(
        status,
        {
            "Content-Length": Buffer.byteLength(body, "UTF-8"),
            "Content-Type": `${contentType(path)}; charset=UTF-8`
        }
    );

    response.end(body);
};

const requestListener = function (request, response) {
    readRequestedFile(requestedFilePath(request.url))
        .then(partApply(writeResponse, response));
};

const onready = function (hostname, port) {
    console.log(`listening on http://${hostname}:${port}`);
};

const create = function (port = 8080, hostname = "127.0.0.1") {
    return Http
        .createServer(requestListener)
        .listen(port, hostname, partApply(onready, hostname, port));
};

// >>> module exports
const _exports = Object.create(
    Object.prototype,
    {
        create: {
            enumerable: true,
            value: create
        }
    }
);

Object.defineProperty(
    module,
    "exports",
    {
        enumerable: true,
        value: _exports
    }
);
// module exports <<<
