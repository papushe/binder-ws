let fs = require('fs'),
    moment = require('./node_modules/moment/moment'),
    winston = require('winston'),
    { createLogger, format, transports } = winston,
    DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss',
    logDir = 'logs',
    moduleName = '',
    logger;

const formatMessage = format((info, opts) => {
    info.message = `${moment().format(DATE_FORMAT)} - ${info.message}`;
    return info ;
});

function initLogger () {
    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    logger = createLogger({
        format: format.combine(
        ),
        transports: [
            new (transports.Console) ({
                format: format.combine(
                    format.colorize(),
                    formatMessage(),
                    format.simple()
                )
            }),

            new (transports.File) ({
                filename: `${logDir}/logs.log`,
                format: format.combine(
                    format.colorize(),
                    formatMessage(),
                    format.simple()
                )
            })
        ]
    });
}

exports.now = () => {
    return moment().format(DATE_FORMAT);
};

exports.getRandomString = (length) => {
    length = 10;
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

exports.normalizeDate = (date) => {
    return moment(date).format(DATE_FORMAT);
};

exports.getLogger = () => {
    initLogger();
    return logger;
};

