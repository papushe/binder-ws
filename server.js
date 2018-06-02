const express = require('express'),
    helmet = require('helmet'),
    http = require('http'),
    app = express(),
    server = http.createServer(app),

    userContext = 'user',
    communityContext = 'community',
    activityContext = 'activity',
    notificationContext = 'notification',
    messageContext = 'message',

    admin = require('firebase-admin'),
    serviceAccount = require('./binder-pnk-firebase-adminsdk-nhbvv-5ced6a0ee2.json'),

    userController = require('./controllers/userController'),
    communityController = require('./controllers/communityController'),
    activityController = require('./controllers/activityController'),
    notificationController = require('./controllers/notificationController'),
    messageController = require('./controllers/messageController'),
    schedulerService = require('./services/schedulerService'),
    port = process.env.PORT || require('./config').PORT,
    bodyParser = require('body-parser'),
    logger = require('./utils').getLogger(),
    socketIO = require('socket.io'),
    io = socketIO(server);
require('./socket/socketService')(io);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


function validateToken(req, res, next) {
    let token = req.get('Authorization');
    try {
        //CORS
        if (req.method === 'OPTIONS') {
            res.status(200).send(`OPTIONS`);
            return;
        }

        if (!token) {
            logger.warn(`failed to call: ${req.originalUrl} due to: empty token`);
            res.status(401).send(`permission denied! missing authorization header`);
        }
        else {
            admin.auth().verifyIdToken(token)
                .then(decodedToken => {
                    next();
                })
                .catch(err => {
                    logger.warn(`failed to call: ${req.originalUrl} invalid token!`);
                    res.status(401).send(`permission denied! invalid authorization header`);
                });
        }
    } catch (e) {
        logger.error(e);
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
app.use(helmet());


/* All routes  */
app.get('/', (req, res) => {
    res.sendFile(`${__dirname}/index.html`);
});

//User
app.post(`/${userContext}/create`, userController.create);

app.post(`/${userContext}/update`, userController.update);

app.get(`/${userContext}/get/:key`, userController.getProfile);

app.get(`/${userContext}/delete/:key`, userController.deleteProfile);

app.get(`/${userContext}/search/:query`, userController.search);

app.post(`/${userContext}/vote`, userController.rank);


//Community
app.post(`/${communityContext}/create`, communityController.create);

app.post(`/${communityContext}/leave`, communityController.leave);

app.post(`/${communityContext}/delete`, communityController.delete);

app.post(`/${communityContext}/join`, communityController.join);

app.post(`/${communityContext}/members`, communityController.getMembers);

app.get(`/${communityContext}/get/:key`, communityController.getByUserId);

app.get(`/${communityContext}/search/:query`, communityController.search);

app.post(`/${communityContext}/add-waiting-list`, communityController.addUserToWaitingList);

app.post(`/${communityContext}/remove-waiting-list`, communityController.removeUserFromWaitingList);


//Activity
app.post(`/${activityContext}/create/`, activityController.create);

app.get(`/${activityContext}/user/get/:key`, activityController.getByUserId);

app.post(`/${activityContext}/community`, activityController.getByCommunityId);

app.post(`/${activityContext}/delete`, activityController.deleteById);

app.post(`/${activityContext}/update`, activityController.update);

app.post(`/${activityContext}/claim`, activityController.claim);

app.post(`/${activityContext}/approve`, activityController.approve);

app.post(`/${activityContext}/decline`, activityController.decline);

app.post(`/${activityContext}/finish`, activityController.finish);

app.post(`/${activityContext}/cancel`, activityController.cancel);


//Notification
app.post(`/${notificationContext}/create`, notificationController.create);

app.post(`/${notificationContext}/update`, notificationController.update);

app.get(`/${notificationContext}/get/:keyForFirebase`, notificationController.getById);

app.post(`/${notificationContext}/delete`, notificationController.deleteById);


//Message
app.post(`/${messageContext}/create`, messageController.create);

app.get(`/${messageContext}/get/:roomId`, messageController.getByRoomId);

app.post(`/${messageContext}/save-chat-room`, messageController.saveUserChatByUserId);


app.all('*', (req, res) => {
    res.json({"error": "404 - not found (Wrong input or Wrong url)"});
});

server.listen(port, () => {
    logger.info(`listening on port ${port}`);
    schedulerService.execute(true)
        .then(data => {
            logger.info(`initiated execution task - will be executed every 5 min`);
        })
        .catch(err => {
            logger.error(`failed to initiate execution task on startup due to: ${err}`);
        });
});