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
wordhop.logUnkownIntent(message);
```

Here is an example implementation using Botkit:

```javascript
// reply to a direct mention 
wordhop.controller.on('message_received',function(bot,message) { 
    // reply to _message_ by using the _bot_ object 
    wordhop.logUnkownIntent(message); 
}); 
     
// reply to a direct message 
wordhop.controller.on('message_delivered',function(bot,message) { 
    wordhop.logUnkownIntent(message); 
});
```

Wordhop triggers alerts to suggest when a human should take over for your Chatbot. You can also trigger your own custom alerts, such as when a customer explicitly requests live assistance. Create an intent, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(messageObject);
```

Go back to Slack and wait for alerts. That's it!

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
var message = { 
                 recipient: {id: sender}, 
                 message: { 
                     text: 'You are right when you say: ' + text 
                 } 
              }
var data = { 
             url: 'https://graph.facebook.com/v2.6/me/messages', 
             qs: {access_token: process.env.FACEBOOK_PAGE_TOKEN, 
             method: 'POST', 
             json: message
           } 
}; 
request(data, function(error, response, body) { 
     wordhop.hopOut(message); 
});
```

Now find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops I didn't get that!"). Within that block of code, include the following line of code to capture these conversational ‘dead-ends’:

```javascript
wordhop.logUnkownIntent(messageObject);
```

Wordhop triggers alerts to suggest when a human should take over for your Chatbot. You can also trigger your own custom alerts, such as when a customer explicitly requests live assistance. Create an intent, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(messageObject);
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

Add these two lines below where you've previously defined `controller` and `wordhop`:

```javascript
controller.middleware.receive.use(wordhop.receive); 
controller.middleware.send.use(wordhop.send); 
```

Now find where in your code your bot processes incoming messages it does not understand. You may have some outgoing fallback message there (i.e. "Oops! I didn't get that"). Within that block of code, include the following line of code to capture these conversational "Dead-ends"

```javascript
wordhop.logUnkownIntent(message);
```

Here is an example implementation using Botkit for Slack:

```javascript
// reply to a direct mention 
wordhop.controller.on('direct_mention',function(bot,message) { 
    // reply to _message_ by using the _bot_ object 
    wordhop.logUnkownIntent(message); 
}); 
     
// reply to a direct message 
wordhop.controller.on('direct_message',function(bot,message) { 
    wordhop.logUnkownIntent(message); 
});
```

Wordhop triggers alerts to suggest when a human should take over for your Chatbot. You can also trigger your own custom alerts, such as when a customer explicitly requests live assistance. Create an intent, and then include the following line of code where your bot listens for this intent:

```javascript
wordhop.assistanceRequested(message);
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

Go back to Slack and wait for alerts. That's it!

=======================
That's all for now. Questions?  Feedback?  
* [Email Support](mailto://support.wordhop.io)

