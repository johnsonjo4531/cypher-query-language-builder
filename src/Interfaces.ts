import neo4j from "neo4j-driver";

export interface IHelperConfig {
    driver?: neo4j.Driver;
    parseIntegers?: boolean;
    rawResults?: boolean;
}
