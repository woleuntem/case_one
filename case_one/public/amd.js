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
    const resolveRegisteredModule = function _resolve(spec) {
        const {path, promise} = spec;

        if (!moduleRegister(path)) {
            window.setTimeout(_resolve, 24, spec);
            return;
        }

        promise.resolve(moduleRegister(path));
    };

    const moduleScript = function (id, spec) {
        const script = window.document.createElement("script");
        script.addEventListener(
            "load",
            partApply(resolveRegisteredModule, spec)
        );
        script.setAttribute("id", id);
        script.setAttribute("src", `${spec.path}.js`);
        return script;
    };

    const moduleResolver = function (path, resolve, reject) {
        const doc = window.document;
        const id = `module:${path.replace(/\//g, "-")}`;
        const spec = {path, promise: {resolve, reject}};

        if (doc.getElementById(id)) {
            resolveRegisteredModule(spec);
        } else {
            doc.head.appendChild(moduleScript(id, spec));
        }
    };

    const _module = function (path) {
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
            .all(modules.map(_module))
            .then(partApply(requireResolver, loadedCallback));
    };

    /*
    * define
    */
    const defineDependencies = function (args) {
        return args.find((arg) => Array.isArray(arg))
                || ["require", "exports", "module"];
    };

    const defineFactory = function (factory) {
        return typeof factory === "function"
            ? factory()
            : factory;
    };

    const defineId = function (id) {
        return typeof id === "string"
            ? id
            : window.document.currentScript
                .getAttribute("src").replace(/\.js$/, "");
    };

    const defineArguments = function (args) {
        return {
            dependencies: defineDependencies(args.slice(0, 2)),
            factory: defineFactory(args.slice(-1)[0]),
            id: defineId(args[0])
        };
    };

    const defineResolver = function (factory, id) {
        moduleRegister(id, factory);
    };

    const define = function (...args) {
        const {dependencies, factory, id} = defineArguments(args);

        if (moduleRegister(id)) {
            return;
        }

        Promise
            .all(dependencies)
            .then(partApply(defineResolver, factory, id));
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
