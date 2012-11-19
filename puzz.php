<?php
$bxht=40;
$bxwd=40;
$posLeft=50;
$posTop=120;
include "/var/www/games/php/PuzFunctions2.php";

?>
<html>
<head>
<script src="/js/socket.io.js"></script>
<script src="/js/puzz2.js"></script>
<script src="/js/ajax2.js"></script>

<script src="/js/game.io.js"></script>
<script src="./js/jquery-1.8.2.js"></script>
<script src="./js/jquery.cookie.js"></script>
<script src="./js/jquery-ui-1.9.0.custom.js"></script>
<link rel="stylesheet" href="./css/jquery-ui-1.9.0.custom.css" />

<style type="text/css">
.btmBox
{
margin:3px;
text-align:center;
font-size:<?php echo $bxht - 10; ?>px;
font-weight:bold;
color:black;
width:<?php echo $bxwd; ?>px;
height:<?php echo $bxht; ?>px;
position:absolute;
border-color:BLACK;
border-style:solid;
border-width:thin;
}
.topBox
{
margin:3px;
text-align:center;
font-size:<?php echo $bxht - 5; ?>px;
font-weight:bold;
color:black;
width:<?php echo $bxwd; ?>px;
height:<?php echo $bxht; ?>px;
position:absolute;
border-color:BLACK;
border-style:solid;
border-width:thin;
}
.puzNum
{
text-align:center;
font-size:20;
font-weight:bold;
color:black;
position:absolute;
top:<?php echo $posTop - 64; ?>;
left:<?php echo $posLeft; ?>;
border-color:BLACK;
border-style:none;
border-width:thin;
}
.inp
{
text-align:center;
font-size:20;
font-weight:bold;
color:black;
position:absolute;
top:<?php echo $posTop - 123; ?>;
left:<?php echo $posLeft + 20; ?>;
border-style:none;
}
table
{
table-layout:fixed;
border-collapse: collapse;
}
.info
{
font-size:16;
font-weight:bold;
color:black;
position:absolute;
top:5px;
left:550px;

}

.infochlng
{
font-size:16;
font-weight:bold;
color:black;
position:absolute;
top:15px;
left:550px;
visbility:hidden;
}

.time
{
font-size:20;
font-weight:bold;
color:black;


}
qu.
{
font-size:20;
font-weight:bold;
color:black;
position:absolute;
top:1000px;
left:500px;

}

.loginLabel
{
color:red;
font-size:12;
}

.chlng
{
	position:absolute;
	left : 395;
	top : 45;
	
}

.userList
{
	position:absolute;
	left : 397;
	top : 9;
}

.countDown
{
	font-size:40;
	font-weight:bold;
	color:black;
}

.cnt
{
font-size:50;
}

.messagebox
{
	font-size:16;
	color:black;
	position:absolute;
	top:<?php echo $posTop - 85; ?>;
	left:<?php echo $posLeft + 130; ?>;
}
.messsageArea
{
	font-size:12;
	color:black;
}
</style>
</head>
<body onload="first()">
<div id="login" title="Log In" class="dialog">
	<input type='text' id='loginID'/>
	<input type='button' id='newidButt' value='New Id' onclick='newID()'/>
	<input type='button' id='loginButt' value='Log In' onclick='log_in()'/>
</div>

<form>
<input type="button" id =  "newButt" value="New Puzzle" onClick='skillLevel(0)'/>
<input type="button" id="mistakeButt" value="Remove Mistakes" onClick="hiMistake()"/>
<input type="button" value="Pause" onClick="pause()" id="pauseButt"/>
<select onChange="skillLevel(0)" id="skill">
	<option id="esy" value=1 >EASY</option>
	<option id="mdm" value=2 Selected>Meduim</option>
	<option id="hrd" value=3>Hard</option>
	<option id="vhd" value=4>VERY Hard</option>
</select>
</br>
<i href="" onclick='showLogin()' class='loginLabel' id='loginlab'>login</i>
<input class = "chlng" type="button" id =  "chlngButt" value="Challenge" onClick='chlngClick()'/>
<select onChange="chlngRequ(this)" id="userList" class = "userList">
<option value= 'none' >No Users</option>
</select>
<div class="puzNum">Puzzle #
<input type='text' id='pNum' size='2' class= 'inp' />
</div>
</form>
<br/>
<div id="qu" class="qu">
</div>
<div id='messbox' class = 'messagebox'>
	<textarea id = 'messages' class = 'messsageArea' rows = '5' cols = '40' readonly = 'readonly'></textarea>
</div>
<div id="puzzData">
<?php
mkPuzz(0,"","");
?>
</div>
<div id='gameOver' class='dialog'></div>
</body></html>