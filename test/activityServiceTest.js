let mongoose = require("mongoose");
let Activity = require('../models/Activity');
let testUtils = require('./testUtils');
let utils = require('../utils');

let chai = require('chai');
let chaiHttp = require('chai-http');
let server = require('../index');
let should = chai.should();

chai.use(chaiHttp);

describe(`Activity Service Tests`, () => {

    //before ALL tests do that.
    before((done) => {
        done();
    });

    // can be replaced by:


    //before EACH 'it' test do that.
    beforeEach((done) => {
        done();
    });


    //after ALL tests do that - usually clean test data
    after((done) => {
       done()
    });

    // can be replaced by:


    //after EACH 'it' test do that.
    afterEach((done) => {
        done();
    });


    it(`it should test API something1`, (done) => {
        done();
    });

    it(`it should test API something2`, (done) => {
        done();
    });

    it(`it should test API something3`, (done) => {
        done();
    });
});
