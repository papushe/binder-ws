const consts = require('./config').MLAB_KEY,
    mongoose = require('mongoose'),
    logger = require('./utils').getLogger();


mongoose.Promise = global.Promise;
//The server option auto_reconnect is defaulted to true
let options = {
    server: {
        auto_reconnect: true,
        useMongoClient: false,
        keepAlive: 300000,
        connectTimeoutMS: 60000
    }
};

mongoose.connect(consts, options)
    .then(() => {
        const conn = mongoose.connection;//get default connection
        // Event handlers for Mongoose
        conn.on('error', (err) => {
            logger.error('Mongoose: Error: ' + err);
        });
        conn.on('open', () => {
            logger.info('Mongoose: Connection established');
        });
        conn.on('disconnected', () => {
            logger.info('Mongoose: Connection stopped, reconnect');
            mongoose.connect(consts, options);
        });
        conn.on('reconnected', () => {
            logger.info('Mongoose reconnected!');
        });
    })
    .catch(err => {
        logger.error(`failed to connect DB  - reason:  ${err}`);
    });
