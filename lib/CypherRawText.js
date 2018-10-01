"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Don't export this outside the package they can use nested cypher``
 * statements for static text or various helpers to get dynamic text
 * like cypher.label, cypher.id, and cypher.prop.
 */
class CypherRawText {
    constructor(text) {
        this.text = "";
        this.text = text;
    }
    toString() {
        return this.text;
    }
}
exports.default = CypherRawText;
//# sourceMappingURL=CypherRawText.js.map