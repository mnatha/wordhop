# [Wordhop](https://www.wordhop.io) - A Customer Service Toolkit Built For Messaging

Wordhop is an intuitive customer service layer built on Slack with real-time synchronization to Chatbots across platforms. You can easily connect Chatbots you're building to a Slack team so you can scale customer service with bots while delighting your customers with humans.  Tag team with your Chatbot on conversations to improve engagement and monetization and access reports that help you find and fix problems fast in your conversational experience.

IMPORTANT --> YOU WILL NEED:
* A Slack Team: [Slack](http://www.slack.com)
* Wordhop For Slack [Wordhop on Slack](https://slack.com/oauth/authorize?scope=users:read,commands,chat:write:bot,channels:write,bot&client_id=23850726983.39760486257)
* A Chatbot created with Node.js [Build a Chatbot](https://developer.wordhop.io/botbuilders.html)

When you add Wordhop to Slack, the Wordhop Chatbot will give you API keys for these supported Chatbot platforms:
* [Facebook Messenger](https://developers.facebook.com)
* [Slack](https://api.slack.com)
* [Other platform? email us](mailto:support@wordhop.io)

## 1.0 Connect a Facebook Messenger app to Wordhop

Add the free Wordhop Slack app from [https://wordhop.io](https://wordhop.io) and `Add a Bot`.  Provide a name for your bot and `Add a Platform`.  Pick Messenger as your platform. Then, open your terminal window and enter this:

```bash
npm install --save wordhop
```

Create an instance of a Wordhop object near the top of your code as seen below. Wordhop will give you two keys. The first is your API Key and the second is a bot-specific key for each bot you add.

```javascript
var wordhop = require('wordhop')(WORDHOP_API_KEY,WORDHOP_BOT_KEY,{platform:'messenger'});
```


### 1.1 For a Messenger app built with Botkit

Add the following lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send);

// Handle forwarding the messages sent by a human through your bot
wordhop.on('chat response', function (message) {
    bot.say(message);
});
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(message);
```

Wordhop can trigger alerts to suggest when a human should take over for your Chatbot. To enable this, create an intent such as when a customer explicitly requests live assistance, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(message);
```

Wordhop can pause your bot so that it doesn't auto response while a human has taken over. To enable this, add the following line of code before you trigger your bot to respond. 

```javascript
if (message.paused) { return };
```

Here is an example implementation using Botkit:

```javascript

// Botkit for Messenger implementation

if (!process.env.page_token) {
    console.log('Error: Specify page_token in environment');
    process.exit(1);
}

if (!process.env.verify_token) {
    console.log('Error: Specify verify_token in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var commandLineArgs = require('command-line-args');
var localtunnel = require('localtunnel');

const ops = commandLineArgs([
      {name: 'lt', alias: 'l', args: 1, description: 'Use localtunnel.me to make your bot available on the web.',
      type: Boolean, defaultValue: false},
      {name: 'ltsubdomain', alias: 's', args: 1,
      description: 'Custom subdomain for the localtunnel.me URL. This option can only be used together with --lt.',
      type: String, defaultValue: null},
   ]);

if(ops.lt === false && ops.ltsubdomain !== null) {
    console.log("error: --ltsubdomain can only be used together with --lt.");
    process.exit();
}

var controller = Botkit.facebookbot({
    debug: true,
    access_token: process.env.page_token,
    verify_token: process.env.verify_token,
});

var bot = controller.spawn({
});

controller.setupWebserver(process.env.port || 3000, function(err, webserver) {
    controller.createWebhookEndpoints(webserver, bot, function() {
        console.log('ONLINE!');
        if(ops.lt) {
            var tunnel = localtunnel(process.env.port || 3000, {subdomain: ops.ltsubdomain}, function(err, tunnel) {
                if (err) {
                    console.log(err);
                    process.exit();
                }
                console.log("Your bot is available on the web at the following URL: " + tunnel.url + '/facebook/receive');
            });

            tunnel.on('close', function() {
                console.log("Your bot is no longer available on the web at the localtunnnel.me URL.");
                process.exit();
            });
        }
    });
});


// Wordhop related code

var wordhop = require('wordhop')(WORDHOP_API_KEY,WORDHOP_BOT_KEY,{platform:'messenger'});
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send);

// Handle forwarding the messages sent by a human through your bot
wordhop.on('chat response', function (message) {
    bot.say(message);
});

// Listens for an intent whereby a user wants to talk to a human
controller.hears(['help', 'operator', 'human'], 'message_received', function(bot, message) {
    // Forwards request to talk to a human to Wordhop
    wordhop.assistanceRequested(message);
});

// give the bot something to listen for.
controller.hears(['hello', 'hi'], 'message_received', function(bot, message) {
    
    // If your bot is paused, stop it from replying
    if (message.paused) { return };

    bot.reply(message,'Hello yourself.');
});

// Handle receiving a message.
// NOTE: This handler only gets called if there are no matched intents handled by 'controller.hears'
controller.on('message_received',function(bot,message) { 
    
    //check if paused. if it is, do not proceed
    if (message.paused) { return };

    // log an unknown intent with Wordhop
    wordhop.logUnkownIntent(message); 
    bot.reply(message, 'Huh?');
}); 
```

Go back to Slack and wait for alerts. That's it!

### 1.2 For a Messenger app NOT built with Botkit


Add the following lines below where you've previously defined `wordhop`:

```javascript

// Handle forwarding the messages sent by a human through your bot
wordhop.on('chat response', function (message) {
    // program your bot to say the message
    // e.g. bot.say(message);
});
```
When Messenger calls your receiving webhook, you'll need to log the data with Wordhop. Here is an example:

```javascript
app.post('/webhook', function (req, res) {
     var data = req.body; 
     // Let Wordhop know when a message comes in 
     wordhop.hopIn(data, function(message) {
        if (message.paused) { return; }
        // Process incoming message
     });
    ...
```

Each time your bot sends a message, make sure to log that with Wordhop in the request's callback. Here is an example:
```javascript
request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {

    wordhop.hopOut(messageData); 
    ...
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(message);
```

Wordhop can trigger alerts to suggest when a human should take over for your Chatbot. To enable this, create an intent such as when a customer explicitly requests live assistance, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(message);
```

Wordhop can pause your bot so that it doesn't auto response while a human has taken over. To enable this, add the following line of code before you trigger your bot to respond. 

```javascript
if (message.paused) { return };
```

Here's an example implementation based on https://github.com/fbsamples/messenger-platform-samples/tree/master/node
```javascript
app.post('/facebook/receive', function (req, res) {
  var data = req.body;
  // Make sure this is a page subscription
  if (data.object == 'page') {
    // Iterate over each entry
    // There may be multiple if batched
    data.entry.forEach(function(pageEntry) {
      var pageID = pageEntry.id;
      var timeOfEvent = pageEntry.time;

      // Iterate over each messaging event
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.message) {
          wordhop.hopIn(data, function(message) {
            if (message.paused) { return; }
            receivedMessage(messagingEvent);
          });
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know you've 
    // successfully received the callback. Otherwise, the request will time out.
    res.sendStatus(200);
  
  }
});

function receivedMessage(event) {

  var senderID = event.sender.id;
  var message = event.message;
  var messageText = message.text;
  
  if (messageText) {
    if (messageText == "help") {
      sendTextMessage(senderID, "Hold on. I'll forward your message to a real live human.");
      wordhop.assistanceRequested(event);
    } else {
      wordhop.logUnkownIntent(event);
      sendTextMessage(senderID, "Huh?");
    }
  }

}

function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "DEVELOPER_DEFINED_METADATA"
    }
  };

  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {

    wordhop.hopOut(messageData); 
  });  
}

wordhop.on('chat response', function (message) {
    sendTextMessage(message.channel, message.text);
});

```

Go back to Slack and wait for alerts. That's it!

## 2.0 Connect a Slack app to Wordhop

Add the free Wordhop Slack app from [https://wordhop.io](https://wordhop.io) and  `Add a Bot`.  Provide a name for your bot and  `Add a Platform`.  Pick Slack as your platform. Then, open your terminal window and enter this:

```bash
npm install --save wordhop
```

Wordhop will automatically generate two keys for you and securely (via Slack auth) provide you those keys in the conversation. The first key is a Wordhop API key, and the second key is a bot-specific key.  Create an instance of a Wordhp object near the top of your code and include both keys:  

```javascript
var wordhop = require('wordhop')('WORDHOP_API_KEY','WORDHOP_BOT_KEY',{platform:'slack'});
```


### 2.1 For a Slack app built with Botkit


Add the following lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send);

// Handle forwarding the messages sent by a human through your bot
wordhop.on('chat response', function (message) {
    bot.say(message);
});
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(message);
```

Wordhop can trigger alerts to suggest when a human should take over for your Chatbot. To enable this, create an intent such as when a customer explicitly requests live assistance, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(message);
```

Wordhop can pause your bot so that it doesn't auto response while a human has taken over. To enable this, add the following line of code before you trigger your bot to respond. 

```javascript
if (message.paused) { return };
```


Here is an example implementation using Botkit:

```javascript

// Botkit for Slack implementation

if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

var Botkit = require('botkit');
var os = require('os');

var controller = Botkit.slackbot({
    debug: true,
});

var bot = controller.spawn({
    token: process.env.token
}).startRTM();


// Wordhop related code

var wordhop = require('wordhop')(WORDHOP_API_KEY,WORDHOP_BOT_KEY,{platform:'messenger'});
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send);

// Handle forwarding the messages sent by a human through your bot
wordhop.on('chat response', function (message) {
    bot.say(message);
});

// Listens for an intent whereby a user wants to talk to a human
controller.hears(['help', 'operator', 'human'], 'direct_message,direct_mention,mention', function(bot, message) {
    // Forwards request to talk to a human to Wordhop
    wordhop.assistanceRequested(message);
});

// give the bot something to listen for.
controller.hears(['hello', 'hi'], 'direct_message,direct_mention,mention', function(bot, message) {
    // If your bot is paused, stop it from replying
    if (message.paused) { return };
    bot.reply(message,'Hello yourself.');
});

// Handle receiving a message.
// NOTE: This handler only gets called if there are no matched intents handled by 'controller.hears'
controller.on(['direct_mention','direct_message'],function(bot,message) { 
    // log an unknown intent with Wordhop
    wordhop.logUnkownIntent(message); 
    bot.reply(message, 'huh?');
}); 
```

Go back to Slack and wait for alerts. That's it!

### 2.2 For a Slack app not built with Botkit

When a message comes through on the websocket, save the message object and pass it to Wordhop. Here's an example:

```javascript
////Example based on the ws WebSocket implementation.
//See https://www.npmjs.com/package/ws for more information.

this.ws.on('message', function(message) { 
     const messageObject = JSON.parse(message); 

     // Let Wordhop know when a message comes through 
     wordhop.hopIn(messageObject);
     ...
```

When you send a reply on the websocket, tell Wordhop - passing bot, team, and reply. Here's an example:

```javascript
var reply = { 
     type: 'message', 
     text: 'This is an outgoing message', 
     channel: messageObject.channel 
}; 

// Let Wordhop know your response 
wordhop.hopOut(reply); 
...
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(messageObject);
```

Wordhop triggers alerts to suggest when a human should take over for your Chatbot. You can also trigger your own custom alerts, such as when a customer explicitly requests live assistance. Create an intent, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(messageObject);
```

Here's an example:

```javascript
request.post({url:'https://slack.com/api/rtm.start', 
    form: {token:token, no_unreads:'true'}}, function(err,res,body){ 
    
    if(err){
        console.log(err);
    }else{    

        //parse the returned body 
        obj = JSON.parse(body);
            
        //create new websocket to connect to RTM using URL returned from RTM.start 
        ws = new WebSocket(obj.url); 

        var sendMessage = function(message) {
            wordhop.hopOut(message); 
            ws.send(JSON.stringify(message)); 
        }

        //open websocket connection to Slack rtm api - error handling?
        ws.on('open', function() {
            console.log('Websocket opened');    
        });

        wordhop.on('chat response', function (message) { 
            sendMessage(message);
        });

        //listen for activity on Slack 
        ws.on('message', function(message) {

            wordhop.hopIn(JSON.parse(message), function(parsed) {

                //easy tp parse events by type
                if (parsed.type=='message') {
                    if (parsed.paused) {
                        return;
                    }

                    if(parsed.text == 'tick'){
                        console.log('INFO: received "tick"');
                        var reply = { 
                              type: 'message', 
                               text: 'TOCK', 
                             channel: parsed.channel 
                        }; 
                        sendMessage(reply);

                    }else if(parsed.text == 'help'){
                        wordhop.assistanceRequested(parsed);
                    } else{

                        var reply = { 
                              type: 'message', 
                               text: 'Wha?', 
                             channel: parsed.channel 
                        }; 
                        wordhop.logUnkownIntent(parsed);
                        sendMessage(reply);
                        
                    }
                } 
            });
        }); 
    }
});
```

Go back to Slack and wait for alerts. That's it!

=======================
That's all for now. Questions?  Feedback?  
* [Email Support](mailto://support.wordhop.io)

