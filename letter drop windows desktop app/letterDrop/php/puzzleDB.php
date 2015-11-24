<?php
class sqlite3db extends SQLite3
{	
	function __construct($db)
    {
		$this->open($db);
	}
}

function opendb($db)
{
	if(!isset($db3)){
		if($db == '')$db= "../db/quotes.sqlite";
		$db3 = new sqlite3db($db);
	}
	if ($db3->lastErrorCode()) {
		printf("Connect failed: %s\n");
		exit();
	}
	return $db3;
}
