package br.com.agv.touch;

import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.graphics.drawable.StateListDrawable;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import br.com.agv.touch.core.VoxelWorld;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/** Product-specific visual tokens shared by every native screen. No network assets. */
final class UiKit {
    static final int INK=0xff10142f, SURFACE=0xfff6f6fc, PAPER=Color.WHITE;
    static final int TEXT=0xff191c39, MUTED=0xff58657b, LIME=0xffbdfa79;
    static final int CYAN=0xff77dcf0, BORDER=0xffe0e4ef, DANGER=0xffac3157;
    static final int VIOLET=0xff6352e8, PEACH=0xffffb29c, LAVENDER=0xffeae5ff, MINT=0xffb9f6db;
    final Context context;
    UiKit(Context context) { this.context=context; }
    int dp(float value) { return Math.round(value*context.getResources().getDisplayMetrics().density); }
    GradientDrawable shape(int color,int radius) {
        GradientDrawable d=new GradientDrawable();d.setColor(color);d.setCornerRadius(dp(radius));return d;
    }
    GradientDrawable gradient(int radius,int... colors) {
        GradientDrawable d=new GradientDrawable(GradientDrawable.Orientation.TL_BR,colors);
        d.setCornerRadius(dp(radius));
        return d;
    }
    GradientDrawable outline(int color,int radius,int borderColor) {
        GradientDrawable d=shape(color,radius);d.setStroke(dp(1),borderColor);return d;
    }
    TextView text(String value,int size,int color,boolean medium) {
        TextView v=new TextView(context);v.setText(value);v.setTextSize(size);v.setTextColor(color);
        v.setTypeface(Typeface.create(medium?"sans-serif-medium":"sans-serif",Typeface.NORMAL));
        v.setIncludeFontPadding(false);v.setLineSpacing(dp(2),1);return v;
    }
    TextView label(String value) {
        TextView v=text(value,12,MUTED,true);v.setLetterSpacing(.14f);return v;
    }
    Button button(String label,boolean primary,Runnable action) {
        return button(label,primary?VIOLET:PAPER,primary?PAPER:TEXT,action);
    }
    Button button(String label,int background,int foreground,Runnable action) {
        Button b=new Button(context);b.setText(label);b.setAllCaps(false);b.setTextSize(15);
        b.setTypeface(Typeface.create("sans-serif-medium",Typeface.NORMAL));
        boolean tv="tv".equals(context.getSharedPreferences("preferences",Context.MODE_PRIVATE).getString("profile","auto"));
        b.setMinHeight(dp(tv?64:52));b.setMinimumHeight(dp(tv?64:52));b.setMinWidth(0);b.setMinimumWidth(0);
        b.setPadding(dp(16),dp(10),dp(16),dp(10));b.setStateListAnimator(null);
        styleButton(b,background,foreground,false);
        b.setOnClickListener(v->action.run());return b;
    }
    void styleButton(Button b,int background,int foreground,boolean selected) {
        b.setTextColor(new ColorStateList(new int[][]{new int[]{-android.R.attr.state_enabled},new int[]{}},new int[]{0xff677b79,foreground}));
        StateListDrawable states=new StateListDrawable();
        states.addState(new int[]{-android.R.attr.state_enabled},shape(0xffe8eaf1,17));
        int ripple=foreground==PAPER?0x3dffffff:0x26163141;
        states.addState(new int[]{},new RippleDrawable(ColorStateList.valueOf(ripple),outline(background,17,selected?VIOLET:background==PAPER?BORDER:background),shape(Color.WHITE,17)));
        b.setBackground(states);b.setSelected(selected);
    }
    LinearLayout vertical() {LinearLayout v=new LinearLayout(context);v.setOrientation(LinearLayout.VERTICAL);return v;}
    LinearLayout row() {LinearLayout v=new LinearLayout(context);v.setOrientation(LinearLayout.HORIZONTAL);v.setGravity(Gravity.CENTER_VERTICAL);return v;}
    LinearLayout card() {
        LinearLayout v=vertical();v.setPadding(dp(20),dp(20),dp(20),dp(20));
        v.setBackground(outline(PAPER,24,BORDER));
        v.setElevation(dp(2));
        return v;
    }
    LinearLayout featureCard(int first,int second){
        LinearLayout v=vertical();
        v.setPadding(dp(20),dp(22),dp(20),dp(22));
        v.setBackground(gradient(24,first,second));
        return v;
    }
    TextView overline(String value,int color){
        TextView v=text(value,11,color,true);v.setLetterSpacing(.15f);return v;
    }
    View gap(int height) {View v=new View(context);v.setLayoutParams(new LinearLayout.LayoutParams(1,dp(height)));return v;}
    void addGap(LinearLayout parent,int height) {parent.addView(gap(height));}
    void addFull(LinearLayout parent,View v,int top) {
        LinearLayout.LayoutParams p=new LinearLayout.LayoutParams(-1,-2);p.topMargin=dp(top);parent.addView(v,p);
    }
    LinearLayout.LayoutParams weighted() {return new LinearLayout.LayoutParams(0,-2,1);}

    static final class Icon extends View {
        private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
        private final String kind;private int color;
        Icon(Context c,String kind,int color) {super(c);this.kind=kind;this.color=color;setImportantForAccessibility(IMPORTANT_FOR_ACCESSIBILITY_NO);}
        @Override protected void onDraw(Canvas c) {
            super.onDraw(c);c.save();c.scale(getWidth()/24f,getHeight()/24f);
            p.setColor(color);p.setStrokeWidth(1.75f);p.setStyle(Paint.Style.STROKE);p.setStrokeCap(Paint.Cap.ROUND);p.setStrokeJoin(Paint.Join.ROUND);
            Path path=new Path();
            if("home".equals(kind)) {path.moveTo(3,11);path.lineTo(12,3);path.lineTo(21,11);path.moveTo(5,10);path.lineTo(5,21);path.lineTo(10,21);path.lineTo(10,15);path.lineTo(14,15);path.lineTo(14,21);path.lineTo(19,21);path.lineTo(19,10);c.drawPath(path,p);}
            else if("explore".equals(kind)) {for(int y:new int[]{4,14})for(int x:new int[]{4,14})c.drawRoundRect(x,y,x+6,y+6,1,1,p);}
            else if("projects".equals(kind)) {path.moveTo(3,8);path.lineTo(3,5);path.lineTo(10,5);path.lineTo(12,8);path.lineTo(21,8);path.lineTo(21,20);path.lineTo(3,20);path.close();c.drawPath(path,p);}
            else if("settings".equals(kind)) {c.drawCircle(12,12,6,p);c.drawCircle(12,12,2,p);for(int i=0;i<8;i++){double a=i*Math.PI/4;c.drawLine(12+(float)Math.cos(a)*8,12+(float)Math.sin(a)*8,12+(float)Math.cos(a)*10,12+(float)Math.sin(a)*10,p);}}
            else if("cube".equals(kind)) {path.moveTo(12,2);path.lineTo(21,7);path.lineTo(21,17);path.lineTo(12,22);path.lineTo(3,17);path.lineTo(3,7);path.close();path.moveTo(3,7);path.lineTo(12,12);path.lineTo(21,7);path.moveTo(12,12);path.lineTo(12,22);c.drawPath(path,p);}
            else if("back".equals(kind)) {path.moveTo(13,5);path.lineTo(6,12);path.lineTo(13,19);path.moveTo(6,12);path.lineTo(21,12);c.drawPath(path,p);}
            else {c.drawLine(5,12,19,12,p);c.drawLine(12,5,12,19,p);}
            c.restore();
        }
    }

    /** A drawn illustration or a projection of actual saved blocks; not a fake saved-project thumbnail. */
    static final class BlockArt extends View {
        private final Paint p=new Paint(Paint.ANTI_ALIAS_FLAG);
        private final List<VoxelWorld.Block> blocks;
        private final boolean hero;
        BlockArt(Context c,List<VoxelWorld.Block> actual,boolean hero) {
            super(c);this.hero=hero;blocks=new ArrayList<>();
            if(actual!=null) blocks.addAll(actual);
            else {
                blocks.add(new VoxelWorld.Block(2,0,3,"wood"));blocks.add(new VoxelWorld.Block(4,0,3,"wood"));
                blocks.add(new VoxelWorld.Block(2,1,3,"ice"));blocks.add(new VoxelWorld.Block(3,1,3,"ice"));blocks.add(new VoxelWorld.Block(4,1,3,"ice"));
                blocks.add(new VoxelWorld.Block(4,2,3,"grass"));blocks.add(new VoxelWorld.Block(2,0,2,"crystal"));
            }
            blocks.sort(Comparator.comparingInt((VoxelWorld.Block b)->b.x+b.z).thenComparingInt(b->b.y));
            setContentDescription(actual==null?"Ilustração de uma construção com blocos":"Prévia da construção com "+blocks.size()+" blocos");
        }
        @Override protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            float w=getWidth(),h=getHeight();
            float minX=Float.POSITIVE_INFINITY,maxX=Float.NEGATIVE_INFINITY,minY=Float.POSITIVE_INFINITY,maxY=Float.NEGATIVE_INFINITY;
            for(VoxelWorld.Block b:blocks){float x=(b.x-b.z)*.5f,y=(b.x+b.z-7)*.25f-b.y*.6f;minX=Math.min(minX,x-.5f);maxX=Math.max(maxX,x+.5f);minY=Math.min(minY,y-.85f);maxY=Math.max(maxY,y+.25f);}
            if(blocks.isEmpty()){p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(2);p.setColor(0xffccdcd3);canvas.drawRoundRect(w*.25f,h*.2f,w*.75f,h*.75f,16,16,p);canvas.drawLine(w*.42f,h*.47f,w*.58f,h*.47f,p);canvas.drawLine(w*.5f,h*.35f,w*.5f,h*.59f,p);return;}
            float unit=Math.min(w*.82f/(maxX-minX),h*.8f/(maxY-minY));
            canvas.save();canvas.translate(w*.5f-(minX+maxX)*unit*.5f,h*.5f-(minY+maxY)*unit*.5f);
            p.setStyle(Paint.Style.FILL);p.setColor(0x10163141);canvas.drawOval(minX*unit,maxY*unit-unit*.25f,maxX*unit,maxY*unit+unit*.2f,p);
            for(VoxelWorld.Block b:blocks) {
                float x=(b.x-b.z)*unit*.5f,y=(b.x+b.z-7)*unit*.25f-b.y*unit*.6f;
                int color=VoxelWorld.materialColor(b.material);float half=unit*.49f,quarter=unit*.245f,height=unit*.59f;
                face(canvas,color,new float[]{x,y-height-quarter,x+half,y-height,x,y-height+quarter,x-half,y-height});
                face(canvas,shade(color,.76f),new float[]{x-half,y-height,x,y-height+quarter,x,y+quarter,x-half,y});
                face(canvas,shade(color,.9f),new float[]{x,y-height+quarter,x+half,y-height,x+half,y,x,y+quarter});
            }
            canvas.restore();
        }
        private void face(Canvas c,int color,float[] values) {Path path=new Path();path.moveTo(values[0],values[1]);for(int i=2;i<values.length;i+=2)path.lineTo(values[i],values[i+1]);path.close();p.setStyle(Paint.Style.FILL);p.setColor(color);c.drawPath(path,p);p.setStyle(Paint.Style.STROKE);p.setStrokeWidth(.8f);p.setColor(0x22163141);c.drawPath(path,p);}
        private int shade(int c,float factor){return Color.rgb((int)(Color.red(c)*factor),(int)(Color.green(c)*factor),(int)(Color.blue(c)*factor));}
    }
}
