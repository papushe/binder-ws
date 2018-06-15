let testUtils = require('./testUtils'),
    userService = require('../services/userService'),
    notificationService = require('../services/notificationService'),
    testUser = testUtils.user,
    NOTIFICATION = require('../models/Notification'),
    utils = require('../utils'),
    logger = utils.getLogger(),
    chai = require('chai'),
    expect = chai.expect,
    testUniqueId,
    notifications = [],
    notificationId;

describe(`Notification Service Integration Tests`, () => {

    before(async () => {
        logger.info(`messagesServiceIT started at: ${utils.now()}`);
        testUniqueId = `test${new Date().getTime()}`;
        let result = await userService.getUserProfile(testUser.USER_KEY);

        if (result) {
            result = await userService.updateUserProfile(result);
            logger.info(`deleted old activities success? ${!!result}`);
        }
    });

    after(async () => {
        let promises = [];
        notifications.forEach(item => {
            promises.push(notificationService.deleteNotificationById(item._id));
        });

        let result = await Promise.all(promises);
    });

    it(`should create a new notification message`, async () => {
        let notificationObj = new NOTIFICATION({
            from: {
                fullName: 'moshe',
                keyForFirebase: '1111',
                profilePic: ''
            },
            to: {
                fullName: 'itzik',
                keyForFirebase: testUser.USER_KEY,
                profilePic: ''
            },
            room: '0000',
            communityName: 'community',
            status: 'unread',
            event: 'test',
            activity: 'activity',
            content: 'nothing',
            user: '',
            isAddToCalender: false
        });

        let result = await notificationService.saveNewNotification(notificationObj);

        notifications.push(result);
        notificationId = result._id;
        expect(result.from.fullName).equal('moshe');
        expect(result.from.keyForFirebase).equal('1111');
        expect(result.to.fullName).equal('itzik');
        expect(result.to.keyForFirebase).equal(testUser.USER_KEY);
        expect(result.room).equal('0000');
        expect(result.communityName).equal('community');
        expect(result.status).equal('unread');
        expect(result.event).equal('test');
        expect(result.activity).equal('activity');
        expect(result.content).equal('nothing');

    });

    it(`should update notification`, async () => {
        let notificationObj = {
            status: 'read',
            keyForFirebase: notificationId
        };

        let result = await notificationService.updateNotification(notificationObj);

        expect(result.status).equal('read');

    });

    it(`should get notification by id`, async () => {

        let result = await notificationService.getUserNotifications(testUser.USER_KEY);

        expect(result[0].from.fullName).equal('moshe');
        expect(result[0].from.keyForFirebase).equal('1111');
        expect(result[0].to.fullName).equal('itzik');
        expect(result[0].to.keyForFirebase).equal(testUser.USER_KEY);
        expect(result[0].room).equal('0000');
        expect(result[0].communityName).equal('community');
        expect(result[0].status).equal('read');
        expect(result[0].event).equal('test');
        expect(result[0].activity).equal('activity');
        expect(result[0].content).equal('nothing');

    });

    it(`should delete notification by id`, async () => {

        let result = await notificationService.deleteNotificationById(notificationId);
        expect(result).equal(true);
    });

    it(`should delete all users notifications by id`, async () => {

        let result = await notificationService.deleteAllNotificationById(testUser.USER_KEY);
        expect(result).equal(true);
    });

});