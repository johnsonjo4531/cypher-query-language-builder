import { IHelperConfig } from "./Interfaces";
export default class CypherQuery {
    protected config: IHelperConfig;
    protected strings: TemplateStringsArray;
    protected params: any[];
    constructor(config: IHelperConfig, strings: TemplateStringsArray, params?: any[]);
    export(prefix?: string): [string, any];
    run<T extends object = any>(config?: IHelperConfig): Promise<any>;
}
