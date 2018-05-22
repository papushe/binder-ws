let fs = require('fs'),
    moment = require('./node_modules/moment/moment'),
    winston = require('winston'),
    { createLogger, format, transports } = winston,
    DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss',
    logDir = 'logs',
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
                    formatMessage(),
                    format.simple()
                )
            })
        ]
    });
}

exports.getLogger = () => {
    initLogger();
    return logger;
};

exports.getUnixTime = (dateStr) => {
    let localDateWithOffset = new Date(dateStr);
    return localDateWithOffset.getTime() - (localDateWithOffset.getTimezoneOffset() * 60 * 1000);
};

exports.unixToLocal = (epoch) => {
   return moment.utc(epoch).local().format(DATE_FORMAT);
};

exports.unixToUTC = (epoch) => {
   return moment.utc(epoch).format(DATE_FORMAT);
};


exports.now = () => {
    return moment().format(DATE_FORMAT);
};

exports.isAfter = (date) => {
    let nowBefore2Min = (new Date().getTime()) - (2 * 60 * 1000);
    return moment(nowBefore2Min).isAfter(date);
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

exports.currentDateTimeInUTC = () => {
    return moment.utc().format(DATE_FORMAT);
};

exports.UTCTimeToLocalDateTime = (date) => {
    let stillUtc = moment.utc(date).toDate();
    return moment(stillUtc).local().format(DATE_FORMAT);
};

