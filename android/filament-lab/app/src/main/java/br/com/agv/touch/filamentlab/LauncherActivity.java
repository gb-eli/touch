package br.com.agv.touch.filamentlab;
import android.app.Activity;
import android.app.ActivityManager;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.graphics.Color;
import android.view.View;
import android.widget.*;

public final class LauncherActivity extends Activity {
    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        LinearLayout panel=new LinearLayout(this);panel.setOrientation(LinearLayout.VERTICAL);
        panel.setPadding(dp(24),dp(28),dp(24),dp(24));panel.setBackgroundColor(Color.rgb(16,20,35));
        ScrollView scroll=new ScrollView(this);scroll.addView(panel);setContentView(scroll);
        TextView title=new TextView(this);title.setText("AGV TOUCH · FILAMENT LAB");title.setTextColor(Color.WHITE);title.setTextSize(28);panel.addView(title);
        ActivityManager am=(ActivityManager)getSystemService(ACTIVITY_SERVICE);
        int gl=am.getDeviceConfigurationInfo().reqGlEsVersion;
        boolean vulkan=getPackageManager().hasSystemFeature(PackageManager.FEATURE_VULKAN_HARDWARE_LEVEL);
        TextView info=new TextView(this);info.setTextColor(0xffc4cfdf);info.setTextSize(16);
        info.setText("Prova de conceito 2.0-alpha.1\nOpenGL ES informado: "+(gl>>16)+"."+(gl&0xffff)+"\nVulkan informado: "+(vulkan?"sim":"não")+"\nA disponibilidade informada não garante funcionamento. O app de construção e seus projetos não são alterados.");
        panel.addView(info);
        add(panel,"Testar OpenGL", "opengl",gl>=0x00030000);
        add(panel,"Testar Vulkan (experimental)", "vulkan",vulkan);
    }
    private void add(LinearLayout parent,String label,String backend,boolean enabled){
        Button b=new Button(this);b.setText(label);b.setMinHeight(dp(56));b.setEnabled(enabled);parent.addView(b);
        b.setOnClickListener(v->startActivity(new Intent(this,LabActivity.class).putExtra("backend",backend)));
    }
    private int dp(int v){return Math.round(v*getResources().getDisplayMetrics().density);}
}
