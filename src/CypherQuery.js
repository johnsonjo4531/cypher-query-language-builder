"use strict";
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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var neo4j_driver_1 = require("neo4j-driver");
var CypherRawText_1 = require("./CypherRawText");
var CypherQuery = /** @class */ (function () {
    function CypherQuery(config, strings, params) {
        if (params === void 0) { params = []; }
        this.config = config;
        this.strings = strings;
        this.params = params;
    }
    CypherQuery.prototype["export"] = function (prefix) {
        if (prefix === void 0) { prefix = "p"; }
        var query = "";
        var params = {};
        var _loop_1 = function (i, l) {
            var name_1 = prefix + "_" + i;
            var param = this_1.params[i];
            query += this_1.strings[i];
            var acceptParam = function (innerParam, innerName) {
                if (innerParam instanceof CypherQuery) {
                    var _a = innerParam["export"](innerName), subQuery = _a[0], subParams = _a[1];
                    query += subQuery;
                    params = __assign({}, params, subParams);
                }
                else if (Array.isArray(innerParam)) {
                    for (var j = 0; j < innerParam.length; ++j) {
                        acceptParam(innerParam[j], innerName + "_" + j);
                    }
                }
                else if (innerParam instanceof CypherRawText_1["default"]) {
                    query += innerParam.toString();
                }
                else if (innerParam !== undefined) {
                    query += "{" + innerName + "}";
                    params[innerName] = innerParam;
                }
            };
            acceptParam(param, name_1);
        };
        var this_1 = this;
        for (var i = 0, l = this.strings.length; i < l; i++) {
            _loop_1(i, l);
        }
        return [query, params];
    };
    CypherQuery.prototype.run = function (config) {
        if (config === void 0) { config = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var _a, driver, parseIntegers, rawResults, session, _b, query, params, result, data;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _a = __assign({}, this.config, config), driver = _a.driver, parseIntegers = _a.parseIntegers, rawResults = _a.rawResults;
                        session = driver.session();
                        _b = this["export"](), query = _b[0], params = _b[1];
                        return [4 /*yield*/, session.run(query, params)];
                    case 1:
                        result = _c.sent();
                        if (rawResults) {
                            return [2 /*return*/, result];
                        }
                        data = normalizeObjects(result.records);
                        if (parseIntegers) {
                            data = normalizeInts(data);
                        }
                        session.close();
                        return [2 /*return*/, data];
                }
            });
        });
    };
    return CypherQuery;
}());
exports["default"] = CypherQuery;
function normalizeObjects(record) {
    if (!(record instanceof Object)) {
        return record;
    }
    var normalized = record;
    if (record.toObject !== undefined) {
        normalized = record.toObject();
    }
    if (record instanceof neo4j_driver_1["default"].types.Node) {
        normalized = record.properties;
    }
    if (normalized instanceof Array) {
        normalized = normalized.map(function (item) { return normalizeObjects(item); });
    }
    else if (normalized instanceof Object) {
        for (var _i = 0, _a = Object.keys(normalized); _i < _a.length; _i++) {
            var key = _a[_i];
            normalized[key] = normalizeObjects(normalized[key]);
        }
    }
    return normalized;
}
function normalizeInts(record) {
    var normalized = record;
    if (neo4j_driver_1["default"].isInt(record)) {
        var i = neo4j_driver_1["default"].integer;
        normalized = i.inSafeRange(record)
            ? i.toNumber(record)
            : i.toString(record);
    }
    else if (record instanceof Array) {
        normalized = record.map(function (item) { return normalizeInts(item); });
    }
    else if (record instanceof Object) {
        for (var _i = 0, _a = Object.keys(record); _i < _a.length; _i++) {
            var key = _a[_i];
            normalized[key] = normalizeInts(record[key]);
        }
    }
    return normalized;
}
