import driverMock from "neo4j-driver";
import Cypher, { DangerousTextError } from "../";

declare const jest: any;
declare const describe: any;
declare const xdescribe: any;
declare const it: any;
declare const xit: any;
declare const expect: any;

jest.mock("neo4j-driver", () => {
    const sessionMock = {
        run: jest.fn((p1, p2) => []),
        close() {
            return;
        }
    };
    return {
        __sessionMock__: sessionMock,
        driver() {
            return {
                session() {
                    return sessionMock;
                }
            };
        }
    };
});
const cql = new Cypher({
    driver: driverMock.driver("bolt://example.com:6060")
}).query;

describe("Cypher", () => {
    describe(".query``.export", () => {
        it("should work with simple example parameters", () => {
            const expectedParams = {
                title: "The Dark Knight"
            };
            const expectedString = /^MATCH \(m:Movie \{title: \{(.*?)\}\}\) RETURN m$/;

            const [actualString, actualParams] = cql`MATCH (m:Movie {title: ${
                expectedParams.title
            }}) RETURN m`.export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.title);
            expect(Object.values(actualParams)).toContain(expectedParams.title);
        });

        it("should work with more complex example parameters", () => {
            const expectedParams = {
                release: new Date().toString(),
                title: "Marvel: Infinity War"
            };
            const expectedString = /^MATCH \(m:Movie:NewRelease \{title: \{(.*?)\}, release: \{(.*?)\}\}\) RETURN m$/;

            const [
                actualString,
                actualParams
            ] = cql`MATCH (m:Movie:NewRelease {title: ${
                expectedParams.title
            }, release: ${expectedParams.release}}) RETURN m`.export();

            const paramValues = Object.values(actualParams);
            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.title);
            expect(actualParams[matches[2]]).toEqual(expectedParams.release);
            expect(paramValues).toContain(expectedParams.title);
            expect(paramValues).toContain(expectedParams.release);
        });

        it("should work with nested queries", () => {
            const expectedParams = {
                release: new Date().toString(),
                title: "Marvel: Infinity War"
            };
            const expectedString = /^MATCH \(m:Movie:NewRelease \{title: \{(.*?)\}, release: \{(.*?)\}\}\) RETURN m$/;

            const Node = cql`m:Movie:NewRelease {title: ${
                expectedParams.title
            }, release: ${expectedParams.release}}`;
            const [
                actualString,
                actualParams
            ] = cql`MATCH (${Node}) RETURN m`.export();

            const paramValues = Object.values(actualParams);
            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.title);
            expect(actualParams[matches[2]]).toEqual(expectedParams.release);
            expect(paramValues).toContain(expectedParams.title);
            expect(paramValues).toContain(expectedParams.release);
        });

        it("should work with params that are arrays", () => {
            const expectedParams = {
                release: new Date().toString(),
                title: "Marvel: Infinity War"
            };
            const expectedString = /^MATCH \(m:Movie:NewRelease \{title: \{(.*?)\}, release: \{(.*?)\}\}\) RETURN m$/;

            const title = "title";
            const [
                actualString,
                actualParams
            ] = cql`MATCH (m:Movie:NewRelease {${[
                cql`title: `,
                expectedParams.title,
                cql`, release: `,
                expectedParams.release
            ]}}) RETURN m`.export();

            const paramValues = Object.values(actualParams);
            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.title);
            expect(actualParams[matches[2]]).toEqual(expectedParams.release);
            expect(paramValues).toContain(expectedParams.title);
            expect(paramValues).toContain(expectedParams.release);
        });
    });

    describe("query.Node", () => {
        it("should create empty node", () => {
            const expectedString = /^\(\)$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql.Node().export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to have a name", () => {
            const input = {
                name: "a"
            };
            const expectedString = /^\(a\)$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql.Node(input).export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to have labels", () => {
            const input = {
                labels: ["A", "B"]
            };
            const expectedString = /^\(:A:B\)$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql.Node(input).export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to have properties", () => {
            const input = {
                properties: {
                    email: "anna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["email", "name"]
            };
            const expectedParams = input.properties;
            const expectedString = /^\({email: \{(.*?)\}, name: \{(.*?)\}\}\)$/;

            const [actualString, actualParams] = cql.Node(input).export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.email);
            expect(actualParams[matches[2]]).toEqual(expectedParams.name);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.email);
            expect(paramValues).toContain(expectedParams.name);
        });

        it("should whitelist props", () => {
            const input = {
                properties: {
                    email: "anna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["email", "extra"]
            };
            const expectedParams = {
                email: input.properties.email
            };
            const expectedString = /^\({email: \{(.*?)\}\}\)$/;

            const [actualString, actualParams] = cql.Node(input).export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.email);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.email);
            expect(paramValues).not.toContain(input.properties.name);
        });

        it("should be able to run the full api together", () => {
            const input = {
                labels: ["A", "B"],
                name: "anna",
                properties: {
                    email: "anna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["email", "extra"]
            };
            const expectedParams = {
                email: input.properties.email
            };
            const expectedString = /^\(anna:A:B {email: \{(.*?)\}\}\)$/;

            const [actualString, actualParams] = cql.Node(input).export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.email);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.email);
            expect(paramValues).not.toContain(input.properties.name);
        });

        it("should throw if given something other than alphanumerics and underscores", () => {
            const maybeDangerousLabel = "ValidLabel) DELETE (b) MATCH (c:";
            expect(() =>
                cql.Node({
                    name: "a) DELETE (b) MATCH (c"
                })
            ).toThrowError(DangerousTextError);
            expect(() =>
                cql.Node({
                    labels: [":Something) DELETE (b) MATCH (c:SomeOtherLabel"]
                })
            ).toThrowError(DangerousTextError);
        });

        it("should throw if given properties but no whitelist", () => {
            expect(() =>
                cql.Node({
                    properties: {
                        foo: "bar",
                        h4x0r_input:
                            "injecting unwanted keys and properties into your db"
                    }
                })
            ).toThrowError(TypeError);
        });
    });

    describe("query.setters", () => {
        it("should create empty setter clause", () => {
            const expectedString = /^$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql
                .setters({
                    name: "a",
                    properties: {
                        name: "doesn't matter no whitelist"
                    },
                    propsWhitelist: []
                })
                .export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to run full api and set values", () => {
            const input = {
                name: "a",
                properties: {
                    address: "123 Whitaker Ln.",
                    email: "annabananna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["name", "email"]
            };
            const expectedString = /^a.name = \{(.*?)\}, a.email = \{(.*?)\}$/;
            const expectedParams = {
                name: "anna"
            };

            const [actualString, actualParams] = cql.setters(input).export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.name);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.name);
            expect(paramValues).toContain(input.properties.email);
            expect(paramValues).not.toContain(input.properties.address);
        });

        it("should throw if given something other than alphanumerics and underscores", () => {
            const maybeDangerousLabel = "ValidLabel) DELETE (b) MATCH (c:";
            expect(() => {
                cql.setters({
                    name: "a",
                    properties: {
                        'a: "foo" }) DELETE (b) MATCH (b {foo:': "random"
                    },
                    propsWhitelist: ['a: "foo" }) DELETE (b) MATCH (b {foo:']
                });
            }).toThrowError(DangerousTextError);
        });

        it("should throw if given properties but no whitelist", () => {
            expect(() =>
                cql.Node({
                    properties: { foo: "bar" }
                })
            ).toThrowError(TypeError);
        });
    });

    describe("query.Relationship", () => {
        it("should create empty relationship", () => {
            const expectedString = /^--$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql.Relationship().export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to have a name", () => {
            const input = {
                name: "a"
            };
            const expectedString = /^-\[a\]-$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to have labels", () => {
            const input = {
                labels: ["A", "B"]
            };
            const expectedString = /^-\[:A:B\]-$/;
            const expectedParams = {};

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to have properties", () => {
            const input = {
                properties: {
                    email: "anna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["email", "name"]
            };
            const expectedParams = input.properties;
            const expectedString = /^-\[{email: \{(.*?)\}, name: \{(.*?)\}\}\]-$/;

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.email);
            expect(actualParams[matches[2]]).toEqual(expectedParams.name);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.email);
            expect(paramValues).toContain(expectedParams.name);
        });

        it("should whitelist props", () => {
            const input = {
                properties: {
                    email: "anna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["email", "extra"]
            };
            const expectedParams = {
                email: input.properties.email
            };
            const expectedString = /^-\[{email: \{(.*?)\}\}\]-$/;

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.email);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.email);
            expect(paramValues).not.toContain(input.properties.name);
        });

        it("should handle left direction", () => {
            const input = {
                direction: cql.dirLeft
            };
            const expectedParams = {};
            const expectedString = /^<--$/;

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should handle right direction", () => {
            const input = {
                direction: cql.dirRight
            };
            const expectedParams = {};
            const expectedString = /^-->$/;

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should handle no direction", () => {
            const input = {
                direction: cql.dirNone
            };
            const expectedParams = {};
            const expectedString = /^--$/;

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            expect(actualParams).toMatchObject(expectedParams);
        });

        it("should be able to run the full api together", () => {
            const input = {
                direction: cql.dirLeft,
                labels: ["A", "B"],
                name: "anna",
                properties: {
                    email: "anna@example.com",
                    name: "anna"
                },
                propsWhitelist: ["email", "extra"]
            };
            const expectedParams = {
                email: input.properties.email
            };
            const expectedString = /<-\[anna:A:B {email: \{(.*?)\}\}\]-/;

            const [actualString, actualParams] = cql
                .Relationship(input)
                .export();

            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.email);
            const paramValues = Object.values(actualParams);
            expect(paramValues).toContain(expectedParams.email);
            expect(paramValues).not.toContain(input.properties.name);
        });

        it("should throw if given something other than alphanumerics and underscores", () => {
            expect(() =>
                cql.Relationship({
                    name: "a] DELETE (b) MATCH (c)-[d"
                })
            ).toThrowError(DangerousTextError);
            expect(() =>
                cql.Relationship({
                    labels: [":Something) DELETE (b) MATCH (c:SomeOtherLabel"]
                })
            ).toThrowError(DangerousTextError);
        });

        it("should throw if given properties but no whitelist", () => {
            expect(() =>
                cql.Relationship({
                    properties: {
                        foo: "bar",
                        h4x0r_input:
                            "injecting unwanted keys and properties into your db"
                    }
                })
            ).toThrowError(TypeError);
        });
    });

    describe("query.fromProps", () => {
        it("should transform object and whitelist into Neo4j props", () => {
            const expectedParams = {
                release: new Date().toString(),
                title: "Marvel: Infinity War"
            };
            const expectedString = /^MATCH \(m:Movie:NewRelease \{title: \{(.*?)\}, release: \{(.*?)\}\}\) RETURN m$/;

            const [
                actualString,
                actualParams
            ] = cql`MATCH (m:Movie:NewRelease {${cql.fromProps(
                ["title", "release"],
                expectedParams
            )}}) RETURN m`.export();

            const paramValues = Object.values(actualParams);
            expect(actualString).toMatch(expectedString);
            const matches = expectedString.exec(actualString);
            expect(actualParams[matches[1]]).toEqual(expectedParams.title);
            expect(actualParams[matches[2]]).toEqual(expectedParams.release);
            expect(paramValues).toContain(expectedParams.title);
            expect(paramValues).toContain(expectedParams.release);
        });

        it("should throw if given something other than alphanumerics and underscores", () => {
            expect(() =>
                cql.fromProps(["a a"], {
                    "a a": "foo"
                })
            ).toThrowError(DangerousTextError);
        });

        it("should throw if given properties but no whitelist", () => {
            expect(() => cql.fromProps(null, { foo: "bar" })).toThrowError(
                TypeError
            );
        });
    });

    describe(".query``.run", () => {
        it("should call driver run method with proper export data", async () => {
            const params = {
                title: "The Dark Knight"
            };
            const expectedArgs = cql`MATCH (m:Movie {title: ${
                params.title
            }}) RETURN m`.export();

            await cql`MATCH (m:Movie {title: ${params.title}}) RETURN m`.run();

            expect((driverMock as any).__sessionMock__.run).toBeCalledTimes(1);
            expect((driverMock as any).__sessionMock__.run).toBeCalledWith(
                ...expectedArgs
            );
        });
    });
});
