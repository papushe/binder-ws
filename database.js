const consts   = require('./config').MLAB_KEY,
    mongoose = require('mongoose');


mongoose.Promise = global.Promise;
//The server option auto_reconnect is defaulted to true
var options = {
    server: {
        auto_reconnect:true,
        useMongoClient: false
    }
};
mongoose.connect(consts, options);
const conn = mongoose.connection;//get default connection
// Event handlers for Mongoose
conn.on('error', function (err) {
    console.log('Mongoose: Error: ' + err);
});
conn.on('open', function() {
    console.log('Mongoose: Connection established');
});
conn.on('disconnected', function() {
    console.log('Mongoose: Connection stopped, recconect');
    mongoose.connect(consts, options);
});
conn.on('reconnected', function () {
    console.info('Mongoose reconnected!');
});