let testUtils = require('./testUtils'),
    testedService = require('../services/userService'),
    messageService = require('../services/messageService'),
    testUser = testUtils.user,
    MESSAGE = require('../models/Message'),
    utils = require('../utils'),
    logger = utils.getLogger(),
    chai = require('chai'),
    expect = chai.expect,
    testUniqueId;

describe(`Message Service Integration Tests`, () => {

    before(async () => {
        logger.info(`messagesServiceIT started at: ${utils.now()}`);
        testUniqueId = `test${new Date().getTime()}`;
        let result = await testedService.getUserProfile(testUser.USER_KEY);

        if (result) {
            result.chats = [{}];
            result = await testedService.updateUserProfile(result);
            logger.info(`deleted old activities success? ${!!result}`);
        }
    });

    after(async () => {

    });

    it(`should create a new chat message`, async () => {
        let obj = {
            chatRoomId: '00000',
            talkedToId: '11111',
            talkedToName: 'moshe',
            talkedFromName: 'papushe',
            profilePic: '',
        };

        let result = await messageService.saveUserChat(obj, testUser.USER_KEY);

        expect(result.chats[0].chatRoomId).equal('00000');
        expect(result.chats[0].talkedToId).equal('11111');
        expect(result.chats[0].talkedToName).equal('moshe');
        expect(result.chats[0].talkedFromName).equal('papushe');
    });

    it(`should save new message`, async () => {
        let msgObj = new MESSAGE({
            from: 'Itzik',
            date: utils.now(),
            room: '00000',
            text: 'Hi how r u?'
        });

        let result = await messageService.saveNewMessage(msgObj);

        expect(result.from).equal('Itzik');
        expect(result.room).equal('00000');
        expect(result.text).equal('Hi how r u?');
    });

     it(`should get room messages`, async () => {

         let result = await messageService.getRoomMessages('00000');

         expect(result[0].from).equal('Itzik');
         expect(result[0].room).equal('00000');
         expect(result[0].text).equal('Hi how r u?');

     });
});