# google-crawler-nodejs

The application was done in nodejs. The goal is to crawl as many as data and fill into the spreadsheet automatically. I targeted a real estate agency and started craling as many as information. 
- ipi_be_database - this file will create a database to store the records
- ipi_be_entries - This will crawl datas given in the URL array from Belgium and France and store them in MySQL.
- ipi_be_remove_duplicates - This will check for any duplicate entries and trash them and provide a clean copy.
- ipi_search - This will search the missing fields from the list and grab details from google and fill them up of the real estate agents.
- ipi_google_search - This will only search from google, and provide spread sheet file. 
