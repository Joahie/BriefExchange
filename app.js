//Dependencies
const express = require('express');
const app = express();
const { MongoClient } = require('mongodb')
const env = require('dotenv').config()
const URI = process.env.URI
const SECRET = process.env.SECRET
const mongoclient = new MongoClient(URI, { useUnifiedTopology: true });
app.use(express.urlencoded({ extended: false }));
const session = require('express-session')
const MongoDBSession = require("connect-mongodb-session")(session)
const PORT = 3000
const helmet = require("helmet");
const hpp = require('hpp');

//Configuring cookies
const store = new MongoDBSession({
    uri: URI,
    collection: 'mySessions'
})

app.use(session({
    secret: SECRET,
    resave: false,
    saveUninitialized: false,
    store: store,
    secure: true,
    httpOnly: true,

}))

app.disable('x-powered-by')
app.use(hpp());
//Connecting to MongoDB and server
mongoclient.connect(async function (err, mongoclient) {
    console.log("Successfully connected to MongoDB!");
    global.mongoclient = mongoclient;
    app.set('port', PORT);
    app.set('view engine', 'ejs');
    app.use(express.static('static'));
    require('./router')(app);
    app.listen(PORT, () => console.info(`Listening on port ${PORT}`));
})
