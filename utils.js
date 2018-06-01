let fs = require('fs'),
    moment = require('./node_modules/moment/moment'),
    winston = require('winston'),
    config = require('./config'),
    nodeMailer = require('nodemailer'),
    request = require('request').defaults({encoding: null}),
    {createLogger, format, transports} = winston,
    DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss',
    logDir = 'logs',
    logger;

const formatMessage = format((info, opts) => {
    info.message = `${moment().format(DATE_FORMAT)} - ${info.message}`;
    return info;
});

const transporter = nodeMailer.createTransport({
    service: config.BINDER_MAIL_SERVICE,
    auth: {
        user: config.BINDER_MAIL_USER,
        pass: config.BINDER_MAIL_PASS
    }
});

initLogger = () => {
    // Create the log directory if it does not exist
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir);
    }

    logger = createLogger({
        format: format.combine(
        ),
        transports: [
            new (transports.Console)({
                format: format.combine(
                    format.colorize(),
                    formatMessage(),
                    format.simple()
                )
            }),

            new (transports.File)({
                filename: `${logDir}/logs.log`,
                maxSize: 10000000,
                format: format.combine(
                    formatMessage(),
                    format.simple()
                )
            })
        ]
    });
};

exports.sendEmail = (options) => {
    let opt = {
        from: config.BINDER_MAIL_USER,
        to: options.to,
        subject: options.subject || `Message from Binder team`,
        text: options.body
    };

    transporter.sendMail(opt, (err, info) => {
        if (err) {
            logger.error(`failed to send email to: ${opt.to} due to: ${err}`);
        } else {
            logger.info(`email was sent to user: ${opt.to} with status: ${info.statusCode}`);
        }
    });
};

exports.getLogger = () => {
    initLogger();
    return logger;
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

/**
 * Time conversion
 * */
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


