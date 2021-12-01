# About
This project was created for Kompetegram OpenAPI Challenge. For fun I also created options to enable `cache` and `cheat`.

`cache` work by saving the output on first run to a dictionary, then return it immediately upon request if it were within the last ` 5 minutes`

`cheat` needs cache to be turned on, it cached the `/fakultas-prodi` method.

For performance I use restana as my framework and pure mongodb.
# How to run
Before running the code make sure you set up `.env` file, it should look something like this:

```
DB_USER=your_username
DB_PASS=your_password
DB_SERVER=cluster0.od9px.mongodb.net/somedbname?retryWrites=true&w=majority
```

To run the code use:

```
npm init
npm start
```

To run the code without the cache and cheat options and checks:
```
npm init
npm run pure
```
Please note that cache and cheat were turned off by default on `server.js` this won't make much impact.
