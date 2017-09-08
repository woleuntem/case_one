/*jslint
    browser es6 maxlen:80
*/
/*global
    Array Map Object Promise window
*/

// https://github.com/amdjs/amdjs-api/blob/master/AMD.md
(function (win) {
    "use strict";

    if (win.hasOwnProperty("define")) {
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
        new Map([
            ["exports", {}],
            ["module", {}],
            ["require", {}]
        ])
    );
    /*
    * define
    */
    const resolveRegisteredModule = function _resolve({path, promise}) {
        if (!moduleRegister(path)) {
            win.setTimeout(_resolve, 24, {path, promise});
            return;
        }

        promise.resolve(moduleRegister(path));
    };

    const rejectModuleError = function (path, promise, e) {
        promise.reject(moduleRegister(path, {e}));
    };

    const moduleScript = function (id, {path, promise}) {
        const script = win.document.createElement("script");
        script.addEventListener(
            "error",
            partApply(rejectModuleError, path, promise)
        );
        script.setAttribute("id", id);
        script.setAttribute("src", `${path}.js`);
        return script;
    };

    const moduleResolver = function (path, resolve, reject) {
        const doc = win.document;
        const id = `module:${path.replace(/\//g, "-")}`;
        const spec = {path, promise: {resolve, reject}};

        resolveRegisteredModule(spec);

        if (!(moduleRegister(path) || doc.getElementById(id))) {
            doc.head.appendChild(moduleScript(id, spec));
        }
    };

    const _module = function (path) {
        return new Promise(partApply(moduleResolver, path));
    };

    const requireResolver = function (loadedCallback, modules) {
        loadedCallback(...modules);
    };

    const require = function (modules, loadedCallback) {
        if (!Array.isArray(modules)) {
            // throw
            return;
        }

        Promise
            .all(modules.map(_module))
            .then(partApply(requireResolver, loadedCallback))
            .catch(function ({e}) {
                win.console.log(e);
            });
    };

    /*
    * define
    */
    const defineDependencies = function (args) {
        return args.find((arg) => Array.isArray(arg))
                || ["require", "exports", "module"];
    };

    const defineFactoryInstantiate = function (factory, ...args) {
        return typeof factory === "function"
            ? factory(...args)
            : factory;
    };

    const defineId = function (id) {
        return typeof id === "string"
            ? id
            : win.document.currentScript
                .getAttribute("src").replace(/\.js$/, "");
    };

    const defineArguments = function (args) {
        return {
            dependencies: defineDependencies(args.slice(0, 2)),
            factory: args.slice(-1)[0],
            id: defineId(args[0])
        };
    };

    const defineRequireCallback = function (factory, id, ...args) {
        moduleRegister(id, defineFactoryInstantiate(factory, ...args));
    };

    const define = function (...args) {
        const {dependencies, factory, id} = defineArguments(args);

        if (!moduleRegister(id)) {
            require(
                dependencies,
                partApply(defineRequireCallback, factory, id)
            );
        }
    };

    Object.defineProperty(
        define,
        "amd",
        {enumerable: true, value: {}}
    );

    Object.defineProperties(
        win,
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
}(window));
