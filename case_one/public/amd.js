/*jslint
    browser es6 maxlen:80
*/
/*global
    Object window
*/

// https://github.com/amdjs/amdjs-api/blob/master/AMD.md
(function () {
    "use strict";

    if (window.hasOwnProperty("define")) {
        return;
    }

    const define = (/*id, dependencies, factory*/) => null;
    Object.defineProperty(define, "amd", {enumerable: true, value: {}});
    Object.defineProperty(window, "define", {enumerable: true, value: define});
}());
