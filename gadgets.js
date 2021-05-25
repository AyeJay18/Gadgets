let tmi = require ('tmi.js');
let request = require('request');
let obs = require('./obs.js');
let ConfigStore = require('configstore');
let packageJson = require('./package.json');

let configStore = new ConfigStore(packageJson.name);
console.log('Using Config File at: ' + configStore.path);
console.log('Current Free Fires:');
console.log(configStore.all);

let lastScene;
let gadgetsOn = true;
let crazyPrices = 1;

let mods = ['ayejay18','martinirita'];
let config = {
  options: {
	  debug: false,
  },	
  identity: {
    username: 'chatsyncbot',
    password: 'oauth:'
  },
  channels: ['martinirita','martiniritaafterdark']
};''
let client = new tmi.client(config);
client.connect();

client.on('message', (channel, context, message, self) => {
	let touser = message;
	let username = context["username"];
	if (message.toLowerCase() == "!fire" && mods.includes(username)){
		fireNerf();
	} else if (message.toLowerCase().startsWith("!fire")) {
		if (configStore.get(username)) {
			let val = configStore.get(username);
			if (val <= 0) {
				configStore.delete(username);
				client.say(channel, 'Sorry ' + username + ', you dont have any free fire tokens. Donate $20 or more to get 5 of your own, or sub with tier 2 or 3.');
			} else if (val == 1) {
				console.log(username + " used a free fire");
				fireNerf();
				client.say(channel, username + ' used one of his fire tokens!  Get your own when you donate $20 or more, or sub with tier 2 or 3!');
				configStore.delete(username);
			} else {
				console.log(username + " used a free fire");
				fireNerf();
				client.say(channel, username + ' used one of his fire tokens!  Get your own when you donate $20 or more, or sub with tier 2 or 3!');
				configStore.set(username, val-1);
			}
		} else {
			client.say(channel, 'Sorry ' + username + ', you dont have any free fire tokens. Get your own when you donate $20 or more, or sub with tier 2 or 3!');
		}
	} else if (message.toLowerCase() == "!checkfire") {
		if (configStore.get(username)) {
			let val = configStore.get(username);
			if (val <= 0) {
				configStore.delete(username);
				client.say(channel, username + ' has no free fires available :(');
			} else {
				client.say(channel, username + ' has ' + val + ' free fires available! Use command !fire to use them!');
			}
		} else {
			client.say(channel, username + ' has no free fires available :(');
		}
	} else if (message.toLowerCase().startsWith("!addfire") && mods.includes(username)) {
		let addUserArr = message.toLowerCase().split(" ");
		if (addUserArr.length == 2) {
			let addUser = addUserArr[1];
			addNerfFiresQty(channel,addUser,1);
		}
	} else if (message.toLowerCase().startsWith("!rev") && mods.includes(username)){
		revNerf();
	} else if (message.toLowerCase() == "!nerfoff" && (context.mod || mods.includes(username))){
		gadgetsOn = false;
		obsSource("off");
		client.say(channel,'Stream Gadgets are off... sadge');
	} else if (message.toLowerCase() == "!nerfon" && (context.mod || mods.includes(username))){
		gadgetsOn = true;
		if (crazyPrices == 1) {obsSource("calm");} else {obsSource("crazy");}
		client.say(channel,'Stream Gadgets are back on!');
	} else if (message.toLowerCase() == "!nerfcalm" && (context.mod || mods.includes(username))){
		crazyPrices = 1;
		if (gadgetsOn) {obsSource("calm");}
		client.say(channel,'Discount on all Stream Gadgets!');
	} else if (message.toLowerCase() == "!nerfcrazy" && (context.mod || mods.includes(username))){
		crazyPrices = 5;
		if (gadgetsOn) {obsSource("crazy");}
		client.say(channel,'Things are getting wild, gotta pay to play!');
	} else if (message.toLowerCase() == "!discoball" && mods.includes(username)){
        discoBall();
    } else if (message.toLowerCase() == "!moneygun" && mods.includes(username)){
		moneyGun();
	} else if (username == 'streamelements' && message.includes(" just tipped ")) {
		let amountStr = message.split(/[$€£.]/);
		let amount = parseInt(amountStr[1],10);
		let tipUser = message.split(' ')[0];
		if (amount >= 20) {
			fireNerf();
			let nerfAmt = Math.floor(amount/5) + 1;
			addNerfFiresQty(channel,tipUser,nerfAmt);
		} else if (amount >= 5) {
			fireNerf();
		} else if (amount >= 2) {
			moneyGun();
		} else if (amount >= 1) {
			revNerf();
		}
	}
});

client.on('cheer', (channel,userstate,message) => {
	var bits = userstate["bits"];
	var user = userstate["username"];
	console.log(`${user} cheered ${bits} bits`);
	if (bits >= 2000) {
		fireNerf();
		let nerfAmt = Math.floor(bits/500) + 1;
		addNerfFiresQty(channel,user,nerfAmt);
	} else if (bits >= 500*crazyPrices) {
		fireNerf();
	} else if (bits == 200*crazyPrices) {
		moneyGun();
	} else if (bits == 100*crazyPrices) {
		revNerf();
	} else if (bits >= 20*crazyPrices) {
		discoBall();
	}
});

client.on("submysterygift", (channel, username, numOfSubs, methods, userstate) => {
	if (numOfSubs >= 5) {
		console.log(`${username} sent ${numOfSubs} mystery gift subs`);
		fireNerf();
	}
});

client.on("subscription", (channel, username, methods, message, userstate) => {
	let plan = methods.plan;
	if (plan == "2000" || plan == "3000") {
		addNerfFires(channel, username.toLowerCase(), plan);
	}
});

client.on("resub", (channel, username, months, message, userstate,methods) => {
	let plan = methods.plan;
	if (plan == "2000" || plan == "3000") {
		addNerfFires(channel, username.toLowerCase(), plan);
	}
});

function addNerfFires(channel, username, plan) {
	console.log('Tier 2/3 Sub: Plan: ' + plan);
	if (plan == "2000") {
		let val = configStore.get(username);
		if (val) {
			configStore.set(username, val+2);
			client.say(channel,username + ' got 2 free Nerf Fires for their Tier 2 sub!  Use command !fire to use them anytime during the stream!');
		} else {
			configStore.set(username, 2);
			client.say(channel,username + ' got 2 free Nerf Fires for their Tier 2 sub!  Use command !fire to use them anytime during the stream!');
		}
	} else if (plan == "3000") {
		let val = configStore.get(username);
		if (val) {
			configStore.set(username, val+6);
			client.say(channel,username + ' got 6 free Nerf Fire for their Tier 3 sub!  Use command !fire to use them anytime during the stream!');
		} else {
			configStore.set(username, 6);
			client.say(channel,username + ' got 6 free Nerf Fire for their Tier 3 sub!  Use command !fire to use them anytime during the stream!');
		}
	}
}

function addNerfFiresQty(channel, username, amount) {
	let val = configStore.get(username);
	if (val) {
		configStore.set(username, val+amount);
	} else {
		configStore.set(username, amount);
	}
	if (amount > 1) {
		client.say(channel,'Added ' + amount + ' Free Nerf Fires for ' + username);
	} else {
		client.say(channel,'Added a Free Nerf Fire for ' + username);
	}
}

function fireNerf() {
	if (gadgetsOn) {
		console.log("Firing Nerf Gun!");
		if (lastScene != "Be Right Back " && lastScene != "Just Chatting") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting"});}
		request('http://192.168.0.136/F', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
	}
}

function revNerf() {
	if (gadgetsOn) {
		console.log("Reving Nerf Gun!");
		if (lastScene != "Be Right Back " && lastScene != "Just Chatting") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting"});}
		request('http://192.168.0.136/R', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
	}
}

function moneyGun() {
	if (gadgetsOn) {
		console.log("Making it Rain!");
		if (lastScene != "Be Right Back " && lastScene != "Just Chatting") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting"});}
		request('http://192.168.0.220/M', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
	}
}

function discoBall() {
	if (gadgetsOn) {
		console.log("Disco Time!");
		if (lastScene != "Be Right Back " && lastScene != "Just Chatting") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting"});}
		request('http://192.168.0.220/D', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
	}
}

function resetScene(scene) {
	obs.send("SetCurrentScene",{"scene-name": scene});
}

function obsSource(mode) {
	if (mode == "calm") {
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfOff", "render": false});
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfCrazy", "render": false});
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfCalm", "render": true});
	} else if (mode == "crazy") {
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfOff", "render": false});
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfCrazy", "render": true});
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfCalm", "render": false});
	} else {
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfOff", "render": true});
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfCrazy", "render": false});
		obs.send("SetSceneItemRender",{"scene-name": "Alerts","source": "NerfCalm", "render": false});
	}
}

obs.on("message", (data) => {
	if (data["update-type"] == "SwitchScenes") {
	  lastScene = data["scene-name"];
	}
	if (data["message-id"] == "GetCurrentScene") {
	  lastScene = data["name"];
	}
});