"use strict";
exports.__esModule = true;
/**
 * Don't export this outside the package they can use nested cypher``
 * statements for static text or various helpers to get dynamic text
 * like cypher.label, cypher.id, and cypher.prop.
 */
var CypherRawText = /** @class */ (function () {
    function CypherRawText(text) {
        this.text = "";
        this.text = text;
    }
    CypherRawText.prototype.toString = function () {
        return this.text;
    };
    return CypherRawText;
}());
exports["default"] = CypherRawText;
