import neo4j from 'neo4j-driver'


export interface IHelperConfig {
	driver: neo4j.Driver
	parseIntegers?: boolean
}

export default class CypherHelper {
	config: IHelperConfig = {
		driver: null,
		parseIntegers: false
	}

	constructor(config: IHelperConfig) {
		this.config = {parseIntegers: false, ...config}
	}

	query = (strings: TemplateStringsArray, ...params: any[]) => {
		return new CypherQuery(this.config, strings, params)
	}
}

export class CypherQuery {
	constructor(
		protected config: IHelperConfig,
		protected strings: TemplateStringsArray,
		protected params: any[] = [],
	) {}

	export(prefix: string = 'p'): [string, any] {
		let query = ''
		let params = {} as any

		for (let i = 0, l = this.strings.length; i < l; i++) {
			const name = `${prefix}_${i}`
			const param = this.params[i]

			query += this.strings[i]

			if (param instanceof CypherQuery) {
				const [subQuery, subParams] = param.export(name)
				query += subQuery
				params = {...params, ...subParams}
			} else if (param !== undefined) {
				query += `{${name}}`
				params[name] = param
			}
		}

		return [
			query,
			params,
		]
	}

	async run(): Promise<any[]> {
		const session = this.config.driver.session()
		const [query, params] = this.export()
		const result = await session.run(query, params)
		let data = result.records.map(record => record.toObject())

		if (this.config.parseIntegers) {
			data = normalizeInts(data)
		}

		session.close()

		return data
	}
}

function normalizeInts(record: any) {
	let normalized = record

	if (neo4j.isInt(record)) {
		normalized = neo4j.integer.toNumber(record)
	} else if (record instanceof Array) {
		normalized = record.map(item => normalizeInts(item))
	} else if (record instanceof Object) {
		for (let key in record) {
			normalized[key] = normalizeInts(record[key])
		}
	}

	return normalized
}