package com.example.letterdrop;

import java.io.IOException;
import java.util.Arrays;
import java.util.Timer;
import java.util.TimerTask;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Resources;
import android.database.SQLException;
import android.graphics.Color;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.view.DragEvent;
import android.view.Gravity;
import android.view.Menu;
import android.view.MotionEvent;
import android.view.View;
import android.view.View.DragShadowBuilder;
import android.view.View.OnDragListener;
import android.view.Window;
import android.widget.AdapterView;
import android.widget.AdapterView.OnItemSelectedListener;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.RelativeLayout;
import android.widget.Spinner;
import android.widget.TableLayout;
import android.widget.TableRow;
import android.widget.TextView;
// TODO add opening splash with buttons for play or login
//		add resources for life cycles.
//		add best score to db

public class LetterDrop extends Activity{
	
	protected int skillLevel = 0;
	protected boolean creating = true;
	protected int rowCount = 0;
	protected int columnCount = 0;
	protected char[][] puzzData;
	protected char[][] puzzRandom;
	protected boolean timerStarted = false;
	protected boolean timePaused = false;
	protected int playTime = 0;
	protected boolean puzzComplete = false;
	private int removeCount =0;
	protected Resources res;
	private Timer timer;
	private DataBaseHelper dbHelper =new DataBaseHelper(this);
	private Button newbutton;
	private Button pausebutton;
	private Button rembutton;
	//private OnDragListener dragListen = new dragListener();


	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		requestWindowFeature(Window.FEATURE_NO_TITLE);
		setContentView(R.layout.activity_letter_drop);
		setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
		openDB();
		newbutton = (Button) findViewById(R.id.buttonNew);
		pausebutton = (Button) findViewById(R.id.buttonPause);
		rembutton = (Button) findViewById(R.id.buttonRemove);
		newbutton.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				newPuzzle(0);
			}
		});
		pausebutton.setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				pause();
			}
		});
		findViewById(R.id.goButton).setOnClickListener(new View.OnClickListener() {
			@Override
			public void onClick(View v) {
				gameover();
			}
		});
		Spinner skillView = (Spinner) findViewById(R.id.spinnerSkill);
		skillView.setOnItemSelectedListener(new OnItemSelectedListener(){
			public void onItemSelected(AdapterView<?> parent, View view, int pos,long id) {
				skillLevel = pos;
				if(creating){
					creating=false;
				}else{
					newPuzzle(0);
				}
			}
			 @Override
			  public void onNothingSelected(AdapterView<?> arg0) {}
		});
		
		res = getResources();
		SharedPreferences setting = getSharedPreferences("letdrop",MODE_PRIVATE);
		int pnum = setting.getInt("PUZZ_NUM", 0);
		if(pnum > 0){
			newPuzzle(pnum);
			String pd = setting.getString("PUZZ_PLAY", "");
			if(pd.length() > 1)puzzRebuild(pd);
			playTime=setting.getInt("PUZZ_TIME", 0);
		}else{
			newPuzzle(0);
		}
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.activity_letter_drop, menu);
		return true;
	}
	
	
	@Override
	protected void onPause(){
		super.onPause();
		int pnum=0;
		SharedPreferences setting = getSharedPreferences("letdrop",MODE_PRIVATE);
		SharedPreferences.Editor editor = setting.edit();
		editor.clear();
		if(playTime>0 && !puzzComplete)pnum=dbHelper.puzzNumber;
		editor.putInt("PUZZ_NUM", pnum);
		editor.putInt("PUZZ_TIME",playTime);
		editor.putString("PUZZ_PLAY", puzzPlayToString());
		editor.commit();
		dbHelper.closeDataBase();
	}
	
	@Override
    protected void onStop(){
		super.onStop();
		int pnum=0;
		SharedPreferences setting = getSharedPreferences("letdrop",MODE_PRIVATE);
		SharedPreferences.Editor editor = setting.edit();
		//editor.clear();
		//if(playTime>0 && !puzzComplete)pnum=dbHelper.puzzNumber;
		//editor.putInt("PUZZ_NUM", pnum);
		//editor.putInt("PUZZ_TIME",playTime);
		//editor.putString("PUZZ_PLAY", puzzPlayToString());
		//editor.putInt("PUZZ_STOP",1);
		//editor.commit();
		dbHelper.closeDataBase();
	}
	
	//------------ Puzzle database ---------//
	
	private void openDB(){
		 try {
	        	dbHelper.createDataBase();
		 	} catch (IOException ioe) {
		 		throw new Error("Unable to create database");
		 	}
		 	try {
		 		dbHelper.openDataBase();
		 	}catch(SQLException sqle){
		 		throw sqle;
		 	}
	}
	
	public void newPuzzle(int pnum){
		int max = res.getInteger(R.integer.maxColumns) * res.getIntArray(R.array.max_rows)[skillLevel];
	 	int min = res.getInteger(R.integer.minColumns) * res.getIntArray(R.array.min_rows)[skillLevel];
		if(pnum==0)dbHelper.getPuzz(min,max);
		if(pnum>0)dbHelper.getPuzz(pnum);
		puzzle(findViewById(R.id.puzz));
		SharedPreferences setting = getSharedPreferences("letdrop",MODE_PRIVATE);
		SharedPreferences.Editor editor = setting.edit();
		editor.clear();
		editor.commit();
	}
	
	//------------ Puzzle Timer -------------// 
	private void playTimer(){		
		if(timerStarted && !timePaused && !puzzComplete){
			playTime+=1;
			this.runOnUiThread(Timer_Tick);
		}		
	}
	
	private Runnable Timer_Tick = new Runnable() {
		public void run(){
			TextView tim = (TextView) findViewById(R.id.time);
			tim.setText(secsToString(playTime));
		};
	};
	
	protected void startTimer(){
		timerStarted = true;
		rembutton.setEnabled(true);
		pausebutton.setEnabled(true);
		if(timer==null){
			timer = new Timer();
			timer.schedule(new TimerTask() {
				@Override
		        public void run() {
		            playTimer();
		        }
			}, 0, 1000);
		}
	}
	
	public void pause(){
		if(timerStarted){
			View pz = (View)findViewById(R.id.puzz);
			if(timePaused){
				timePaused = false;
				pausebutton.setText("Pause");
				if(removeCount > 0)rembutton.setEnabled(true);
				newbutton.setEnabled(true);
				pz.setVisibility(View.VISIBLE);
			} else{
				timePaused = true;
				pausebutton.setText("Continue");
				rembutton.setEnabled(false);
				newbutton.setEnabled(false);
				pz.setVisibility(View.INVISIBLE);
			}
		}
	}
	
	private String secsToString(int secs){
		String stime = "";
		if(secs < 1){
			stime="00:00:00";
		}else{
			int shour = (int) Math.floor(secs / 3600);
			if(shour < 10)stime += "0";
			stime += Integer.toString(shour) + ":";
			secs -= shour * 3600;
			int smin = (int) Math.floor(secs / 60);
			if(smin < 10)stime += "0";
			stime += Integer.toString(smin) + ":";
			secs -= smin * 60;
			if(secs < 10)stime += "0";
			stime += Integer.toString(secs);
		}
		return stime;
	}
	
	//---------- game play --------------//
	@SuppressLint("NewApi")
	protected void moveLetter(TextView cv){
		if(puzzComplete)return;
		int c=getColumnFromId(cv.getId());
		TextView uv;
		int csr = (Integer) cv.getTag();
		int ps = csr;
		int rows = 0;
		while(Character.isLetter(puzzRandom[c][rows])){
			if(++rows == rowCount)break;
		}
		String nt = res.getString(R.string.blank);
		Drawable ntbg= res.getDrawable(R.drawable.cell_white);
		csr++;
		if(csr < rows){
			while(csr < rows){
				if(((TextView) findViewById(getIdFromRowColumn(csr,c,true))).getCurrentTextColor()==res.getColor(R.color.unused_letter))break;
				csr++;
			}
			if(csr<rows){
				uv = (TextView) findViewById(getIdFromRowColumn(csr,c,true));
				nt = (String) uv.getText();
				ntbg = res.getDrawable(R.drawable.tile2);
				uv.setTextColor(res.getColor(R.color.used_letter));
				setBG(uv,res.getDrawable(R.drawable.cell_dkgrey));
			}else{
				csr = -1;
			}
		}else{
			csr = -1;
		}
		cv.setTag(Integer.valueOf(csr));
		setBG(cv,ntbg);
		cv.setText((CharSequence)nt,TextView.BufferType.SPANNABLE);
		if(ps >= 0){
			uv=(TextView) findViewById(getIdFromRowColumn(ps,c,true));
			uv.setTextColor(res.getColor(R.color.unused_letter));
			setBG(uv,res.getDrawable(R.drawable.tile3));
		}
		if(!timerStarted)startTimer();
		checkIfComplete();
		if(puzzComplete == true)finishPuzz();
	}
		
	protected void checkIfComplete(){
		this.puzzComplete = false;
		int rows = 0;
		int cols = 0;
		int csr = 0;
		while(cols < columnCount && rows < rowCount){
			if(Character.isLetter(puzzData[rows][cols])){
				csr = (Integer)(((TextView)findViewById(getIdFromRowColumn(rows,cols,false))).getTag());
				if(csr < 0)break;
				if(puzzData[rows][cols] != puzzRandom[cols][csr])break;
			}
			if(++cols == columnCount){
				rows++;
				if(rows < rowCount)cols=0;
			}
		}
		if(cols==columnCount && rows == rowCount) this.puzzComplete=true;
	}
	
	public void removeMistakes(View view){
		int rows = 0;
		int cols = 0;
		int csr = 0;
		playTime += 120;
		while(cols < columnCount && rows < rowCount){
			if(Character.isLetter(puzzData[rows][cols])){
				TextView pv=(TextView) findViewById(getIdFromRowColumn(rows,cols,false));
				csr = (Integer)pv.getTag();
				if(csr >= 0){
					if(puzzData[rows][cols] != puzzRandom[cols][csr]){
						clearCell(pv);
					}
				}
			}
			if(++cols == columnCount){
				rows++;
				if(rows < rowCount)cols=0;
			}
		}
		removeCount--;
		if(removeCount==0)rembutton.setEnabled(false);
	}
	
	//@SuppressLint("NewApi")
	protected void finishPuzz(){
		View puz = findViewById(R.id.puzz);
		View go = findViewById(R.id.gameover);
		disablePuzz(false);
		pausebutton.setEnabled(false);
		rembutton.setEnabled(false);
		puz.setAlpha((float) .45);
		dbHelper.setCompTime(playTime);
		int bTime=dbHelper.getUserBestTime();
		String txt1=res.getString(R.string.goTime,secsToString(playTime));
		String txt2=res.getString(R.string.goBest,secsToString(bTime));
		((TextView) findViewById(R.id.goTime)).setText(txt1);
		((TextView) findViewById(R.id.goBest)).setText(txt2);
		go.setVisibility(View.VISIBLE);
	}
	
	//@SuppressLint("NewApi")
	public void gameover(){
		View puz = findViewById(R.id.puzz);
		View go = findViewById(R.id.gameover);
		puz.setAlpha((float) 1);
		go.setVisibility(View.INVISIBLE);
	}
	
	private void disablePuzz(boolean tf){
		int r = 0;
		int c = 0;
		int cnt = 100;
		View cell;
		while(cnt <= 1000){
			cell=findViewById(((r+1)*cnt)+c);
			cell.setEnabled(!tf);
			if(++c == columnCount){
				if(++r == rowCount){
					cnt*=10;
					r=0;
				}
				c=0;
			}
		}		
	}
	
	protected int getRowFromId(int id){
		if(id >= 1000 && id <= 9999)return (int) Math.floor(id/1000)-1;
		if(id >= 100 && id <= 999)return (int) Math.floor(id/100)-1;
		return -1;
	}
	
	protected int getColumnFromId(int id){
		if(id >= 1000 && id <= 9999)return (int) id%1000;
		if(id >= 100 && id <= 999)return (int) id%100;
		return -1;
	}
	
	protected int getIdFromRowColumn(int r,int c,boolean upper){
		r++;
		r *= 100;
		if(upper)r *=10;
		return r+c;
	}
	
	@SuppressLint("NewApi")
	private boolean dragListen(TextView dv, DragEvent event){
		if(puzzComplete)return false;
		int uvId;
		boolean ret = false;
		TextView uv;
		String text;
			switch (event.getAction()) {
		      case DragEvent.ACTION_DRAG_STARTED:
		    	  uvId = Integer.parseInt((String) event.getClipDescription().getLabel());
		    	  if(getColumnFromId(uvId)==getColumnFromId(dv.getId()))ret=true;
		    	  break;
		      case DragEvent.ACTION_DRAG_ENTERED:
		    	  ret=false;
		    	  break;
	      	  case DragEvent.ACTION_DRAG_EXITED:
	      		  ret=false;
	      		  break;
		      case DragEvent.ACTION_DROP:
		    	  text = dv.getText().toString();
		    	  uvId = Integer.parseInt((String) event.getClipDescription().getLabel());
		    	  uv = (TextView)findViewById(uvId);
		    	  if(Character.isLetter(text.charAt(0)))clearCell(dv);
		    	  uv.setTextColor(res.getColor(R.color.used_letter));
		    	  setBG(uv, res.getDrawable(R.drawable.cell_dkgrey));
		    	  dv.setText((CharSequence)uv.getText(),TextView.BufferType.SPANNABLE);
		    	  setBG(dv,res.getDrawable(R.drawable.tile2));
		    	  dv.setTag(Integer.valueOf(getRowFromId(uvId)));
		    	  if(!timerStarted)startTimer();
		    	  checkIfComplete();
		  		  if(puzzComplete == true)finishPuzz();
		    	  ret=true;
		    	  break;
		      case DragEvent.ACTION_DRAG_ENDED:
		    	  break;
		      default:
		        break;
		      }
		return ret;
	}
	
	public void clearCell(View v){
		if((Integer)((TextView) v).getTag() == -1)return;
		int cols = getColumnFromId(v.getId());
		TextView uv=(TextView) findViewById(getIdFromRowColumn((Integer)((TextView) v).getTag(),cols,true));
		((TextView) v).setText((CharSequence)res.getString(R.string.blank),TextView.BufferType.SPANNABLE);
		setBG((TextView)v,res.getDrawable(R.drawable.cell_white));
		v.setTag(Integer.valueOf(-1));
		uv.setTextColor(res.getColor(R.color.unused_letter));
		setBG(uv,res.getDrawable(R.drawable.tile3));
	}
	
	//-----------Display Puzzle ------------------//
	
	public void puzzle(View view){
		//String st = res.getString(R.string.someString);
		newbutton.setEnabled(true);
		pausebutton.setEnabled(false);
		rembutton.setEnabled(false);
		timerStarted = false;
		playTime=0;
		removeCount= res.getIntArray(R.array.removeCnt)[skillLevel];
		puzzComplete = false;
		RelativeLayout puzz = (RelativeLayout) findViewById(R.id.puzz);
		TextView whom = (TextView) findViewById(R.id.whom);
		TextView subject = (TextView) findViewById(R.id.subject);
		subject.setText(dbHelper.subject);
		whom.setText(dbHelper.bywhom);
		puzz.removeAllViews();
		puzz.addView(makePuzz(dbHelper.quotes));
	}	
	

	public View makePuzz(String quote){
		
		getRowsColumns(quote.length());
		puzzData = new char[rowCount][columnCount];
		puzzRandom = new char[columnCount][rowCount];
		makePuzzData(quote);
		makeRandomPuzz();
		View puzz=layoutPuzz(new TableLayout(this));
		return puzz;
	}
	
	private void getRowsColumns(int len){
		int[] maxr=res.getIntArray(R.array.max_rows);
		int[] minr=res.getIntArray(R.array.min_rows);
		int maxc = res.getInteger(R.integer.maxColumns);
		int minc = len/maxr[skillLevel] ;
		int remain = 0;
		for(int cnt = minc;cnt<maxc;cnt++){
			if(len % cnt > remain || len % cnt == 0){
				columnCount=cnt;
				remain = len % cnt;
				if(remain == 0)break;
			}
			if(len / cnt <= minr[skillLevel])break;
		}
		rowCount = len / columnCount;
		if(len % columnCount > 0)rowCount++;
	}
	
	private void makePuzzData(String quote){
		int cnt = 0;
		for(int rows = 0;rows < rowCount;rows++){
			for(int cols = 0; cols < columnCount; cols++){
				if(cnt < quote.length()) puzzData[rows][cols]=Character.toUpperCase(quote.charAt(cnt++)); else puzzData[rows][cols]=32;
			}
		}
	}
	
	private void makeRandomPuzz(){
		int cnt = 0;
		char a = 'a';
		char mt = ' ';
		for(int col=0;col < columnCount; col++){
			Arrays.fill(puzzRandom[col],a);
			for(int row=0; row < rowCount; row++){
				if(Character.isLetter(puzzData[row][col]))puzzRandom[col][cnt++]=puzzData[row][col];
			}
			Arrays.sort(puzzRandom[col]);
			for(int b = 0;b<rowCount;b++)if(Character.isLowerCase(puzzRandom[col][b]))puzzRandom[col][b]=mt;
			cnt=0;
		}
	}
		
	private View layoutPuzz(TableLayout table){
		for(int top=0;top<2;top++){
			for(int row = 0;row < rowCount;row++){				
				TableRow tr = new TableRow(this);
				tr.setBackgroundColor(Color.WHITE);
				LinearLayout cell = new LinearLayout(this);
				for(int col=0;col<columnCount;col++){
					TextView tv = new TextView(this);
					tv.setWidth(res.getDimensionPixelSize(R.dimen.cell_wide));
					tv.setHeight(res.getDimensionPixelSize(R.dimen.cell_high));
					tv.setTextSize(res.getDimensionPixelSize(R.dimen.cell_text_size));
					tv.setGravity(Gravity.CENTER_VERTICAL | Gravity.CENTER_HORIZONTAL);
					if(top==0){
						setBG(tv,res.getDrawable(R.drawable.cell_yellow));
						tv.setTextColor(res.getColor(R.color.unused_letter));
						tv.setId(getIdFromRowColumn(row,col,true));
						if(Character.isLetter(puzzRandom[col][row])){
							setBG(tv,res.getDrawable(R.drawable.tile3));
							tv.setText(Character.toString(puzzRandom[col][row]));
							tv.setOnTouchListener(new View.OnTouchListener() {
								@Override
								public boolean onTouch(View v, MotionEvent event) {
									if (event.getAction() == MotionEvent.ACTION_DOWN && ((TextView)v).getCurrentTextColor()==res.getColor(R.color.unused_letter)) {
								        ClipData data = ClipData.newPlainText(Integer.toString(v.getId()), "xxxx");
								        DragShadowBuilder shadowBuilder = new View.DragShadowBuilder(v);
								        v.startDrag(data, shadowBuilder, v, 0);
								        return true;
									}
									return false;
								}
							});
							//tv.setOnTouchListener(new dragListener());
						}
					}else{
						tv.setId(getIdFromRowColumn(row,col,false));
						tv.setTag(Integer.valueOf(-1));
						if(Character.isLetter(puzzData[row][col])){
							setBG(tv,res.getDrawable(R.drawable.cell_white));
							tv.setText(res.getString(R.string.blank),TextView.BufferType.SPANNABLE);
							tv.setTextColor(res.getColor(R.color.unused_letter));
							tv.setTag(Integer.valueOf(-1));
							tv.setOnClickListener(new View.OnClickListener() {
								@Override
								public void onClick(View v) {
									moveLetter((TextView)v);
								}
							});
							//tv.setOnDragListener(new dragListener());
							tv.setOnDragListener(new OnDragListener(){
								@Override
								public boolean onDrag(View v, DragEvent event) {
									return dragListen((TextView)v,event);
								}
							});
							tv.setOnLongClickListener(new View.OnLongClickListener() {
								@Override
								public boolean onLongClick(View v) {
									clearCell(v);
									return true;
								}
							});
						}else{
							setBG(tv,res.getDrawable(R.drawable.cell_grey));
							tv.setText(Character.toString(puzzData[row][col]));
						}
					}
					cell.addView(tv);
				}
				tr.addView(cell);
				table.addView(tr);
			}
		}
		return table;
	}
	
	@SuppressLint("NewApi")
	@SuppressWarnings("deprecation")
	protected void setBG(TextView tv ,Drawable resbg){
		
		int sdk = android.os.Build.VERSION.SDK_INT;
		if(sdk < android.os.Build.VERSION_CODES.JELLY_BEAN) {
		    tv.setBackgroundDrawable(resbg);
		} else {
		    tv.setBackground(resbg);
		} 
	}
	
	private String puzzPlayToString(){
		String pd = "";
		for(int r=0;r<rowCount;r++){
			for(int c=0;c<columnCount;c++){
				if(r>0 || c>0)pd += ",";
				View v = findViewById(getIdFromRowColumn(r,c,false));
				String t = v.getTag().toString();
				pd += t;
			}
		}
		return pd;
	}
	
	private void puzzRebuild(String pd){
		TextView bv;
		TextView uv;
		int tag;
		String[] pda = pd.split(",");
		for(int r=0;r<rowCount;r++){
			for(int c=0;c<columnCount;c++){
				bv = (TextView)findViewById(getIdFromRowColumn(r,c,false));
				tag=Integer.valueOf(pda[(r*columnCount)+c]);
				if(tag >=0){
					bv.setTag(tag);
					uv=(TextView)findViewById(getIdFromRowColumn(tag,r,true));
					bv.setText(uv.getText());
					setBG(bv,res.getDrawable(R.drawable.tile2));
					uv.setTextColor(res.getColor(R.color.used_letter));
					setBG(uv, res.getDrawable(R.drawable.cell_dkgrey));
				}
			}
		}
	}

}
