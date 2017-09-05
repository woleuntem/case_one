"use strict";
const Assert = require("assert");
const Http = require("http");
const XServer = require("./extremely-simple-server.js");

describe("Module extremely-simple-server", function () {
    describe("create", function () {
        it("should return an instance of http Server", function () {
            Assert.equal(XServer.create().constructor, Http.Server);
        });

        it("http://127.0.0.1:8080/evil.exe should return a status code of 404", function (done) {
            Http.get("http://127.0.0.1:8080/evil.exe", function (response) {
                Assert.equal(response.statusCode, 404);
                done();
            });
        });

        it("http://127.0.0.1:8080/../evil.exe should return a status code of 404", function (done) {
            Http.get("http://127.0.0.1:8080/../evil.exe", function (response) {
                Assert.equal(response.statusCode, 404);
                done();
            });
        });

        it("http://127.0.0.1:8080/amd should return a status code of 200", function (done) {
            Http.get("http://127.0.0.1:8080/amd", function (response) {
                Assert.equal(response.statusCode, 200);
                done();
            });
        });

        it("http://127.0.0.1:4343/amd should return a status code of 200", function (done) {
            XServer.create(4343);
            Http.get("http://127.0.0.1:4343/amd", function (response) {
                Assert.equal(response.statusCode, 200);
                done();
            });
        });
    });
});
