/*jslint
    browser es6 maxlen:80
*/
/*global
    Array Map Object Promise window
*/

// https://github.com/amdjs/amdjs-api/blob/master/AMD.md
(function () {
    "use strict";

    if (window.hasOwnProperty("define")) {
        return;
    }

    const partApply = function (fn, ...fixed) {
        return (...args) => fn.apply(null, [...fixed, ...args]);
    };

    const moduleRegister = partApply(
        function (register, key, value) {
            if (value !== undefined && !register.has(key)) {
                register.set(key, value);
            }
            return register.get(key);
        },
        new Map()
    );

    /*
    * define
    */
    const registerResolver = function _registerResolver(spec) {
        const {path, promise} = spec;

        if (!moduleRegister(path)) {
            window.setTimeout(_registerResolver, 24, spec);
            return;
        }

        promise.resolve(moduleRegister(path));
    };

    const moduleScript = function (id, spec) {
        const script = window.document.createElement("script");
        script.addEventListener(
            "load",
            partApply(registerResolver, spec)
        );
        script.setAttribute("id", id);
        script.setAttribute("src", `${spec.path}.js`);
        return script;
    };

    const moduleResolver = function (path, resolve, reject) {
        const doc = window.document;
        const id = `module:${path.replace(/\//g, "-")}`;
        const spec = Object.assign({path, promise: {resolve, reject}});

        if (doc.getElementById(id)) {
            registerResolver(spec);
        } else {
            doc.head.appendChild(moduleScript(id, spec));
        }
    };

    const module = function (path) {
        return new Promise(partApply(moduleResolver, path));
    };

    const requireResolver = function (loadedCallback, modules) {
        loadedCallback.apply(null, modules);
    };

    const require = function (modules, loadedCallback) {
        if (!Array.isArray(modules)) {
            // throw
            return;
        }

        Promise
            .all(modules.map(module))
            .then(partApply(requireResolver, loadedCallback));
    };

    /*
    * define
    */
    /*
    const _dependencies = function (_arguments) {
        return _arguments.find((argument) => Array.isArray(argument))
                || ["require", "exports", "module"];
    };
    */
    const _factory = function (factory) {
        return typeof factory === "function"
            ? factory()
            : factory;
    };

    const _id = function (id) {
        return typeof id === "string"
            ? id
            : window.document.currentScript
                .getAttribute("src").replace(/\.js$/, "");
    };

    const define = function (..._arguments) {
        const id = _id(_arguments[0]);
        const registered = moduleRegister(id);
        if (registered) {
            return registered;
        }

        //_dependencies(_arguments.slice(0, 2))
        return moduleRegister(id, _factory(_arguments.slice(-1)[0]));
    };

    Object.defineProperty(
        define,
        "amd",
        {enumerable: true, value: {}}
    );

    Object.defineProperties(
        window,
        {
            define: {
                enumerable: true,
                value: define
            },

            require: {
                enumerable: true,
                value: require
            }
        }
    );
}());

window.require(["./module1"], function (module1) {
    "use strict";
    window.console.log(module1);
});
