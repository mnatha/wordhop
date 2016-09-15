# [Wordhop](https://wordhop.io) - Conversational Analytics and Real-time Alerts For Bots

Wordhop provides real-time insights for chatbots and helps companies improve communications through messaging.  
With this developer toolkit you can monitor most bots built on Node.js, but with examples for those building bots on Messenger and Slack.
The user experience is entirely through Slack.

IMPORTANT --> TO USE THIS NODE APP YOU WILL NEED:
* A Slack Account: [Slack](https://api.slack.com)
* The Wordhop Bot [Wordhop on Slack](https://developer.wordhop.io)
* An API Key which you obtain from the Wordhop Bot once you add Wordhop to Slack.

The information provided below is for reference purposes only.  The Wordhop bot will share these code snippets with you and walk you through the setup ;)

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
var wordhop = require('wordhop')(WORDHOP_API_KEY,WORDHOP_BOT_KEY,{platform:'messenger'})
```


### 1.1 For a Messenger app built with Botkit

Add these two lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send); 
```

Find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhopbot.logUnkownIntent(message);
```

Here is an example implementation using Botkit:

```javascript
// reply to a direct mention 
wordhopbot.controller.on('message_received',function(bot,message) { 
    // reply to _message_ by using the _bot_ object 
    wordhopbot.logUnkownIntent(message); 
}); 
     
// reply to a direct message 
wordhopbot.controller.on('message_delivered',function(bot,message) { 
    wordhopbot.logUnkownIntent(message); 
});
```

Go back to Slack and wait for insights to be delivered. That's it!

### 1.2 For a Messenger app NOT built with Botkit


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
     wordhop.hopOut(response.body); 
});
```

Now find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(messageObject);
```

Go back to Slack and wait for inishgts to be delivered. That's it!

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

Add these two lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send); 
```

Now find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops! I didn't get that"). Within that block of code, include the following line of code to capture these conversational "Dead-ends"

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

Go back to Slack and wait for inishgts to be delivered. That's it!

=======================
That's all for now. Questions?  Feedback?  
* [Email Support](mailto://support.wordhop.io)


