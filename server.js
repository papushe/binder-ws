const   express = require('express'),
        app = express(),
        toDo = require('./controllers/binderController'),
        PORT   = require('./config').PORT,
        port = PORT || process.env.PORT,
        bodyParser = require('body-parser');

// app.set('port',port); //check
app.use(bodyParser.json()); // parsing application/json
app.use(bodyParser.urlencoded({extended:true})); // parsing application/x-www-form-urlencoded
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
app.get('/', (req,res) =>{
    res.sendFile(`${__dirname}/index.html`);
});

app.post('/login/', toDo.login);

app.post('/changePassword/', toDo.changePassword);

app.post('/updateAllToDo/', toDo.updateAllToDo);

app.post('/createNewUser/', toDo.createNewUser);

// app.get('/getAllToDo/:email', toDo.getAllToDo);
app.post('/getAllToDo/', toDo.getAllToDo);

app.post('/createNewToDo/', toDo.createNewToDo);

app.post('/dropToDo/', toDo.dropToDo);

app.all('*', toDo.errorHandling);

app.listen(port, () => {console.log(`listening on port ${port}`);});