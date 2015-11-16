var server = 'dbimporters.info'
	, connected = false //-- data flags -->	
	, challenged = false
	, confirmed = false
	, puzzData = ""
	, cntDown = 10
	, host = ""
	, guest = ""
	, gameRoom = ''
	, completeSent = false
	, _login=function(ns,port){
		login = io.connect(server + ns,{port:port});
		login.on('hello',function(message){if(message.message == 'hello'){connected=true;login.emit('login',{id:id});};});
		login.on('users',function(message){updateUsers(message.users);});
		login.on('challenged',function(message){login.emit("confirm",{confirm:showConfirm(message.from),from:message.from,to:message.to})});
		login.on('confirmed',function(message){if(message.confirm){login.emit("puzzleData",{puzzle:puzzData,id:id,room:gameRoom});countDown();challenged=true;gameRoom = message.room}else{chlngCancelled()};});
		login.on('puzzleData',function(message){puzzData = message.puzzle;});
		login.on('countDown',function(message){cntDown = message.count;showCntDown(message.count);if(message.count===0)loadChlngPuzz();});
		login.on('time',function(message){showOppTime(message.time,message.id);});
		login.on('gamemessage',function(message){showMessage(message.id,message.message)});
		login.on('completed',function(message){oppGameFinished(message.id,message.time);});
		login.on('replay',function(message){replayRequest(message.id);});
	}
	, challenge=function(from,to){login.emit("challenge",{to:to,from:from});host=from;guest=to;getChlngPuzz();}
	, sendCountDown=function(cnt){login.emit("countDown",{id:id,count:cnt,room:gameRoom});}
	, updateUsers=function(users,list){
		$('option', "#userList").remove()
		$("#userList").append( new Option("Select Users", "none"));
		$.each(users,function(val,txt){if(id !== val)$("#userList").append( new Option(txt, val))});
		if(document.getElementById('userList').options.length < 2)$("#userList").empty().append( new Option("No Users", "none"));
	}
	, getChlngPuzz=function(){ajaxReq("php/PuzFunctions2.php","newpuzz");}
	, showConfirm=function(from){confirmed = confirm("Player " + from + " has challenged you!");return confirmed;}
	, sendTime = function(usr,tim){login.emit("time",{room:gameRoom,id:usr,time:tim});}
	, sendComplete = function(usr,tim){if(!completeSent)login.emit("completed",{room:gameRoom,id:usr,time:tim});completeSent=true;}
	, sendMessage = function(usr,message){login.emit("gamemessage",{room:gameRoom,id:usr,message:message});}
	, leaveGame = function(usr){login.emit("leaveRoom",{room:gameRoom,id:usr});}
	, logout=function(){login.disconnect();connected=false}
	, sendReplayRequest = function(){login.emit("replay",{id:id,room:gameRoom});}
;
