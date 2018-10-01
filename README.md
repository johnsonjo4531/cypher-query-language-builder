# cypher-query-language-builder

Fork of [cypher-tagged-templates](https://www.npmjs.com/package/cypher-tagged-templates)

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

```typescript
interface IHelperConfig {
    driver?: neo4j.Driver;
    parseIntegers?: boolean;
}

interface FromProps {
    (propsWhitelist: [string], object: object): CypherQuery;
}

interface Raw {
    (strings: TemplateStringsArray, ...params: any[]): CypherRawText;
}

interface Query {
    (strings: TemplateStringsArray, ...params: any[]): CypherQuery;
    raw: Raw;
    fromProps: FromProps;
}

class CypherHelper {
    constructor(config: IHelperConfig = {});
    query = Query;
}

class CypherQuery {
    export(prefix: string = "p"): [string, any];
    async run<T extends Object>(config: IHelperConfig = {}): Promise<T[]>;
}
```
