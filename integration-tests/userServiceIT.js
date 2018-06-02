let testUtils = require('./testUtils'),
    testedService = require('../services/userService'),
    User = require('../models/User'),
    utils = require('../utils'),
    logger = utils.getLogger(),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    mongoose = require('../database'),
    user,
    testKey,
    communityId,
    testUniqueId;

describe(`User Service Integration Tests`, () => {

    before(async () => {
        logger.info(`userServiceIT started at: ${utils.now()}`);
        testUniqueId = `test ${new Date().getTime()}`;
        testKey = `KeyForFirebase${new Date().getTime()}`;
        communityId = `Community${new Date().getTime()}ID`;
    });

    after(async () => {
        logger.info(`make sure users are deleted before ending...`);
        let result = await testedService.deleteUser(testKey);
        expect(result).equal(true);
        logger.info(`communityServiceIT ended at: ${utils.now()}`);
    });

    it(`should create a new user`, async () => {
        user = new User({
            firstName: 'Binder',
            lastName: 'Test',
            location: 'Arlozorov, Ramat Gan',
            email: 'Binder@binder.com',
            phoneNumber: '080909909',
            dateOfBirth: '',
            description: 'test user description',
            profilePic: '',
            keyForFirebase: testKey
        });

        let result = await testedService.saveNewUser(user);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
    });

    it(`should get user profile`, async () => {
        let result = await testedService.getUserProfile(testKey);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result.keyForFirebase).equal(testKey);
        expect(result.firstName).equal('Binder');
        expect(result.lastName).equal('Test');
        expect(result.fullName).equal('Binder Test');
        expect(result.phoneNumber).equal('080909909');
        expect(result.location).equal('Arlozorov, Ramat Gan');
        expect(result.description).equal('test user description');
        expect(result.email).equal('Binder@binder.com');
        expect(result.votes.down).equal(0);
        expect(result.votes.up).equal(0);
        expect(result.rank).equal(-1);
    });

    it(`should vote for an user and check user rank`, async () => {
        let voteUp = {userId: testKey, up: true};
        let voteDown = {userId: testKey, down: true};

        let result = await testedService.rankUser(voteUp);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result.votes.up).equal(1);
        expect(result.votes.down).equal(0);
        expect(result.rank).equal(5);

        result = await testedService.rankUser(voteDown);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result.votes.up).equal(1);
        expect(result.votes.down).equal(1);
        expect(result.rank).equal(3);
    });

    it(`should update user profile`, async () => {
        user = new User({
            firstName: 'Binder_new',
            lastName: 'Test_new' + testKey,
            location: 'Arlozorov, Tel Aviv',
            phoneNumber: '0999999999',
            dateOfBirth: '',
            description: 'new description',
            profilePic: '',
            keyForFirebase: testKey
        });

        let result = await testedService.updateUserProfile(user);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result.keyForFirebase).equal(testKey);
        expect(result.firstName).equal('Binder_new');
        expect(result.lastName).contains('Test_new');
        expect(result.fullName).contains('Binder_new Test_new');
        expect(result.phoneNumber).equal('0999999999');
        expect(result.location).equal('Arlozorov, Tel Aviv');
        expect(result.description).equal('new description');
    });

    it(`should search user`, async () => {
        let result = await testedService.searchUsers(testKey);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
        result.should.be.an('array').with.lengthOf(1);
        expect(result.keyForFirebase).not.equal(testKey);
    });

    it(`should add community to user`, async () => {
        let community = {
            communityId: communityId,
            role: 'Member'
        };

        let result = await testedService.addCommunityToUser(testKey, community);

        expect(result).not.equal(false);
        expect(result).not.equal(null);

        result.communities.should.be.an('array').with.lengthOf(1);
        expect(result.communities[0].communityId).equal(communityId);
        expect(result.communities[0].role).equal('Member');
    });

    it(`should remove community from user`, async () => {

        let result = await testedService.removeCommunityFromUser(testKey, communityId);

        expect(result).not.equal(false);
        expect(result).not.equal(null);

        result.communities.should.be.an('array').with.lengthOf(0);
    });

    it(`should delete user`, async () => {
        let result = await testedService.deleteUser(testKey);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result).equal(true);

        result = await testedService.getUserProfile(testKey);
        result.should.be.an('array').with.lengthOf(0);
    });
});