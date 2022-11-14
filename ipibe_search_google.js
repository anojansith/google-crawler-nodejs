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
    .default('v', false)
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
const GoogleSearch = require('./model/IpiBe/SearchGoogle');


let proxy = new PoolManagerProxy(process.env.PROXY, argv);
(async () => {

    let shard = argv.shard.split('/');

    let selectQuery = `
    SELECT * 
    FROM crawler.ipi_be
    WHERE 
        ipibe_status=1
        AND google_status IS NULL
        AND MOD(id, ?)=?
    `;

    let rowsLead = await connection.query(selectQuery, [
        shard[1],
        ((shard[0] == shard[1]) ? 0 : shard[0])
    ]);

    console.log('');
    for (let loop = 0; loop < rowsLead[0].length; loop++) {
        search = await new GoogleSearch(proxy, argv);

        let message = ' id: ' + rowsLead[0][loop].id + ' | ' + rowsLead[0][loop].siret + ' | Crawling position: ' + (loop + 1) + '/' + rowsLead[0].length + ' ';
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
            result = await search.bySiret(rowsLead[0][loop].siret, rowsLead[0][loop].business_name, rowsLead[0][loop].address_nl);
            if (argv.verbose) {
                console.log(result);
            }


            query = `
                    UPDATE 
                        crawler.ipi_be
                    SET 
                        google_status=?,
                        google_businessname=?,
                        google_businessphonenumber=?,
                        google_businessaddress=?
                    WHERE
                        id=?
                    `;

            await connection.execute(query, [
                (result.google.google_status ? result.google.google_status : 0),
                (result.google.businessName ? result.google.businessName : null),
                (result.google.businessPhoneNumber ? result.google.businessPhoneNumber : null),
                (result.google.businessAddress ? result.google.businessAddress : null),
                rowsLead[0][loop].id
            ]);

            console.log('');

        } catch (error) {
            console.log('\x1b[41m\x1b[5m%s\x1b[0m', error.message);
            console.log(error.data);
            console.log('');
        }
    }

    process.exit();

})();