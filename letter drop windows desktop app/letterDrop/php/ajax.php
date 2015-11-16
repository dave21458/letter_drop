<?php
require_once "puzzleDB.php";

if(array_key_exists('type',$_REQUEST))$_REQUEST['type']();

function getQuoteByLevel($quNum,$auth,$cat,$minL,$maxL)
{
	$conn=opendb();
	$res=$conn->querySingle("SELECT count(*) FROM quote");
	$totQu = $res;
	$pLen = 0;
	$num = 0;
	$cnt = 0;
	//if($quNum < 1 || $quNum > $totQu)$num=rand(1,$totQu);
	while(($pLen > $maxL || $pLen < $minL) && $cnt < 1000){
		$num=rand(1,$totQu);
		$pLen = $conn->querySingle("SELECT len FROM quote WHERE _id = $num");
		$cnt++;
	}
	//if($cat=="")$cat="%";
	//if($auth=="")$auth="%";
	$qry="SELECT * FROM quote WHERE _id LIKE '$num'";// AND whom LIKE '$auth' AND category LIKE '$cat' AND len >= $minL AND len <= $maxL";
	$res=$conn->query($qry);
	$qu=$res->fetchArray(SQLITE3_ASSOC);
	$res->finalize();
	$conn->close();
	if(strlen($qu['quote']) == 0)$qu['quote'] =  $qry;
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
	$ret .= "category&{$quArr['category']}^author&{$quArr['whom']}^number&{$quArr['_id']}^quote&{$quArr['quote']}^len&{$quArr['len']}";
	//$ret .= "}";
	echo $ret;
}

function getAuthors()
{
	$auth = "";
	$conn=opendb();
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
	$conn=opendb();
	$qry = "SELECT distinct category FROM quote";
	$res=$conn->query($qry);
	while($a= $res->fetchArray(SQLITE3_ASSOC))$auth .= $a['category'] . ",";
	$res->finalize();
	$conn->close();
	$auth =  substr($auth,0,-1);
	echo $auth;
}

function parseQuote()
{
	if(array_key_exists('file',$_REQUEST)){
		$conn=opendb();
		$cnt = 0;
		$id = $conn->querySingle("Select max(_id) from quote");
		$qf = file_get_contents($_REQUEST['file']);
		$lines = explode("\n",$qf);
		$f = explode("\t",trim($lines[0]));
		for($c = 1;$c < count($lines);$c++){
			
			$lines[$c] = str_replace('"',"",$lines[$c]);
			$lines[$c] = strtoupper(str_replace("'","",$lines[$c]));
			$d = explode("	",trim($lines[$c]));
			if(count($d) == 3){
				$id++;
				$qry = "INSERT INTO quote (_id,quote,whom,category,len) values ($id,'{$d[0]}','{$d[1]}','{$d[2]}',".strlen($d[0])." )";
				$conn->exec($qry);
			}
		}
		$conn->close();
		echo $id;
	}
}
		

?>