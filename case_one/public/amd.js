/*jslint
    browser es6 maxlen:80
*/
/*global
    Array Error Map Object Promise window
*/

// https://github.com/amdjs/amdjs-api/blob/master/AMD.md
// http://wiki.commonjs.org/wiki/Modules/1.1
(function (window) {
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
        new Map([
            ["exports", {}],
            ["module", {}]
        ])
    );

    /*
    * require
    */
    const rejectModule = function (path, promise, e) {
        promise.reject(moduleRegister(path, e.target));
    };

    const moduleLoader = function (spec) {
        const {doc, id, path, promise} = spec;
        const script = doc.createElement("script");

        script.addEventListener(
            "error",
            partApply(rejectModule, path, promise)
        );
        script.setAttribute("id", id);
        script.setAttribute("src", `${path}.js`);
        return script;
    };

    const initialiseModule = function (spec) {
        const {doc, id, path} = spec;

        if (!(moduleRegister(path) || doc.getElementById(id))) {
            doc.head
                .appendChild(
                    moduleLoader(spec)
                );
        }
    };

    const resolveModule = function _resolve(spec) {
        const {path, promise} = spec;

        if (!moduleRegister(path)) {
            window.setTimeout(_resolve, 24, spec);
            return spec;
        }

        promise.resolve(moduleRegister(path));
        return spec;
    };

    const moduleSpecifier = function (spec) {
        return Object.assign(
            {
                doc: window.document,
                id: `module:${spec.path.replace(/\//g, "-")}`
            },
            spec
        );
    };

    const moduleResolver = function (path, resolve, reject) {
        initialiseModule(
            resolveModule(
                moduleSpecifier(
                    {path, promise: {resolve, reject}}
                )
            )
        );
    };

    const _module = function (path) {
        return new Promise(partApply(moduleResolver, path));
    };

    const requireResolver = function (loadedCallback, modules) {
        loadedCallback(...modules);
    };

    const requireErrorCatch = function (error) {
        const stack = Error.prototype.isPrototypeOf(error)
            ? error
            : {
                id: error.id.substring(7).replace("-", "/"),
                src: error.src
            };

        window.console.error("Error::require", stack);
    };

    const require = function (modules, loadedCallback) {
        Promise
            .all(Array.prototype.concat(modules).map(_module))
            .then(partApply(requireResolver, loadedCallback))
            .catch(requireErrorCatch);
    };

    Object.defineProperty(
        require,
        "paths",
        {
            enumerable: true,
            value: []
        }
    );

    Object.defineProperty(
        window,
        "require",
        {
            enumerable: true,
            value: moduleRegister("require", require)
        }
    );

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
            : window.document.currentScript
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

    Object.defineProperty(
        window,
        "define",
        {enumerable: true, value: define}
    );
}(window));
