//Express
var express = require('express');
var app = express();
var port = 80;
app.set('view engine', 'ejs');

//SaltedMD5
const saltedMd5 = require('salted-md5');
var salt = "RtzJjONNx71foxafBfSK9s1XKztZji"

//LowDB
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const adapter = new FileSync('db.json')
const db = low(adapter)
db.defaults({ users: [], resets: [], hiddenPasswords: [] })
  .write()

//Load the default page
app.get('/', function(req, res){
	decryptPasswords();
	res.render('index',{
		errorText: ""
	});
});

app.get('/login', function(req, res){
	//Get the username and password from the form
	var username = req.query.username;
	var password = req.query.password;
	var hash = saltedMd5(password, salt);

	//Search the DB for the user
	var result = db.get('users')
	  .find({ username: username, password: hash})
	  .value()

	//Direct the user to the correct page
	if(result !== undefined){
		res.render("success");
	}else{
		res.render("failure",{
			username: username
		});
	}
});

app.get('/signup', function(req, res){
	//Get the username and password from the form
	var username = req.query.username;
	var password = req.query.password;
	var hash = saltedMd5(password, salt);

	//Search the DB for the username to see if the user already exists
	var result = db.get('users')
	  .find({ username: username })
	  .value()

	//Direct the user to the correct page
	if(result !== undefined){
		var error = "Username is already taken"
		res.render('index',{
			errorText: error
		});
	}else{
		//Add the user to the database
		addUser(username, hash);
		addEncrpytedPassword(password);
		var success = "Created user: " + username;
		res.render("login", {
			username: username,
			successText: success
		});
	}
});

app.get('/reset', function(req, res){
	//Get the username and generate a random resetToken
	var username = req.query.username;
	var resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
	var result = db.get('resets')
	  .find({ username: username })
	  .value()

	//Add the reset token to the database
	if(result !== undefined){
		resetToken = result.key;
	}else{
		db.get('resets')
	  	  .push({ username: username, key: resetToken})
	      	  .write();
	}
	console.log(resetToken);
	//Send email to the user
	var email = username + "@usc.edu"
	sendResetEmail(email, username, resetToken);

	//Render the page
	res.render("reset",{
		username: username,
		errorText: "",
		token: "",
	});
});

app.get('/updatePassword', function(req, res){
	//Get the username, resetToken, and password from the form
	var username = req.query.username;
	var resetToken = req.query.token;
	var password = req.query.password;
	var hash = saltedMd5(password, salt);

	//Search the resets db for the username and ensure the resetToken matches
	var result = db.get('resets')
	  .find({ username: username })
	  .value()

	var dbToken = undefined
	if(result !== undefined){
		dbToken = result.key
	}

	//Check to see if the resetToken matches
	if(result === undefined || dbToken !== resetToken){
		var error = "The provided reset token is invalid"
		res.render('reset',{
			errorText: error,
			username: username,
			token: "",
		});
	}else{
		//Update the password and remove the reset token from the DB
		var success = "Updated password for " + username;
		db.get('users')
		  .find({ username: username })
		  .assign({ password: hash })
		  .write()

		db.get('resets')
		  .remove({ username: username, key: resetToken })
		  .write()
		res.render('login', {
			username: username,
			successText: success
		});
	}
});

//Listen on port 3000
app.listen(port, () => console.log(`Listening on port ${port}`));

//Add a new user to the database
function addUser(name, hash) {
	db.get('users')
	  .push({ username: name, password: hash})
	  .write();
}

function addEncrpytedPassword(password){
	//TODO: Finish the below line
	var encryptedPass = "";//encrpyt(password);

	db.get('hiddenPasswords')
	  .push({ password: encryptedPass })
	  .write();
}

function decryptPasswords(){
	var passwords = db.get('hiddenPasswords')
	  .map('password')
	  .value()

	passwords.forEach(function(password) {
		var decryptPass = "";//decrypt(password);
		console.log(decryptPass)
	});
}

//TODO: Encrpyt the password
function encrypt(password){

}

//TODO: Decrypt the password
function decrypt(password){

}

//TODO: Send email to email, with the username and resetToken in the body
function sendResetEmail(email, username, resetToken){
        const { exec } = require('child_process');
	var cmd = 'echo "Your username: '+ username +'\nReset Token: '+ resetToken +'\nPlease follow the link to reset your password: http://54.219.178.221/reset" | mail -s "Password Reset Email" ' + email;
	exec(cmd, (err, stdout, stderr) => {
        if (err) {
                // node couldn't execute the command
                return;
        }

         // the *entire* stdout and stderr (buffered)
         console.log(`stdout: ${stdout}`);
         console.log(`stderr: ${stderr}`);
        });
}
