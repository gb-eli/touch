package br.com.agv.touch.filamentlab;

import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.os.Bundle;
import android.view.Choreographer;
import android.view.MotionEvent;
import android.view.ScaleGestureDetector;
import android.view.Surface;
import android.view.SurfaceView;
import android.widget.*;
import android.graphics.Color;
import com.google.android.filament.*;
import com.google.android.filament.android.UiHelper;
import com.google.android.filament.gltfio.*;
import java.io.InputStream;
import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Locale;

public final class LabActivity extends Activity {
    private Engine engine;
    private com.google.android.filament.Renderer renderer;
    private com.google.android.filament.View view;
    private Scene scene;
    private Camera camera;
    private SwapChain chain;
    private UiHelper helper;
    private AssetLoader loader;
    private ResourceLoader resources;
    private UbershaderProvider materials;
    private FilamentAsset asset;
    private Skybox skybox;
    private IndirectLight ambient;
    private int cameraEntity, key, fill;
    private SurfaceView surface;
    private TextView status;
    private Button benchmark,copy;
    private boolean resumed,disposed,failed,orbit=true,testing=false;
    private float yaw=.6f,pitch=.25f,zoom=1f,lastX,lastY;
    private float[] center={0,0,0};
    private float radius=1f;
    private int width=1,height=1;
    private long lastFrame,windowStart,benchStart;
    private final FrameStats stats=new FrameStats(),benchStats=new FrameStats();
    private String backend="opengl",report="";
    private final Choreographer.FrameCallback callback=this::frame;
    @Override public void onCreate(Bundle state){
        super.onCreate(state);
        backend="vulkan".equals(getIntent().getStringExtra("backend"))?"vulkan":"opengl";
        LinearLayout root=new LinearLayout(this);root.setOrientation(LinearLayout.VERTICAL);root.setBackgroundColor(0xff101423);
        status=new TextView(this);status.setTextColor(Color.WHITE);status.setTextSize(16);status.setPadding(dp(12),dp(12),dp(12),dp(8));status.setText("Preparando "+backend+"…");root.addView(status);
        surface=new SurfaceView(this);root.addView(surface,new LinearLayout.LayoutParams(-1,0,1));
        HorizontalScrollView scroller=new HorizontalScrollView(this);LinearLayout bar=new LinearLayout(this);scroller.addView(bar);root.addView(scroller);
        button(bar,"Voltar",v->finish());
        button(bar,"Girar / pausar",v->{if(!testing)orbit=!orbit;});
        button(bar,"Enquadrar",v->{if(!testing){yaw=.6f;pitch=.25f;zoom=1;updateCamera();}});
        benchmark=button(bar,"Benchmark 12 s",v->toggleBenchmark());
        copy=button(bar,"Copiar relatório",v->{if(!report.isEmpty())((ClipboardManager)getSystemService(CLIPBOARD_SERVICE)).setPrimaryClip(ClipData.newPlainText("AGV Filament Lab",report));});copy.setEnabled(false);
        setContentView(root);
        try{initialize();setupTouch();}catch(RuntimeException|LinkageError error){fail(error);}
    }
    private Button button(LinearLayout parent,String label,android.view.View.OnClickListener listener){Button b=new Button(this);b.setText(label);b.setMinHeight(dp(56));b.setOnClickListener(listener);parent.addView(b);return b;}
    private int dp(int n){return Math.round(n*getResources().getDisplayMetrics().density);}
    private void initialize(){
        Gltfio.init();
        engine=Engine.create("vulkan".equals(backend)?Engine.Backend.VULKAN:Engine.Backend.OPENGL);
        if(engine==null)throw new IllegalStateException("Engine indisponível");
        renderer=engine.createRenderer();scene=engine.createScene();view=engine.createView();
        EntityManager em=EntityManager.get();cameraEntity=em.create();camera=engine.createCamera(cameraEntity);
        view.setScene(scene);view.setCamera(camera);view.setPostProcessingEnabled(true);view.setAntiAliasing(com.google.android.filament.View.AntiAliasing.FXAA);
        camera.setExposure(16f,1f/125f,100f);
        skybox=new Skybox.Builder().color(.012f,.018f,.028f,1f).build(engine);scene.setSkybox(skybox);
        ambient=new IndirectLight.Builder().irradiance(1,new float[]{.4f,.45f,.55f}).intensity(18000f).build(engine);scene.setIndirectLight(ambient);
        key=em.create();new LightManager.Builder(LightManager.Type.DIRECTIONAL).color(1f,.91f,.80f).intensity(95000f).direction(-.6f,-1f,-.7f).castShadows(false).build(engine,key);scene.addEntity(key);
        fill=em.create();new LightManager.Builder(LightManager.Type.DIRECTIONAL).color(.55f,.76f,1f).intensity(35000f).direction(.7f,-.3f,.5f).castShadows(false).build(engine,fill);scene.addEntity(fill);
        materials=new UbershaderProvider(engine);loader=new AssetLoader(engine,materials,em);resources=new ResourceLoader(engine);
        asset=loader.createAsset(readModel());if(asset==null)throw new IllegalStateException("GLB inválido");
        resources.loadResources(asset);asset.releaseSourceData();scene.addEntities(asset.getEntities());
        Box box=asset.getBoundingBox();center=box.getCenter();float[] half=box.getHalfExtent();radius=Math.max(.1f,(float)Math.sqrt(half[0]*half[0]+half[1]*half[1]+half[2]*half[2]));
        helper=new UiHelper(UiHelper.ContextErrorPolicy.DONT_CHECK);
        helper.setRenderCallback(new UiHelper.RendererCallback(){
            @Override public void onNativeWindowChanged(Surface nativeSurface){if(disposed||failed)return;try{releaseChain();chain=engine.createSwapChain(nativeSurface,helper.getSwapChainFlags());}catch(RuntimeException error){fail(error);}}
            @Override public void onDetachedFromSurface(){releaseChain();}
            @Override public void onResized(int w,int h){if(disposed||failed)return;if(testing&&(width!=w||height!=h))endBenchmark(false);width=Math.max(1,w);height=Math.max(1,h);view.setViewport(new Viewport(0,0,width,height));updateCamera();}
        });helper.attachTo(surface);
        updateCamera();status.setText("Filament · "+engine.getBackend()+" · aguardando superfície");
    }
    private ByteBuffer readModel(){
        try(InputStream in=getAssets().open("metal-rough.glb");ByteArrayOutputStream out=new ByteArrayOutputStream()){
            byte[] chunk=new byte[8192];int n;while((n=in.read(chunk))!=-1){out.write(chunk,0,n);if(out.size()>1024*1024)throw new IllegalStateException("Amostra acima do limite");}
            byte[] bytes=out.toByteArray();ByteBuffer data=ByteBuffer.allocateDirect(bytes.length).order(ByteOrder.nativeOrder());data.put(bytes);data.flip();return data;
        }catch(java.io.IOException error){throw new IllegalStateException("Amostra indisponível",error);}
    }
    private void updateCamera(){
        if(camera==null||disposed)return;
        double aspect=(double)width/height,vertical=Math.toRadians(40)*.5,horizontal=Math.atan(Math.tan(vertical)*aspect);
        double d=radius/Math.sin(Math.min(vertical,horizontal))*1.12*zoom;
        camera.setProjection(40,aspect,Math.max(.001,radius*.01),Math.max(radius*100,d*4),Camera.Fov.VERTICAL);
        camera.lookAt(center[0]+d*Math.cos(pitch)*Math.sin(yaw),center[1]+d*Math.sin(pitch),center[2]+d*Math.cos(pitch)*Math.cos(yaw),center[0],center[1],center[2],0,1,0);
    }
    private void setupTouch(){
        ScaleGestureDetector scale=new ScaleGestureDetector(this,new ScaleGestureDetector.SimpleOnScaleGestureListener(){
            @Override public boolean onScale(ScaleGestureDetector detector){if(!testing){zoom=Math.max(.65f,Math.min(3f,zoom/detector.getScaleFactor()));updateCamera();}return true;}
        });
        surface.setOnTouchListener((v,e)->{if(testing||failed)return true;scale.onTouchEvent(e);if(e.getActionMasked()==MotionEvent.ACTION_DOWN||e.getActionMasked()==MotionEvent.ACTION_POINTER_UP){lastX=e.getX();lastY=e.getY();}
            if(e.getActionMasked()==MotionEvent.ACTION_MOVE){float x=e.getX(),y=e.getY();if(e.getPointerCount()==1&&!scale.isInProgress()){yaw+=(x-lastX)*.007f;pitch=Math.max(-1.2f,Math.min(1.2f,pitch+(y-lastY)*.007f));updateCamera();}lastX=x;lastY=y;}return true;});
    }
    private void frame(long now){
        if(!resumed||failed||disposed)return;
        try{
            if(chain!=null&&helper.isReadyToRender()){
                if(lastFrame==0)lastFrame=now;double dt=Math.min(.05,(now-lastFrame)/1e9);lastFrame=now;
                if(orbit||testing){yaw+=(float)(dt*.35);updateCamera();}
                boolean accepted=renderer.beginFrame(chain,now);
                if(accepted){try{renderer.render(view);}finally{renderer.endFrame();}}
                stats.frame(now,accepted);
                if(windowStart==0)windowStart=now;
                if(testing){if(benchStart==0)benchStart=now;long elapsed=now-benchStart;
                    if(elapsed>=2_000_000_000L)benchStats.frame(now,accepted);
                    if(elapsed>=12_000_000_000L)endBenchmark(true);
                }
                if(now-windowStart>=1_000_000_000L){
                    status.setText(String.format(Locale.US,"Filament %s · %dx%d · %.1f FPS enviados · p95 %.1f ms%s",engine.getBackend(),width,height,stats.fps(),stats.p95ms(),testing?" · benchmark":""));
                    stats.reset();windowStart=now;
                }
            }
            Choreographer.getInstance().postFrameCallback(callback);
        }catch(RuntimeException|LinkageError error){fail(error);}
    }
    private void toggleBenchmark(){if(failed||disposed||chain==null)return;if(testing){endBenchmark(false);return;}testing=true;benchStart=0;benchStats.reset();report="";copy.setEnabled(false);benchmark.setText("Cancelar");}
    private void endBenchmark(boolean completed){
        if(!testing)return;testing=false;benchmark.setText("Benchmark 12 s");
        if(completed&&benchStats.accepted()>=2){report=String.format(Locale.US,"AGV Filament Lab 2.0-alpha.1\nBackend: %s\nModelo: Khronos MetalRoughSpheresNoTextures\nResolução: %dx%d\nFrames enviados: %d\nFrames recusados: %d\nFPS enviados: %.2f\np95 intervalo: %.2f ms\n2 s aquecimento + 10 s medição. Não mede apresentação ou tempo GPU.",engine.getBackend(),width,height,benchStats.accepted(),benchStats.skipped(),benchStats.fps(),benchStats.p95ms());copy.setEnabled(true);new AlertDialogCompat(this,report).show();}
    }
    private static final class AlertDialogCompat {
        final Activity activity;final String text;
        AlertDialogCompat(Activity a,String t){activity=a;text=t;}
        void show(){new android.app.AlertDialog.Builder(activity).setTitle("Resultado do benchmark").setMessage(text).setPositiveButton("Fechar",null).show();}
    }
    @Override protected void onResume(){super.onResume();resumed=true;lastFrame=windowStart=0;stats.reset();if(!failed&&!disposed)Choreographer.getInstance().postFrameCallback(callback);}
    @Override protected void onPause(){resumed=false;Choreographer.getInstance().removeFrameCallback(callback);endBenchmark(false);super.onPause();}
    private void releaseChain(){if(chain!=null&&engine!=null){SwapChain old=chain;chain=null;engine.destroySwapChain(old);engine.flushAndWait();}if(testing)endBenchmark(false);}
    private void fail(Throwable error){failed=true;resumed=false;Choreographer.getInstance().removeFrameCallback(callback);endBenchmark(false);status.setText("Motor indisponível: "+error.getClass().getSimpleName()+". Volte e teste outro backend.");benchmark.setEnabled(false);android.util.Log.e("AgvFilamentLab","Falha do motor",error);}
    @Override protected void onDestroy(){
        resumed=false;disposed=true;Choreographer.getInstance().removeFrameCallback(callback);
        try{if(helper!=null)helper.detach();releaseChain();if(engine!=null){
            if(asset!=null){scene.removeEntities(asset.getEntities());loader.destroyAsset(asset);}
            if(resources!=null)resources.destroy();if(loader!=null)loader.destroy();
            if(materials!=null){materials.destroyMaterials();materials.destroy();}
            if(scene!=null){scene.setSkybox(null);scene.setIndirectLight(null);}
            if(skybox!=null)engine.destroySkybox(skybox);if(ambient!=null)engine.destroyIndirectLight(ambient);
            EntityManager em=EntityManager.get();if(key!=0){engine.destroyEntity(key);em.destroy(key);}if(fill!=0){engine.destroyEntity(fill);em.destroy(fill);}
            if(view!=null)engine.destroyView(view);if(cameraEntity!=0){engine.destroyCameraComponent(cameraEntity);em.destroy(cameraEntity);}
            if(scene!=null)engine.destroyScene(scene);if(renderer!=null)engine.destroyRenderer(renderer);engine.destroy();
        }}catch(RuntimeException error){android.util.Log.e("AgvFilamentLab","Falha de descarte",error);}finally{super.onDestroy();}
    }
}
