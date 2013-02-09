package com.example.letterdrop;

import android.os.Bundle;
import android.app.Activity;
import android.content.Intent;
import android.content.SharedPreferences;
import android.view.Menu;
import android.view.View;
import android.widget.ImageButton;

public class Opener extends Activity {
	
	private ImageButton playButt;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);
		setContentView(R.layout.activity_opener);
		playButt = (ImageButton)findViewById(R.id.spButtonPlay);
		playButt.setOnClickListener(new View.OnClickListener(){
			@Override
			public void onClick(View v){
				Intent intent= new Intent(Opener.this,LetterDrop.class);
				startActivity(intent);
				Opener.this.finish();
			}
		});
		SharedPreferences setting = getSharedPreferences("letdrop",MODE_PRIVATE);
		int pnum = setting.getInt("PUZZ_NUM", 0);
		if(pnum > 0){
			Intent intent= new Intent(Opener.this,LetterDrop.class);
			startActivity(intent);
			Opener.this.finish();
		}
	}

	@Override
	public boolean onCreateOptionsMenu(Menu menu) {
		// Inflate the menu; this adds items to the action bar if it is present.
		getMenuInflater().inflate(R.menu.activity_opener, menu);
		return true;
	}

}
