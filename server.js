//Express
var express = require('express');
var app = express();
var port = 3000;

//SaltedMD5
const saltedMd5 = require('salted-md5');
var salt = "RtzJjONNx71foxafBfSK9s1XKztZji"

//LowDB
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ users: [], resets: [] })
  .write()

app.set('view engine', 'ejs');
app.get('/', function(req, res){
	res.render('index',{
		errorText: ""
	});
});

app.get('/login', function(req, res){
	var username = req.query.username;
	var password = req.query.password;
	var hash = saltedMd5(password, salt);

	var result = db.get('users')
	  .find({ username: username, password: hash})
	  .value()

	if(result !== undefined){
		res.render("success");
	}else{
		res.render("failure",{
			username: username
		});
	}
});

app.get('/signup', function(req, res){
	var username = req.query.username;
	var password = req.query.password;
	var hash = saltedMd5(password, salt);

	var result = db.get('users')
	  .find({ username: username })
	  .value()

	if(result !== undefined){
		var error = "Username is already taken"
		res.render('index',{
			errorText: error
		});
	}else{
		addUser(username, hash, password);
		var success = "Created user: " + username;
		res.render("login", {
			successText: success
		});
	}
});

app.get('/reset', function(req, res){
	var username = req.query.username;
	var resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	console.log(resetToken)
	var result = db.get('resets')
	  .find({ username: username })
	  .value()

	if(result !== undefined){
		db.get('resets')
		  .find({ username: username })
		  .assign({ key: resetToken })
		  .write()
	}else{
		db.get('resets')
	  	  .push({ username: username, key: resetToken})
	      .write();
	}

	//TODO: Send email with resetToken to email
	var email = username + "@usc.edu"


	res.render("reset",{
		username: username,
		errorText: "",
	});
});

app.get('/updatePassword', function(req, res){
	var username = req.query.username;
	var resetToken = req.query.resetToken;
	var password = req.query.password;

	var result = db.get('resets')
	  .find({ username: username, key: resetToken })
	  .value()

	console.log(result)

	if(result === undefined){
		var error = "The provided reset token is invalid"
		res.render('reset',{
			errorText: error,
			username: username
		});
	}else{
		db.get('users')
		  .find({ username: username })
		  .assign({ password: password })
		  .write()

		db.get('resets')
		  .remove({ username: username, key: resetToken })
		  .write()
		res.render('login', {
			successText: username
		});
	}
});

app.listen(port, () => console.log(`Listening on port ${port}`));

function addUser(name, hash, password) {
	db.get('users')
	  .push({ username: name, password: hash})
	  .write();
}