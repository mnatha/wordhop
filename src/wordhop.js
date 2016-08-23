'use strict';

var rp = require('request-promise');
var io = require('socket.io-client');




function WordhopBot(apiKey, serverRoot, controller, clientkey, debug) {
    var that = Object;
    that.apiKey = apiKey;
    that.serverRoot = serverRoot;
    that.controller = controller;
    that.debug = debug;
    that.clientkey = clientkey;



    that.logUnkownIntent = function(message) {



        var data = {
            method: 'POST',
            url: that.serverRoot + '/track',
            headers: {
                'content-type': 'application/json',
                'apikey': that.apiKey,
                'failure': true,
                'platform': that.platform,
                'clientkey': that.clientkey
            },

            json: {
                message: message
            }
        };




        rp(data);
    }


    that.hopIn = function(message) {


        if (message.type === 'reconnect_url' || message.type === 'presence_change') {
            // ignore this type.
            return;
        }


        if (message.timestamp == null && message.ts == null) {
            message.timestamp = Date.now();
        }

        if (message.timestamp) {
            message.timestamp = message.timestamp / 1000;
        }


        var data = {
            method: 'POST',
            url: that.serverRoot + '/track',
            headers: {
                'content-type': 'application/json',
                'apikey': that.apiKey,
                'platform': that.platform,
                'clientkey': that.clientkey
            },

            json: {
                message: message
            }
        };


        rp(data);
    }

    that.hopOut = function(message) {



        if (message.type === 'reconnect_url' || message.type === 'presence_change') {
            // ignore this type.
            return;
        }


        if (message.timestamp == null && message.ts == null) {
            message.timestamp = Date.now();
        }

        if (message.timestamp) {
            message.timestamp = message.timestamp / 1000;
        }


        var data = {
            method: 'POST',
            url: that.serverRoot + '/track',
            headers: {
                'content-type': 'application/json',
                'apikey': that.apiKey,
                'platform': that.platform,
                'clientkey': that.clientkey
            },


            json: {
                message: message
            }
        };


        rp(data);
    }



    return that;
}


function WordhopBotFacebook(wordhopbot, apiKey, serverRoot, controller, debug) {

    var that = this;
    wordhopbot.platform = 'facebook';



    if (wordhopbot.controller) {
        wordhopbot.controller.on('message_received', function(bot, message) {
            wordhopbot.logUnkownIntent(message);
        });

        wordhopbot.controller.on('message_delivered', function(bot, message) {

        });


    }



    that.hopOut = function(bot, team, message) {
        return wordhopbot.hopOut(message);
    };

    that.hopIn = function(bot, team, message) {
        return wordhopbot.hopIn(message);
    };


    // botkit middleware endpoints
    that.send = function(bot, message, next) {


        if (message.user == null) {
            message.user = bot.config.verify_token;
        }



        wordhopbot.hopOut(message);
        next();
    };

    that.receive = function(bot, message, next) {
        wordhopbot.hopIn(message);
        next();
    };
}

function WordhopBotSlack(wordhopbot, apiKey, serverRoot, controller, debug) {
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

    that.hopOut = function(bot, message, team) {
        message.id = messageId;
        messageId++;

        return wordhopbot.hopOut(message);
    };



    // botkit middleware endpoints
    that.send = function(bot, message, next) {
        message.id = messageId;
        messageId++;
        if (message.user == null) {
            message.user = bot.identity.id;
        }
        wordhopbot.hopOut(message);
        next();
    };

    // botkit middleware endpoints
    that.receive = function(bot, message, next) {

        message.id = messageId;
        messageId++;
        wordhopbot.hopIn(message);
        next();
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
    var debug = false;
    var controller;
    var platform = 'slack';
    if (config) {
        debug = config.debug;
        serverRoot = config.serverRoot || serverRoot;
        controller = config.controller;
        platform = config.platform || platform;
    }
    var wordhopbot = WordhopBot(apiKey, serverRoot, controller, clientkey, debug);
    var socket = io.connect("https://wordhop-socket-server.herokuapp.com");



    if (platform == 'slack') {
        return new WordhopBotSlack(wordhopbot, apiKey, serverRoot, controller, debug);
    } else if (platform == 'facebook') {
        return new WordhopBotFacebook(wordhopbot, apiKey, serverRoot, controller, debug);
    } else {
        throw new Error('platform not supported. please set it to be either "slack" or "facebook".');
    }
};