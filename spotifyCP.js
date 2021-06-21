var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
let ConfigStore = require('configstore');
let packageJson = require('./package.json');
var http = require('http');
var https = require('https');
var fs = require('fs');
const { response } = require('express');
const { config } = require('process');

var privateKey = fs.readFileSync('localhost.key','utf8');
var certificate = fs.readFileSync('localhost.crt','utf8');
var credentials = {key: privateKey, cert: certificate};

let configStore = new ConfigStore(packageJson.nameSP);

var client_id = configStore.get('client_id');
var client_secret = configStore.get('client_secret');
var redirect_uri = configStore.get('redirect_uri');
var td_consumer_key = configStore.get('td_consumer_key');
var td_redirect_uri = configStore.get('td_redirect_uri');
var access_token = configStore.get("access_token");
var refresh_token = configStore.get("refresh_token");
var td_access_token = configStore.get("td_access_token");
var td_refresh_token = configStore.get("td_refresh_token");

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors());

app.get('/login', function(req, res) {

  // your application requests authorization
  var scope = 'user-read-private user-read-email user-read-playback-state user-read-recently-played';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri
    }));
});

app.get('/tdlogin', function(req, res) {

  // your application requests authorization
  res.redirect('https://auth.tdameritrade.com/auth?' +
    querystring.stringify({
      response_type: 'code',
      redirect_uri: td_redirect_uri,
      client_id: td_consumer_key
    }) + '%40AMER.OAUTHAP');
});

app.get('/redirect', function(req, res) {

  // your application requests refresh and access tokens
  var code = req.query.code || null;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code',
      client_id: client_id,
      client_secret: client_secret
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      configStore.set("access_token", body.access_token);
      access_token = body.access_token;
      configStore.set("refresh_token", body.refresh_token);
      refresh_token = body.refresh_token;
      // we can also pass the token to the browser to make requests from there
      res.send('Got New Token');
    } else {
      res.redirect('/#' +
        querystring.stringify({
          error: 'invalid_token'
        }));
    }
  });
});

app.get('/tdredirect', function(req, res) {

  // your application requests refresh and access tokens
  var code = req.query.code || null;
  var dcode = decodeURIComponent(code);
  var authOptions = {
      url: 'https://api.tdameritrade.com/v1/oauth2/token',
      form: {
        code: dcode,
        client_id: td_consumer_key,
        redirect_uri: td_redirect_uri,
        grant_type: 'authorization_code',
        access_type: 'offline'
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        configStore.set("td_access_token", body.access_token);
        td_access_token = body.access_token;
        configStore.set("td_refresh_token", body.refresh_token);
        td_refresh_token = body.refresh_token;
        // we can also pass the token to the browser to make requests from there
        res.send('Got New Token');
      } else {
        res.send('Did Not Get VALID Token');
      }
    });
});

app.get('/quote', function(req,res) {
  var symbol = req.query.symbol;
  if (!td_refresh_token || td_refresh_token == '') {
    res.redirect('/login');
  } else {
    var url = 'https://api.tdameritrade.com/v1/marketdata/' + symbol + '/quotes';
    var options = {
      url: url,
      headers: {'Authorization': 'Bearer ' + td_access_token },
      json: true
    };
    request.get(options, function(error, response, body) {
        if (response.statusCode != 200) {
          res.status(401).send('invalid token');
        } else {
          //console.log(body);
          var properties = body[Object.keys(body)[0]];
          if (properties && properties.description && properties.symbol) {
            var result = {
              description: properties.description,
              symbol: properties.symbol,
              //volume: properties.totalVolume,
              price: ((Number(properties.bidPrice) + Number(properties.askPrice))/2).toFixed(2)
            }
            if (Number(properties.totalVolume) < 0) {
              res.status(400).send('low volume');
            } else {
              res.send(result);
            }
          } else {
            res.status(404).send('Symbol not found');
          }
        }
    });
  }
});

app.get('/currentTrack', function(req,res) {
  if (!access_token || access_token == '') {
    res.redirect('/login');
  } else {
    var options = {
      url: 'https://api.spotify.com/v1/me/player',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {
      if (response.statusCode == 401) {
        res.redirect('/refresh_token');
      } else if(response.statusCode == 204) {
        res.status(response.statusCode).send('No Song currently Playing');
      } else if (response.statusCode == 200) {
          let result = {
            song: body.item.name,
            album: body.item.album.name,
            artist: body.item.artists[0].name,
            url: body.item.external_urls.spotify
          }
          res.send(result);
      } else {
        res.status(response.statusCode).send('Error Getting Current Song');
      }
    });
  }
});

app.get('/lastTrack', function(req,res) {
  if (!access_token || access_token == '') {
    res.redirect('/login');
  } else {
    var options = {
      url: 'https://api.spotify.com/v1/me/player/recently-played?limit=1',
      headers: { 'Authorization': 'Bearer ' + access_token },
      json: true
    };

    // use the access token to access the Spotify Web API
    request.get(options, function(error, response, body) {
      if (response.statusCode == 401) {
        res.redirect('/refresh_token');
      } else if (response.statusCode == 204) {
        res.status(response.statusCode).send('No songs currently playing!');
      } else if (response.statusCode == 200 && body) {
        let result = {
          song: body.items[0].track.name,
          album: body.items[0].track.album.name,
          artist: body.items[0].track.artists[0].name,
          url: body.items[0].track.external_urls.spotify
        }
        res.send(result);
      } else {
        res.status(response.statusCode).send(body);
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  //var refresh_token = req.query.refresh_token;
  if (!access_token || access_token == '') {
    res.redirect('/login');
  } else {
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token,
        client_id: client_id,
        client_secret: client_secret
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        access_token = body.access_token;
        configStore.set("access_token", access_token);
        if (body.refresh_token && body.refresh_token != "") {
          refresh_token = body.refresh_token;
          configStore.set("refresh_token", refresh_token);
        }
        res.send('Token Refreshed.');
        //res.redirect("/currentTrack");
      } else {
        res.status(401).send("Error Refreshing SP Token");
      }
    });
  }
});

app.get('/tdrefresh_token', function(req, res) {

  // requesting access token from refresh token
  //var refresh_token = req.query.refresh_token;
  if (!td_refresh_token || td_refresh_token == '') {
    res.redirect('/tdlogin');
  } else {
    var authOptions = {
      url: 'https://api.tdameritrade.com/v1/oauth2/token',
      form: {
        grant_type: 'refresh_token',
        refresh_token: td_refresh_token,
        access_type: 'offline',
        client_id: td_consumer_key
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        td_access_token = body.access_token;
        configStore.set("td_access_token", access_token);
        if (body.refresh_token && body.refresh_token != "") {
          td_refresh_token = body.refresh_token;
          configStore.set("td_refresh_token", td_refresh_token);
        }
        res.send('TD Token Refreshed.');
        //res.redirect("/currentTrack");
      } else {
        res.status(401).send("Error Refreshing SP Token");
      }
    });
  }
});

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials,app);

httpServer.listen(3000);
httpsServer.listen(3001);

function refreshToken() {
	request('http://localhost:3000/refresh_token',{json: true}, (err, res, body) => {
		if (err) {
			return console.log(err);
		} else {
			if (res.statusCode != 200) {
				open('http://localhost:3000/login');
				console.log("New Spotify Login!")			
			}
		}
		setTimeout(refreshToken, 30*60*1000);
	});
}

function refreshTDToken() {
	request('http://localhost:3000/tdrefresh_token',{json: true}, (err, res, body) => {
		if (err) {
			return console.log(err);
		} else {
			if (res.statusCode != 200) {
				open('https://localhost:3001/tdlogin');
				console.log("New TD Login!")			
			}
		}
		setTimeout(refreshTDToken, 15*60*1000);
	});
}

refreshToken();
refreshTDToken();
