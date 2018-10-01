import neo4j from "neo4j-driver";
import CypherRawText from "./CypherRawText";
import { IHelperConfig } from "./Interfaces";

export default class CypherQuery {
    constructor(
        protected config: IHelperConfig,
        protected strings: TemplateStringsArray,
        protected params: any[] = []
    ) {}

    public export(prefix: string = "p"): [string, any] {
        let query = "";
        let params = {} as any;

        for (let i = 0, l = this.strings.length; i < l; i++) {
            const name = `${prefix}_${i}`;
            const param = this.params[i];

            query += this.strings[i];

            const acceptParam = (innerParam, innerName) => {
                if (innerParam instanceof CypherQuery) {
                    const [subQuery, subParams] = innerParam.export(innerName);
                    query += subQuery;
                    params = { ...params, ...subParams };
                } else if (Array.isArray(innerParam)) {
                    for (let j = 0; j < innerParam.length; ++j) {
                        acceptParam(innerParam[j], `${innerName}_${j}`);
                    }
                } else if (innerParam instanceof CypherRawText) {
                    query += innerParam.toString();
                } else if (innerParam !== undefined) {
                    query += `{${innerName}}`;
                    params[innerName] = innerParam;
                }
            };
            acceptParam(param, name);
        }

        return [query, params];
    }

    public async run<T extends object = any>(
        config: IHelperConfig = {}
    ): Promise<any> {
        const { driver, parseIntegers, rawResults } = {
            ...this.config,
            ...config
        };
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

function normalizeObjects(record: any) {
    if (!(record instanceof Object)) {
        return record;
    }

    let normalized = record;

    if (record.toObject !== undefined) {
        normalized = record.toObject();
    }

    if (record instanceof (neo4j.types.Node as any)) {
        normalized = record.properties;
    }

    if (normalized instanceof Array) {
        normalized = normalized.map(item => normalizeObjects(item));
    } else if (normalized instanceof Object) {
        for (const key of Object.keys(normalized)) {
            normalized[key] = normalizeObjects(normalized[key]);
        }
    }

    return normalized;
}

function normalizeInts(record: any) {
    let normalized = record;

    if (neo4j.isInt(record)) {
        const i = neo4j.integer;
        normalized = i.inSafeRange(record)
            ? i.toNumber(record)
            : i.toString(record);
    } else if (record instanceof Array) {
        normalized = record.map(item => normalizeInts(item));
    } else if (record instanceof Object) {
        for (const key of Object.keys(record)) {
            normalized[key] = normalizeInts(record[key]);
        }
    }

    return normalized;
}
