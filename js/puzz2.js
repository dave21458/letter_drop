var isAlpha = /[A-Z]/
, movLet=""
, movCol=""
, sec=0
, t
, ct
, timeStart=0
, comp=0
, cnt=0
, paus=0
, skill=1
, mistakes=2
, id=""
, logged = false
, usrAjax = "php/puzzUsers.php"
, userbest =""
, userComp = ""
, skil = ["Easy","Medium","Hard","Very Hard"]
, server = 'dbimporters.info'
, socketPort= 3030
, socketLoginNS = '/usrs'
, socketChallengeNS = '/challenge'
, socketPuzzNS = '/puzz'
, socketMessNS = '/mess'
, challengedPlayer = ''
, chlngPuzz = ''
, chlngPuzzNum = ''
, oppCompTime = 99999
, oppGameComp = false
, oppTime = 0
, gameOverButtons = {buttons:{replay:function(){sendReplayRequest();},Quit:function(){chlngCancelled();}}}
;
Number.prototype.toText = function (format) {
    d = this;
	var h = Math.floor(d / 3600);
	var m = Math.floor(d % 3600 / 60);
	var s = Math.floor(d % 3600 % 60);
	if(format=="trimmed")return ((h > 0 ? h + ":" : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "0:") + (s < 10 ? "0" : "") + s); 
	if(format=="full")return ((h > 0 ? h + ":" : "0:") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + ":" : "00:") + (s < 10 ? "0" : "") + s); 
	if(format=="text")return ((h > 0 ? h + " Hours " : "") + (m > 0 ? (h > 0 && m < 10 ? "0" : "") + m + " Minutes " : "0:") + (s < 10 ? "0" : "") + s + " Seconds"); 
}

function disTime()
{
	if(!paus && !comp)sec=sec+1;
	if(timeStart == 0)gameOn();
	comp==0 ? t=setTimeout("disTime()",1000):clearTimeout(t);
	txt= "Your elapse time is " + sec.toText("trimmed");
	document.getElementById("timeDis").innerHTML=txt;
	if(challenged )
	{
		sendTime(id,sec);
		$("#myTime").text("Your time: " + sec.toText("trimmed"));
		if(sec > oppCompTime && oppGameComp && !comp && !completeSent)loser();
	}
}

function first()
{
skills = ["","esy","mdm","hrd","vhd"];
querystring("skill").length > 0 ? skill=querystring("skill"):skill=2;
document.getElementById(skills[skill]).selected = true;
$("#skill").removeAttr("disabled");
document.getElementById("pNum").value=document.getElementById('quNum').value;
$("#tab2").css({visibility:"hidden"});
$("#tab1").css({visibility:'visible'});
$("#newButt").removeAttr("disabled");
$("#mistakeButt").attr({disabled:"disabled"});
$("#pauseButt").attr({disabled:"disabled"});
$("#chlngButt").css({visibility:"hidden"});
logged ? $("#userList").css({visibility:"visible"}):$("#userList").css({visibility:"hidden"});
$("#messbox").hide();
$( "#login" ).dialog({autoOpen:false,width:450,modal: true},{open:function(e,ui){}});
$("#gameOver").dialog({autoOpen:false,width:450,modal: true}),gameOverButtons;
if($.cookie("id") !== null)ajaxReq(usrAjax);
usrliLeft= $("#skill").width() + $("#skill").offset().left + 10;
usrliTop = $("#skill").offset().top;
$("#userList").css({top:usrliTop,left:usrliLeft});
oppCompTime = 99999;
comp = 0;
oppGameComp = false;
completeSent=false;
}

function querystring(key) {
   var re=new RegExp('(?:\\?|&)'+key+'=(.*?)(?=&|$)','gi');
   var r=[], m;
   while ((m=re.exec(document.location.search)) != null) r.push(m[1]);
   return r;
}

function gameOn()
{
	$("#mistakeButt").removeAttr("disabled");
	$("#loginlab").css({visibility:"hidden"});
	timeStart=1;
	$("#pauseButt").removeAttr("disabled");
}

function moveLet(evnt)
{
	if(!timeStart)disTime();
	el=evnt;
	movLet=el.innerHTML;
	if(el.id.substr(0,3) != "btm")return;
	curRow=Number(el.axis);
	curCol=Number(el.id.substr(el.id.indexOf("-")+1));
	if(curRow > 0)
	{
		topElem=document.getElementById("top"+curRow.toString()+"-"+curCol.toString());
		if(topElem.style.color == "red")topElem.style.color="black";
	}
	curRow=curRow+1;
	if(curRow <= rows)
	{
		topElem=document.getElementById("top"+curRow.toString()+"-"+curCol.toString());
		while(curRow <= rows && topElem.style.color == "red" && isAlpha.test(topElem.innerHTML))
		{
			curRow=curRow + 1
			topElem=document.getElementById("top"+curRow.toString()+"-"+curCol.toString());
		}
		if(curRow <= rows && isAlpha.test(topElem.innerHTML))
		{
			topElem.style.color="red";
			el.innerHTML=topElem.innerHTML;
			el.axis=curRow;
		}else{
		el.innerHTML="_";
		el.axis="0";
		}
	}else{
		el.innerHTML="_";
		el.axis="0";
	}
	isFinished()
}

function isFinished()
{
	for(col=1;col<=cols;col++)
	{
		for(row=1;row<=rows;row++)
		{
			gues=document.getElementById("btm"+row+"-"+col);
			ans=document.getElementById("ans"+row+"-"+col);
			if(ans.innerHTML!=gues.innerHTML && isAlpha.test(ans.innerHTML))return;
		}
	}
	clearTimeout(t);
	if(!challenged)alert("You Have Solved The PUZZLE in "+ sec.toText("text"));
	$("#mistakeButt").attr({disabled:"disabled"});
	$("#pauseButt").attr({disabled:"disabled"});
	$("#loginlab").css({visibility:'visible'});
	comp=1;
	ajaxReq();
	if(logged)ajaxReq(usrAjax,"puzzComp");
	timeStart = 0;
	if(challenged && !completeSent )
	{
		sendComplete(id,sec);
		if(sec < oppTime)winner();
		if(sec == oppCompTime && oppGameComp)tied();
		if(sec > oppCompTime && oppGameComp)loser();
		if(sec > oppTime && !oppGameComp)waitForOpp();
	}
}			

function hiMistake()
{
var col =1
, row=1;

for(col=1;col<=cols;col++)
{
	for(row=1;row<=rows;row++)
	{
		gues=document.getElementById("btm"+row+"-"+col);
		ans=document.getElementById("ans"+row+"-"+col);
		
		if(ans.innerHTML!=gues.innerHTML && isAlpha.test(gues.innerHTML))
		{
			ele=document.getElementById("top"+gues.axis.toString()+"-"+col);
			if(Number(gues.axis)> 0)ele.style.color="black";
			gues.innerHTML="_";
			gues.axis="0";
			cnt=cnt+1;
			//if(cnt > 4)return;
		}
		
	}
}
sec=sec+120;
if(mistakes > skill )
{
	$("#mistakeButt").attr({disabled:"disabled"});
}else{
	mistakes += 1;
}
}

function skillLevel(newQu)
{
timeStart = 0;
sec = 0;
if(timeStart > 0)ajaxReq();
$sklLevel=$("#skill")[0].value;
rel="";
//if(newQu==0) rel="&rel="+Number(document.getElementById("quNum").value);
if(newQu > 0) rel="&rel=" + newQu;
if(timeStart && !comp)ajaxReq();
var newL=("/puzz.php?skill="+ $sklLevel + rel);
window.location.replace(newL);
}


function pause()
{
var $obj=document.getElementsByTagName('table');
if(paus==0)
{
	paus=1;
	vis="hidden";
	$("#pauseButt")[0].value="Continue";
	$("#mistakeButt").attr({disabled:"disabled"});
}else{
	paus=0;
	vis="visible";
	$("#pauseButt")[0].value="Pause";
	$("#mistakeButt").removeAttr("disabled");
}
//alert(paus);
for(tab=0;tab<$obj.length;tab++)
{
	for(rows=0;rows<$obj[tab].rows.length;rows++)
	{
		for(cells=0;cells<$obj[tab].rows[rows].cells.length;cells++)
		{
			$obj[tab].rows[rows].cells[cells].style.visibility=vis;
		}
	}
}

}

function showLogin()
{
	if(!logged)
	{
		$("#login").dialog('open');
		$("#loginID")[0].value=$.cookie("id");
	}
	if(logged)
	{
		if(confirm("log out?"))ajaxReq(usrAjax,"logout");
		logout();
	}
}

function log_in()
{
	if(typeof($.cookie("id"))!== $("#loginID")[0].value)newID();
	$("#login").dialog('close');
	skillLevel(pnum);
}

function newID()
{
	id=$("#loginID")[0].value
	id=id.substr(0,8);
	id=id.toLowerCase();
	$.cookie("id",id,{expires:3653});
}

function getPlayers()
{
	if(!connected && logged)_login(socketLoginNS,socketPort);
}

function chlngRequ(obj)
{
	if(obj.value == "none")
	{
		$("#chlngButt").css({visibility:"hidden"});
		return;
	}
	$("#chlngButt")[0].value = "Challenge " + obj.value;
	$("#chlngButt").css({visibility:"visible"});
	challengedPlayer = obj.value;
}

function chlngClick()
{
	if(connected && logged && challengedPlayer !== "")challenge(id,challengedPlayer);
	$("#chlngButt").css({visibility:"hidden"});
}

function loadChlngPuzz()
{
	if(puzzData.length > 20)
	{
		chlngPuzzNum=puzzData.substr(0,puzzData.indexOf(","));
		chlngPuzz=puzzData.substr(chlngPuzzNum.length + 1);
		$("#pNum")[0].value=chlngPuzzNum;
		$("#puzzData").html(chlngPuzz);
		$("#chlngButt").css({visibility:"hidden"});
		$("#loginlab").css({visibility:"hidden"});
		$("#userList").css({visibility:"hidden"});
		$("#newButt").attr({disabled:"disabled"});
		$("#skill").attr({disabled:"disabled"});
		paus = 0;
		disTime();
		showChlngTab();
		sec = 0;
	}else{
		
	}
}

function countDown()
{
	var x = setTimeout(function(){
		cntDown--;
		if(cntDown < 0){
			clearTimeout(x);
			cntDown=10;
			$("#tab1").css({visibility:"hidden"});
			$("#tab2").css({visibility:'visible'});
			return;
		}
		sendCountDown(cntDown);
		countDown();
	},1000);
}

function showCntDown(cnt)
{
	if(cnt==9)
	{
		chlngPuzzNum=puzzData.substr(0,puzzData.indexOf(","));
		chlngPuzz=puzzData.substr(chlngPuzzNum.length + 1);
		$("#pNum")[0].value=chlngPuzzNum;
		$("#puzzData").html(chlngPuzz);
		challenged = true;
		paus=1;
		pause();
		oppCompTime = 0;
		sec = 0;
	}
	$("#puzzle").html("<div class='countDown' > Game Will Start in <i id='cntdwn' class='cnt'>" + cnt + "</i></div>");
}

function showChlngTab()
{
	var quInfo = $("#tab1").html().split("<br>");
	var html= "<div>" + quInfo[0] + "</div><div id='myTime'></div><div id='oppTime'></div>";
	html += "<input type='button' value='SEND' onclick = 'messageToSend()' /><input type='text' id='msging' maxlength = '38' size = '25'/>";
	$("#tab2").html(html);
	$("#tab1").css({visibility:"hidden"});
	$("#tab2").css({visibility:'visible'});
	$("#messbox").show();
	$("#messsageArea").empty();
}

function showOppTime(tim,usr)
{
	$("#oppTime").text(usr + " time: " + tim.toText("trimmed"));
	$("#opptimer").text(oppTime.toText("trimmed"));
	oppTime=tim;
	if(comp && !oppGameComp && oppTime > sec)winner();
}

function showMessage(usr,mesg)
{
	$("#messages").append("\n" +usr + ": " + mesg);
	$('#messages').scrollTop($('#messages')[0].scrollHeight);
}

function messageToSend()
{
	sendMessage(id,$('#msging')[0].value);
	showMessage(id,$('#msging')[0].value);
	$('#msging')[0].value="";
}

function oppGameFinished(usr,tim)
{
	$("#oppTime").text(usr + " has finished time: " + tim.toText("trimmed"));
	oppCompTime = tim;
	oppGameComp = true;
	if(challenged)
	{
		if(sec < oppCompTime && comp)winner();
		if(sec > oppCompTime)loser();
		if(sec == oppCompTime && comp)tied();
	}
}

function waitForOpp()
{
	$("#gameOver").attr({title:"Waiting on Opponent"
	$("#gameOver").html("You have completed the Puzzle in " + sec.toText("trimmed") + "</br>Currently your opponent has not completed the puzzle and their playing time is still less than yours<br>Please wait to see who will win this round</br> your opponents current time is <i id='opptimer'></i>");
	$("#gameOver").dialog("open");
}

function gameOver()
{
	oppCompTime = 99999;
	oppGameComp = false;
	comp = 1;
	challenged = false;
	confirmed = false
	puzzData = ""
	cntDown = 10
	host = ""
	guest = ""
	gameRoom = ''
	timeStart = 0;
	clearTimeout(t);
	if($("#gameOver").dialog("isOpen"))$("#gameOver").dialog("close");
}

function loser()
{
	gameOver();
	alert("You Lost!");
	first();
	
}

function winner()
{
	gameOver();
	alert("You Won!!!!!");
	first();
}

function tied()
{
	gameOver();
	alert("Amazing You Tied");
	first();
}

function replayRequest(usr)
{
	if($("#gameOver").dialog("isOpen"))$("#gameOver").dialog(close);
	if(confirm(usr + "Wants to play again"));
}

function chlngCancelled()
{
	$("#chlngButt").css({visibility:"hidden"});
	challenged = false;
	$("#tab2").css({visibility:"hidden"});
	$("#tab1").css({visibility:'visible'});
}
function cheat()
{
	for(col=1;col<=cols;col++)
	{
		for(row=1;row<=rows;row++)
		{
			gues=document.getElementById("btm"+row+"-"+col);
			ans=document.getElementById("ans"+row+"-"+col);
			gues.innerHTML=ans.innerHTML;
		}
	}
}