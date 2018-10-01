/**
 * Don't export this outside the package they can use nested cypher``
 * statements for static text or various helpers to get dynamic text
 * like cypher.label, cypher.id, and cypher.prop.
 */
export default class CypherRawText {
    private text: string = "";

    constructor(text: string) {
        this.text = text;
    }

    public toString(): string {
        return this.text;
    }
}
