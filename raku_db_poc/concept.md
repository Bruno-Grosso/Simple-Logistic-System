A Raku script, a cronjob and a dream (for a logistics system)

The files:
1. db.json
2. queue.json
3. sync_db.raku
4. conjob.sh (keeps track of the last processed line in the log)
5. index.html, main.css, main.js (frontend stuff)
8. dockerfile (the open-bsd setup)

The idea is that the front-end will write the post/patch requests to queue.json and every 5 seconds the conjob will call the sync_db script to update the db based on the queue and (re)calculates the routes as needed.

The get requests can just read from the db file ez to parse as a JSON for JS.

This directory contains a simple implementation just to illustrate the idea that the backend can be basically deleted in order to favor simplicity.
