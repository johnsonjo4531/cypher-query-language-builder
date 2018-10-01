"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var CypherQuery_1 = require("./CypherQuery");
var CypherRawText_1 = require("./CypherRawText");
var Errors_1 = require("./Errors");
var RelationDir;
(function (RelationDir) {
    RelationDir[RelationDir["Left"] = 0] = "Left";
    RelationDir[RelationDir["Right"] = 1] = "Right";
    RelationDir[RelationDir["None"] = 2] = "None";
})(RelationDir || (RelationDir = {}));
function raw(strings) {
    var params = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        params[_i - 1] = arguments[_i];
    }
    for (var _a = 0, params_1 = params; _a < params_1.length; _a++) {
        var param = params_1[_a];
        if (!Array.isArray(param) &&
            !(param instanceof CypherRawText_1["default"]) &&
            !(typeof param === "string")) {
            throw new Errors_1.DangerousTextError("Parameters should be of type string, CypherRawText, or an Array of either of those.");
        }
        if (typeof param === "string" && !/^\w+$/.test(param)) {
            throw new Errors_1.DangerousTextError("string parameters must be alphanumerics and/or underscores");
        }
    }
    return new CypherRawText_1["default"](strings.reduce(function (accumulator, str, i, arr) {
        var param = params[i];
        if (Array.isArray(param)) {
            param = raw.apply(void 0, [new Array(param.length + 1).fill("")].concat(param));
        }
        if (i === arr.length - 1) {
            return accumulator + str;
        }
        else {
            return accumulator + str + param;
        }
    }, ""));
}
function InnerNode(cql, _a) {
    var _b = _a === void 0 ? {} : _a, name = _b.name, labels = _b.labels, properties = _b.properties, propsWhitelist = _b.propsWhitelist;
    var space = name || labels ? raw(templateObject_1 || (templateObject_1 = __makeTemplateObject([" "], [" "]))) : raw(templateObject_2 || (templateObject_2 = __makeTemplateObject([""], [""])));
    var rawName = name ? raw(templateObject_3 || (templateObject_3 = __makeTemplateObject(["", ""], ["", ""])), name) : raw(templateObject_4 || (templateObject_4 = __makeTemplateObject([""], [""])));
    var rawLabels = labels ? raw(templateObject_5 || (templateObject_5 = __makeTemplateObject(["", ""], ["", ""])), cql.labels.apply(cql, labels)) : raw(templateObject_6 || (templateObject_6 = __makeTemplateObject([""], [""])));
    properties = properties
        ? cql(templateObject_7 || (templateObject_7 = __makeTemplateObject(["", "{", "}"], ["", "{", "}"])), space, cql.fromProps(propsWhitelist, properties)) : raw(templateObject_8 || (templateObject_8 = __makeTemplateObject([""], [""])));
    return cql(templateObject_9 || (templateObject_9 = __makeTemplateObject(["", "", "", ""], ["", "", "", ""])), rawName, rawLabels, properties);
}
var CypherHelper = /** @class */ (function () {
    function CypherHelper(config) {
        if (config === void 0) { config = {}; }
        var _this = this;
        this.query = Object.assign(function (strings) {
            var params = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                params[_i - 1] = arguments[_i];
            }
            return new CypherQuery_1["default"](_this.config, strings, params);
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
            fromProps: function (propsWhitelist, properties) {
                if (properties &&
                    (!propsWhitelist ||
                        !Array.isArray(propsWhitelist) ||
                        !propsWhitelist.every(function (x) { return typeof x === "string"; }))) {
                    throw new TypeError("propsWhiteList key must be defined as an array of strings for safety reasons when properties are defined");
                }
                var keyVals = propsWhitelist
                    .map(function (prop, i, arr) {
                    if (properties[prop] === undefined ||
                        properties[prop] === null) {
                        return undefined;
                    }
                    else {
                        return [raw(templateObject_10 || (templateObject_10 = __makeTemplateObject(["", ": "], ["", ": "])), prop), properties[prop]];
                    }
                })
                    .filter(function (x) { return !!x; })
                    .reduce(function (a, b, i, arr) {
                    if (i === arr.length - 1) {
                        return a.concat(b.slice());
                    }
                    else {
                        return a.concat(b.concat([raw(templateObject_11 || (templateObject_11 = __makeTemplateObject([", "], [", "])))]));
                    }
                }, []);
                return this(templateObject_12 || (templateObject_12 = __makeTemplateObject(["", ""], ["", ""])), keyVals);
            },
            labels: function () {
                var labels = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    labels[_i] = arguments[_i];
                }
                var rawLabels = labels.map(function (label) { return raw(templateObject_13 || (templateObject_13 = __makeTemplateObject([":", ""], [":", ""])), label); });
                return raw(templateObject_14 || (templateObject_14 = __makeTemplateObject(["", ""], ["", ""])), rawLabels);
            },
            Node: function (config) {
                if (config === void 0) { config = {}; }
                return this(templateObject_15 || (templateObject_15 = __makeTemplateObject(["(", ")"], ["(", ")"])), InnerNode(this, config));
            },
            Relationship: function (config) {
                if (config === void 0) { config = {}; }
                var _a = config.direction, direction = _a === void 0 ? "" : _a;
                var left = raw(templateObject_16 || (templateObject_16 = __makeTemplateObject([""], [""])));
                var right = raw(templateObject_17 || (templateObject_17 = __makeTemplateObject([""], [""])));
                if (direction === RelationDir.Right) {
                    right = raw(templateObject_18 || (templateObject_18 = __makeTemplateObject([">"], [">"])));
                }
                else if (direction === RelationDir.Left) {
                    left = raw(templateObject_19 || (templateObject_19 = __makeTemplateObject(["<"], ["<"])));
                }
                if (config.name || config.labels || config.properties) {
                    return this(templateObject_20 || (templateObject_20 = __makeTemplateObject(["", "-[", "]-", ""], ["", "-[", "]-", ""])), left, InnerNode(this, config), right);
                }
                else {
                    return this(templateObject_21 || (templateObject_21 = __makeTemplateObject(["", "--", ""], ["", "--", ""])), left, right);
                }
            },
            config: function (config) {
                if (config === void 0) { config = {}; }
                this.config = __assign({}, this.config, config);
            }
        });
        this.config = {
            driver: null,
            parseIntegers: false,
            rawResults: false
        };
        this.config = __assign({ parseIntegers: false }, config);
        this.query.bind(this);
        this.query.fromProps.bind(this.query);
        this.query.Node.bind(this.query);
        this.query.Relationship.bind(this.query);
        this.query.config.bind(this.query);
    }
    return CypherHelper;
}());
exports["default"] = CypherHelper;
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7, templateObject_8, templateObject_9, templateObject_10, templateObject_11, templateObject_12, templateObject_13, templateObject_14, templateObject_15, templateObject_16, templateObject_17, templateObject_18, templateObject_19, templateObject_20, templateObject_21;
