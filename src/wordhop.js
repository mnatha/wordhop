'use strict';

var rp = require('request-promise');
var io = require('socket.io-client');

function WordhopBot(apiKey, serverRoot, socketServer, controller, clientkey, token, debug) {
    var that = Object;
    var socket = io.connect(socketServer);
    that.apiKey = apiKey;
    that.serverRoot = serverRoot;
    that.controller = controller;
    that.debug = debug;
    that.clientkey = clientkey;
    that.token = token;
    that.events = {};

    that.emit = function(event, message) {
        socket.emit(event, message);
    }

    that.checkIfMessage = function(message) {
        
        if ((message.type === 'message' || message.type == null || message.page) 
            && message.channel 
            && message.user != 'USLACKBOT' 
            && message.transcript == null 
            && (message.subtype == null || message.subtype === "file_share")
            && message.reply_to == null 
            && message.is_echo == null) {
            return true;
        };
        return false;
    }

    that.structureMessage = function(message, cb) {

        
        if (that.checkIfMessage(message)) {
            message.client_key = that.clientkey;
            if (message.timestamp == null && message.ts == null) {
                message.timestamp = Date.now();
            }
            if (message.timestamp) {
                message.timestamp = message.timestamp / 1000;
            }
            cb(message);
        };
    }

    that.logUnkownIntent = function(message) {

        console.log("logUnkownIntent");

        that.structureMessage(message, function(res) {
            var data = {
                method: 'POST',
                url: that.serverRoot + '/track',
                headers: {
                    'content-type': 'application/json',
                    'apikey': that.apiKey,
                    'platform': that.platform,
                    'clientkey': that.clientkey,
                    'failure': true,
                    'type':'unknown'
                },

                json: {
                    message: res
                }
            };
            rp(data);

        });
    }


    that.hopIn = function(message, cb) {

        var track = function(msg) {

            if (that.checkIfMessage(message)) {

                console.log("hopIn");
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
                        message: msg
                    }
                };

                rp(data);
            }
            
        }

                
        that.checkForPaused(message, function(obj) { 

           
           if (obj) {
                message.paused = obj.paused;
                message.user_profile = obj.user_profile;
            }
            track(message);
            if (cb) {
                cb(message);
            }    
        });

    }

    that.hopOut = function(message) {


        that.structureMessage(message, function(res) {
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
                    message: res
                }
            };

            setTimeout(function() {
                rp(data);
            }, 500);

        });
    }

    that.trigger = function(event, data) {
         if (debug) {
            console.log('handler:', event);
        }
        if (that.events[event]) {
            for (var e = 0; e < that.events[event].length; e++) {
                console.log(data);

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


    that.checkForPaused = function(message, cb) {

        if (that.checkIfMessage(message)) {
            
            var headers = {
                            'content-type': 'application/json',
                            'apikey': that.apiKey,
                            'type': 'paused_check'
                        };

            if (that.token != "") {
                headers.token = that.token;
            }
        
            var data = {
                method: 'POST',
                url: that.serverRoot + '/is_channel_paused',
                headers: headers,
                json: message

            };


            rp(data).then(function (obj) {
                cb(obj);
            })
            .catch(function (err) {
                cb(null);
            });
        } else {
            cb(null);
        }
    }


    that.getSocketId = function () {
        return that.socketId;
    }

    that.setSocketId = function(socketId) {
        console.log("set socket : " + socketId);
        that.socketId = socketId;
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
        that.trigger(event, [msg]);
    });

  

    socket.on('chat response', function (msg) {
        var event = 'chat response';
        var message = {text:msg.text};
        if (msg.attachments) {
            message.attachments = msg.attachments;
        }
        that.trigger(event, [msg.sourceChannel.toUpperCase(), message, msg.team]);

    });

    socket.on('chat message', function (msg) {
        var event = 'chat message';
        that.trigger(event, [msg]);

    });

    socket.on('bot message', function (msg) {
        var event = 'bot message';
        that.trigger(event, [msg]);

    });

    socket.on('engage users', function (msg) {
        var event = 'engage users';
        that.trigger(event, [msg]);
    });

    socket.on('inactive channels message', function (msg) {
        var event = 'inactive channels message';
        that.trigger(event, [msg]);
    });


    return that;
}


function WordhopBotFacebook(wordhopbot, apiKey, serverRoot, controller, debug) {

    var that = this;
    wordhopbot.platform = 'facebook';

    if (wordhopbot.controller) {
        wordhopbot.controller.on('message_received', function(bot, message) {
            wordhopbot.logUnkownIntent(message);
        });
    }

    that.hopIn = function(obj, cb) {

        var callback = function(message) {
            if (message.type == null) {
                message.type = "message";
            }
            wordhopbot.hopIn(message, cb);
        }
        
        if (obj.entry) {
            for (var e = 0; e < obj.entry.length; e++) {
                for (var m = 0; m < obj.entry[e].messaging.length; m++) {
                    var facebook_message = obj.entry[e].messaging[m];
                    if (facebook_message.message) {
                        var message = {
                            text: facebook_message.message.text,
                            user: facebook_message.sender.id,
                            channel: facebook_message.sender.id,
                            timestamp: facebook_message.timestamp,
                            seq: facebook_message.message.seq,
                            mid: facebook_message.message.mid,
                            sticker_id: facebook_message.message.sticker_id,
                            attachments: facebook_message.message.attachments,
                            quick_reply: facebook_message.message.quick_reply
                        };
                        callback(message);
                    }
                }
            }
        } else {
            callback(obj);
        }


    };


    that.hopOut = function(obj) {

        var message = obj;
        if (obj.message && obj.recipient) {

            message = {
                text: facebook_message.message.text,
                user: facebook_message.recipient.id,
                channel: facebook_message.recipient.id
            };
        }

        wordhopbot.hopOut(message);

    }

    // botkit middleware endpoints
    that.send = function(bot, message, next) {
        that.hopOut(message);
        next();   
    };

    that.receive = function(bot, message, next) {
        that.hopIn(message, function(msg) {
            next();
        });
            
    };

}

function WordhopBotSlack(wordhopbot, apiKey, serverRoot, controller, debug) {
    var that = this;

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

            that.hopIn(message, function(msg) {
                next();
            });
        };
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

    that.hopIn = wordhopbot.hopIn;
    that.hopOut = wordhopbot.hopOut;
    

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
    var wordhopbot = WordhopBot(apiKey, serverRoot, socketServer, controller, clientkey, token, debug); 
    var wordhopObj;
    
    if (platform == 'slack') {
        wordhopObj = new WordhopBotSlack(wordhopbot, apiKey, serverRoot, controller, debug);
    } else if (platform == 'facebook') {
        wordhopObj = new WordhopBotFacebook(wordhopbot, apiKey, serverRoot, controller, debug);
    } else {
        throw new Error('platform not supported. please set it to be either "slack" or "facebook".');
    }

    wordhopObj.logUnkownIntent = wordhopbot.logUnkownIntent;
    wordhopObj.on = wordhopbot.on;
    wordhopObj.emit = wordhopbot.emit;
    wordhopObj.getSocketId = wordhopbot.getSocketId;
    wordhopObj.checkForPaused = wordhopbot.checkForPaused;
    return wordhopObj;
};