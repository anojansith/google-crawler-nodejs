const mysql = require('mysql2/promise');
const CapitalizationFr = require('./model/Capitalization/Fr');
const readlineSync = require('readline-sync');

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
	.default('v', false)
	.help('h')
	.alias('h', 'help')
	.wrap(yargs.terminalWidth())
	.argv;


// create the connection to database
(async () => {
	let variable = [];
	try {

		if (!readlineSync.keyInYN('This process will drop the real advice table, are you sure?')) {
			process.exit();
		}

		const connection = await mysql.createConnection({
			host: process.env.DATABASE_HOST,
			port: process.env.DATABASE_PORT,
			user: process.env.DATABASE_USER,
			password: process.env.DATABASE_PASSWORD,
			charset: process.env.DATABASE_CHARSET
		});

		// create the table in the db if it doesn't exist
		process.stdout.write("Dropping pages dor table... ");
		let dropQuery = `DROP TABLE IF EXISTS crawler.ipi_be;`;
		console.log(dropQuery);
		await connection.execute(dropQuery);
		process.stdout.write("Done." + "\n");

		// create the table in the db if it doesn't exist
		process.stdout.write("Creating ipi_be table... ");
		let createQuery = `
		CREATE TABLE IF NOT EXISTS crawler.ipi_be (
			id INT NOT NULL AUTO_INCREMENT, 
			ipibe_status INT(10) NULL DEFAULT NULL,	
			agent_name VARCHAR(255) NULL DEFAULT NULL,
			business_name VARCHAR(255) NULL DEFAULT NULL,
			telephone VARCHAR(100) NULL DEFAULT NULL,
			address_nl VARCHAR(500) NULL DEFAULT NULL,
			address_fr VARCHAR(500) NULL DEFAULT NULL,
			email VARCHAR(100) NULL DEFAULT NULL,
			website VARCHAR(100) NULL DEFAULT NULL,
			postal_code VARCHAR(100) NULL DEFAULT NULL,
			city VARCHAR(100) NULL DEFAULT NULL,
			note VARCHAR(500) NULL DEFAULT NULL,
			language_code VARCHAR(255) NULL DEFAULT NULL,
			url VARCHAR(500) NULL DEFAULT NULL,
			google_status INT(10) NULL DEFAULT NULL,	
			google_businessname VARCHAR(500) NULL DEFAULT NULL,
			google_businessphonenumber VARCHAR(255) NULL DEFAULT NULL,
			google_businessaddress VARCHAR(255) NULL DEFAULT NULL,
			PRIMARY KEY(id)
		) ENGINE = InnoDB;
		`;
	
		await connection.execute(createQuery);
		process.stdout.write("Done." + "\n");

		await connection.end();

	} catch (error) {
		console.log(error);
	}

	process.exit();

})();