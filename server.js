const express = require('express'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),
    admin = require('firebase-admin'),
    serviceAccount = require('./binder-pnk-firebase-adminsdk-nhbvv-5ced6a0ee2.json'),
    userController = require('./controllers/userController'),
    communityController = require('./controllers/communityController'),
    activityController = require('./controllers/activityController'),
    port = process.env.PORT || require('./config').PORT,
    bodyParser = require('body-parser'),
    socketIO = require('socket.io'),
    io = socketIO(server);
    require('./socket/socketService')(io);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


function validateToken(req, res, next) {
    let token = req.get('Authorization');
    try{
        //CORS
        if (req.method === 'OPTIONS') {
            res.status(200).send(`OPTIONS`);
            return;
        }

        if(!token) {
             console.warn(`failed to call: ${req.originalUrl} due to: empty token`);
             res.status(401).send(`permission denied! missing authorization header`);
        }
        else {
            admin.auth().verifyIdToken(token)
                .then(decodedToken => {
                 next();
                })
                .catch(err => {
                    console.warn(`failed to call: ${req.originalUrl} due to invalid token: ${token}`);
                    res.status(401).send(`permission denied! invalid authorization header`);
                });
        }
     }catch (e) {
         console.error(e);
         res.json(`permission denied due to invalid token!`);
     }
}


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

app.use(validateToken);


/* All routes  */
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

app.post('/createNewUser/', userController.createNewUser);

app.post('/updateProfile/', userController.updateProfile);

app.get('/getProfile/:key', userController.getProfile);

app.get('/deleteProfile/:key', userController.deleteProfile);

app.post('/createNewCommunity/', communityController.createNewCommunity);

app.post('/leaveCommunity/', communityController.leaveCommunity);

app.post('/deleteCommunity/', communityController.deleteCommunity);

app.post('/joinCommunity/', communityController.joinCommunity);

app.post('/getCommunityMembers/', communityController.getCommunityMembers);

app.get('/getCommunities/:key', communityController.getCommunities);

app.get('/deleteCommunities/:key', communityController.deleteCommunitiesByKey);

app.post('/updateCommunityUserRole/', communityController.updateCommunityUserRole);

app.get('/searchCommunity/:type', communityController.searchCommunity);

app.post('/createNewActivity/', activityController.createNewActivity);

app.get('/getActivitiesByUserId/:key', activityController.getActivitiesByUserId);

app.get('/getActivitiesByCommunityId/:key', activityController.getActivitiesByCommunityId);

app.post('/deleteActivityById/', activityController.deleteActivityById);

app.all('*', (req, res) => {
    res.json({"error": "404 - not found (Wrong input or Wrong url)"});
});

server.listen(port, () => {
    console.log(`listening on port ${port}`);
});