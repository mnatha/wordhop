# [Wordhop](https://wordhop.io) - An AI-powered analyst for chatbot developers

Wordhop is an AI-powered analyst for chatbot developers. It monitors chatbots across messaging platforms, alerts chatbot developers when it finds problems, and shares insight to help developers make better data-driven decisions. With Wordhop, analytics become objects of a conversation and data becomes more actionable.

IMPORTANT --> TO USE THIS NODE APP YOU WILL NEED:
* A Slack Account: [Slack](https://api.slack.com)
* The Wordhop Slack Bot [Wordhop on Slack](https://wordhop.io)
* An API Key which you obtain from the Wordhop Bot on Slack. 

When you add Wordhop to your Slack team, the Wordhop Bot will give you both your API key and bot-specific keys and show and tell you how to connect your bots to Wordhop.  The information provided below is for reference purposes only.  Currently Wordhop supports chatbot developers building Node.js apps for:

* [Facebook Messenger](https://developers.facebook.com)
* [Slack](https://api.slack.com)

Building bots for another messaging platform?  Join our Slack Community to find out when we expand support for other platforms:

* [Wordhop HQ on Slack](https://hq.wordhop.io)

## Connect a Facebook Messenger app to Wordhop

Add the free Wordhop Slack app from [https://wordhop.io](https://wordhop.io) and `Add a Bot`.  Provide a name for your bot and `Add a Platform`.  Pick Messenger as your platform. Then, open your terminal window and enter this:

```bash
npm install --save wordhop
```

Wordhop will automatically generate two keys for you and securely (via Slack auth) give you those keys in the conversation. The first key is a Wordhop API key, and the second key is a bot-specific key.  Create an instance of a Wordhp object near the top of your code and include both keys:  

```javascript
var wordhop = require('wordhop')(WORDHOP_API_KEY,WORDHOP_BOT_KEY,{platform:'messenger'})
```

### For a Messenger app built with Botkit

Add these two lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send); 
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there. Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhopbot.logUnkownIntent(addTeamInfo(bot, message));
```

Here is an example implementation using Botkit:

```javascript
// reply to a direct mention 
wordhopbot.controller.on('message_received',function(bot,message) { 
    // reply to _message_ by using the _bot_ object 
    wordhopbot.logUnkownIntent(bot, message); 
}); 
     
// reply to a direct message 
wordhopbot.controller.on('message_delivered',function(bot,message) { 
    wordhopbot.logUnkownIntent(bot, message); 
});
```

### For a Messenger app NOT built with Botkit


When Messenger calls your Webhook, you'll need to save the message object, then log that with Wordhop. Here is an example:

```javascript
app.post('/facebook/receive/', function(req, res) {
    //save messageObject
    const messageObject = req.body; 
    // Let Wordhop know when a message comes through 
    wordhop.hopIn(messageObject);
 ...
```

Each time you send a message, make sure to log both the request and the response. Here is an example:
```javascript
var data = { 
     url: 'https://graph.facebook.com/v2.6/me/messages', 
     qs: {access_token: process.env.FACEBOOK_PAGE_TOKEN, 
     method: 'POST', 
     json: { 
         recipient: {id: sender}, 
         message: { 
             text: 'You are right when you say: ' + text 
         } 
     } 
}; 
request(data, function(error, response, body) { 
     wordhop.hopOut(data, response.body); 
});
```

Now find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there. Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(messageObject);
```

## Connect a Slack app to Wordhop

Add the free Wordhop Slack app from [https://wordhop.io](https://wordhop.io) and  `Add a Bot`.  Provide a name for your bot and  `Add a Platform`.  Pick Slack as your platform. Then, open your terminal window and enter this:

```bash
npm install --save wordhop
```

Wordhop will automatically generate two keys for you and securely (via Slack auth) provide you those keys in the conversation. The first key is a Wordhop API key, and the second key is a bot-specific key.  Create an instance of a Wordhp object near the top of your code and include both keys:  

```javascript
var wordhop = require('wordhop')('WORDHOP_API_KEY,WORDHOP_BOT_KEY',{platform:'slack'});
```


### For a Slack app built with Botkit

Add these two lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send); 
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there. Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhopbot.logUnkownIntent(message);
```

Here is an example implementation using Botkit for Slack:

```javascript
// reply to a direct mention 
wordhopbot.controller.on('direct_mention',function(bot,message) { 
    // reply to _message_ by using the _bot_ object 
    wordhopbot.logUnkownIntent(message); 
}); 
     
// reply to a direct message 
wordhopbot.controller.on('direct_message',function(bot,message) { 
    wordhopbot.logUnkownIntent(message); 
});
```

### For a Slack app not built with Botkit

When a message comes through on the websocket, save the message object and pass it to Wordhop. Here's an example:

```javascript
connection.on('message', function(message) { 
     const messageObject = JSON.parse(message.utf8Data); 
     // Let Wordhop know when a message comes through 
     wordhop.hopIn(messageObject);
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
 
connection.sendUTF(JSON.stringify(reply));
```

Now find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there. Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(messageObject);
```

=======================
That's all for now. Questions?  Feedback?  Talk with Wordhop Developer Relations, or with other Wordhop users. Join our Public Slack Group:
* [Wordhop HQ on Slack](https://hq.wordhop.io)


