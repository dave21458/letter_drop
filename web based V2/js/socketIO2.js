
var socket = require('socket.io').listen(3030)// must have '+ 1' or throws error
, server = require('http').createServer()
, clients = {}
, usrs = socket.of('/usrs')
, playing = socket.of('/playing')
, users={}
, players={}
, gameRoom = 0
, player = []
;
socket.set('log level', 1);
usrs.on('connection', function(cli){	
	
	cli.emit('hello',{message:"hello"});
	
	cli.on('hello', function(message){if(message["message"] == "hello")cli.emit('hello',{message:'hello'});});
	//send all users  user list and add new user to client object
	cli.on("login",function(user){
		clients[user.id]=cli;
		cli["userName"] = user.id;
		//console.log(cli.userName);
		sendUsers();
	});
	//user chalenges other user
	cli.on('challenge', function(message){
		clients[message.to].emit("challenged",{from:message.from,to:message.to});
	});
	cli.on('confirm', function(message){
		clients[message.from].emit("confirmed",{confirm:message.confirm,room:"room"+gameRoom,from:message.from,to:message.to});
		if(message.confirm){
			players["room" + gameRoom]={host:message.from,guest:message.to};
			player.push(message.from,message.to);
			clients[message.from].join("room" + gameRoom);
			clients[message.to].join("room" + gameRoom);
			//console.log(cli.manager.rooms)
			gameRoom++;
		}
	});
	cli.on('puzzleData', function(message){cli.broadcast.to(message.room).emit('puzzleData',{puzzle:message.puzzle,id:message.id});});
	cli.on('countDown', function(message) {cli.broadcast.in(message.room).emit('countDown',{count:message.count});clients[message.id].emit('countDown',{count:message.count});});
	cli.on('time',function(message) {cli.broadcast.to(message.room).emit('time',{id:message.id,time:message.time});});
	cli.on('completed',function(message){cli.broadcast.to(message.room).emit('completed',{id:message.id,time:message.time});});
	cli.on('leaveRoom',function(message){cli.leave("/" + message.room);cli.broadcast.to(message.room).emit('leftGame',{id:message.id});});
	cli.on('gamemessage',function(message){cli.broadcast.to(message.room).emit('gamemessage',{id:message.id,message:message.message});});
	cli.on('replay',function(message){cli.broadcast.to(message.room).emit('confirmed',{id:message.id,room:message.room});});
	//remove user on disconnect
	cli.on("disconnect",function(){
		for(usr in clients){
			if(cli.id == clients[usr].id){
				delete clients[usr];
				//console.log(cli.manager.roomClients[cli.id]);
				//console.log(cli.userName);
				player.slice(player.indexOf(usr),1);
			}
			sendUsers();
		}
	});
	
});

playing.on('connection', function(cli){	
	//cli.emit('challenge',{message:"hello"});
	//cli.on('challange', function(message){console.log("challenged "+ message.user)});
});

function sendUsers()
{
	users={};
	for(usr in clients)users[usr]=usr;
	for(usr in clients)clients[usr].emit("users",{users:users});
}


		
		
		
		