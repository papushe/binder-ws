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
app.post(`/${userContext}/create`, userController.createNewUser);

app.post(`/${userContext}/update`, userController.updateProfile);

app.get(`/${userContext}/get/:key`, userController.getProfile);

app.get(`/${userContext}/delete/:key`, userController.deleteProfile);

app.get(`/${userContext}/search/:query`, userController.searchUsers);

app.post(`/${userContext}/vote/`, userController.rankUser);



//Community
app.post(`/${communityContext}/create`, communityController.createNewCommunity);

app.post(`/${communityContext}/leave`, communityController.leaveCommunity);

app.post(`/${communityContext}/delete`, communityController.deleteCommunity);

app.post(`/${communityContext}/join`, communityController.joinCommunity);

app.post(`/${communityContext}/members`, communityController.getCommunityMembers);

app.get(`/${communityContext}/get/:key`, communityController.getCommunities);

app.post(`/${communityContext}/update-role`, communityController.updateCommunityUserRole);

app.get(`/${communityContext}/search/:query`, communityController.searchCommunity);

app.post(`/${communityContext}/add-waiting-list`, communityController.addUserToWaitingList);

app.post(`/${communityContext}/remove-waiting-list`, communityController.removeUserFromWaitingList);


//Activity
app.post(`/${activityContext}/create/`, activityController.createNewActivity);

app.get(`/${activityContext}/user/get/:key`, activityController.getActivitiesByUserId);

app.get(`/${activityContext}/community/get/:key`, activityController.getActivitiesByCommunityId);

app.post(`/${activityContext}/delete/`, activityController.deleteActivityById);

app.post(`/${activityContext}/update`, activityController.updateActivity);



//Notification
app.post(`/${notificationContext}/create`, notificationController.createNewNotification);

app.post(`/${notificationContext}/update`, notificationController.updateNotification);

app.get(`/${notificationContext}/get/:key`, notificationController.getNotificationsByUserId);

app.post(`/${notificationContext}/delete/`, notificationController.deleteNotificationById);



//Message
app.post(`/${messageContext}/create`, messageController.createNewMessage);

app.get(`/${messageContext}/get/:key`, messageController.getMessagesByRoomId);



app.all('*', (req, res) => {
    res.json({"error": "404 - not found (Wrong input or Wrong url)"});
});

server.listen(port, () => {
    logger.info(`listening on port ${port}`);
});