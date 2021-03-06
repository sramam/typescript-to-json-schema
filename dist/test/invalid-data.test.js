"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const hookStd = require("hook-std");
const path_1 = require("path");
const formatter_1 = require("../factory/formatter");
const parser_1 = require("../factory/parser");
const program_1 = require("../factory/program");
const SchemaGenerator_1 = require("../src/SchemaGenerator");
const basePath = "test/invalid-data";
function assertSchema(name, type) {
    it(name, () => {
        const config = {
            path: path_1.resolve(`${basePath}/${name}/*.ts`),
            type: type,
            expose: "export",
            topRef: true,
            jsDoc: "none",
            visibility: "hide",
        };
        const unhook = hookStd.stderr((out) => "");
        const program = program_1.createProgram(config);
        const generator = new SchemaGenerator_1.SchemaGenerator(program, parser_1.createParser(program, config), formatter_1.createFormatter(config));
        try {
            generator.createSchema(type);
            chai_1.assert.equal(false, true, `Expected createSchema to throw`);
        }
        catch (err) {
        }
        finally {
            unhook();
        }
    });
}
describe("invalid-data", () => {
    assertSchema("script-empty", "MyType");
});
//# sourceMappingURL=invalid-data.test.js.map