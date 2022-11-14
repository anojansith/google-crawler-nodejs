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
	.default('p', 15000)
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
	const FindCompanies = require('./model/IpiBe/GrabUrl');
	let proxy = new PoolManagerProxy(process.env.PROXY, argv);

(async () => {
	// Hardcoded number of pages

	const urls = [
					// "https://www.ipi.be/rechercher-un-agent-immobilier?location=Bruxelles", 
					// "https://www.ipi.be/rechercher-un-agent-immobilier?location=Charleroi",
					// "https://www.ipi.be/rechercher-un-agent-immobilier?location=Li%C3%A8ge",
					// "https://www.ipi.be/rechercher-un-agent-immobilier?location=Namur",
					// "https://www.ipi.be/rechercher-un-agent-immobilier?location=Ixelles",
					// "https://www.biv.be/vastgoedmakelaar-zoeken?location=Gent",
					// "https://www.biv.be/vastgoedmakelaar-zoeken?location=Louvain-la-Neuve",
					// "https://www.biv.be/vastgoedmakelaar-zoeken?location=Brugge",
					// "https://www.biv.be/vastgoedmakelaar-zoeken?location=Kortrijk",
					"https://www.biv.be/vastgoedmakelaars?location=Antwerpen"
				];

		for (let i = 0; i < urls.length; i++) {
			const url = urls[i];

			for (let page = 0; page < 64; page++) {
				let findCompanies = await new FindCompanies( proxy, argv);
				let message = ' Page: ' + page + ' ';
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
					result = await findCompanies.grabUrl(url, page);
					if (argv.verbose) {
						console.log(result);
					}
		
					for(let res of result){
						query = `
						INSERT INTO 
							crawler.ipi_be
						SET 
							url=?
						`;
		
						await connection.execute(query, [
							(res ? res : null)					
							]);
		
					} 
					console.log('');
		
				} catch (error) {
					console.log('\x1b[41m\x1b[5m%s\x1b[0m', error.message);
					console.log(error.data);
					console.log('');
				}
			}
			
		}


	
	
    process.exit();
})();

