/*jslint
    es6 maxlen:80 node
*/
"use strict";

const Fs = require("fs");
const Path = require("path");

const flatten = function (array) {
    return array.reduce((a, b) => a.concat(b), []);
};

const partApply = function (fn, ...fixed) {
    return (...args) => fn.apply(null, [...fixed, ...args]);
};

const watch = function (path) {
    console.log("watching", path);

    Fs.watch(path, function (eventType, filename) {
        console.log(path, eventType, filename);
    });
};

const childDirectoryItemStatCallback = function (spec, ignore, stats) {
    spec.promise.resolve(
        stats.isDirectory()
            ? spec.path
            : null
    );
};

const childDirectoryItemPromiseCallback = function (path, resolve, reject) {
    Fs.stat(
        path,
        partApply(
            childDirectoryItemStatCallback,
            {path, promise: {resolve, reject}}
        )
    );
};

const childDirectoryItemsMapCallback = function (spec, dirItem) {
    return new Promise(
        partApply(
            childDirectoryItemPromiseCallback,
            Path.resolve(spec.path, dirItem)
        )
    );
};

const childDirectoriesReaddirResolver = function (resolve, dirItems) {
    resolve(dirItems.filter((item) => item !== null));
};

const childDirectoriesReaddirCallback = function (spec, error, dirItems) {
    if (error !== null) {
        throw new Error(`${error.path}::${error.code}`);
    }

    Promise.all(
        dirItems.map(
            partApply(
                childDirectoryItemsMapCallback,
                spec
            )
        )
    )
        .then(
            partApply(
                childDirectoriesReaddirResolver,
                spec.promise.resolve
            )
        );
};

const childDirectoriesPromiseCallback = function (path, resolve, reject) {
    Fs.readdir(
        path,
        partApply(
            childDirectoriesReaddirCallback,
            {path, promise: {reject, resolve}}
        )
    );
};

const getChildDirectories = function (path) {
    return new Promise(partApply(childDirectoriesPromiseCallback, path));
};

const getBottomDirectoriesResolver = function (spec, childDirectories) {
    return childDirectories.length === 0
        ? spec.path
        : Promise.all(
            childDirectories
                .map((dir) => spec.caller(dir))
        );
};

const getBottomDirectories = async function _getBottomDirectories(path) {
    /*return getChildDirectories(path)
        .then(
            partApply(
                getBottomDirectoriesResolver,
                {caller: _getBottomDirectories, path}
            )
        );
    */
    return getBottomDirectoriesResolver(
        {caller: _getBottomDirectories, path},
        await getChildDirectories(path)
    );
};


getBottomDirectories("./board")
    .then((dirs) => flatten(dirs))
    .then((dirs) => dirs.forEach((dir) => watch(dir)));
