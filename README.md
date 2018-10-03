# cypher-query-language-builder

Fork of [cypher-tagged-templates](https://www.npmjs.com/package/cypher-tagged-templates)

-   NPM: https://www.npmjs.com/package/cypher-query-language-builder
-   Github: https://github.com/johnsonjo4531/cypher-query-language-builder#readme

[Version Change Differences](./VERSION_CHANGES.md)

Table of Contents:

<!-- TOC -->

-   [cypher-query-language-builder](#cypher-query-language-builder)
    -   [What?](#what)
    -   [Why?](#why)
    -   [How?](#how)
        -   [Installation](#installation)
        -   [Basic example](#basic-example)
        -   [Node insertion](#node-insertion)
        -   [Setting](#setting)
        -   [Relationships](#relationships)
        -   [Enable automatic integers parsing](#enable-automatic-integers-parsing)
        -   [Override configuration options when running a query](#override-configuration-options-when-running-a-query)
        -   [Nested queries](#nested-queries)
        -   [Array input](#array-input)
        -   [Insert Whitelisted Object](#insert-whitelisted-object)
        -   [Manual queries](#manual-queries)
        -   [Using with Typescript](#using-with-typescript)
    -   [API](#api)
    -   [More Examples](#more-examples)

<!-- /TOC -->

## What?

A tiny helper for securely writing and running Cypher queries using Javascript tagged templates. This query builder
is designed to help be as close to cypher as possible while providing convenience methods that help you write
your queries through the default driver without the added pain.

## Why?

I found the default driver's parameterization to be a little akward this is where template strings come in handy.
I also found the driver hard to use when trying to insert objects from JavaScript, so the `cql.fromProps()` method
was something designed to help alleviate that pain. Other query builders seemed to take away from the simpleness of the
cypher query language by almost completely abstracting it away into methods. One goal of this project is to keep things
as close to looking like the cypher query language as possible.

## How?

### Installation

```bash
npm install --save cypher-query-language-builder
```

### Basic example

It supports variables interpolation, automatically using the Neo4j driver to escape values.

The return value of the query is an array of records, after calling the `toObject` method on them.

```javascript
const neo4j = require("neo4j-driver").v1;
const Cypher = require("cypher-query-language-builder").default;

const driver = neo4j.driver("bolt://...", neo4j.auth.basic("neo4j", "pass"));
const cql = new Cypher({ driver }).query;

const email = "anna@example.com";
const query = cql`
	MATCH (user:User {email: ${email}}) RETURN user
`;

const result = query.run().then(result => {
    console.log(result[0].user);
});

// at some point
// driver.close()
```

### Node insertion

You can create a node with a given variable `name`, some given `labels`, and a given `properties` object that is whitelisted through `propsWhitelist`.

```javascript
// cql setup

const annaNode = cql.Node({
    labels: ["Person", "User"],
    name: "anna",
    properties: {
        email: "anna@example.com",
        name: "anna",
        notAdded: "random"
    },
    propsWhitelist: ["email", "name", "address"]
});

const bananaNode = cql.Node({
    labels: ["Person", "User", "Admin"],
    name: "annabananna",
    properties: {
        email: "annabananna@example.com",
        name: "anna bananna",
        notAdded: "random",
        address: "123 Whitaker Ln."
    },
    propsWhitelist: ["email", "name", "address"]
});

const query = cql`CREATE ${annaNode} CREATE ${bananaNode} RETURN anna, annabananna`;

query
    .run()
    .then(function(a) {
        console.log(JSON.stringify(a, null, 2));
        /* outputs:
        * [
        *  {
        *   "anna": {
        *      "name": "anna",
        *      "email": "anna@example.com"
        *    },
        *    "annabananna": {
        *      "name": "anna bananna",
        *      "email": "annabananna@example.com",
        *      "address": "123 Whitaker Ln."
        *    }
        *  }
        * ]
        */
    })
    .then(function() {
        driver.close();
    });
```

### Setting

Setting is how you update certain properties in Neo4j. In order to quickly write a setter from an object and whitelist you can use
the `cql.setters()` method. In the below we Match any existing node's with Anna's email or create it if it's not there by using a MERGE clause and set that node with her name and address using a SET clause with `.setters()`.

```javascript
// cql setup

const anna = {
    email: "anna@example.com",
    name: "anna",
    address: "123 Washington Blvd."
};

const annaNode = cql.Node({
    labels: ["User"],
    name: "anna",
    properties: anna,
    propsWhitelist: ["email"]
});

const annaSetters = cql.setters({
    name: "anna",
    properties: anna,
    propsWhitelist: ["name", "address"]
});

const query = cql`MERGE ${annaNode} SET ${annaSetters}  RETURN anna`;

query
    .run()
    .then(function(a) {
        console.log(JSON.stringify(a, null, 2));
        /* outputs:
        * [
        *  {
        *   "anna": {
        *      "name": "anna",
        *      "email": "anna@example.com"
        *      "address": "123 Washington Blvd."
        *    },
        *  }
        * ]
        */
    })
    .then(function() {
        driver.close();
    });
```

### Relationships

You can create a relationship with a given variable `name`, some given `labels`, and a given `properties` object that is whitelisted through `propsWhitelist`.

```javascript
// cql setup

const annaNode = cql.Node({
    labels: ["Person", "User"],
    name: "anna",
    properties: {
        email: "anna@example.com",
        name: "anna",
        notAdded: "random"
    },
    propsWhitelist: ["email", "name", "address"]
});

const friend = cql.Relationship({
    name: "fr",
    labels: ["FRIEND"],
    properties: {
        since: Date.now()
    },
    propsWhitelist: ["since"],
    direction: cql.dirRight
});

const bananaNode = cql.Node({
    labels: ["Person", "User", "Admin"],
    name: "annabananna",
    properties: {
        email: "annabananna@example.com",
        name: "anna bananna",
        notAdded: "random",
        address: "123 Whitaker Ln."
    },
    propsWhitelist: ["email", "name", "address"]
});

const query = cql`CREATE ${annaNode} CREATE ${bananaNode} CREATE (anna) ${friend} (annabananna) RETURN anna, annabananna, fr`;

query
    .run()
    .then(function(a) {
        console.log(JSON.stringify(a, null, 2));
        /* outputs:
        * [
        *  {
        *   "anna": {
        *      "name": "anna",
        *      "email": "anna@example.com"
        *    },
        *    "annabananna": {
        *      "name": "anna bananna",
        *      "email": "annabananna@example.com",
        *      "address": "123 Whitaker Ln."
        *    }
        *  }
        * ]
        */
    })
    .then(function() {
        driver.close();
    });
```

### Enable automatic integers parsing

You can configure the helper to automatically convert Neo4j integers to native Javascript, avoiding having to deal with that yourself.

```javascript
// ...

const driver = neo4j.driver("bolt://...", neo4j.auth.basic("neo4j", "pass"));

const cql = new Cypher({
    driver,
    parseIntegers: true
}).query;

// ...
```

### Override configuration options when running a query

```javascript
// ...
const cql = new Cypher({ driver }).query;
const query = cql`
	MATCH (user:User {status: "active"}) RETURN user
`;

const result = await query.run({ parseIntegers: true });
// ...
```

### Nested queries

You can also nest subqueries as variables.

```javascript
// ...setup

const email = "anna@example.com";
const selectDb = cql`MATCH (neo:Database {name: "Neo4j"})`;
const selectPerson = cql`MATCH (anna:Person {email: ${email}})`;
const createFriend = cql`
	CREATE (anna)
		-[:FRIEND]->(:Person:Expert {name:"Amanda"})
		-[:WORKED_WITH]->(neo)
`;

const mainQuery = cql`
	${selectDb}
	${selectPerson}
	${createFriend}
`;

const result = mainQuery.run().then(result => {
    console.log(result.records);
});
```

### Array input

You can add arrays of any valid interpolation value and they will be concatenated together in your query.

```javascript
// ...setup

const anna = {
    email: "anna@example.com",
    name: "anna"
};
const selectPerson = cql`MATCH (anna:Person {${[
    cql.raw`email: `,
    anna[prop],
    cql`, name: `,
    anna.name
]}}) 
RETURN anna`;
/**
 * The Query string should be:
 * MATCH (anna:Person {email: {p_0_1}, name: {p_0_3}})
 * RETURN anna
 *
 * and the Paramaters should be:
 * {
 * 	p_0_1: "anna@example.com",
 * 	p_0_3: "anna"
 * }
 */

const result = mainQuery.run().then(result => {
    console.log(result.records);
});
```

### Insert Whitelisted Object

You can insert whitelisted properties and values from an object using the `cql.fromProps(propsWhitelist, object)` property. Where `propsWhitelist` is an array of strings representing properties to whitelist on the `object` This is the same query as above using `cql.fromProps()`.

```javascript
// ...setup

const anna = {
    email: "anna@example.com",
    name: "anna",
    other: "H4x0r User input"
};
const whitelistedProps = ["email", "name", "nonExistentProp"];
const selectPerson = cql`MATCH (anna:Person {${cql.fromProps(
    anna,
    whitelistedProps
)}}) 
RETURN anna`;
/**
 * The Query string should be:
 * MATCH (anna:Person {email: {p_0_1}, name: {p_0_3}})
 * RETURN anna
 *
 * and the Paramaters should be:
 * {
 * 	p_0_1: "anna@example.com",
 * 	p_0_3: "anna"
 * }
 */

const result = mainQuery.run().then(result => {
    console.log(result.records);
});
```

### Manual queries

Instead of directly runing the queries, you can export them as a string and a parameters object so you can execute them yourself (E.g. execute multiple queries as part of a transaction).

```javascript
// ...setup

const email = "anna@example.com";
const status = "active";
const findUser = cql`
	MATCH (user:User {email: ${email}})
	WHERE status = ${status}
	RETURN user
`;

const [query, params] = findUser.export();

/*
query = 'MATCH (user:User {email: {p_0}}) WHERE status = {p_1} RETURN user'
params = {
	p_0: 'anna@example.com',
	p_1: 'active'
}
*/
```

### Using with Typescript

An example of using Typescript's generic types

```typescript
// ...
const cql = new Cypher({ driver }).query;
const query = cql`
	MATCH (user:User {status: "active"}) RETURN user
`;

interface IUser {
    name: string;
    status: "active" | "disabled";
}

const result = await query.run<{ user: IUser }>({ parseIntegers: true });
// result is an array of {user: IUser}
// ...
```

## API

index.d.ts

```typescript
import CypherHelper from "./CypherHelper";
import CypherQuery from "./CypherQuery";
import { DangerousTextError } from "./Errors";
export default CypherHelper;
export { CypherQuery, DangerousTextError };
```

CypherHelper.d.ts

```typescript
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
```

CypherQuery.d.ts

```typescript
import { IHelperConfig } from "./Interfaces";
export default class CypherQuery {
    protected config: IHelperConfig;
    protected strings: TemplateStringsArray;
    protected params: any[];
    constructor(
        config: IHelperConfig,
        strings: TemplateStringsArray,
        params?: any[]
    );
    export(prefix?: string): [string, any];
    run<T extends object = any>(config?: IHelperConfig): Promise<any>;
}
```

CypherRawText.d.ts

```typescript
export default class CypherRawText {
    private text;
    constructor(text: string);
    toString(): string;
}
```

Errors.d.ts

```typescript
export declare class DangerousTextError extends TypeError {}
```

Interfaces.d.ts

```typescript
import neo4j from "neo4j-driver";
export interface IHelperConfig {
    driver?: neo4j.Driver;
    parseIntegers?: boolean;
    rawResults?: boolean;
}
```

## More Examples

See the tests in `./src/__tests__` for more examples
