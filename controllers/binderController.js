let TODO = require('../models/todo'),
    USER = require('../models/user');
    // email   = require('emailjs/email');
    cGetAllTodo = 0,
    cLogin = 0,
    cCreateNewToDo = 0,
    cCreateNewUser = 0,
    cDropToDo = 0,
    cChangePassword = 0,
    cErrorHandling = 0,
    cUpdateToD = 0,
    portNumber = '';


const   log4js = require('log4js'),
        logger = log4js.getLogger('logs');
logger.level = 'info';
log4js.configure({
    appenders: { logs: { type: 'file', filename: 'logs.log' } },
    categories: { default: { appenders: ['logs'], level: 'info' } }
});

    exports.errorHandling = (req, res) => {
        cErrorHandling++;
        logger.info(`error 404 - not found (Wrong input or Wrong url, called: ${cErrorHandling}`);
        res.json({"error": "404 - not found (Wrong input or Wrong url)"});
    };

    exports.createNewUser =  (req, res) => {
        let newUser = new USER({
            password: req.body.password,
            userName: req.body.userName,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            date: createNewDate()
        });
        newUser.save(
            (err, data) => {
                if (err) {
                    logger.info(`something went wrong - User was not create properly!: ${err}`);
                    res.json(err);
                }
                res.json(data);
                logger.info(`new User: ${newUser} was been created successfully`);
                cCreateNewUser++;
                logger.info(`The Api: createNewUser called: ${cCreateNewUser}`);
            }
        );
    };
    exports.createNewToDo = (req, res) => {
    let newToDO = new TODO({
        email: req.body.email,
        password: req.body.password,
        date: createNewDate(),
        whatToDo: req.body.whatToDo,
        title: req.body.title
    });
    newToDO.save(
        (err, data) => {
            if (err) {
                logger.info(`something went wrong - toDo was not saved properly!: ${err}`);
                res.json(err);
            }
            res.json(data);
            logger.info(`new toDo: ${newToDO} was been saved successfully`);
            cCreateNewToDo++;
            logger.info(`The Api: createNewToDo called: ${cCreateNewToDo}`);
        }
    );
};
    exports.getAllToDo = (req, res) => {
        TODO.find({email:{$eq:req.body.email}},
            (err, data) => {
                if (err) {
                    logger.info(`query error: ${err}`);
                    res.json(err);
                }
                cGetAllTodo++;
                logger.info(`The Api: getAllTest called: ${cGetAllTodo}`);
                res.json(data);
            })
    };
    exports.changePassword = (req, res) => {
        USER.find({email:{$eq:req.body.email}},
            (err, data) => {
                if (err) {
                    logger.info(`query error: ${err}`);
                    console.log(err);
                    res.json(err);
                    return;
                }
                if(data[0] && data[0].email == req.body.email){
                    if(data[0].password == req.body.oldPassword){
                        data[0].set({password : req.body.newPassword});
                        data[0].save(
                            (err, data) => {
                                if (err) {
                                    logger.info(`something went wrong - new Password was not saved properly!: ${err}`);
                                    res.json(err);
                                }
                                res.json(data);
                                cChangePassword++;
                                logger.info(`The Api: changePassword called: ${cChangePassword}`);
                            }
                        );
                    } else {
                        res.send({ error: 'Wrong Password' })
                    }
                } else {
                    res.send({ error: 'Wrong Email' })
                }
        })
    };

    exports.updateAllToDo = (req, res) => {
        TODO.find({_id:{$eq:req.body._id}},
            (err, data) => {
                if (err) {
                    logger.info(`query error: ${err}`);
                    console.log(err);
                    res.json(err);
                    return;
                }
                data[0].set({  title : req.body.title,
                            whatToDo:req.body.whatToDo,
                            date:createNewDate()});
                data[0].save(
                    (err, data) => {
                        if (err) {
                            logger.info(`something went wrong - updateToDo was not saved properly!: ${err}`);
                            res.json(err);
                        }
                        res.json(data);
                        cUpdateToD++;
                        logger.info(`The Api: updateAllToDo called: ${cUpdateToD}`);
                    }
                );
            })
    };

    exports.getPortNumber = (port) => {
        portNumber = port;

    };
    exports.login = (req, res) => {
        USER.find({email:{$eq:req.body.email}},
            (err, data) => {
            if (err) {
                logger.info(`query error: ${err}`);
                res.json(err);
                return;
            }
            if(data[0] && data[0].email == req.body.email){
                if(data[0].password == req.body.password){
                    cLogin++;
                    logger.info(`The Api: login called: ${cLogin}`);
                    data[0].__v = portNumber;

                    res.json(data);
                } else {
                    logger.info(`The Api: login called: ${cLogin}`);
                    res.send({ error: 'Wrong Password' })
                }
            } else {
                res.send({ error: 'Wrong Email' })
            }
        })
    };
    exports.dropToDo = (req, res) => {
    TODO.find({_id:{$eq:req.body._id}},
        (err, data) => {
            if (err) {
                logger.info(`query error: ${err}`);
                res.json(err);
            }else{
                TODO.remove({_id:{$eq:data[0]._id}},
                    (err,toDo) => {
                        if (err) {
                            logger.info(`query error: ${err}`);
                            res.json(err);
                        }
                        else logger.info(`${toDo} was deleted successfully!`);
                        cDropToDo++;
                        logger.info(`The Api: dropToDo called:${cDropToDo}`);
                        res.json(data);
                });
            }

        })
    };

// exports.sendmail = (req, res)=> {
//
//     let emailServer  = email.server.connect({
//         user:    "papushe",
//         password:"shely61333189188",
//         host:    "smtp.papushe@gmail.com",
//         ssl:     true
//     });
//
// // send the message and get a callback with an error or details of the message that was sent
//     emailServer.send({
//         text:    "You have signed up",
//         from:    "papushe@gmail.com",
//         to:      req.body.email,
//         subject: "Welcome to my app",
//         attachment:
//             [
//                 {data:"<html>i <i>hope</i> this works!</html>", alternative:true},
//                 // {path:"pathtofile.zip", type:"application/zip", name:"renamed.zip"}
//             ]
//     }, function(err, message) {
//         if(err)
//             console.log(err);
//         else
//             res.json({success: true, msg: 'sent'});
//     });
//
// };


    getRandomString = (length) => {
    length = 10;
    let text = "";
    let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for(var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};
    fixTime = (minutes, second) => {
    if(second < 10 && second >= 0){
        second = '0'+second;
    }
    if(minutes < 10 && minutes >= 0){
        minutes = '0'+minutes;
    }
    return minutes+':'+second;
};
    createNewDate =  () => {
    let date = new Date(),
        dataTime = date.getDate(),
        monthIndex = date.getMonth(),
        year = date.getFullYear(),
        fullDate = dataTime +'-' +  monthIndex + '-' + year,
        hour = date.getHours(),
        minutes = date.getMinutes(),
        second = date.getSeconds();
console.log(fullDate + ', '+ hour + ':'+ fixTime(minutes,second));
    return fullDate + ', '+ hour + ':'+ fixTime(minutes,second);
};

//     exports.getRandomTracks = function (req, res) {
//         TRACK.aggregate({ $sample: { size: parseInt(req.params.trackCount) }},
//             (err, tracks) => {
//                 if (err) logger.log('magneto-stream', `query error: ${err}`);
//                 cgetRandomTracks++;
//                 logger.log('magneto-stream', `The Api: getRandomTracks called:${cgetRandomTracks}`);
//                 res.json(tracks);
//             })
//
//     };
