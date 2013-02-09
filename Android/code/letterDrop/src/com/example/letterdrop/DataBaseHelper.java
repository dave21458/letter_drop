package com.example.letterdrop;

import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Random;
import android.content.Context;
import android.database.Cursor;
import android.database.SQLException;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteException;
import android.database.sqlite.SQLiteOpenHelper;

public class DataBaseHelper extends SQLiteOpenHelper {
	private static String DB_PATH = "/data/data/com.example.letterdrop/databases/";
    private static String DB_NAME = "quotes.sqlite";
    private static int version = 3;
    private SQLiteDatabase db; 
    private final Context myContext;
    public String quotes;
    public String bywhom;
    public String subject;
    public int puzzNumber = 0;
    public String curUser;
    public int curUserId=0;
    
    public DataBaseHelper(Context context) {
    	super(context, DB_NAME, null, version);
        this.myContext = context;
    }
    
    public void createDataBase() throws IOException{
    	boolean dbExist = checkDataBase();
    	if(dbExist){
    		//do nothing - database already exist
    	}else{
        	this.getReadableDatabase();
        	try {
    			copyDataBase();
    		} catch (IOException e) {
        		throw new Error("Error copying database");
        	}
    	}
    }
    
    private boolean checkDataBase(){
    	SQLiteDatabase checkDB = null;
    	try{
    		String myPath = DB_PATH + DB_NAME;
    		checkDB = SQLiteDatabase.openDatabase(myPath, null, SQLiteDatabase.OPEN_READONLY);
    	}catch(SQLiteException e){
    		//database does't exist yet.
    	}
    	if(checkDB != null){
    		if(checkDB.getVersion() != version){
    			checkDB.close();
	    		this.getReadableDatabase();
	        	try {
	    			copyDataBase();
	    		} catch (IOException e) {
	        		throw new Error("Error copying database");
	    		}
    		}else{
	    		checkDB.close();
    		}
    	}
    	return checkDB != null ? true : false;
    }
    
    private void copyDataBase() throws IOException{
    	InputStream myInput = myContext.getAssets().open(DB_NAME);
    	String outFileName = DB_PATH + DB_NAME;
    	OutputStream myOutput = new FileOutputStream(outFileName);
    	byte[] buffer = new byte[1024];
    	int length;
    	while ((length = myInput.read(buffer))>0){
    		myOutput.write(buffer, 0, length);
    	}
    	myOutput.flush();
    	myOutput.close();
    	myInput.close();
 
    }
    
    public void openDataBase() throws SQLException{
        String myPath = DB_PATH + DB_NAME;
    	db = SQLiteDatabase.openDatabase(myPath, null, SQLiteDatabase.OPEN_READWRITE);
    	db.setVersion(version);
    }
    
    @Override
	public void onCreate(SQLiteDatabase db) {
 
	}
 
	@Override
	public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
		try {
			copyDataBase();
		} catch (IOException e) {
			
			e.printStackTrace();
		}
	}
    
    public synchronized void closeDataBase() {
	    if(db != null)db.close();
}
 
    @Override
	public synchronized void close() {
    	    if(db != null)db.close();
    	    super.close();
	}
    //---------- puzzle data methods -------------
	public void getPuzz(int minlen,int maxlen){
    	Cursor cursor = db.rawQuery("Select * from quote where len between " + minlen + " and " + maxlen,null);
    	int quindx = cursor.getColumnIndex("quote");
    	int whindx = cursor.getColumnIndex("whom");
    	int caindx = cursor.getColumnIndex("catagory");
    	int nuindx = cursor.getColumnIndex("_id");
    	int cnt = cursor.getCount();
    	Random ran = new Random();
    	int pn = ran.nextInt(cnt-1);
    	cursor.moveToFirst();
    	cursor.move(pn);
    	this.quotes =  cursor.getString(quindx);
    	this.bywhom= cursor.getString(whindx);
    	this.subject = cursor.getString(caindx);
    	this.puzzNumber = cursor.getInt(nuindx);
    	
    }
	
	public void getPuzz(int pnum){
    	Cursor cursor = db.rawQuery("Select * from quote where _id == " + pnum,null);
    	int quindx = cursor.getColumnIndex("quote");
    	int whindx = cursor.getColumnIndex("whom");
    	int caindx = cursor.getColumnIndex("catagory");
    	int nuindx = cursor.getColumnIndex("_id");
    	cursor.moveToFirst();
    	this.quotes =  cursor.getString(quindx);
    	this.bywhom= cursor.getString(whindx);
    	this.subject = cursor.getString(caindx);
    	this.puzzNumber = cursor.getInt(nuindx);
    	
    }
	
	//--- user data methods -----
	public boolean addUser(String name){
		if(userExist(name))return false;
		db.execSQL("UPDATE players SET current = 0");
		db.execSQL("INSERT INTO players (_id,name,current) values(" + getNextId() + ",'" + name + "'," + 1 +")" );
		getCurUser();
		return true;
	}
    
	public boolean userExist(String name){
		Cursor curs = db.rawQuery("Select count(*) as 'CNT'  From players WHERE name = '" + name + "'", null);
		curs.moveToFirst();
		if(curs.getInt(curs.getColumnIndex("CNT"))>0)return true;
		return false;
	}
	
	public String getCurUser(){
		Cursor curs = db.rawQuery("select name,_id from players where current = 1", null);
		this.curUser = "";
		if(curs.getCount() < 1){
			curs.close();
			curs = db.rawQuery("select name,_id from players LIMIT 1", null);
		}
		if(curs.getCount() > 0){
			curs.moveToFirst();
			this.curUser =curs.getString(curs.getColumnIndex("name"));
			this.curUserId =curs.getInt(curs.getColumnIndex("_id"));
		}
		return this.curUser;
	}
	
	public void changeUser(String name){
		db.execSQL("UPDATE players SET current = 0");
		db.execSQL("UPDATE players SET current = 1 WHERE name = '" + name + "'");
		getCurUser();
	}
	
	public String[] getuserList(){
		String[] users;
		int cnt=0;
		Cursor curs = db.rawQuery("SELECT name FROM players", null);
		curs.moveToFirst();
		users = new String[curs.getCount()];
		if(curs.getCount() > 0){
			while(cnt < curs.getCount()){
				users[cnt++]=curs.getString(curs.getColumnIndex("name"));
				curs.moveToNext();
			}
		}
		return users;
	}
	//----------- best time data ---------
	public int getUserBestTime(){
		if(this.puzzNumber > 0){
			Cursor curs=db.rawQuery("Select MIN(secs) as 'sec' from times where user = " + this.curUserId + "AND puzz = " + this.puzzNumber, null);
			if(curs.getColumnCount() < 1)return 0;
			curs.moveToFirst();
			return curs.getInt(curs.getColumnIndex("sec"));
		}
		return 0;
	}
	
	public int getbestTime(){
		if(this.puzzNumber > 0){
			Cursor curs=db.rawQuery("Select MIN(secs) as 'sec' from times where puzz = " + this.puzzNumber, null);
			if(curs.getColumnCount() < 1)return 0;
			curs.moveToFirst();
			return curs.getInt(curs.getColumnIndex("sec"));
		}
		return 0;
	}
	
	public void setCompTime(int secs){
		db.execSQL("INSERT INTO times SET puzz = " + this.puzzNumber + ",user = " + this.curUserId + ",secs = " + secs);
	} 
	
	private int getNextId(){
		Cursor curs = db.rawQuery("SELECT MAX(_id) FROM players",null);
		curs.moveToFirst();
		int id = curs.getInt(0);
		return id+1;
	}
}

