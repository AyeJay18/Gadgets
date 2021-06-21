let tmi = require ('tmi.js');
let request = require('request');
let obs = require('./obs.js');
let ConfigStore = require('configstore');
let packageJson = require('./package.json');
let spotifyCP = require('./spotifyCP.js');
let open = require('open');
const Configstore = require('configstore');

let configStore = new ConfigStore(packageJson.nameCP);
let lastScene;
let gadgetsOn = true;
let mods = configStore.get('SettingsMods');
let config = configStore.get('SettingsConfig');

let client = new tmi.client(config);
client.connect();

client.on('message', (channel, context, message, self) => {
	let touser = message;
	let username = context["username"];
	if (message.toLowerCase() == "!fire" && mods.includes(username)){
		fireNerf(channel,username);
	} else if (gadgetsOn && message.toLowerCase().startsWith("!fire")) {
		let val = configStore.get(username) || 0;
		if (val <= 0) {
			configStore.delete(username);
			client.say(channel, 'Sorry ' + username + ', you dont have any fire tokens SadgeCry Donate $20 or sub with tier 2 or 3 to get some.');
		} else {
			console.log(username + " used a fire token.");
			fireNerf(channel, username);
			client.say(channel, username + ' used one of their fire tokens! pepeDHaw NerfThis pepeDHaw Get your own when you donate $20 or more, or sub with tier 2 or 3!');
			if (val <= 1) {
				configStore.delete(username);
			} else {
				configStore.set(username, val-1);
			}
		}
	} else if (message.toLowerCase() == "!checkfire") {
		let val = configStore.get(username) || 0;
		if (val <= 0) {
			configStore.delete(username);
			client.say(channel, username + ' has no fire tokens available SadgeCry');
		} else {
			client.say(channel, username + ' has ' + val + ' fire tokens available! Use command !fire to use them!');
		}
	} else if (message.toLowerCase().startsWith("!addfire") && mods.includes(username)) {
		let addUserArr = message.toLowerCase().split(" ");
		if (addUserArr.length >= 2) {
			let addUser = addUserArr[1];
			let qty = 1;
			if (addUserArr.length == 3){
				qty = parseInt(addUserArr[2],10);
			}
			addNerfFiresQty(channel,addUser,qty);
		}
	} else if (message.toLowerCase().startsWith("!givefire")) {
		let addUserArr = message.toLowerCase().split(" ");
		if (addUserArr.length == 3) {
			let recvUser = addUserArr[1].toLowerCase();
			let qty = parseInt(addUserArr[2],10);
			let giveval = configStore.get(username.toLowerCase()) || 0;
			let recvval = configStore.get(recvUser) || 0;
			if (!Number.isInteger(qty)) {
				client.say(channel, 'Use command with "!givefire username quantity"')
			} else if (qty > giveval) {
				client.say(channel, 'Sorry ' + username + ', you dont have enough fire tokens to give PepeHands');
			} else if (qty < 0) {
				client.say(channel, "How about you don't do that " + username + " peepoFinger");
			} else {
				if ((giveval-qty) < 1) {
					configStore.delete(username.toLowerCase());
				} else {
					configStore.set(username.toLowerCase(), giveval - qty);
				}
				configStore.set(recvUser, recvval + qty);
				client.say(channel, username + " gave " + qty + " pepeDHaw tokens to " + recvUser + ", ain't they just the best! ppJedi");
			}
		} else {
			client.say(channel, 'Use command with "!givefire username quantity"');
		}
    } else if (message.toLowerCase().startsWith("!clearfire") && mods.includes(username)) {
		let addUserArr = message.split(" ");
		if (addUserArr.length == 2) {
			let addUser = addUserArr[1];
			configStore.delete(addUser);
			client.say(channel,"Cleared Fire Tokens for " + addUser);
		}
    } else if (message.toLowerCase().startsWith("!currentsong") || message.toLowerCase().startsWith("!song")){
		currentTrack(channel);
	} else if (message.toLowerCase().startsWith("!previoussong") || message.toLowerCase().startsWith("!lastsong")){
		lastTrack(channel);
	} else if (message.toLowerCase().startsWith("!price") || message.toLowerCase().startsWith("!q") || message.toLowerCase().startsWith("!p")){
		let msgArr = message.split(" ");
		if (msgArr.length == 2){
			if (msgArr[1].toLowerCase() == 'ayejay18') {
				client.say(channel,"If you have to ask, you cant afford him!");
			} else if (msgArr[1].toLowerCase() == 'purpleton') {
				client.say(channel,"Free to those looking for a fun time, send him a DM!");
			} else if (msgArr[1].toLowerCase() == 'martinirita') {
				client.say(channel,"I'll need about $3.50");
			} else {
				quote(channel,msgArr[1]);
			}
		} else {
			client.say(channel,"Use this command like '!quote symbol'");
		}
	} else if (message.toLowerCase().startsWith("!rev") && mods.includes(username)){
		revNerf();
	} else if (message.toLowerCase() == "!nerfoff" && (context.mod || mods.includes(username))){
		gadgetsOn = false;
		client.say(channel,'Stream Gadgets are off... sadge');
	} else if (message.toLowerCase() == "!nerfon" && (context.mod || mods.includes(username))){
		gadgetsOn = true;
		client.say(channel,'Stream Gadgets are live!');
	} else if (message.toLowerCase() == "!discoball" && mods.includes(username)){
        discoBall();
    } else if (message.toLowerCase() == "!moneygun" && mods.includes(username)){
		moneyGun();
	} else if (username == 'streamelements' && message.includes(" just tipped ")) {
		let amountStr = message.split(/[$€£.]/);
		let amount = parseInt(amountStr[1],10);
		let tipUser = message.split(' ')[0].toLowerCase();
		if (amount >= 20) {
			fireNerf(channel,tipUser);
			let nerfAmt = Math.floor(amount/5) + 1;
			addNerfFiresQty(channel,tipUser,nerfAmt);
		} else if (amount >= 5) {
			fireNerf(channel,tipUser);
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
		fireNerf(channel,user);
		let nerfAmt = Math.floor(bits/500) + 1;
		addNerfFiresQty(channel,user,nerfAmt);
	} else if (bits >= 500) {
		fireNerf(channel,user);
	} else if (bits == 200) {
		moneyGun();
	} else if (bits == 100) {
		revNerf();
	} else if (bits >= 20) {
		discoBall();
	}
});

client.on("submysterygift", (channel, username, numOfSubs, methods, userstate) => {
	if (numOfSubs >= 5) {
		console.log(`${username} sent ${numOfSubs} mystery gift subs`);
		fireNerf(channel, username);
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
		let val = configStore.get(username) || 0;
		configStore.set(username, val+2);
		client.say(channel,username + ' got 2 Nerf Fire Tokens for their Tier 2 sub!  Use command !fire to use them anytime during the stream!');
	} else if (plan == "3000") {
		let val = configStore.get(username) || 0;
		configStore.set(username, val+6);
		client.say(channel,username + ' got 6 free Nerf Fire for their Tier 3 sub!  Use command !fire to use them anytime during the stream!');
	}
}

function addNerfFiresQty(channel, username, amount) {
	if (mods.includes(username)) {return;}
	let val = configStore.get(username) || 0;
	configStore.set(username, amount+val);
	if (channel === undefined) {
		console.log("refunded fire for " + username);
	} else {
		if (amount > 1) {
			client.say(channel,'Added ' + amount + ' Nerf Fire Tokens for ' + username);
		} else {
			client.say(channel,'Added a Nerf Fire Token for ' + username);
		}
	}
}

function fireNerf(channel,username) {
	if (gadgetsOn) {
		console.log("Firing Nerf Gun!");
		if (lastScene != "Be Right Back" && lastScene != "Just Chatting 2") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting 2"});}
		request('http://192.168.0.136/F', { json: true }, (err, res, body) => {
  				if (err) { 
					client.say(channel, "Refunded a Nerf Fire for " + username);
					addNerfFiresQty(undefined,username,1);
					return console.log(err);
				}
		});
	}
}

function revNerf() {
	if (gadgetsOn) {
		console.log("Reving Nerf Gun!");
		if (lastScene != "Be Right Back" && lastScene != "Just Chatting 2") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting 2"});}
		request('http://192.168.0.136/R', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
	}
}

function quote(channel,symbol) {
	request(('http://localhost:3000/quote?symbol=' + symbol),{json: true}, (err, res, body) => {
		if (err) {
			return console.log(err);
		} else {
			if (res.statusCode == 200) {
				if (body && body.symbol) {
					client.say(channel, "Current Price for " + body.symbol + " (" + body.description + ") is: $" + body.price);
				} else {
					console.log(body);
					client.say(channel, "Couldnt get price for symbol or AyeJay18 sucks at coding!");
				}
			} else if (res.statusCode == 404) {
				client.say(channel, "Couldnt find price for " + symbol);
			} else if (res.statusCode == 400) {
				client.say(channel, "Volume for " + symbol + " is too low, we cant discuss such things. :(");
			} else {
				console.log("Error Getting price:  Response Code: " + res.statusCode);
			}
		}
	});
}

function currentTrack(channel) {
	request('http://localhost:3000/currenttrack',{json: true}, (err, res, body) => {
		if (err) {
			return console.log(err);
		} else {
			if (res.statusCode == 200) {
				if (body && body.song) {
					client.say(channel, "Current Song is: " + body.song + " by: " + body.artist + " " + body.url + " catJAM ratJAM dogJAM");
				} else {
					client.say(channel, "No song currently playing or AyeJay18 sucks at coding!");
				}
			} else if (res.statusCode == 204) {
				client.say(channel, "No song currently playing.");
			} else {
				console.log("Error Getting Current Track:  Response Code: " + res.statusCode);
			}
		}
	});
}

function lastTrack(channel) {
	request('http://localhost:3000/lasttrack',{json: true}, (err, res, body) => {
		if (err) {
			return console.log(err);
		} else {
			if (res.statusCode == 200) {
				if (body && body.song) {
					client.say(channel, "Previous Song was: " + body.song + " by: " + body.artist + " " + body.url + " catJAM ratJAM dogJAM");
				} else {
					console.log(body);
					client.say(channel, "No Songs currently playing or AyeJay18 sucks at coding!");
				}
			} else if (res.statusCode == 204) {
				client.say(channel, "Not currently playing any songs.");
			} else {
				console.log("Error Getting Last Track:  Response Code: " + res.statusCode);
			}
		}
	});
}

function moneyGun() {
	if (gadgetsOn) {
		console.log("Making it Rain!");
		if (lastScene != "Be Right Back" && lastScene != "Just Chatting 2") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting 2"});}
		request('http://192.168.0.220/M', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
		if (lastScene != "Be Right Back" && lastScene != "Just Chatting 2") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting 2"});}
		request('http://192.168.0.220/M', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
		if (lastScene != "Be Right Back" && lastScene != "Just Chatting 2") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting 2"});}
		request('http://192.168.0.220/M', { json: true }, (err, res, body) => {
  				if (err) { return console.log(err); }
		});
	}
}

function discoBall() {
	if (gadgetsOn) {
		console.log("Disco Time!");
		if (lastScene != "Be Right Back" && lastScene != "Just Chatting 2") {setTimeout(resetScene, 8000, lastScene); obs.send("SetCurrentScene",{"scene-name": "Just Chatting 2"});}
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

