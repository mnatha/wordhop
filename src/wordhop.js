'use strict';

var rp = require('request-promise');
var io = require('socket.io-client');
var socket;


function WordhopBot(apiKey, serverRoot, controller, clientkey, debug) {
    var that = Object;
    that.apiKey = apiKey;
    that.serverRoot = serverRoot;
    that.controller = controller;
    that.debug = debug;
    that.clientkey = clientkey;



    that.logUnkownIntent = function(message) {

        if (message.subtype == null &&  message.user != 'USLACKBOT') {

             var data = {
                method: 'POST',
                url: that.serverRoot + '/track',
                headers: {
                    'content-type': 'application/json',
                    'apikey': that.apiKey,
                    'failure': true,
                    'platform': that.platform,
                    'clientkey': that.clientkey,
                    'type':'unknown'
                },

                json: {
                    message: message
                }
            };
            rp(data);
        } 
    }


    that.hopIn = function(message) {

        


        if ((message.type === 'message' || message.type == null) && message.channel && message.transcript == null && message.subtype == null && message.user != 'USLACKBOT' && message.reply_to == null) {
                

            console.log("hopIn");


            if (message.timestamp == null && message.ts == null) {
                message.timestamp = Date.now();
            }

            if (message.timestamp) {
                message.timestamp = message.timestamp / 1000;
            }

            
            message.client_key = that.clientkey;

           
            var data = {
                method: 'POST',
                url: that.serverRoot + '/track',
                headers: {
                    'content-type': 'application/json',
                    'apikey': that.apiKey,
                    'platform': that.platform,
                    'clientkey': that.clientkey,
                    'socket_id': that.getSocketId(),
                    'type':'in'
                },

                json: {
                    message: message
                }
            };



            rp(data);
        }
    }

    that.hopOut = function(message) {





        if ((message.type === 'message' || message.type == null) && message.channel && message.transcript == null && message.subtype == null && message.user != 'USLACKBOT') {
                


            if (message.timestamp == null && message.ts == null) {
                message.timestamp = Date.now();
            }

            if (message.timestamp) {
                message.timestamp = message.timestamp / 1000;
            }

            message.client_key = that.clientkey;

            console.log("hopOut");
        



            var data = {
                method: 'POST',
                url: that.serverRoot + '/track',
                headers: {
                    'content-type': 'application/json',
                    'apikey': that.apiKey,
                    'platform': that.platform,
                    'clientkey': that.clientkey,
                    'socket_id': that.getSocketId(),
                    'type':'out'
                },


                json: {
                    message: message
                }
            };

            setTimeout(function() {
                rp(data);
            }, 500);



        }
    }

    that.events = {};


    that.trigger = function(event, data) {
        if (that.events[event]) {
            for (var e = 0; e < that.events[event].length; e++) {
                var res = that.events[event][e].apply(that, data);
                if (res === false) {
                    return;
                }
            }
        } else if (debug) {
            console.log('No handler for', event);
        }
    };



    that.on = function(event, cb) {
        var events = (typeof(event) == 'string') ? event.split(/\,/g) : event;

        for (var e in events) {
            if (!that.events[events[e]]) {
                that.events[events[e]] = [];
            }
            that.events[events[e]].push(cb);
        }
        return that;
    };


    that.emit = function(event, message) {
        socket.emit(event, message);
    }


    socket.on('connect', function (message) {
        
        that.trigger('connect');
    });

    socket.on('message', function (message) {
        that.setSocketId(message);

        var data = {
            method: 'POST',
            url: that.serverRoot + '/update_bot_socket_id',
            headers: {
                'content-type': 'application/json',
                'apikey': that.apiKey,
                'type': 'connect'
            },

            json: {
                'socket_id': message,
                'clientkey': that.clientkey
                
            }

        };

        that.trigger('message');


        rp(data);

    });


    socket.on('failure log', function (msg) {
        var event = 'failure log';
        if (debug) {
            console.log('handler:', event);
        }
        
        that.trigger(event, [msg]);
    });

  

    socket.on('chat response', function (msg) {
        var event = 'chat response';
        
        that.trigger(event, [msg.sourceChannel.toUpperCase(), msg.text, msg.team]);

    });

    socket.on('chat message', function (msg) {
        var event = 'chat message';
       
        that.trigger(event, [msg]);

    });

    socket.on('bot message', function (msg) {
        var event = 'bot message';
        
        that.trigger(event, [msg]);

    });

    that.checkForPaused = function(message, cb) {

        if ((message.type === 'message' || message.type == null) && message.channel && message.transcript == null && message.subtype == null && message.user != 'USLACKBOT') {
        



            var channel_id = message.channel;
            var data = {
                method: 'POST',
                url: that.serverRoot + '/is_channel_paused',
                headers: {
                    'content-type': 'application/json',
                    'apikey': that.apiKey,
                    'type': 'connect'
                },

                json: {
                    'channel_id':channel_id,
                    'clientkey': that.clientkey
                    
                }

            };


            rp(data).then(function (parsedBody) {

                if (parsedBody.channel) {
                    if (parsedBody.channel.paused) {
                        message.paused = true;
                    }
                    cb(null, parsedBody.channel.paused);

                } else {
                    cb(null, false);

                }

                
                // Process html like you would with jQuery... 
            })
            .catch(function (err) {
                
                cb(err, false);
            });
        } else {
            cb(null, false);
        }
    }


    that.getSocketId = function () {
        return that.socketId;
    }

    that.setSocketId = function(socketId) {
        that.socketId = socketId;
    }

    return that;
}


function WordhopBotFacebook(wordhopbot, apiKey, serverRoot, controller, token, debug) {

    var that = this;
    wordhopbot.platform = 'facebook';
   



    if (wordhopbot.controller) {
        wordhopbot.controller.on('message_received', function(bot, message) {
            wordhopbot.logUnkownIntent(message);
        });

        wordhopbot.controller.on('message_delivered', function(bot, message) {

        });


    }



    that.hopOut = function(message) {

       
        return wordhopbot.hopOut(message);
    };

    that.hopIn = function(message) {
        if (message.type == null) {
            message.type = "message";
        }
        return wordhopbot.hopIn(message);
    };

    that.logUnkownIntent = function(message) {
        return wordhopbot.logUnkownIntent(message);
    };

    // botkit middleware endpoints
    that.send = function(bot, message, next) {

        that.hopOut(message);
        next();
        
    };

    that.receive = function(bot, message, next) {

        var callback = function() {
            that.checkForPaused(message, function(error, paused) {
                if (paused) {
                    message.paused = paused;
                }
                that.hopIn(message);

                next();
            });
        }

        if (token != "") {

            var data = {
                method: 'GET',
                url: 'https://graph.facebook.com/v2.7/' + message.user + '?access_token=' + token,
                headers: {
                    'content-type': 'application/json'
                }
            };

            rp(data).then(function (response) {
                message.user_profile = JSON.parse(response);
                callback();
                
            })
            .catch(function (err) {
                callback();

            });

        } else {
            callback();

        }


        
    };

    that.on = function(event, cb) {
        return wordhopbot.on(event, cb);
    }

    that.emit = function(event, message) {
        wordhopbot.emit(event, message);
    }

    that.checkForPaused = function(message, cb) {
        wordhopbot.checkForPaused(message, cb);
    }


    that.getSocketId = wordhopbot.getSocketId;

}

function WordhopBotSlack(wordhopbot, apiKey, serverRoot, controller, token, debug) {
    var that = this;
    var messageId = 0;

    wordhopbot.platform = 'slack';



    that.logConnect = function(message) {

        var data = {
            method: 'POST',
            url: that.serverRoot + '/track',
            headers: {
                'content-type': 'application/json',
                'apikey': wordhopbot.apiKey,
                'type': 'connect',
                'platform': wordhopbot.platform,
                'clientkey': wordhopbot.clientkey
            },

            json: {
                message: message
            }

        };


        rp(data);
    };

    that.logUnkownIntent = function(message) {

        return wordhopbot.logUnkownIntent(message);
    };

    that.hopIn = function(message) {
        message.id = messageId;
        messageId++;

        return wordhopbot.hopIn(message);
    };

    that.hopOut = function(message) {
        message.id = messageId;
        messageId++;

        return wordhopbot.hopOut(message);
    };



    // botkit middleware endpoints
    that.send = function(bot, message, next) {
        if (message.user == null) {
            message.user = bot.identity.id;
        }
        that.hopOut(message);
        next();
    };

    // botkit middleware endpoints
    that.receive = function(bot, message, next) {

        if (message.callback_id != "resume_buttons" && message.callback_id != "pause_buttons") {

            var callback = function() {
                that.checkForPaused(message, function(error, paused) {
                    if (paused) {
                        message.paused = paused;
                    }
                    that.hopIn(message);

                    next();
                });
            }


            if (token != "") {
                var data = {
                    method: 'GET',
                    url: 'https://slack.com/api/users.info?token=' + token + '&user=' + message.user,
                    headers: {
                        'content-type': 'application/json'
                    }
                };

                rp(data).then(function (response) {

                    var obj = JSON.parse(response);

                    if (obj.ok) {
                        message.user_profile = obj.user;
                    }

                    callback();
                    
                })
                .catch(function (err) {
                   
                    callback();

                });

            } else {
                callback();

            }
        }

        

    };


    if (wordhopbot.controller) {

        // reply to a direct mention
        wordhopbot.controller.on('direct_mention', function(bot, message) {

            wordhopbot.logUnkownIntent(message);
        });

        // reply to a direct message
        wordhopbot.controller.on('direct_message', function(bot, message) {

            wordhopbot.logUnkownIntent(message);

        });

    }

    that.on = function(event, cb) {
        return wordhopbot.on(event, cb);
    }

    that.emit = function(event, message) {
        wordhopbot.emit(event, message);
    }

    that.getSocketId = wordhopbot.getSocketId;

    that.checkForPaused = function(message, cb) {
        wordhopbot.checkForPaused(message, cb);
    }


}

module.exports = function(apiKey, clientkey, config) {

    if (!apiKey && !clientkey) {
        throw new Error('YOU MUST SUPPLY AN API_KEY AND A CLIENT_KEY TO WORDHOP!');
    }
    if (!apiKey) {
        throw new Error('YOU MUST SUPPLY AN API_KEY TO WORDHOP!');
    }
    if (!clientkey) {
        throw new Error('YOU MUST SUPPLY A CLIENT_KEY TO WORDHOP');
    }
    var serverRoot = 'https://wordhopapi.herokuapp.com';
    var socketServer = '"https://wordhop-socket-server.herokuapp.com"';
    var debug = false;
    var controller;
    var platform = 'slack';
    var token = '';
    if (config) {
        debug = config.debug;
        serverRoot = config.serverRoot || serverRoot;
        controller = config.controller;
        platform = config.platform || platform;
        socketServer = config.socketServer || socketServer;
        token = config.token || token;
    }
    socket = io.connect(socketServer);
    var wordhopbot = WordhopBot(apiKey, serverRoot, controller, clientkey, debug);




    if (platform == 'slack') {
        return new WordhopBotSlack(wordhopbot, apiKey, serverRoot, controller, token, debug);
    } else if (platform == 'facebook') {
        return new WordhopBotFacebook(wordhopbot, apiKey, serverRoot, controller, token, debug);
    } else {
        throw new Error('platform not supported. please set it to be either "slack" or "facebook".');
    }
};