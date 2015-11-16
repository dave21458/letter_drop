<?php
$xmlFile="./db/users.xml";
$type=$_REQUEST['type'];
$id=$_REQUEST['id'];
$userXml="";
if($type=="" && $id > "")user();
if(function_exists( $type))$type();

function user()
{
	global $id,$userXml,$xmlFile;
	$userXml = loadUsers();
	if(!$userXml->xpath($id))$userXml->addChild($id,$id);
	$usr=$userXml->$id;
	if($usr->xpath("logged")===false)$usr->addChild("logged",0);
	$usr->logged = 1;
	$userXml->asXML($xmlFile);
	echo "loggedin";
}

function logout()
{
	global $id,$userXml,$xmlFile;
	$userXml=loadUsers();
	$userXml->$id->logged = 0;
	$userXml->asXML($xmlFile);
	echo "loggedout";
}

function loadUsers()
{
	global $id,$userXml,$xmlFile;
	if(!file_exists($xmlFile))mkXMLfile();
	return simplexml_load_file($xmlFile);
}

function mkXMLfile()
{
	global $id,$userXml,$xmlFile;
	$xml="<users>\n</users>";
	$userXml=new SimpleXMLElement($xml);
	$userXml->asXML($xmlFile);
}

function puzzComp()
{
	global $id,$userXml,$xmlFile;
	$userXml=loadUsers();
	$pnum="p".$_REQUEST["pnum"];
	$att=$_REQUEST["att"];
	$comp=$_REQUEST["comp"];
	$skill=$_REQUEST["skill"];
	$best = "best".$skill;
	$pTime=$_REQUEST["time"];
	if(!$att)exit;
	if(!isset($userXml->$id ))exit;
	$usr=$userXml->$id;
	if(!isset($usr->$pnum))
	{
		$puzz=$usr->addChild($pnum);
		$puzz->addChild("completed",0);
		$puzz->addChild("best0","99:59:59");
		$puzz->addChild("best1","99:59:59");
		$puzz->addChild("best2","99:59:59");
		$puzz->addChild("best3","99:59:59");
		$puzz->addChild("level",0);
		$puzz->addChild("challenged",0);
		$puzz->addChild("won",0);
	}
	$puzz=$usr->$pnum;
	$puzz->completed=$puzz->completed + 1;
	$puzz->level = $skill;
	$oldTime=explode(":",$puzz->$best);
	$newTime = explode(":",$pTime);
	if($oldTime[0] > $newTime[0])$puzz->$best = $pTime;
	if($oldTime[0] == $newTime[0] && $oldTime[1] > $newTime[1])$puzz->$best = $pTime;
	if($oldTime[0] == $newTime[0] && $oldTime[1] == $newTime[1] && $oldTime[2] > $newTime[2])$puzz->$best = $pTime;
	//echo $oldTime[2]."-".$newTime[2];
	$userXml->asXML($xmlFile);
}

function getUserInfo()
{
	global $id,$userXml,$xmlFile;
	$userXml=loadUsers();
	$pnum="p".$_REQUEST["pnum"];
	$skill=$_REQUEST["skill"];
	$best = "best".$skill;
	$xpa = "/users/".$id."/".$pnum;
	$puzz=$userXml->xpath($xpa);
	echo "puzzle";
	if($puzz===false)return;
	echo ",best;".$userXml->$id->$pnum->$best.",completed;".$userXml->$id->$pnum->completed;
}
	
	
	
?>