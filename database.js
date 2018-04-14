const consts   = require('./config').MLAB_KEY,
    mongoose = require('mongoose');


mongoose.Promise = global.Promise;
//The server option auto_reconnect is defaulted to true
let options = {
    server: {
        auto_reconnect:true,
        useMongoClient: false,
        keepAlive: 300000,
        connectTimeoutMS: 60000
    }
};

mongoose.connect(consts, options).then(() => {
    const conn = mongoose.connection;//get default connection
    // Event handlers for Mongoose
    conn.on('error', (err) => {
        console.error('Mongoose: Error: ' + err);
    });
    conn.on('open', () => {
        console.log('Mongoose: Connection established');
    });
    conn.on('disconnected', () => {
        console.log('Mongoose: Connection stopped, recconect');
        mongoose.connect(consts, options);
    });
    conn.on('reconnected', () => {
        console.info('Mongoose reconnected!');
    });
}, (err) => {
    console.error(`failed to connect DB  - reason:  ${err}`);
});
