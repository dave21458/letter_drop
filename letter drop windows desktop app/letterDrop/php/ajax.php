<?php
require_once "puzzleDB.php";

if(array_key_exists('type',$_REQUEST))$_REQUEST['type']();

function getQuoteByLevel($quNum,$auth,$cat,$minL,$maxL)
{
	$conn=opendb("");
	$res=$conn->querySingle("SELECT count(*) FROM quote");
	$totQu = $res;
	$pLen = 0;
	$num = 0;
	$cnt = 0;
	if($quNum > 0 && $quNum < $totQu){
		$num = $quNum;
	}else{
		while(($pLen > $maxL || $pLen < $minL) && $cnt < 1000){
			$num=rand(1,$totQu);
			$pLen = $conn->querySingle("SELECT len FROM quote WHERE _id = $num");
			$cnt++;
		}
	}
	//if($cat=="")$cat="%";
	//if($auth=="")$auth="%";
	$qry="SELECT * FROM quote WHERE _id LIKE '$num'";// AND whom LIKE '$auth' AND category LIKE '$cat' AND len >= $minL AND len <= $maxL";
	$res=$conn->query($qry);
	$qu=$res->fetchArray(SQLITE3_ASSOC);
	$res->finalize();
	$conn->close();
	if(strlen($qu['quote']) == 0)$qu['quote'] =  $qry;
	$qu['qry']=$qry;
	return $qu;
}

function getNewQuote()
{
	$ret = "";
	$num = -1;
	if(isset($_REQUEST['qtNum']))$num = $_REQUEST['qtNum'];
	$auth = "";
	if(isset($_REQUEST['auth']))$auth = $_REQUEST['auth'];
	$cat = "";
	if(isset($_REQUEST['cat']))$cat = $_REQUEST['cat'];
	$maxLen = '500';
	if(isset($_REQUEST['maxLen']))$maxLen = $_REQUEST['maxLen'];
	$minLen = '10';
	if(isset($_REQUEST['minLen']))$minLen = $_REQUEST['minLen'];
	$quArr = getQuoteByLevel($num,$auth,$cat,$minLen,$maxLen);
	$ret .= "category&{$quArr['category']}^author&{$quArr['whom']}^number&{$quArr['_id']}^quote&{$quArr['quote']}^len&{$quArr['len']}^best&{$quArr['best']}^qry&{$quArr['qry']}";
	//$ret .= "}";
	echo $ret;
}

function getAuthors()
{
	$auth = "";
	$conn=opendb("");
	$qry = "SELECT distinct whom FROM quote";
	$res=$conn->query($qry);
	while($a= $res->fetchArray(SQLITE3_ASSOC))$auth .= $a['whom'] . ",";
	$res->finalize();
	$conn->close();
	$auth =  substr($auth,0,-1);
	echo $auth;
}

function getCatagories()
{
	$cat = "";
	$conn=opendb("");
	$qry = "SELECT distinct category FROM quote";
	$res=$conn->query($qry);
	while($a= $res->fetchArray(SQLITE3_ASSOC))$auth .= $a['category'] . ",";
	$res->finalize();
	$conn->close();
	$auth =  substr($auth,0,-1);
	echo $auth;
}

function getBest()
{
	$best = 0;
	if(array_key_exists('num',$_REQUEST)){
		$num = $_REQUEST['num'];
		$conn=opendb("");
		if($conn->querySingle("SELECT COUNT(*) FROM quote WHERE _id = $num")){
			$best = $conn->querySingle("SELECT best FROM quote WHERE _id = $num");
		}
		$conn->close();
	}
	echo $best;
}

function setBest()
{
	if(array_key_exists('num',$_REQUEST) && array_key_exists('time',$_REQUEST)){
		$num = $_REQUEST['num'];
		$time = $_REQUEST['time'];
		$conn=opendb("");
		if($conn->querySingle("SELECT COUNT(*) FROM quote WHERE _id = $num")){
			$conn->exec("UPDATE quote SET best = $time WHERE _id = $num");
		}
		$conn->close();
	}
	echo $time;
}


function parseQuote()
{
	if(array_key_exists('file',$_REQUEST)){
		$conn=opendb("");
		$cnt = 0;
		$id = $conn->querySingle("Select max(_id) from quote");
		$qf = file_get_contents($_REQUEST['file']);
		$lines = explode("\n",$qf);
		$f = explode("\t",trim($lines[0]));
		for($c = 1;$c < count($lines);$c++){
			$lines[$c] = str_replace('"',"",$lines[$c]);
			$lines[$c] = strtoupper($lines[$c]);
			$d = explode("	",trim($lines[$c]));
			$d[2] = strtoupper(pathinfo($_REQUEST['file'],PATHINFO_FILENAME));
			if(count($d) > 2 && strlen($d[0]) < 281 && strlen($d[0]) > 19){
				$id++;
				$qry = "INSERT INTO quote (_id,quote,whom,category,len) values ($id,\"{$d[0]}\",\"{$d[1]}\",\"{$d[2]}\",".strlen($d[0])." )";
				$conn->exec($qry);
			}
		}
		$conn->close();
		echo $id;
	}
}

function updateDb()
{
	if(array_key_exists('file',$_REQUEST)){
		$row = 0;
		if(array_key_exists('row',$_REQUEST))$row = $_REQUEST['row'];
		$conn=opendb("");
		$newdb = opendb($_REQUEST['file']);
		$cnt = 0;
		$curRow = 0;
		$max = $newdb->querySingle("SELECT MAX(_id) FROM quote");
		$res = $newdb->query("SELECT * FROM quote WHERE _id > $row order by _id" );
		while($new = $res->fetchArray(SQLITE3_ASSOC)){
			$id = $conn->querySingle("Select * from quote where _id = {$new['_id']}",true);
			if(count($id) == 0){
				$qry = "INSERT INTO quote (_id,quote,whom,category,len) values ({$new['_id']},\"{$new['quote']}\",\"{$new['whom']}\",\"{$new['category']}\",{$new['len']})";
				$conn->exec($qry);
				$cnt++;
			}else{
				$id = $conn->querySingle("Select * from quote where _id = {$new['_id']} AND NOT quote = \"{$new['quote']}\"",true);
				if(count($id) > 0){
					$qry = "UPDATE quote SET quote=\"{$new['quote']}\", whom = \"{$new['whom']}\", category = \"{$new['category']}\",  len = {$new['len']} WHERE _id = {$new['_id']}";
					$conn->exec($qry);
					$cnt++;
					echo $qry ;
				}
			}
			if($cnt > 50)break;
			$curRow = $new['_id'];
		}
		echo " $cnt&&&$max&&&$curRow";
		$conn->close();
		$newdb->close();
		//echo $id;
	}
}	

function updateDbold()
{
	if(array_key_exists('file',$_REQUEST)){
		$conn=opendb("");
		$newdb = opendb($_REQUEST['file']);
		$cnt = 0;
		$id = $conn->querySingle("Select max(_id) from quote");
		$newid = $newdb->querySingle("Select max(_id) from quote");
		if($newid > $id){
			//echo "quotes need updated $id $newid";
			$res = $newdb->query("SELECT _id,quote,whom,category,len FROM quote WHERE _id >= $id");
			while($new = $res->fetchArray(SQLITE3_ASSOC)){
				$qry = "INSERT INTO quote (_id,quote,whom,category,len) values ({$new['_id']},\"{$new['quote']}\",\"{$new['whom']}\",\"{$new['category']}\",{$new['len']})";
				$conn->exec($qry);
				$cnt++;
				if($cnt > 50)break;
				//echo $qry . "\n";
			}
		}
		echo "&&&$cnt&&&$newid&&&$id";
		$conn->close();
		$newdb->close();
		//echo $id;
	}
}		

?>