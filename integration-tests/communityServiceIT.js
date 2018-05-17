let testUtils = require('./testUtils'),
    testedService  = require('../services/communityService'),
    userService  = require('../services/userService'),
    Community  = require('../models/Community'),
    testUser = testUtils.user,
    utils = require('../utils'),
    logger = utils.getLogger(),
    chai = require('chai'),
    should = chai.should(),
    expect = chai.expect,
    mongoose = require('../database'),
    testUniqueId,
    communities = [],
    member = {
        firstName: 'Naor',
        lastName: 'Mailinator',
        keyForFirebase: 'RJKAEPE0Cog4oZRIiSGtHus2X0g1'
    };

describe(`Community Service Integration Tests`, () => {

    before(async () => {
        let promises = [];
        //clean old tests communities and references
        logger.info(`communityServiceIT started at: ${utils.now()}`);
        testUniqueId = `test ${new Date().getTime()}`;
        let result = await testedService.getUserCommunities(testUser.USER_KEY);

        if (result) {
           result.forEach(community => {
               promises.push(testedService.deleteCommunityById(community._id));
           });
            result = await Promise.all(promises);
            logger.info(`deleted old test communities success? ${!!result}`);
        }
    });

    after(async () => {
        let promises = [];
        //clean test communities and references
        communities.forEach(community => {
            promises.push(userService.removeCommunityFromUser(testUser.USER_KEY,community._id));
            promises.push(userService.removeCommunityFromUser(member.keyForFirebase,community._id));
            promises.push(testedService.deleteCommunityById(community._id));
        });
        let result = await Promise.all(promises);

            logger.info(`removed all test communities? ${!!result}`);
            logger.info(`communityServiceIT ended at: ${utils.now()}`);
    });

    it(`should create new communities`, async () => {
        let publicCommunity = new Community ({
            communityName: `${testUniqueId} public` ,
            communityDescription: 'community-test-desc',
            managerId: testUser.USER_KEY,
            creationDate: utils.now(),
            members: {
                memberId: testUser.USER_KEY
            },
            type: 'Public'
        }),
            securedCommunity = new Community ({
            communityName: `${testUniqueId} secured` ,
            communityDescription: 'community-test-desc',
            managerId: testUser.USER_KEY,
            creationDate: utils.now(),
            members: {
                memberId: testUser.USER_KEY
            },
            type: 'Secured'
        }),
            promises = [];

        promises.push(testedService.saveNewCommunity(publicCommunity));
        promises.push(testedService.saveNewCommunity(securedCommunity));
        let result = await Promise.all(promises);
    });

    it(`should get community users`, async () => {
        let result = await testedService.getUserCommunities(testUser.USER_KEY);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
        communities = result;
        result.should.be.an('array').with.lengthOf(2);
    });

    it(`should search communities - without secured communities`, async () => {
        let result = await testedService.searchCommunities(testUniqueId);

        expect(result).not.equal(false);
        expect(result).not.equal(null);
        result.should.be.an('array').with.lengthOf(1);
        expect(result[0]._id.toString()).equal(communities[0]._id.toString());
    });

    it(`should delete community by id`, async () => {
        let result = await testedService.deleteCommunityById(communities[1]._id);

        expect(result).equal(true);
        result = await testedService.getUserCommunities(testUser.USER_KEY);
        expect(result).not.equal(false);
        result.should.be.an('array').with.lengthOf(1);
    });

    it(`should join to community`, async () => {
        let result = await testedService.addUserToCommunityMembers(member.keyForFirebase, communities[0]._id, false);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result).equal(true);

        result = await testedService.getCommunityMembers(communities[0]._id);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        result.should.be.an('array').with.lengthOf(2);
        expect(result.keyForFirebase).not.equal(member.keyForFirebase);
        expect(result.keyForFirebase).equal(testUser.keyForFirebase);

    });

    it(`should leave community and set a new manager`, async () => {
        let result = await testedService.addUserToCommunityMembers(member.keyForFirebase, communities[0]._id, false);
        expect(result).equal(true);

        result = await testedService.leaveCommunity(testUser.USER_KEY,communities[0]._id);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result.keyForFirebase).equal(testUser.USER_KEY);
        result.communities.should.be.an('array').with.lengthOf(1);

        result = await testedService.getCommunityById(communities[0]);
        expect(result.managerId).equal(member.keyForFirebase);
    });

    it(`should add user to community waiting list`, async () => {
        let result = await testedService.addToWaitingList(testUser.USER_KEY, communities[0]._id);
        expect(result).not.equal(false);
        expect(result.waiting_list[0]).equal(testUser.USER_KEY);
    });

    it(`should remove user to community waiting list`, async () => {
        let result = await testedService.removeFromWaitingList(testUser.USER_KEY, communities[0]._id);
        expect(result).not.equal(false);
        expect(result).not.equal(null);
        expect(result.waiting_list[0]).not.equal(testUser.USER_KEY);
    });
});