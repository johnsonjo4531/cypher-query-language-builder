"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const neo4j_driver_1 = __importDefault(require("neo4j-driver"));
const CypherRawText_1 = __importDefault(require("./CypherRawText"));
class CypherQuery {
    constructor(config, strings, params = []) {
        this.config = config;
        this.strings = strings;
        this.params = params;
    }
    export(prefix = "p") {
        let query = "";
        let params = {};
        for (let i = 0, l = this.strings.length; i < l; i++) {
            const name = `${prefix}_${i}`;
            const param = this.params[i];
            query += this.strings[i];
            const acceptParam = (innerParam, innerName) => {
                if (innerParam instanceof CypherQuery) {
                    const [subQuery, subParams] = innerParam.export(innerName);
                    query += subQuery;
                    params = Object.assign({}, params, subParams);
                }
                else if (Array.isArray(innerParam)) {
                    for (let j = 0; j < innerParam.length; ++j) {
                        acceptParam(innerParam[j], `${innerName}_${j}`);
                    }
                }
                else if (innerParam instanceof CypherRawText_1.default) {
                    query += innerParam.toString();
                }
                else if (innerParam !== undefined) {
                    query += `{${innerName}}`;
                    params[innerName] = innerParam;
                }
            };
            acceptParam(param, name);
        }
        return [query, params];
    }
    async run(config = {}) {
        const { driver, parseIntegers, rawResults } = Object.assign({}, this.config, config);
        const session = driver.session();
        const [query, params] = this.export();
        const result = await session.run(query, params);
        if (rawResults) {
            return result;
        }
        let data = normalizeObjects(result.records);
        if (parseIntegers) {
            data = normalizeInts(data);
        }
        session.close();
        return data;
    }
}
exports.default = CypherQuery;
function normalizeObjects(record) {
    if (!(record instanceof Object)) {
        return record;
    }
    let normalized = record;
    if (record.toObject !== undefined) {
        normalized = record.toObject();
    }
    if (record instanceof neo4j_driver_1.default.types.Node) {
        normalized = record.properties;
    }
    if (normalized instanceof Array) {
        normalized = normalized.map(item => normalizeObjects(item));
    }
    else if (normalized instanceof Object) {
        for (const key of Object.keys(normalized)) {
            normalized[key] = normalizeObjects(normalized[key]);
        }
    }
    return normalized;
}
function normalizeInts(record) {
    let normalized = record;
    if (neo4j_driver_1.default.isInt(record)) {
        const i = neo4j_driver_1.default.integer;
        normalized = i.inSafeRange(record)
            ? i.toNumber(record)
            : i.toString(record);
    }
    else if (record instanceof Array) {
        normalized = record.map(item => normalizeInts(item));
    }
    else if (record instanceof Object) {
        for (const key of Object.keys(record)) {
            normalized[key] = normalizeInts(record[key]);
        }
    }
    return normalized;
}
//# sourceMappingURL=CypherQuery.js.map