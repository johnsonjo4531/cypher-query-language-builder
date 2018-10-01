"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const CypherQuery_1 = __importDefault(require("./CypherQuery"));
const CypherRawText_1 = __importDefault(require("./CypherRawText"));
const Errors_1 = require("./Errors");
var RelationDir;
(function (RelationDir) {
    RelationDir[RelationDir["Left"] = 0] = "Left";
    RelationDir[RelationDir["Right"] = 1] = "Right";
    RelationDir[RelationDir["None"] = 2] = "None";
})(RelationDir || (RelationDir = {}));
function raw(strings, ...params) {
    for (const param of params) {
        if (!Array.isArray(param) &&
            !(param instanceof CypherRawText_1.default) &&
            !(typeof param === "string")) {
            throw new Errors_1.DangerousTextError("Parameters should be of type string, CypherRawText, or an Array of either of those.");
        }
        if (typeof param === "string" && !/^\w+$/.test(param)) {
            throw new Errors_1.DangerousTextError("string parameters must be alphanumerics and/or underscores");
        }
    }
    return new CypherRawText_1.default(strings.reduce((accumulator, str, i, arr) => {
        let param = params[i];
        if (Array.isArray(param)) {
            param = raw(new Array(param.length + 1).fill(""), ...param);
        }
        if (i === arr.length - 1) {
            return accumulator + str;
        }
        else {
            return accumulator + str + param;
        }
    }, ""));
}
function InnerNode(cql, { name, labels, properties, propsWhitelist } = {}) {
    const space = name || labels ? raw ` ` : raw ``;
    const rawName = name ? raw `${name}` : raw ``;
    const rawLabels = labels ? raw `${cql.labels(...labels)}` : raw ``;
    properties = properties
        ? cql `${space}{${cql.fromProps(propsWhitelist, properties)}}`
        : raw ``;
    return cql `${rawName}${rawLabels}${properties}`;
}
class CypherHelper {
    constructor(config = {}) {
        this.query = Object.assign((strings, ...params) => {
            return new CypherQuery_1.default(this.config, strings, params);
        }, {
            dirLeft: RelationDir.Left,
            dirNone: RelationDir.None,
            dirRight: RelationDir.Right,
            /**
             * Plucks whitelisted keys and values and inserts them
             * as key value pairs seperated by commas, so that they
             * can be inserted into a Cypher query object.
             * @param propsWhitelist
             * an array of properties to whitelist from the `object`
             * @param object
             * object to be whitelisted
             *
             * @example
             *  cql`MATCH (m:Movie:NewRelease {${cql.fromProps(
             * 	["title", "release"],
             * 	{title: "Bee Movie", release: new Date().toString()}
             * )}}) RETURN m`
             */
            fromProps(propsWhitelist, properties) {
                if (properties &&
                    (!propsWhitelist ||
                        !Array.isArray(propsWhitelist) ||
                        !propsWhitelist.every(x => typeof x === "string"))) {
                    throw new TypeError("propsWhiteList key must be defined as an array of strings for safety reasons when properties are defined");
                }
                const keyVals = propsWhitelist
                    .map((prop, i, arr) => {
                    if (properties[prop] === undefined ||
                        properties[prop] === null) {
                        return undefined;
                    }
                    else {
                        return [raw `${prop}: `, properties[prop]];
                    }
                })
                    .filter(x => !!x)
                    .reduce((a, b, i, arr) => {
                    if (i === arr.length - 1) {
                        return a.concat([...b]);
                    }
                    else {
                        return a.concat([...b, raw `, `]);
                    }
                }, []);
                return this `${keyVals}`;
            },
            labels(...labels) {
                const rawLabels = labels.map(label => raw `:${label}`);
                return raw `${rawLabels}`;
            },
            Node(config = {}) {
                return this `(${InnerNode(this, config)})`;
            },
            Relationship(config = {}) {
                const { direction = "" } = config;
                let left = raw ``;
                let right = raw ``;
                if (direction === RelationDir.Right) {
                    right = raw `>`;
                }
                else if (direction === RelationDir.Left) {
                    left = raw `<`;
                }
                if (config.name || config.labels || config.properties) {
                    return this `${left}-[${InnerNode(this, config)}]-${right}`;
                }
                else {
                    return this `${left}--${right}`;
                }
            },
            config(config = {}) {
                this.config = Object.assign({}, this.config, config);
            }
        });
        this.config = {
            driver: null,
            parseIntegers: false,
            rawResults: false
        };
        this.config = Object.assign({ parseIntegers: false }, config);
        this.query.bind(this);
        this.query.fromProps.bind(this.query);
        this.query.Node.bind(this.query);
        this.query.Relationship.bind(this.query);
        this.query.config.bind(this.query);
    }
}
exports.default = CypherHelper;
//# sourceMappingURL=CypherHelper.js.map