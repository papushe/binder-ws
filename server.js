const express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    communityController = require('./controllers/communityController'),
    port = process.env.PORT || require('./config').PORT,
    bodyParser = require('body-parser');

app.use(bodyParser.json()); // parsing application/json
app.use(bodyParser.urlencoded({extended: true})); // parsing application/x-www-form-urlencoded
app.use('/', express.static('./public'));
app.use('/assets', express.static(`${__dirname}/public`)); // public as assets
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Credentials", true); //false
    res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Length, Authorization, Origin, X-Requested-With, Content-Type, Accept, application/json");
    next();
});

/* All routes  */
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.post('/createNewCommunity/', communityController.createNewCommunity);

app.get('/getCommunities/:key', communityController.getCommunities);

app.get('/searchCommunity/:type', communityController.searchCommunity);

app.all('*', communityController.errorHandling);

server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
