var puzzle = {
	'storeQuote' : function(data){ //starts new puzzle (ajax returns new puzzle data
		puzzle.data = {}; //clear old data
		data[0].split("^").map(function(ob){var d = ob.split("&");puzzle.data[d[0]] = d[1];});//parse ajax puzzle data
		puzzle.getRowsCols(); //determine puzzle number of columns and rows
		puzzle.makeCellsArr(); // create arrays used to to track game play
		puzzle.redraw(); //display puzzle
		removesCnt = puzzle.levels[puzzle.curLevel].removes; //set remove mistakes counter per skill level
		//update info display for new puzzle
		document.getElementById('rem').disabled = true;
		document.getElementById('paus').disabled = true;
		document.getElementById('puzzNum').innerText = puzzle.data.number;
		document.getElementById('auth').innerText = puzzle.data.author;
		document.getElementById('subject').innerText = puzzle.data.category;
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
		css('.cell','font-size',Math.round(puzzle.position.height * .75)); //set font size to cell size
	},
	'makePuzzTop': function(){
		puzzle.position.curTop = puzzle.position.top; //set top of top puzzle for making cells positioning
		for(var row = 0; row < puzzle.curRows; row++){
			for(var col = 0; col < puzzle.curCols; col++){
				var cl = puzzle.makeCell(row,col); //create cell element
				var ele = document.getElementById('puzzTop');
				cl.row = row; //add row and column property to each cell element
				cl.col = col;
				cl.id = "tr" + row + "c" + col; //add id with some meaning
				cl.innerText = puzzle.topCells[col][row].letter; //put a letter in the cell
				var cls = 'topUnUsed cell ';
				isAlpha.test(cl.innerText)?cls += 'topAlpha':cls += 'topNonAlpha'; //add css classes depending if letter or blank
				cl.className = cls;
				puzzle.topCells[col][row].ele = ele.appendChild(cl); //add cell element to top puzzle
			}
		}
		puzzle.position.curTop = puzzle.position.height * puzzle.curRows + puzzle.position.top; //set top for bottom puzzle
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
					cl.addEventListener('click',moveLetFrom); //add events for lettered cell
					cl.addEventListener("mousewheel",moveLetFrom);
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
			for(var c = (Math.random() * 5)+1; c > 0; c--) pc = shuffle(pc);
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
	// skill level properties
	'levels':{"Easy":{'maxCol':20,"maxRow":3,"minRow":2,'maxLen':80,'minLen':20,'val':'Easy','removes':4},
		"Medium":{'maxCol':25,"maxRow":5,"minRow":4,'maxLen':110,'minLen':80,'val':'Medium','removes':3},
		"Hard":{'maxCol':30,"maxRow":6,"minRow":5,'maxLen':150,'minLen':110,'val':'Hard','removes':2},
		"Very Hard":{'maxCol':35,"maxRow":8 ,"minRow":7,'maxLen':280,'minLen':120,'val':'Very Hard','removes':1}
	},
	'authors':[],
	'cells':[],
	'topCells':[],
	'bottCells':[],
	'data':{},
	'curRows':0,
	'curCols':0,
	'position':{'width':40,'height':48,'left':50,'top':100,'curTop':0}, //set default cell width and height... puzzle position on page
	'curLevel':'Medium',
	'startTime':0,
	'endTime':0,
	'completedTime':0
};

var isAlpha = /[A-Z]/;//used to test for alpha characters
var pStartTime = 0; //pause times
var pStopTime = 0;
var removesCnt = 0; //remove mistake counter

var moveLetFrom = function(evt){
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
		puzzle.startTime = new Date().getTime(); 
		document.getElementById('rem').disabled = false;
		document.getElementById('paus').disabled = false;
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
		isCompleted();
	}
}

var isCompleted = function(){
	for(var row = 0; row < puzzle.curRows; row++){
		for(var col = 0; col < puzzle.curCols; col++){
			if(puzzle.bottCells[row][col].letter != puzzle.cells[row][col])return false;
		}
	}
	puzzle.endTime = new Date().getTime();
	puzzle.completedTime = Math.round((puzzle.endTime - puzzle.startTime)/1000);
	puzzle.startTime = 0;
	alert("Completed in " + (Math.round(puzzle.completedTime/60)) + "minutes and " +( puzzle.completedTime % 60) + " seconds");
}

var pause = function(ele){
	if(puzzle.startTime){
		if(pStartTime == 0){
			pStartTime = new Date().getTime();
			ele.value = 'Start';
			document.getElementById('puzzTop').style.visibility = 'hidden';
			document.getElementById('puzzBott').style.visibility = 'hidden';
		}else{
			puzzle.startTime +=  new Date().getTime() - pStartTime;
			pStartTime = 0;
			ele.value = 'Pause';
			document.getElementById('puzzTop').style.visibility = 'visible';
			document.getElementById('puzzBott').style.visibility = 'visible';
		}
	}
}

var remMistakes = function(){
	removesCnt--;
	if(removesCnt == 0)document.getElementById('rem').disabled = true;
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

var skillLevel = function(ele){
	puzzle.curLevel = ele.value;
}

var shuffle = function(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
}

var css = function(selector, property, value) {
    for (var i=0; i<document.styleSheets.length;i++) {//Loop through all styles
        //Try add rule
        try { document.styleSheets[i].insertRule(selector+ ' {'+property+':'+value+'}', document.styleSheets[i].cssRules.length);
        } catch(err) {try { document.styleSheets[i].addRule(selector, property+':'+value);} catch(err) {}}//IE
    }
}
