
var isAlpha = /[A-Z]/;//used to test for alpha characters
var ct;


Number.prototype.to_hms = function(et){
	if(typeof(et)=='undefined')return new Date(null, null, null, null, null, this).toTimeString().replace(/.*(\d{2}:)(\d{2}:\d{2}).*/, "$2");
	if(isNaN(et))return new Date(null, null, null, null, null, Math.round(new Date().getTime()/1000) - this).toTimeString().replace(/.*(\d{2}:)(\d{2}:\d{2}).*/, "$2");
	return new Date(null, null, null, null, null, et - this).toTimeString().replace(/.*(\d{2}:)(\d{2}:\d{2}).*/, "$2")
	};

var puzzle = {
	'newPuzzle' : function(data){ //starts new puzzle (ajax returns new puzzle data)
		puzzle.startTime = 0;
		//puzzle.endTime = 0;
		puzzle.data = {}; //clear old data
		data[0].split("^").map(function(ob){var d = ob.split("&");puzzle.data[d[0]] = d[1];});//parse ajax puzzle data
		puzzle.data.best = parseInt(puzzle.data.best)
		puzzle.getRowsCols(); //determine puzzle number of columns and rows
		puzzle.makeCellsArr(); // create arrays used to to track game play
		puzzle.redraw(); //display puzzle
		gamePlay.removesCnt = puzzle.levels[puzzle.curLevel].removes; //set remove mistakes counter per skill level
		//update info display for new puzzle
		document.getElementById('rem').disabled = true;
		document.getElementById('paus').disabled = true;
		document.getElementById('puzzNum').innerText = puzzle.data.number;
		document.getElementById('auth').innerText = puzzle.data.author;
		document.getElementById('subject').innerText = puzzle.data.category;
		var bestTxt = "";
		puzzle.data.best > 0 ? bestTxt = "Your Best Time in Completing this Puzzle was " + puzzle.data.best.to_hms() : bestTxt = "You Have Not Played This Puzzle Before";
		var ele = document.getElementById('bestTime');
		ele.innerText = bestTxt;
		ele.classList.remove('btimeBeat');
		ele.classList.add('btime');
		document.getElementById('curTime').innerText = "00:00"
		animate.curTopRow = puzzle.curRows;
		document.getElementById('puzzBott').addEventListener('webkitAnimationEnd',animate.botRowsIntro);
		animate.setAnimTimes();
		animate.topRowsIntro();
	},
	'storeAuthors': function(data){
		data[0].split(",").map(function(ob){puzzle.authors.push(ob)});
	},
	'redraw':function(){
		var db = document.getElementsByTagName('body')[0]; //get body element to determine height and width
		//sh = db.clientHeight - puzzle.position.top;
		document.getElementById('puzzTop').innerHTML = ''; //clear old puzzle display
		document.getElementById('puzzBott').innerHTML = '';
		//puzzle.position.height = Math.round(sh /(puzzle.curRows * 2))-20;
		//puzzle.position.width = Math.round(puzzle.position.height * .80);
		if((puzzle.position.width * puzzle.curCols) + puzzle.position.left + 2> db.clientWidth){ //if puzzle too wide lets make it smaller size cells
			sw = db.clientWidth - puzzle.position.left;
			puzzle.position.width = Math.round(sw /(puzzle.curCols )-2);
			puzzle.position.height = Math.round(puzzle.position.width * 1.25);
		}
		puzzle.makePuzzTop();
		puzzle.makePuzzBottom();
		puzzle.css('.cell','font-size',Math.round(puzzle.position.height * .75)); //set font size to cell size
	},
	'makePuzzTop': function(){
		puzzle.position.curTop = puzzle.position.top; //set top of top puzzle for making cells positioning
		for(var row = 0; row < puzzle.curRows; row++){
			var rowEle = document.createElement("div");
			rowEle.classList.add('topRows');
			rowEle.id = "r"+row;
			rowEle.addEventListener('webkitAnimationEnd',animate.topRowsIntro);
			var ele = document.getElementById('puzzTop');
			for(var col = 0; col < puzzle.curCols; col++){
				var cl = puzzle.makeCell(row,col); //create cell element
				cl.row = row; //add row and column property to each cell element
				cl.col = col;
				cl.id = "tr" + row + "c" + col; //add id with some meaning
				cl.innerText = puzzle.topCells[col][row].letter; //put a letter in the cell
				var cls = 'topUnUsed cell ';
				isAlpha.test(cl.innerText)?cls += 'topAlpha':cls += 'topNonAlpha'; //add css classes depending if letter or blank
				cl.className = cls;
				puzzle.topCells[col][row].ele = rowEle.appendChild(cl); //add cell element to top puzzle
			}
			ele.appendChild(rowEle);
		}
		puzzle.position.curTop = puzzle.position.height * puzzle.curRows + puzzle.position.top;
		//if(settings.animate)puzzle.position.curTop = -400;
		//puzzle.css('#puzzTop','top', puzzle.position.curTop);
		//puzzle.css('#puzzTop','left', puzzle.position.left);
		//if(settings.animate)puzzle.position.curTop = 1000;
		//puzzle.css('#puzzBott','left', puzzle.position.left);
		//puzzle.css('#puzzBott','top', puzzle.position.height * puzzle.curRows + puzzle.position.curTop);
	},
	'makePuzzBottom': function(){
		for(var row = 0; row < puzzle.curRows; row++){
			for(var col = 0; col < puzzle.curCols; col++){
				var cl = puzzle.makeCell(row,col);
				var ele = document.getElementById('puzzBott');
				cl.row = row;
				cl.col = col;
				cl.id = "br" + row + "c" + col;
				cl.innerText = puzzle.bottCells[row][col].letter; //put spaces, and punctuations in proper places 
				var cls = 'bottUnUsed cell ';
				if(isAlpha.test(puzzle.cells[row][col])){
					cls += 'bottAlpha'; //set css for lettered cells
					cl.addEventListener('click',gamePlay.moveLetFrom); //add events for lettered cell
					cl.addEventListener("mousewheel",gamePlay.moveLetFrom);
				}else{
					cls += 'bottNonAlpha'; //set css for non lettered cells
				}
				cl.className = cls; //add css classes
				ele.appendChild(cl); //add cell element to bottom puzzle
			}
		}
	},
	'getRowsCols':function(){ //get best fit number of columns and rows based on skill level
		var rem = 10;
		for(var r = puzzle.levels[puzzle.curLevel].minRow;r <= puzzle.levels[puzzle.curLevel].maxRow; r++){
			for(var c = 10;c <= puzzle.levels[puzzle.curLevel].maxCol; c++ ){
				if(puzzle.data.len < (r * c) && (r * c) % puzzle.data.len < rem && puzzle.data.len > (r * c )- c){
					puzzle.curRows = r;
					puzzle.curCols = c;
					rem = (r * c) % puzzle.data.len;
				}
			}
		}
	},
	'makeCellsArr':function(){
		puzzle.cells = []; //contains correct puzzle data used to compare for completed
		puzzle.bottCells = []; //used to track game play
		puzzle.topCells = []; //puzzle data with rows shuffled
		for(var row = 0; row < puzzle.curRows; row++){
			puzzle.cells[row] = [];
			puzzle.bottCells[row] = [];
			for(var col = 0; col < puzzle.curCols; col++){
				if(typeof(puzzle.data.quote[col + (row * puzzle.curCols)])=="undefined"){
					puzzle.cells[row][col] = " ";
				}else{
					puzzle.cells[row][col] = puzzle.data.quote[col + (row * puzzle.curCols)];
				}
				isAlpha.test(puzzle.cells[row][col]) ? puzzle.bottCells[row][col] = {'letter':""}:puzzle.bottCells[row][col] = {'letter':puzzle.cells[row][col]};
			}
		}
		for(var col= 0; col < puzzle.curCols; col++){
			puzzle.topCells[col] = [];
			var tr = 0;
			var pc = [];
			for(var row = 0; row < puzzle.curRows;row++){
				if(isAlpha.test( puzzle.cells[row][col])){
					pc[tr] = {'used':0};
					pc[tr].letter = puzzle.cells[row][col];
					tr++;
				}
			}
			for(var c = (Math.random() * 5)+1; c > 0; c--) pc = puzzle.shuffle(pc);
			for(tr;tr<puzzle.curRows;tr++)pc[tr]={'letter':" ",'used':-1};
			puzzle.topCells[col] = pc;
		}
	},
	'makeCell':function(row,col){ //creates cells element with correct position
		var sp = document.createElement("span");
		sp.style.width = puzzle.position.width;
		sp.style.height = puzzle.position.height;
		sp.style.position = "absolute";
		sp.style.left = (puzzle.position.width * col) + puzzle.position.left;
		sp.style.top = (puzzle.position.height * row) +  puzzle.position.curTop;
		return sp;
	},
	'shuffle' : function(o){
		for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
		return o;
	},
	'css' : function(selector, property, value) {
		for (var i=0; i<document.styleSheets.length;i++) {//Loop through all styles
			//Try add rule
			try { document.styleSheets[i].insertRule(selector+ ' {'+property+':'+value+'}', document.styleSheets[i].cssRules.length);
			} catch(err) {try { document.styleSheets[i].addRule(selector, property+':'+value);} catch(err) {}}//IE
		}
	},
	'skillLevel' : function(ele){
		puzzle.curLevel = ele.value;
		newPuzz();
	},
	// skill level properties
	'levels':{"Easy":{'maxCol':27,"maxRow":3,"minRow":2,'maxLen':80,'minLen':20,'val':'Easy','removes':4,'removePenalty':15},
		"Medium":{'maxCol':22,"maxRow":5,"minRow":4,'maxLen':110,'minLen':80,'val':'Medium','removes':3,'removePenalty':45},
		"Hard":{'maxCol':30,"maxRow":6,"minRow":5,'maxLen':150,'minLen':110,'val':'Hard','removes':2,'removePenalty':85},
		"Very Hard":{'maxCol':35,"maxRow":8 ,"minRow":7,'maxLen':280,'minLen':120,'val':'Very Hard','removes':1,'removePenalty':120}
	},
	'authors':[],
	'cells':[],
	'topCells':[],
	'bottCells':[],
	'data':{},
	'curRows':0, //number of rows in the current puzzle
	'curCols':0, //number of columns in the current puzzle
	'position':{'width':40,'height':48,'left':50,'top':100,'curTop':0}, //set default cell width and height... puzzle position on page
	'curLevel':'Medium',
	'startTime':0,
	//'endTime':0,
	'completedTime':0
};

var gamePlay = {
	'removesCnt' : 0,
	'pStartTime': 0,
	'moveLetFrom' : function(evt){
		if(gamePlay.isCompleted())return;
		// set defaults for left click
		var cell = evt.srcElement;
		var c = 0;
		var step = 1;
		var r = 0;
		var prev = 0;
		var targ = puzzle.curRows;
		//defaults for wheel turned cw (wheel turned ccw would be same as left click
		if(typeof(evt.wheelDelta) !== 'undefined'){
			if(evt.wheelDelta < 0){
				step = -1;
				targ = -1;
				r = puzzle.curRows - 1;
			}
		}
		//start timer and enable buttons
		if(puzzle.startTime == 0){
			puzzle.startTime = Math.round(new Date().getTime()/1000); 
			document.getElementById('rem').disabled = false;
			document.getElementById('paus').disabled = false;
			gamePlay.currentTime();
		}
		//check to see if selected bottom puzzle cell has letter from top puzzle
		if(typeof(puzzle.bottCells[cell.row][cell.col].ele) !== "undefined"){
			var e = puzzle.bottCells[cell.row][cell.col].ele; //get cur assoc top puzzle cell element
			e.classList.remove('topUsed'); // change top puzzle cell back to unused
			e.classList.add('topUnUsed');
			r = e.row;
			prev = 1;
		}
		var clrR = r;
		if(evt.button == 1) r = targ; //wheel clicked clears cell
		// find next available letter from top puzzle
		for( c = r ; c != targ ;c+= step){
			if(puzzle.topCells[cell.col][c].used == 0){
				cell.innerText = puzzle.topCells[cell.col][c].letter;
				puzzle.topCells[cell.col][c].used = 1;
				puzzle.topCells[cell.col][c].ele.classList.remove('topUnUsed');
				puzzle.topCells[cell.col][c].ele.classList.add('topUsed');
				puzzle.bottCells[cell.row][cell.col].letter =  puzzle.topCells[cell.col][c].letter;
				if(prev)puzzle.topCells[cell.col][r].used = 0;
				puzzle.bottCells[cell.row][cell.col].ele = puzzle.topCells[cell.col][c].ele;
				break;
			}
		}
		// if last letter in top puzzle column clear the bottom puzzle cell
		if(c == targ){
			cell.innerText = "";
			puzzle.bottCells[cell.row][cell.col].letter = "";
			if(prev)puzzle.topCells[cell.col][clrR].used = 0;
			puzzle.bottCells[cell.row][cell.col].ele = undefined;
		}else{
			if(gamePlay.isCompleted())gamePlay.completed();
		}
	},
	// check to see if puzzle is completed correctly
	'isCompleted' : function(){
		for(var row = 0; row < puzzle.curRows; row++){
			for(var col = 0; col < puzzle.curCols; col++){
				if(puzzle.bottCells[row][col].letter != puzzle.cells[row][col])return false;
			}
		}
		return true;
	},
	'completed':function(){
		clearTimeout(ct);
		// get completed time span
		//puzzle.endTime = Math.round(new Date().getTime()/1000);
		puzzle.completedTime = Math.round(new Date().getTime()/1000) - puzzle.startTime;
		puzzle.startTime = 0;
		document.getElementById('curTime').innerText = puzzle.completedTime.to_hms();
		alert("Completed in " + puzzle.completedTime.to_hms());
		//if completed disable some buttons
		document.getElementById('rem').disabled = true;
		document.getElementById('paus').disabled = true;
		// if best time was beat store new best time
		if(puzzle.completedTime < puzzle.data.best || puzzle.data.best == 0){
			ajaxReq(gamePlay.bestTime,'php/ajax.php','type=setBest&num=' + puzzle.data.number + "&time=" + puzzle.completedTime);
		}
	},
	// if best time was beat
	'bestTime':function(comp){
		var com = comp[0].trim();
		if(com == puzzle.completedTime){
			alert("You have set the best time for this puzzle " + puzzle.completedTime.to_hms());
			var ele = document.getElementById('bestTime');
			ele.innerText = "Your Best Time in Completing this Puzzle was "+ puzzle.completedTime.to_hms();
			ele.classList.remove('btime');
			ele.classList.add('btimeBeat');
		}else{
			alert('failed to record best time');
		}
	},
	'currentTime' : function(){
		if(puzzle.startTime > 0){
			if(gamePlay.pStartTime == 0)document.getElementById('curTime').innerText = puzzle.startTime.to_hms("x");//rt.to_hms();
			ct = setTimeout(function(){gamePlay.currentTime()},1000);
		}
	},
	'pause' : function(ele){
		if(puzzle.startTime){
			if(gamePlay.pStartTime == 0){
				gamePlay.pStartTime = Math.round(new Date().getTime()/1000);
				ele.value = 'Start';
				document.getElementById('puzzTop').style.visibility = 'hidden';
				document.getElementById('puzzBott').style.visibility = 'hidden';
			}else{
				puzzle.startTime +=  Math.round(new Date().getTime()/1000) - gamePlay.pStartTime;
				gamePlay.pStartTime = 0;
				ele.value = 'Pause';
				document.getElementById('puzzTop').style.visibility = 'visible';
				document.getElementById('puzzBott').style.visibility = 'visible';
			}
		}
	},

	'remMistakes' : function(){
		gamePlay.removesCnt--;
		if(gamePlay.removesCnt == 0)document.getElementById('rem').disabled = true;
		gamePlay.startTime -= puzzle.levels.removePenalty;
		for(var row = 0; row < puzzle.curRows; row++){
			for(var col = 0; col < puzzle.curCols; col++){
				if(isAlpha.test(puzzle.bottCells[row][col].letter) && puzzle.bottCells[row][col].letter != puzzle.cells[row][col]){
					document.getElementById('br' + row + 'c' + col).innerText = '';
					puzzle.bottCells[row][col].letter = '';
					puzzle.bottCells[row][col].ele.classList.remove('topUsed');
					puzzle.bottCells[row][col].ele.classList.add('topUnUsed');
					puzzle.topCells[puzzle.bottCells[row][col].ele.col][puzzle.bottCells[row][col].ele.row].used = 0;
					puzzle.bottCells[row][col].ele = undefined;
				}
			}
		}
	}
};

var animate = {
	'curTopRow' : 0,
	'topRowsIntro' : function(ev){
		var intro = 'topNoIntro';
		var fst = typeof(ev) == 'undefined';
		var anm = false;
		if(!fst)anm = ev.animationName == 'fancy';
		if(fst || anm){
			if(settings.animate){
				document.getElementById('puzzTop').classList.add('tp');
				//puzzle.css('#puzzTop','top', puzzle.position.top);
				intro = 'topIntro';
			}
			if(animate.curTopRow > 0){
				document.getElementById("r" + (animate.curTopRow - 1)).classList.add(intro);
				document.getElementById('puzzBott').classList.remove('botDone');
			}
			if(animate.curTopRow < puzzle.curRows && animate.curTopRow >= 0){
				document.getElementById("r" + (animate.curTopRow)).classList.remove(intro);
				document.getElementById("r" + (animate.curTopRow)).classList.add('topDone');
			}
			if(animate.curTopRow == 0)animate.botRowsIntro();
			animate.curTopRow--;
		}
	},
	'botRowsIntro' : function(ev){
		var intro = 'botNoIntro';
		if(settings.animate){
			intro = 'botIntro';
		}
		if(typeof(ev) == 'undefined'){
			document.getElementById('puzzBott').classList.add(intro);
			//puzzle.css('#puzzBott','top', puzzle.position.height * puzzle.curRows + puzzle.position.top);
		}else{
			if(ev.animationName == 'grow'){
				document.getElementById('puzzBott').classList.remove(intro);
				document.getElementById('puzzBott').classList.add('botDone');
				document.getElementById('puzzTop').classList.remove('tp');
				
				
			}
		}
	},
	'setAnimTimes':function(){
		var timing = (settings.topTime * puzzle.curRows).toString()+"," +((settings.topTime * puzzle.curRows)+10).toString();
		puzzle.css('.tp span:nth-of-type(3n)','-webkit-animation-iteration-count',timing);
		puzzle.css('.tp span:nth-of-type(3n +1)','-webkit-animation-iteration-count',timing);
		puzzle.css('.tp span:nth-of-type(3n +2)','-webkit-animation-iteration-count',timing);
	}
};

var settings = {
	'animate':false,
	'topTime':2.25,
	'toggleAnimation' : function(ele){
		ele.checked ? settings.animate = true : settings.animate = false;
	},
	'importNewPuzz': function(){
		if(phomium.result){
			ajaxReq(settings.puzzImported,"php/ajax.php","type=parseQuote&file=" + phomium.resultText + "\\" +phomium.resultArray[0]);
		}
	},
	'updatePuzz': function(curRowId){
		if(typeof(curRowId) == 'undefined'){
			curRowId = 0;
			document.getElementById('puzzTop').innerHTML = "<h1 style = 'top:" + puzzle.position.top + ";left:" + puzzle.position.left + "'><b>Updating Quote Database....</b></h1>"; //clear old puzzle display
			document.getElementById('puzzBott').innerHTML = '';
			document.getElementById('bestTime').innerText = '';
			document.getElementById('rem').disabled = true;
			document.getElementById('paus').disabled = true;
			document.getElementById('newPuzz').disabled = true;
		}
		if(phomium.result){
			ajaxReq(settings.puzzUpdate,"php/ajax.php","type=updateDb&file=" + phomium.resultText + "\\" +phomium.resultArray[0] + "&row=" + curRowId);
		}
	},
	'puzzImported':function(res){
		var a = res;
	},
	'puzzUpdate':function(res){
		reslen = res.length;
		remain = res[reslen - 2] - res[reslen - 1];
		if(remain > 0){
			document.getElementById('puzzTop').innerHTML = "<h1 style = 'top:" + puzzle.position.top + ";left:" + puzzle.position.left + "'><b>Updating Quote Database, Updating " + (res[reslen - 1]) + " of " + (res[reslen - 2] )  + "</b></h1>";
			settings.updatePuzz(res[reslen - 1]);
		}else{
			document.getElementById('newPuzz').disabled = false;
			newPuzz();
		}
	}
		
	
	
		
}

