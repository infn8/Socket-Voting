var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var allMessages = [];
var votes = [];
var allVotes = [];
var clients = [];
var voteDuration = 60 * 1000; // milliseconds until a vote fades away
var score;
var adminPass = "llcisgoodforme"; // i know this is super shitty.  we'll make it a DB hashed thing later.
var admins = [];

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

app.get('/', function(req, res){
	res.sendfile('index.html');
});
app.get('/client.js', function(req, res){
	res.sendfile('vote-client.js');
});
io.on('connection', function(socket){
	console.log("socket.id");
	console.log(socket.id);
	clients.push(socket.id);
	io.sockets.connected[socket.id].emit('client-login', {connected:true});

	socket.on('vote', function(vote){
		/*
			vote obect will contain:
			{
				qty: either 1 or -1
			}
		*/
		var now = new Date().getTime();
		vote.timestamp = now;
		vote.socketID = socket.id;
		votes[socket.id] = vote;
		allVotes.push(vote);
		io.emit('score-update', updateScore());
	});
	socket.on('admin-login', function(login){
		console.log("admin-login");
		console.log(socket.id);
		if(login == adminPass){
			admins.push(socket.id);
			var where = clients.indexOf(socket.id);
			clients.splice(where, 1);
			console.log(io.sockets.connected);
			io.sockets.connected[socket.id].emit('admin-login', {admin:true});
		} else {
			io.sockets.connected[socket.id].emit('admin-login', {admin:false});
		}
		console.log('clients');
		console.log(clients);
		console.log('admins');
		console.log(admins);
	});
	socket.on('admin-hashchange', function(newHash){
		console.log('hashchange request');
		if(admins.indexOf(socket.id) >= 0){
			console.log('admin hashchange request');
			io.emit('client-hashchange', newHash);
		}
	});
});

http.listen(3000, function(){
	console.log('listening on *:3000');
});

function updateScore(){
	var sum = 0;
	var plusCount = 0;
	var minusCount = 0;
	var weight, vote;
	for (var i in votes) {
		vote = votes[i];
		weight = weightVote(vote);
		if(weight == 0){
			// votes.splice(i, 1);
			delete votes[i];
			console.log("removed vote: ", vote);
		} else {
			sum += (vote.qty * weight);
			if(vote.qty > 0){
				plusCount++;
			}
			if(vote.qty < 0){
				minusCount++;
			}
		}
	}
	var voteLength = Object.size(votes);
	var newScore = voteLength == 0 ? 0 : sum / voteLength;
	console.log("Updated Score: " + newScore);
	return {
		score:newScore,
		plusCount:plusCount,
		minusCount:minusCount
	};
}
function weightVote(vote){
	var now = new Date().getTime();
	var then = vote.timestamp;
	var elapsed = now - then; // how many milliseconds since vote
	/*    
		Should weight vote on linear scale  so that the vote weight is between 0 and 1
			if elapsed >= voteDuration then weighted = 0
			if elapsed == 0 then weighted = 1
	*/
	decay = elapsed / voteDuration;
	weightedVote = 1 - decay
	weightedVote = weightedVote <= 0 ? 0 : weightedVote;
	console.log('voteDuration: ', voteDuration, ' now: ', now, ' then: ', then, ' elapsed: ', elapsed, ' decay: ', decay, ' weightedVote: ', weightedVote);
	return weightedVote;
}
setInterval(function(){
	newScore = updateScore();
	console.log(newScore);
	io.emit('score-update', newScore);
}, 1000);
/*
	## plan

	* Have a websockets connection
	* recieve events for:
		* slide-change
		* vote
	* maintain array of votes
	* votes have a time limit and they get less potent over time
	*/




