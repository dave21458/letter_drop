var xmlHttp;
var destObj;
var type;
function ajax()
{
	var xmlHttp=null;
	try
	{
	  // Firefox, Opera 8.0+, Safari
		xmlHttp=new XMLHttpRequest();
	}catch (e){
	  // Internet Explorer
		try
		{
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
		}catch (e){
			xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
		}
	}
	return xmlHttp;
}
	
function ajaxresp()
{
	if(xmlHttp.readyState==4)
	{
		if(xmlHttp.status==200)
		{
			rsp=xmlHttp.responseText.split(",");
			switch(rsp[0])
			{
				case "loggedin":
					$("#loginlab").html("welcome " + $.cookie("id") + "</br> log out");
					logged=true;
					id = $.cookie("id");
					getPlayers();
					$("#userList").css({visibility:"visible"});
					ajaxReq(usrAjax,"getUserInfo");
					break;
				case "loggedout":
					$("#loginlab").text("Log In");
					logged=false;
					$("#chlngButt").css({visibility:"hidden"});
					$("#userList").css({visibility:"hidden"});
					break;
				case "puzzle":
					var tim ="";
					userBest=rsp[1].split(";");
					userComp=rsp[2].split(";");
					if(userComp[1] !== "")
					{
						userComp[1] == 1 ? tim = "time": tim = "times";
						$("#userData").text("You have completed this Puzzle "+userComp[1] + " " + tim +". Your Best Time was " + userBest[1] + " on " + skil[skill]);
					}else{
						$("#userData").text("You have not played this puzzle before on " + skil[skill]);
					}
					break;
				case "newpuzz":
					chlngPuzz=xmlHttp.responseText.substr(rsp[0].length + 1);
					puzzData = chlngPuzz;
					break;
				default:
					document.getElementById('qu').innerHTML=xmlHttp.responseText;
			}
		}
	}
}

function ajaxReq(srcUrl,type)
{
	xmlHttp = ajax();
	if (xmlHttp==null)
	{
	  alert ("Your browser does not support AJAX!");
	  return;
	} 
	if(typeof(type)=='undefined')type="";
	if(typeof(srcUrl)=='undefined')srcUrl="php/upDate.php"
	srcUrl=srcUrl+"?"+getData()+"&type="+type;
	//alert(srcUrl);
	xmlHttp.onreadystatechange=ajaxresp;
	xmlHttp.open("POST",srcUrl,true);
	xmlHttp.send(null);

}

function getData()
{
	skill=document.getElementById("skill").selectedIndex;
	pnum=document.getElementById("pNum").value;
	return "pnum="+pnum+"&comp="+comp+"&att="+timeStart+"&time="+sec.toText("full")+"&skill="+skill+"&id="+$.cookie("id");
}
