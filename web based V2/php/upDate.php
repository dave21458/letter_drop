<?php
include_once "PuzFunctions2.php";
$pnum=$_REQUEST["pnum"];
$att=$_REQUEST["att"];
$comp=$_REQUEST["comp"];
$skill=$_REQUEST["skill"];
$pTime=$_REQUEST["time"];
if(!$att)exit;
$db=opendb();
$qu="select * from quote where number = $pnum";
$requ=$db->query($qu);
$res=$requ->fetch_array(MYSQLI_ASSOC);
$requ->close();
$att=$res['attempts']+1;
if($comp)$comp=$res['completed']+1;
$level= ARRAY("easy","med","hard","vhard");
$aTime= $level[$skill]."_avg_time";
$bTime= $level[$skill]."_best_time";
$ptimeArr=explode(":",$pTime);
$ptotSec=($ptimeArr[0]*3600)+($ptimeArr[1]*60)+$ptimeArr[2];
$btimeArr=explode(":",$res[$bTime]);
$btotSec=($btimeArr[0]*3600)+($btimeArr[1]*60)+$btimeArr[2];
//echo "$pTime:$ptotSec:{$res[$bTime]}***";
$atimeArr=explode(":",$res[$aTime]);
$atotSec=($atimeArr[0]*3600)+($atimeArr[1]*60)+$atimeArr[2];
if($ptotSec < $btotSec || $btotSec == 0) $btotSec = $ptotSec;
if($atotSec==0)
{
	$atotSec=$ptotSec;
}else{
	$atotSec= ($atotSec + $ptotSec)/2;
}
$h=floor($atotSec/3600);
$m=floor(($atotSec-($h*3600))/60);
$avg=$h.":".$m.":".strval($atotSec-(($h*3600)+($m*60)));
//echo "$h:$m:$atotSec***";
$h=floor($btotSec/3600);
$m=floor(($btotSec-($h*3600))/60);
$best="$h:$m:".strval($btotSec-(($h*3600)+($m*60)));
if($comp)
{
	$qu="UPDATE quote SET attempts = '$att', completed = '$comp', $aTime = '$avg' , $bTime = '$best' ";
}else{
	$qu="UPDATE quote SET attempts = '$att' ";
}
$qu.="where number = $pnum";
//error_log($qu);
$db->query($qu);
$db->close();
?>