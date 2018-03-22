let moment = require('./node_modules/moment/moment');

exports.now = () => {
    return moment().format('YYYY-MM-DD HH:mm:ss');
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

