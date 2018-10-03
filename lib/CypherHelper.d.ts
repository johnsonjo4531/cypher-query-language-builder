import CypherQuery from "./CypherQuery";
import CypherRawText from "./CypherRawText";
import { IHelperConfig } from "./Interfaces";
declare enum RelationDir {
    Left = 0,
    Right = 1,
    None = 2
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
export default class CypherHelper {
    query: IQuery;
    private config;
    constructor(config?: IHelperConfig);
}
export {};
