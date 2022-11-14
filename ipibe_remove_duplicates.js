const mysql = require('mysql2/promise');

const yargs = require('yargs');

const argv = require('yargs')
	.usage('Usage: $0 [options]')
	.alias('d', 'debug')
	.describe('d', 'Debug Mode')
	.boolean('d')
	.default('d', false)
	.alias('v', 'verbose')
	.describe('v', 'Increase verbosity')
	.boolean('v')
	.default('v', true)
	.alias('b', 'browser-timeout')
	.describe('b', 'Timeout for browser requests (milliseconds)')
	.number('b')
	.default('b', 30000)
	.alias('q', 'quarantine-timeout')
	.describe('q', 'Quarantine timeout for proxies (milliseconds)')
	.number('q')
	.default('q', 3600000)
	.alias('p', 'empty-pool')
	.describe('p', 'Pause when proxy pool is empty (milliseconds)')
	.number('p')
	.default('p', 60000)
	.alias('s', 'shard')
    .describe('s', 'Shard the crawling process (thread/shards)')
    .string('s')
    .default('s', '1/1')
	.help('h')
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.argv;
	
	// create the connection to database
	const connection = mysql.createPool({
		host: process.env.DATABASE_HOST,
		port: process.env.DATABASE_PORT,
		user: process.env.DATABASE_USER,
		password: process.env.DATABASE_PASSWORD,
		charset: process.env.DATABASE_CHARSET
	});
	
	const PoolManagerProxy = require('./model/PoolManager/Proxy');
	let proxy = new PoolManagerProxy(process.env.PROXY_LUMINATI, argv);
	
(async () => {
	//let shard = argv.shard.split('/');
	let selectQuery = `DELETE FROM crawler.ipi_be WHERE id NOT IN ( SELECT id FROM ( SELECT MIN(id) as id FROM crawler.ipi_be GROUP BY CONCAT(agent_name, business_name, telephone, address_nl, email, website) ) AS duplicate_ids )`;

	await connection.execute(selectQuery);
   // console.log(await connection.execute(selectQuery));
    process.exit();
})();