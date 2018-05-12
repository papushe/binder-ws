let mongoose = require("mongoose"),
    testUtils = require('./testUtils'),
    service  = require('/services/communityService'),
    serverURI = testUtils.server_uri,
    testUser = testUtils.user,
    httpCodes = testUtils.http_codes,
    baseUrl = testUtils.BASE_URL,
    utils = require('../utils'),
    chai = require('chai'),
    // chaiHttp = require('chai-http'),
    should = chai.should(),
    testUniqueId = '',
    communities = [],
    member = {
        id: '123456'
    };

    // chai.use(chaiHttp);

describe(`Community Service Tests`, () => {

    before((done) => {
        testUniqueId = `test community ${new Date().getDate()}`;
        done();
    });


    after((done) => {
    });

    it(`should create new community`, (done) => {
        let obj = {
            communityName: `${testUniqueId} public` ,
            communityDescription: 'community-test-desc',
            managerId: testUser.USER_KEY,
            creationDate: utils.now(),
            members: {
                memberId: testUser.USER_KEY
            },
            type: 'public'
        };

        service.saveNewCommunity(obj)
            .then(result => {
                should(result).not.equal(false);
                should(result).not.equal(null);
                communities.push(result);
                done();
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should get community users`, (done) => {
        service.getUserCommunities(testUser.USER_KEY)
            .then(result => {
                should(result).not.equal(false);
                should(result).not.equal(null);
                should(result).count(1);
                should(result._id).equal(communities[0]._id);
                done();
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should search communities - without secured communities`, (done) => {
        let obj = {
            communityName: `${testUniqueId} secured` ,
            communityDescription: 'community-test-desc',
            managerId: testUser.USER_KEY,
            creationDate: utils.now(),
            members: {
                memberId: testUser.USER_KEY
            },
            type: 'secured'
        };

        service.saveNewCommunity(obj)
            .then(result => {
                if (result) {
                    communities.push(result);
                }
                else {
                    console.log(`failed to create community ${result}`);
                    done.fail();

                }
             service.searchCommunities(testUniqueId);
                should(result).not.equal(false);
                should(result).not.equal(null);
                should(result).count(1);
                should(result._id).equal(communities[0]._id);
                done();
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should delete community by id`, (done) => {
        service.deleteCommunityById(communities[1]._id)
            .then(result => {
                should(result).equal(true);
                service.getCommunityById(communities[1]._id)
                    .then(result => {
                        should(result).not.equal(false);
                        should(result).count(0);
                        communities.pop();
                        done();
                    })
                    .catch(err=> {
                        done.fail(err.message);
                    });
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should add member to community`, (done) => {
        service.addUserToCommunityMembers(member.id, communities[0]._id, false)
            .then(result => {
                should(result).equal(true);
                service.getCommunityMembers(communities[0]._id)
                    .then(result => {
                        should(result).not.equal(false);
                        should(result).not.equal(null);
                        should(result).count(2);
                        done();
                    })
                    .catch(err=> {
                        done.fail(err.message);
                    });
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should join to community`, (done) => {
        service.removeUserFromCommunityMembers(member.id, communities[0]._id, false)
            .then(result => {
                should(result).equal(true);
                service.getCommunityMembers(communities[0]._id)
                    .then(result => {
                        should(result).not.equal(false);
                        should(result).not.equal(null);
                        should(result).count(1);
                        done();
                    })
                    .catch(err=> {
                        done.fail(err.message);
                    });
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should set as authorized member in community`, (done) => {
        service.setAsAuthorizedMember(communities[0]._id, member.id)
            .then(result => {
                should(result).equal(true);
                done();

            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should leave community`, (done) => {
        service.removeUserFromCommunityMembers(member.id, communities[0]._id, false)
            .then(result => {
                should(result).equal(true);
                service.getCommunityMembers(communities[0]._id)
                    .then(result => {
                        should(result).not.equal(false);
                        should(result).not.equal(null);
                        should(result.authorizedMembers).count(0);
                        should(result.members).count(1);
                        should(result.members[0].memberId).count(testUser.USER_KEY);
                        done();
                    })
                    .catch(err=> {
                        done.fail(err.message);
                    });
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should leave community and set a new manager`, (done) => {
        service.addUserToCommunityMembers(member.id, communities[0]._id, false)
            .then(result => {
                should(result).equal(true);
                service.leaveCommunity(testUser.USER_KEY,communities[0]._id)
                    .then(result => {
                        should(result).not.equal(false);
                        should(result).not.equal(null);
                        should(result.keyForFirebase).equal(testUser.USER_KEY);
                        should(result.communities).count(0);
                        service.getCommunityById(communities[0])
                            .then(result =>{
                                if (result) {
                                    should(result[0].managerId).equal(member.id);
                                    done();
                                }
                                else {
                                    done.fail();
                                }
                            }).catch(err => {
                            done.fail(err);
                        });
                    })
                    .catch(err=> {
                        done.fail(err.message);
                    });
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should add user to community waiting list`, (done) => {
        service.addToWaitingList(testUser.USER_KEY, communities[0]._id)
            .then(result => {
                should(result).not.equal(false);
                should(result.waiting_list[0]).equal(testUser.USER_KEY);
                done();
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

    it(`should remove user to community waiting list`, (done) => {
        service.removeFromWaitingList(testUser.USER_KEY, communities[0]._id)
            .then(result => {
                should(result).not.equal(false);
                should(result.waiting_list[0]).not.equal(testUser.USER_KEY);
                done();
            })
            .catch(err => {
                done.fail(err.message);
            });
    });

});
