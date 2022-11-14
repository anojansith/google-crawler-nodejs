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
	const CompaniesSearch = require('./model/IpiBe/Search');
	
	
	let proxy = new PoolManagerProxy(process.env.PROXY_LUMINATI, argv);
	
(async () => {
	let shard = argv.shard.split('/');

    let selectQuery = `
	SELECT * 
	FROM crawler.ipi_be
	WHERE
		url IS NOT NULL
		AND business_name IS NULL
		AND ipibe_status IS NULL
		AND MOD(id, ?)=?
	`;

    let rowsLead = await connection.query(selectQuery, [
        shard[1],
        ((shard[0] == shard[1]) ? 0 : shard[0])
    ]);

    console.log('');

	for (let loop = 0; loop < rowsLead[0].length; loop++) {
		search = await new CompaniesSearch(proxy, argv);
		let message = ' record ID:' +  rowsLead[0][loop].id +' | URL: ' + rowsLead[0][loop].url + ' | Crawling position: ' + (loop + 1) + '/' + rowsLead[0].length + ' ';
		let messageTop = '';
		while (messageTop.length < message.length) {
			messageTop += '─';
		}
		messageTop = '┌' + messageTop + '┐';
		let messageBottom = '';
		while (messageBottom.length < message.length) {
			messageBottom += '═';
		}
		messageBottom = '╘' + messageBottom + '╛';
		message = '│' + message + '│';

		console.log(messageTop);
		console.log(message);
		console.log(messageBottom);

		try {
			result = await search.findCompanies(rowsLead[0][loop].url);
			if (argv.verbose) {
				console.log(result);
			}

			query = `
			UPDATE  
				crawler.ipi_be 
			SET 
			    ipibe_status=?,
			    agent_name=?,
				business_name=?,
				telephone=?,
				address_nl=?,
				address_fr=?,
				email=?,
				website=?,
				postal_code=?,
				city=?,
				note=?,
				language_code=?,
				google_status=?
			WHERE
				id=?
			`;

			let language_code_url;
			if(rowsLead[0][loop].url.indexOf("ipi") > -1){
				language_code_url = "fr-fr";
			}else if(rowsLead[0][loop].url.indexOf("biv") > -1){
				language_code_url = "bl-fr";
			}else{
				language_code_url = "";
			}
			await connection.execute(query, [
				(result.ipibe_status ? result.ipibe_status : ""),
				(result.agent_name ? result.agent_name : ""),
				(result.business_name ? result.business_name : ""),
				(result.telephone ? result.telephone : ""),
				(result.address_fr ? result.address_fr : ""),
				(result.address_nl ? result.address_nl : ""),
				(result.email ? result.email : ""),
				(result.website ? result.website : ""),
				(result.postal_code ? result.postal_code : ""),
				(result.city ? result.city : ""),
				(result.note ? result.note : ""),
				(result.language_code ? language_code_url : ""),
				(result.google_status ? null : ""),
				rowsLead[0][loop].id
			]);			

			console.log('');

		} catch (error) {
			console.log('');
		}
	}

    process.exit();

})();