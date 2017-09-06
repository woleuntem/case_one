/*jslint
    browser es6 maxlen:80
*/
/*global
    Map Object window
*/

// https://github.com/amdjs/amdjs-api/blob/master/AMD.md
(function () {
    "use strict";

    if (window.hasOwnProperty("define")) {
        return;
    }

    const define = function (map) {
        /*
        const _dependencies = function (_arguments) {
            return _arguments.find((argument) => Array.isArray(argument))
                    || ["require", "exports", "module"];
        };

        const _factory = function (factory) {
            return typeof factory === "function"
                ? factory()
                : factory;
        };
        */

        const _id = function (id) {
            return typeof id === "string"
                ? id
                : null;
        };

        return function (..._arguments) {
            const id = _id(_arguments[0]);

            if (map.has(id)) {
                return;
            }

            /*
            const dependencies = _dependencies(_arguments.slice(0, 2));
            map.set(id, _factory(_arguments.slice(-1)[0]));
            */
        };
    };

    const store = new Map();

    Object.defineProperty(
        window,
        "define",
        {enumerable: true, value: define(store)}
    );

    Object.defineProperty(
        window.define,
        "amd",
        {enumerable: true, value: {}}
    );
}());
