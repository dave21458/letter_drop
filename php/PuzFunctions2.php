<?php
isset($_REQUEST['type'])?$typ=$_REQUEST['type']:$typ=null;
if($typ == "newpuzz")mkPuzz(0,"","");


function opendb()
{
	$mysqli = new mysqli("localhost", "www-data","freecell", "quotes");

	/* check connection */
	if ($mysqli->connect_error) {
		printf("Connect failed: %s\n", mysqli_connect_error());
		exit();
	}
	return $mysqli;
}

function mkPuzz($puzNum,$auth,$cat)
{ 
	global $typ;
	$bxht=40;
	$bxwd=40;
	$posLeft=50;
	$posTop=120;
	$sklLevel=2;
	$siz[0]=0;
	$times=ARRAY("","easy","med","hard","vhard");
	if(isset($_REQUEST["skill"]))$sklLevel=$_REQUEST["skill"];
	if(isset($_REQUEST["skill"]) && $typ == "newpuzz")$sklLevel=$_REQUEST["skill"] + 1;
	$reload=0;
	if(isset($_REQUEST["rel"]))$reload=$_REQUEST["rel"];
	while($siz[0]==0)
	{
		$qua=getQuoteDb($reload,"","");
		$siz=puzzSize($qua['quote'],$sklLevel);
		//echo $siz[0]." ";
	}
	if($typ == "newpuzz")echo "newpuzz,{$qua['number']},";
	echo "<input type='hidden' id='quNum' class= 'puzNum' value='{$qua['number']}'/>";
	echo "<div id='tab1' class='info'>Quote By: '".$qua['whom']. "' on the subject of '".$qua['catagory']."' <br/>Best time to solve this Puzzzle on $times[$sklLevel] Skill Level is ".$qua[$times[$sklLevel].'_best_time']."<br/>Average time to solve this Puzzzle on $times[$sklLevel] Skill Level is ".$qua[$times[$sklLevel].'_avg_time']."<div id='userData'></div><div id='timeDis'></div></div><div id='tab2' class='infoChlng'></div><div id='puzzle'>";
	$qu=$qua['quote'];
	$letArray=moveLetters($siz[1],$siz[0],$qu);
	puzzTop($siz[1],$siz[0],$posLeft,$posTop,$bxht,$bxwd,$letArray);
	puzzBottom($siz[1],$siz[0],$posLeft,$posTop,$bxht,$bxwd,$qu,true);
	puzzBottom($siz[1],$siz[0],$posLeft,$posTop,$bxht,$bxwd,$qu,false);
	writeJS($siz,$sklLevel);
}

function puzzBottom($col,$row,$lStart,$tStart,$bHSize,$bWSize,$qu,$ans)
{
	$scr="onClick='moveLet(this)' axis='0'";// onMouseUp='dropLet(this)' onMouseOver='mkred(this)' onMouseOut='mkblack(this)'";
	$tStart+=($row*$bHSize);
	$ans? $id="ans":$id="puz";
	echo "<table cellpadding='0' cellspacing='0' id='$id'>";
	for($rows=1;$rows<=$row;$rows++)
	{
		echo "<tr id='tr$rows'>";
		for($cols=1;$cols<=$col;$cols++)
		{
			$ans?$id="ans$rows-$cols":$id="btm$rows-$cols";
			echo "<td class='btmBox' id='$id' style= 'top:";
			echo(($rows-1) * $bHSize) + $tStart.";left:";
			echo(($cols-1) * $bWSize) + $lStart.";";
			$pos=(($rows-1) * $col) + $cols;
			if($pos <= strlen($qu))
			{
				if(!(is_alpha(substr($qu,$pos-1,1))))
				{
					echo " background-color:gray";
					echo ";'>_";
					echo substr($qu,$pos-1,1);
					echo "</td>\n";
				}else{
					echo " background-color:white";
					echo ";'";
					if(!$ans) echo $scr;
					echo ">";
					if($ans)
					{
						echo substr($qu,$pos - 1,1);
					}else{
						echo "_";					
					}
					echo"</td>\n";
				}
			}else{
				echo " background-color:gray";
				echo ";'";
				echo ">_</td>\n";
			}
		}
		echo "</tr>";
	}
	echo "</table>";
	if(!$ans)echo "</div>";
}

function puzzSize($qu,$lev)
{
	$len=strlen($qu);
	switch ($lev)
	{
		case 1:
			$minRow=3;
			$maxRow=4;
			$maxLen=120;
			$minLen=36;
			break;
		case 2:
			$minRow=5;
			$maxRow=6;
			$maxLen=180;
			$minLen=95;
			break;
		case 3:
			$minRow=5;
			$maxRow=7;
			$maxLen=240;
			$minLen=120;
			break;
		case 4:
			$minRow=7;
			$maxRow=10;
			$maxLen=300;
			$minLen=160;
			break;
		default:
			$minRow=3;
			$maxRow=4;
			$maxLen=120;
			$minLen=36;
			break;
	}
	$col=1;
	$rows=$maxRow;
	for($ro=$minRow;$ro<=$maxRow;$ro++)
	{
		$a=$len%$ro;
		if($a < $col)
		{
			$rows=$ro;
			$col=$a;
		}
	}
	$cols=round($len/$rows);
	if($cols * $rows < $len)$cols++;
	if($maxLen < $len)$rows=0;
	if($minLen > $len)$rows=0;
	return array($rows,$cols);
}

function puzzTop($col,$row,$lStart,$tStart,$bHSize,$bWSize,$qu)
{
	//$scr="onMouseDown='moveLet(this)' onMouseUp='dropLet(this)' onMouseOver='mkred(this)' onMouseOut='mkblack(this)'";
	echo "<table cellpadding='0' cellspacing='0'>";
	for($rows=1;$rows<=$row;$rows++)
	{
		echo "<tr>";
		for($cols=1;$cols<=$col;$cols++)
		{
			echo "<td class='topBox' id='top$rows-$cols' style= 'top:";
			echo(($rows-1) * $bHSize) + $tStart.";left:";
			echo(($cols-1) * $bWSize) + $lStart.";";
			echo " background-color: yellow";
			echo ";'  >".$qu[$rows][$cols]."</td>\n";
		}
		echo "</tr>";
	}
	echo "</table>";
}

function is_alpha($char)
{
	if(ord($char) < 65 || ord($char) > 90) return False;
	Return True;
}

function moveLetters($col,$row,$qu)
{
	for($cols=1;$cols<=$col;$cols++)
	{
		$letCnt=1;
		for($rows=1;$rows<=$row;$rows++)
		{
			$tmp[$rows]="_";
			$let=substr($qu,(( $rows - 1) * $col) + $cols -1,1);
			if(is_alpha($let))$tmp[$letCnt++]=$let;
			$topArray[$rows][$cols]="_";
		}
		$letCnt--;
		for($rows=1;$rows <= $letCnt;$rows++)
		{
			
			while(($topArray[$rows][$cols]=="_"))
			{
				$rd=rand(1,$letCnt);
				if(!($tmp[$rd]=="_"))
				{
				$topArray[$rows][$cols]=$tmp[$rd];
				$tmp[$rd]="_";
				}
			}
		}
	}
	return $topArray;
}

function writeJS($size,$sklLevel)
{
	echo "<script>";
	echo "rows={$size[0]} \n cols={$size[1]} \n";
	echo "skill=$sklLevel \n";
	echo " </script>";
}

function getQuote($quNum)
{
	$fname="/var/www/games/puzz/quotes.txt";
	if(!file_exists($fname)) exit;
	$fqu=fopen($fname,"r");
	$a=1;
	while(!feof($fqu))
	{
		$qu[$a++]=strtoupper(fgets($fqu));
	}
	if($quNum < 1 || $quNum > $a )
	{
		$quNum=rand(1,$a);
	}
	echo "<input type='hidden' id='quNum' value='$quNum'/>";
	return $qu[$quNum];
}

function getQuoteDb($quNum,$auth,$cat)
{
	$conn=opendb();
	$res=$conn->query("SELECT * FROM quote");
	$totQu = $res->num_rows;
	$res->close();
	if($quNum < 1 || $quNum > $totQu)
	{
		$num=rand(1,$totQu);
		if($cat=="")
		{
			$cat="%";
			if($auth=="")
			{
				$auth="%";
				//$quNum=rand(1,$totQu);
			}
		}else{
			$auth="%";
		}
	}else{
		$auth="%";
		$cat="%";
		$num=$quNum;	
	}
	$qry="SELECT * FROM quote Where number like '$num' AND whom like '$auth' AND catagory like '$cat'";
	$res=$conn->query($qry);
	$totQu = $res->num_rows;
	//$res->data_seek(rand(1,$totQu));
	$qu=$res->fetch_array(MYSQLI_ASSOC);
	$res->close();
	$conn->close();
	return $qu;
}

function getAuth()
{
	$conn=opendb();
	$cnt=0;
	$res=$conn->query("SELECT whom FROM quote ORDER BY whom" );

	While($autha[$cnt]=$res->fetch_array(MYSQLI_NUM))
	{
	$auth[$cnt]= $autha[$cnt++][0]."<br/>";
	}
	$res->close();
	$conn->close();
	return array_unique($auth);
}

function getCat()
{
	$conn=opendb();
	$cnt=0;
	$res=$conn->query("SELECT catagory FROM quote ORDER BY catagory" );
	While($cata[$cnt]=$res->fetch_array(MYSQLI_NUM))
	{
	$cat[$cnt]= $cata[$cnt++][0]."<br/>";
	}
	$res->close();
	$conn->close();
	return array_unique($cat);
}

?>