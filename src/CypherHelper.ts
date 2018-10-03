import CypherQuery from "./CypherQuery";
import CypherRawText from "./CypherRawText";
import { DangerousTextError } from "./Errors";
import { IHelperConfig } from "./Interfaces";

enum RelationDir {
    Left,
    Right,
    None
}

interface IRelationshipConfig {
    name?: string;
    labels?: string[];
    direction?: RelationDir;
    properties?: object;
    propsWhitelist?: string[];
}

interface INodeConfig {
    name?: string;
    labels?: string[];
    properties?: object;
    propsWhitelist?: string[];
}

interface ISetterConfig {
    name: string;
    properties: object;
    propsWhitelist: string[];
}

type IRawTextLike = string | CypherRawText;

interface IQuery {
    (strings: TemplateStringsArray, ...params: any[]): CypherQuery;
    config: (config: IHelperConfig) => void;
    dirLeft: RelationDir;
    dirRight: RelationDir;
    dirNone: RelationDir;
    fromProps: (propsWhitelist: string[], object: object) => CypherQuery;
    labels: (...labels: string[]) => CypherRawText;
    Node: (config?: INodeConfig) => CypherQuery;
    Relationship: (config?: IRelationshipConfig) => CypherQuery;
    setters: (config: ISetterConfig) => CypherQuery;
}

function raw(
    strings: TemplateStringsArray | string[],
    ...params: Array<IRawTextLike | IRawTextLike[]>
): CypherRawText {
    for (const param of params) {
        if (
            !Array.isArray(param) &&
            !(param instanceof CypherRawText) &&
            !(typeof param === "string")
        ) {
            throw new DangerousTextError(
                "Parameters should be of type string, CypherRawText, or an Array of either of those."
            );
        }
        if (typeof param === "string" && !/^\w+$/.test(param as string)) {
            throw new DangerousTextError(
                "string parameters must be alphanumerics and/or underscores"
            );
        }
    }
    return new CypherRawText(
        (strings as string[]).reduce(
            (
                accumulator: string,
                str: string,
                i: number,
                arr: string[]
            ): string => {
                let param = params[i];
                if (Array.isArray(param)) {
                    param = raw(new Array(param.length + 1).fill(""), ...param);
                }
                if (i === arr.length - 1) {
                    return accumulator + str;
                } else {
                    return accumulator + str + param;
                }
            },
            ""
        )
    );
}

function join(array, joiner) {
    return array.reduce((a, b, i, arr) => {
        if (i === arr.length - 1) {
            return a.concat(b);
        } else {
            return a.concat(b, [joiner]);
        }
    }, []);
}

function InnerNode(
    cql: IQuery,
    { name, labels, properties, propsWhitelist }: INodeConfig = {}
): CypherQuery {
    const space = name || labels ? raw` ` : raw``;
    const rawName = name ? raw`${name}` : raw``;
    const rawLabels = labels ? raw`${cql.labels(...labels)}` : raw``;
    properties =
        properties && propsWhitelist.length > 0
            ? cql`${space}{${cql.fromProps(propsWhitelist, properties)}}`
            : raw``;
    return cql`${rawName}${rawLabels}${properties}`;
}

const isValidPropsWhitelist = (props: object, whitelist: string[]) =>
    props &&
    whitelist &&
    Array.isArray(whitelist) &&
    whitelist.every(x => typeof x === "string");

export default class CypherHelper {
    public query: IQuery = Object.assign(
        (strings: TemplateStringsArray, ...params: any[]): CypherQuery => {
            return new CypherQuery(this.config, strings, params);
        },
        {
            config(config: IHelperConfig = {}): void {
                this.config = { ...this.config, ...config };
            },
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
            fromProps(
                propsWhitelist: string[],
                properties: object
            ): CypherQuery {
                if (!isValidPropsWhitelist(properties, propsWhitelist)) {
                    throw new TypeError(
                        "propsWhiteList key must be defined as an array of strings for safety reasons when properties are defined"
                    );
                }
                const keyVals = propsWhitelist
                    .map((prop: string, i: number, arr: [string]) => {
                        if (
                            properties[prop] === undefined ||
                            properties[prop] === null
                        ) {
                            return undefined;
                        } else {
                            return [raw`${prop}: `, properties[prop]];
                        }
                    })
                    .filter(x => !!x);

                return this`${join(keyVals, raw`, `)}`;
            },
            labels(...labels: string[]): CypherRawText {
                const rawLabels = labels.map(label => raw`:${label}`);
                return raw`${rawLabels}`;
            },
            Node(config: INodeConfig = {}): CypherQuery {
                return this`(${InnerNode(this, config)})`;
            },
            Relationship(config: IRelationshipConfig = {}): CypherQuery {
                const { direction = "" } = config;
                let left = raw``;
                let right = raw``;
                if (direction === RelationDir.Right) {
                    right = raw`>`;
                } else if (direction === RelationDir.Left) {
                    left = raw`<`;
                }
                if (config.name || config.labels || config.properties) {
                    return this`${left}-[${InnerNode(this, config)}]-${right}`;
                } else {
                    return this`${left}--${right}`;
                }
            },
            setters({
                name,
                properties,
                propsWhitelist
            }: ISetterConfig): CypherQuery {
                if (!properties || !propsWhitelist) {
                    throw new TypeError(
                        "'properties' and 'propsWhitelist' keys must be defined"
                    );
                }
                if (
                    properties &&
                    !isValidPropsWhitelist(properties, propsWhitelist)
                ) {
                    throw new TypeError(
                        "propsWhitelist key must be defined as an array of allowed keys as strings for safety reasons when properties are defined"
                    );
                }
                if (!name) {
                    throw new TypeError(
                        "'name' must be defined in config object"
                    );
                }
                const rawName = raw`${name}`;
                const mapping = propsWhitelist.map(prop => {
                    const rawProp = raw`.${prop}`;
                    return this`${rawName}${rawProp} = ${properties[prop]}`;
                });
                return this`${join(mapping, raw`, `)}`;
            }
        }
    );

    private config: IHelperConfig = {
        driver: null,
        parseIntegers: false,
        rawResults: false
    };

    constructor(config: IHelperConfig = {}) {
        this.config = { parseIntegers: false, ...config };
        this.query.bind(this);
        this.query.fromProps.bind(this.query);
        this.query.Node.bind(this.query);
        this.query.Relationship.bind(this.query);
        this.query.config.bind(this.query);
    }
}
