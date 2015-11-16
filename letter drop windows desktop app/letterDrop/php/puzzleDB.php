<?php
class sqlite3db extends SQLite3
{	
	function __construct($db)
    {
		$this->open($db);
	}
}

function opendb()
{
	if(!isset($db3)){
		$db3 = new sqlite3db("../db/quotes.sqlite");
	}
	if ($db3->lastErrorCode()) {
		printf("Connect failed: %s\n");
		exit();
	}
	return $db3;
}
