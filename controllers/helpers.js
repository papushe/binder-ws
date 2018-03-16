getRandomString = (length) => {
    length = 10;
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
fixTime = (minutes, second) => {
    if (second < 10 && second >= 0) {
        second = '0' + second;
    }
    if (minutes < 10 && minutes >= 0) {
        minutes = '0' + minutes;
    }
    return minutes + ':' + second;
};
fixDate = (date) => {

    if (date < 10 && date >= 0) {
        date = '0' + date;
    }
    return date;
};

exports.createNewDate = () => {
    let date = new Date(),
        dateTime = fixDate(date.getDate()),
        monthIndex = fixDate(date.getMonth()),
        year = date.getFullYear(),
        fullDate = year + '-' + monthIndex + '-' + dateTime,
        hour = date.getHours(),
        minutes = date.getMinutes(),
        second = date.getSeconds();
    return fullDate + ', ' + hour + ':' + fixTime(minutes, second);
};