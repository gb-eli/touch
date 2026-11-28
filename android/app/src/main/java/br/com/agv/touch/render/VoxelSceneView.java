package br.com.agv.touch.render;

import android.content.Context;
import android.opengl.GLES20;
import android.opengl.GLSurfaceView;
import android.opengl.Matrix;
import android.os.SystemClock;
import android.view.Choreographer;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.ViewConfiguration;
import br.com.agv.touch.core.VoxelWorld;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.FloatBuffer;
import java.util.ArrayList;
import java.util.List;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

/** A native OpenGL ES scene. All changes to the world require an explicit UI command. */
public final class VoxelSceneView extends GLSurfaceView implements GLSurfaceView.Renderer {
    public interface Listener {
        void onSelection(RayPicker.Hit hit);
        void onFrameStats(float fps, int contacts, String gpu);
    }
    private final VoxelWorld world;
    private final Listener listener;
    private final ScaleGestureDetector scaleDetector;
    private final int slop;
    private volatile float yaw = 45, pitch = 36, distance = 14;
    private volatile float[] inverse = new float[16];
    private volatile boolean inverseReady;
    private volatile int viewWidth = 1, viewHeight = 1;
    private volatile RayPicker.Hit selected;
    private volatile String mission = "free", tool = "add", material = "grass";
    private volatile int targetFps = 30;
    private boolean active, suppressTap, moved;
    private int pointerId=-1;
    private volatile int maxContacts;
    private float startX,startY,lastX,lastY;
    private long lastRender;
    private int program, posLocation, normalLocation, mvpLocation, colorLocation, lightLocation;
    private FloatBuffer cube, cubeNormals, edges, floor, floorNormals, grid;
    private int gridVertices;
    private long statsStart;
    private int frames;
    private String gpu="Aguardando renderização";
    private final float[] projection = new float[16], view = new float[16], pv = new float[16], model = new float[16], mvp = new float[16];
    private final Choreographer.FrameCallback ticker = new Choreographer.FrameCallback() {
        @Override public void doFrame(long frameTimeNanos) {
            if (!active) return;
            if (frameTimeNanos-lastRender >= 1000000000L/targetFps-1000000L) { requestRender(); lastRender=frameTimeNanos; }
            Choreographer.getInstance().postFrameCallback(this);
        }
    };

    public VoxelSceneView(Context context, VoxelWorld world, Listener listener) {
        super(context); this.world=world; this.listener=listener;
        setEGLContextClientVersion(2);
        setEGLConfigChooser(8,8,8,8,16,0);
        setPreserveEGLContextOnPause(true);
        setRenderer(this);
        setRenderMode(RENDERMODE_WHEN_DIRTY);
        slop=ViewConfiguration.get(context).getScaledTouchSlop();
        scaleDetector=new ScaleGestureDetector(context,new ScaleGestureDetector.SimpleOnScaleGestureListener(){
            @Override public boolean onScale(ScaleGestureDetector detector) {
                suppressTap=true;
                distance=Math.max(6f,Math.min(25f,distance/detector.getScaleFactor()));
                return true;
            }
        });
        setContentDescription("Área de construção 3D. Toque para selecionar uma posição e use o botão para confirmar. Na ferramenta Girar, arraste para mudar a vista. Use dois dedos para aproximar.");
        setFocusable(true);
    }
    public void setMission(String value) { mission=value; }
    public void setTool(String value) { tool=value; selected=null; listener.onSelection(null); }
    public void setMaterial(String value) { material=value; }
    public void setTargetFps(int value) { targetFps=value==60?60:30; }
    public void orbit(float degrees) { yaw+=degrees; }
    public void zoom(float factor) { distance=Math.max(6f,Math.min(25f,distance*factor)); }
    public void resetCamera() { yaw=45; pitch=36; distance=14; }
    public void clearSelection() { selected=null; listener.onSelection(null); }
    public RayPicker.Hit selection() { return selected; }
    public void selectCell(int x,int y,int z) { selected=new RayPicker.Hit(world.get(x,y,z),x,y,z,0);listener.onSelection(selected); }
    public float[] cameraState() { return new float[]{yaw,pitch,distance}; }
    public void restoreCamera(float[] data) { if(data!=null&&data.length==3) { yaw=data[0];pitch=Math.max(15,Math.min(75,data[1]));distance=Math.max(6,Math.min(25,data[2])); } }
    @Override protected void onAttachedToWindow() { super.onAttachedToWindow(); startFrames(); }
    @Override protected void onDetachedFromWindow() { stopFrames(); super.onDetachedFromWindow(); }
    private void startFrames() { if(!active) { active=true;Choreographer.getInstance().postFrameCallback(ticker); } }
    private void stopFrames() { active=false;Choreographer.getInstance().removeFrameCallback(ticker); }
    @Override public void onPause() { stopFrames(); pointerId=-1;suppressTap=true;super.onPause(); }
    @Override public void onResume() { super.onResume();startFrames(); }

    @Override public boolean onTouchEvent(MotionEvent e) {
        scaleDetector.onTouchEvent(e);
        maxContacts=Math.max(maxContacts,e.getPointerCount());
        int action=e.getActionMasked();
        if(action==MotionEvent.ACTION_DOWN) {
            pointerId=e.getPointerId(0); startX=lastX=e.getX();startY=lastY=e.getY();
            moved=false;suppressTap=false; getParent().requestDisallowInterceptTouchEvent(true); return true;
        }
        if(action==MotionEvent.ACTION_POINTER_DOWN) { suppressTap=true;return true; }
        if(action==MotionEvent.ACTION_MOVE) {
            int i=e.findPointerIndex(pointerId); if(i<0) { suppressTap=true;return true; }
            float x=e.getX(i),y=e.getY(i);
            if(Math.hypot(x-startX,y-startY)>slop) moved=true;
            if("orbit".equals(tool)&&e.getPointerCount()==1&&!suppressTap) {
                yaw-=(x-lastX)*.3f;pitch=Math.max(15,Math.min(75,pitch+(y-lastY)*.22f));
            }
            lastX=x;lastY=y;return true;
        }
        if(action==MotionEvent.ACTION_POINTER_UP) { suppressTap=true;return true; }
        if(action==MotionEvent.ACTION_UP) {
            if(!suppressTap&&!moved&&!"orbit".equals(tool)) select(e.getX(),e.getY());
            pointerId=-1;getParent().requestDisallowInterceptTouchEvent(false);performClick();return true;
        }
        if(action==MotionEvent.ACTION_CANCEL) { pointerId=-1;suppressTap=true;getParent().requestDisallowInterceptTouchEvent(false);return true; }
        return true;
    }
    @Override public boolean performClick() { super.performClick();return true; }
    private void select(float x,float y) {
        if(!inverseReady) return;
        float[] inv=inverse, near=new float[4],far=new float[4];
        float nx=2*x/viewWidth-1,ny=1-2*y/viewHeight;
        Matrix.multiplyMV(near,0,inv,0,new float[]{nx,ny,-1,1},0);
        Matrix.multiplyMV(far,0,inv,0,new float[]{nx,ny,1,1},0);
        if(Math.abs(near[3])<1e-7||Math.abs(far[3])<1e-7) return;
        float[] origin=new float[3], direction=new float[3];
        for(int i=0;i<3;i++){origin[i]=near[i]/near[3];direction[i]=far[i]/far[3]-origin[i];}
        selected=RayPicker.pick(origin,direction,world.blocks());listener.onSelection(selected);
    }

    @Override public void onSurfaceCreated(GL10 ignored,EGLConfig config) {
        GLES20.glClearColor(.929f,.956f,.937f,1);
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
        String vertex="attribute vec3 aPosition;attribute vec3 aNormal;uniform mat4 uMvp;uniform vec4 uColor;uniform float uLight;varying vec4 vColor;void main(){float light=0.64+0.36*max(dot(aNormal,normalize(vec3(-0.4,0.85,0.6))),0.0);vColor=vec4(uColor.rgb*mix(1.0,light,uLight),uColor.a);gl_Position=uMvp*vec4(aPosition,1.0);}";
        String fragment="precision mediump float;varying vec4 vColor;void main(){gl_FragColor=vColor;}";
        program=GLES20.glCreateProgram();GLES20.glAttachShader(program,shader(GLES20.GL_VERTEX_SHADER,vertex));GLES20.glAttachShader(program,shader(GLES20.GL_FRAGMENT_SHADER,fragment));GLES20.glLinkProgram(program);
        int[] status=new int[1];GLES20.glGetProgramiv(program,GLES20.GL_LINK_STATUS,status,0);if(status[0]==0) throw new IllegalStateException("Não foi possível iniciar a cena 3D: "+GLES20.glGetProgramInfoLog(program));
        posLocation=GLES20.glGetAttribLocation(program,"aPosition");normalLocation=GLES20.glGetAttribLocation(program,"aNormal");mvpLocation=GLES20.glGetUniformLocation(program,"uMvp");colorLocation=GLES20.glGetUniformLocation(program,"uColor");lightLocation=GLES20.glGetUniformLocation(program,"uLight");
        makeGeometry();gpu=GLES20.glGetString(GLES20.GL_RENDERER);statsStart=SystemClock.elapsedRealtime();frames=0;
    }
    private static int shader(int type,String source) { int s=GLES20.glCreateShader(type);GLES20.glShaderSource(s,source);GLES20.glCompileShader(s);int[] ok=new int[1];GLES20.glGetShaderiv(s,GLES20.GL_COMPILE_STATUS,ok,0);if(ok[0]==0) throw new IllegalStateException(GLES20.glGetShaderInfoLog(s));return s; }
    @Override public void onSurfaceChanged(GL10 gl,int width,int height) {viewWidth=width;viewHeight=Math.max(1,height);GLES20.glViewport(0,0,width,height);}
    @Override public void onDrawFrame(GL10 gl) {
        GLES20.glClear(GLES20.GL_COLOR_BUFFER_BIT|GLES20.GL_DEPTH_BUFFER_BIT);
        GLES20.glUseProgram(program);
        float aspect=(float)viewWidth/viewHeight;
        float a=(float)Math.toRadians(yaw),p=(float)Math.toRadians(pitch),d=distance*Math.max(1f,1.05f/aspect);
        Matrix.perspectiveM(projection,0,42,aspect,.5f,100f);
        Matrix.setLookAtM(view,0,(float)(Math.cos(a)*Math.cos(p)*d),(float)(Math.sin(p)*d+1),(float)(Math.sin(a)*Math.cos(p)*d),0,1,0,0,1,0);
        Matrix.multiplyMM(pv,0,projection,0,view,0);
        float[] inv=new float[16]; if(Matrix.invertM(inv,0,pv,0)){inverse=inv;inverseReady=true;}
        GLES20.glEnableVertexAttribArray(posLocation);GLES20.glEnableVertexAttribArray(normalLocation);
        for(int x=0;x<8;x++) for(int z=0;z<8;z++) {
            float tint=(x+z)%2==0?.91f:.94f;
            draw(floor,floorNormals,6,GLES20.GL_TRIANGLES,x-3.5f,-.015f,z-3.5f,1,new float[]{tint,tint+.025f,tint+.005f,1},false);
        }
        // Grid lines precede all blocks; disable depth here to avoid coplanar flicker.
        GLES20.glDisable(GLES20.GL_DEPTH_TEST);
        draw(grid,null,gridVertices,GLES20.GL_LINES,0,0,0,1,new float[]{.76f,.82f,.78f,1},false);
        GLES20.glEnable(GLES20.GL_DEPTH_TEST);
        List<VoxelWorld.Block> blocks=world.blocks();
        for(VoxelWorld.Block b:blocks) draw(cube,cubeNormals,36,GLES20.GL_TRIANGLES,b.x-3.5f,b.y+.5f,b.z-3.5f,.97f,rgba(VoxelWorld.materialColor(b.material),1),true);
        GLES20.glEnable(GLES20.GL_BLEND);GLES20.glBlendFunc(GLES20.GL_SRC_ALPHA,GLES20.GL_ONE_MINUS_SRC_ALPHA);GLES20.glDepthMask(false);
        for(VoxelWorld.Block b:VoxelWorld.goals(mission)) if(!world.has(b.x,b.y,b.z)) {
            draw(cube,cubeNormals,36,GLES20.GL_TRIANGLES,b.x-3.5f,b.y+.5f,b.z-3.5f,.92f,new float[]{.22f,.65f,.72f,.12f},false);
            draw(edges,null,24,GLES20.GL_LINES,b.x-3.5f,b.y+.5f,b.z-3.5f,.93f,new float[]{.18f,.57f,.64f,.65f},false);
        }
        RayPicker.Hit hit=selected;
        if(hit!=null) {
            int sx=hit.x,sy=hit.y,sz=hit.z;
            boolean erase="erase".equals(tool);
            if(erase&&hit.block!=null) {sx=hit.block.x;sy=hit.block.y;sz=hit.block.z;}
            if((erase&&hit.block!=null)||(!erase&&hit.inBounds)) {
                boolean valid=erase?hit.block!=null:world.canPlace(sx,sy,sz);
                float[] c=erase||!valid?new float[]{.82f,.24f,.29f,.3f}:rgba(VoxelWorld.materialColor(material),.45f);
                draw(cube,cubeNormals,36,GLES20.GL_TRIANGLES,sx-3.5f,sy+.5f,sz-3.5f,1.015f,c,false);
                c[3]=1;draw(edges,null,24,GLES20.GL_LINES,sx-3.5f,sy+.5f,sz-3.5f,1.025f,c,false);
            }
        }
        GLES20.glDepthMask(true);GLES20.glDisable(GLES20.GL_BLEND);
        frames++;long now=SystemClock.elapsedRealtime();
        if(now-statsStart>=1000){final float fps=frames*1000f/(now-statsStart);final int contacts=maxContacts;post(()->listener.onFrameStats(fps,contacts,gpu));frames=0;statsStart=now;}
    }
    private void draw(FloatBuffer vertices,FloatBuffer normals,int count,int mode,float x,float y,float z,float scale,float[] color,boolean lit) {
        Matrix.setIdentityM(model,0);Matrix.translateM(model,0,x,y,z);Matrix.scaleM(model,0,scale,scale,scale);Matrix.multiplyMM(mvp,0,pv,0,model,0);
        GLES20.glUniformMatrix4fv(mvpLocation,1,false,mvp,0);GLES20.glUniform4fv(colorLocation,1,color,0);GLES20.glUniform1f(lightLocation,lit?1:0);
        vertices.position(0);GLES20.glVertexAttribPointer(posLocation,3,GLES20.GL_FLOAT,false,0,vertices);
        if(normals!=null){GLES20.glEnableVertexAttribArray(normalLocation);normals.position(0);GLES20.glVertexAttribPointer(normalLocation,3,GLES20.GL_FLOAT,false,0,normals);}else {GLES20.glDisableVertexAttribArray(normalLocation);GLES20.glVertexAttrib3f(normalLocation,0,1,0);}
        GLES20.glDrawArrays(mode,0,count);
    }
    private static float[] rgba(int value,float alpha) {return new float[]{((value>>16)&255)/255f,((value>>8)&255)/255f,(value&255)/255f,alpha};}
    private static FloatBuffer buffer(float[] values) {FloatBuffer b=ByteBuffer.allocateDirect(values.length*4).order(ByteOrder.nativeOrder()).asFloatBuffer();b.put(values).position(0);return b;}
    private void makeGeometry() {
        float[][] corners={{-.5f,-.5f,-.5f},{.5f,-.5f,-.5f},{.5f,.5f,-.5f},{-.5f,.5f,-.5f},{-.5f,-.5f,.5f},{.5f,-.5f,.5f},{.5f,.5f,.5f},{-.5f,.5f,.5f}};
        int[][] faces={{0,3,2,1},{4,5,6,7},{0,4,7,3},{1,2,6,5},{3,7,6,2},{0,1,5,4}};
        float[][] normals={{0,0,-1},{0,0,1},{-1,0,0},{1,0,0},{0,1,0},{0,-1,0}};
        int[] order={0,1,2,0,2,3};float[] points=new float[108],normalValues=new float[108];int offset=0;
        for(int f=0;f<6;f++)for(int j:order)for(int axis=0;axis<3;axis++){points[offset]=corners[faces[f][j]][axis];normalValues[offset]=normals[f][axis];offset++;}
        cube=buffer(points);cubeNormals=buffer(normalValues);
        int[][] pairs={{0,1},{1,2},{2,3},{3,0},{4,5},{5,6},{6,7},{7,4},{0,4},{1,5},{2,6},{3,7}};
        float[] e=new float[72];offset=0;for(int[] pair:pairs)for(int index:pair)for(float value:corners[index])e[offset++]=value;edges=buffer(e);
        floor=buffer(new float[]{-.5f,0,-.5f,.5f,0,-.5f,.5f,0,.5f,-.5f,0,-.5f,.5f,0,.5f,-.5f,0,.5f});
        floorNormals=buffer(new float[]{0,1,0,0,1,0,0,1,0,0,1,0,0,1,0,0,1,0});
        float[] lines=new float[9*4*3];offset=0;for(int i=0;i<=8;i++){float c=i-4;float[] line={c,.001f,-4,c,.001f,4,-4,.001f,c,4,.001f,c};for(float v:line)lines[offset++]=v;}grid=buffer(lines);gridVertices=36;
    }
}
