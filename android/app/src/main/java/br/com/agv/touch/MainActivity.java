package br.com.agv.touch;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.InputFilter;
import android.view.Gravity;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;
import android.widget.Toast;
import br.com.agv.touch.core.ProjectCodec;
import br.com.agv.touch.core.ProjectStore;
import br.com.agv.touch.core.ProjectTransfers;
import br.com.agv.touch.core.VoxelWorld;
import br.com.agv.touch.core.CreativeLibrary;
import br.com.agv.touch.updates.AppUpdater;
import java.io.IOException;
import java.text.DateFormat;
import java.util.Collections;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Set;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.json.JSONArray;
import org.json.JSONObject;

/** Native, offline MVP. Android capability reporting never grants a feature by UI profile. */
public final class MainActivity extends Activity implements ProjectTransfers.Listener {
    private static final int IMPORT_PROJECT=20,EXPORT_DOCUMENT=21;
    private VoxelWorld world=new VoxelWorld();
    private UiKit ui;
    private SharedPreferences prefs;
    private ProjectStore store;
    private ProjectCodec.Project current;
    private boolean dirty,projectSaved,wide,leaving;
    private String screen="home",mission="free",briefingMission="bridge",editorMaterial="grass",editorTool="add",pendingExport,storageWarning,projectFilter="all";
    private FrameLayout content;
    private BuilderScreen builder;
    private float[] lastCamera;
    private float latestFps;
    private int observedContacts;
    private String gpu="Abra o construtor para detectar";
    private String sessionToken=UUID.randomUUID().toString(),pendingImportToken;
    private ProjectTransfers transfers;
    private AppUpdater updater;
    private AlertDialog transferDialog;
    private boolean interruptedTransfer,resetEditorCamera;

    private static final class RetainedSession {
        final VoxelWorld world;
        final ProjectTransfers transfers;
        RetainedSession(VoxelWorld world,ProjectTransfers transfers){this.world=world;this.transfers=transfers;}
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);ui=new UiKit(this);prefs=getSharedPreferences("preferences",MODE_PRIVATE);
        RetainedSession retainedSession=getLastNonConfigurationInstance() instanceof RetainedSession?(RetainedSession)getLastNonConfigurationInstance():null;
        boolean retained=retainedSession!=null;
        if(retained){world=retainedSession.world;transfers=retainedSession.transfers;}
        else {Handler handler=new Handler(Looper.getMainLooper());transfers=new ProjectTransfers(handler::post);}
        getWindow().setStatusBarColor(UiKit.INK);getWindow().setNavigationBarColor(UiKit.INK);
        try {store=new ProjectStore(this);}catch(IOException e){storageWarning=e.getMessage();}
        if(state!=null) {
            screen=state.getString("screen","home");mission=state.getString("mission","free");briefingMission=state.getString("briefing_mission","bridge");projectFilter=state.getString("project_filter","all");
            editorMaterial=state.getString("material","grass");editorTool=state.getString("tool","add");
            pendingExport=state.getString("pending_export");dirty=state.getBoolean("dirty");projectSaved=state.getBoolean("saved");lastCamera=state.getFloatArray("camera");
            sessionToken=state.getString("session_token",sessionToken);pendingImportToken=state.getString("pending_import_token");
            interruptedTransfer=!retained&&state.getBoolean("transfer_pending");
            String draft=state.getString("project");
            if(draft!=null)try{current=ProjectCodec.decodeStored(draft);if(!retained)world.initialize(current.blocks);}catch(Exception e){screen="home";storageWarning="Não foi possível restaurar a sessão. Seus arquivos salvos foram preservados.";}
        } else if(store!=null) {
            String id=prefs.getString("last_project",null);
            if(id!=null)try{ProjectStore.LoadResult r=store.load(id);current=r.project;world.initialize(current.blocks);mission=current.mission;projectSaved=true;dirty=r.recovered;if(r.recovered)storageWarning=r.warning;}catch(IOException ignored){ }
        }
        if("builder".equals(screen)&&current==null)screen="home";
        updater=new AppUpdater(this,prefs,()->{if("settings".equals(screen))render();});
        render();
        if(!retained&&store!=null)content.post(()->offerRecovery(state!=null));
        content.post(()->{if(updater!=null)updater.checkIfDue();});
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        out.putString("screen",screen);out.putString("project_filter",projectFilter);out.putString("mission",mission);out.putString("briefing_mission",briefingMission);out.putBoolean("dirty",dirty);out.putBoolean("saved",projectSaved);out.putString("pending_export",pendingExport);
        out.putString("session_token",sessionToken);out.putString("pending_import_token",pendingImportToken);out.putBoolean("transfer_pending",transfers!=null&&transfers.hasPendingOperation());
        if(builder!=null){lastCamera=builder.scene.cameraState();editorMaterial=builder.material();editorTool=builder.tool();}out.putFloatArray("camera",lastCamera);out.putString("material",editorMaterial);out.putString("tool",editorTool);
        if(current!=null)try{out.putString("project",ProjectCodec.encode(snapshot(current.name)));}catch(Exception ignored){persistRecovery();}
    }
    @Override protected void onPause(){if(transfers!=null)transfers.detach();dismissTransferDialog();persistRecovery();if(builder!=null)builder.scene.onPause();super.onPause();}
    @Override protected void onResume(){super.onResume();if(updater!=null)updater.onResume();if(builder!=null)builder.scene.onResume();if(transfers!=null)transfers.attach(this);if(interruptedTransfer){interruptedTransfer=false;Toast.makeText(this,"A sessão de transferência foi interrompida pelo sistema. Confira Projetos e o arquivo de destino antes de tentar novamente.",Toast.LENGTH_LONG).show();}}
    @Override protected void onDestroy(){if(updater!=null)updater.close();dismissTransferDialog();if(transfers!=null){transfers.detach();if(!isChangingConfigurations())transfers.close();}super.onDestroy();}
    @Override public Object onRetainNonConfigurationInstance(){return new RetainedSession(world,transfers);}
    @Override public void onBackPressed(){
        if(blockForTransfer())return;
        if("builder".equals(screen)){navigate("home");return;}
        if(!"home".equals(screen)){navigate("home");return;}
        super.onBackPressed();
    }

    private void render() {
        if(builder!=null){if(!resetEditorCamera)lastCamera=builder.scene.cameraState();editorMaterial=builder.material();editorTool=builder.tool();builder.scene.onPause();builder=null;}
        if(resetEditorCamera){lastCamera=null;resetEditorCamera=false;}
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        String profile=prefs.getString("profile","auto");
        wide=getResources().getConfiguration().screenWidthDp>=840&&!"phone".equals(profile);
        LinearLayout outer=ui.vertical();outer.setBackgroundColor(UiKit.INK);
        outer.setOnApplyWindowInsetsListener((v,insets)->{
            if(Build.VERSION.SDK_INT>=30){android.graphics.Insets bars=insets.getInsets(WindowInsets.Type.systemBars()|WindowInsets.Type.displayCutout());v.setPadding(bars.left,bars.top,bars.right,bars.bottom);}
            else v.setPadding(insets.getSystemWindowInsetLeft(),insets.getSystemWindowInsetTop(),insets.getSystemWindowInsetRight(),insets.getSystemWindowInsetBottom());
            return insets;
        });
        boolean activity="builder".equals(screen);
        LinearLayout shell=wide&&!activity?ui.row():ui.vertical();shell.setGravity(Gravity.TOP);outer.addView(shell,new LinearLayout.LayoutParams(-1,0,1));
        content=new FrameLayout(this);content.setBackgroundColor(UiKit.SURFACE);
        if(wide&&!activity){shell.addView(navigation(true),new LinearLayout.LayoutParams(ui.dp(188),-1));shell.addView(content,new LinearLayout.LayoutParams(0,-1,1));}
        else {shell.addView(content,new LinearLayout.LayoutParams(-1,0,1));if(!activity)shell.addView(navigation(false),new LinearLayout.LayoutParams(-1,ui.dp(82)));}
        setContentView(outer);outer.requestApplyInsets();
        switch(screen){case"builder":showBuilder();break;case"explore":showExplore();break;case"library":showLibrary();break;case"projects":showProjects();break;case"settings":showSettings();break;case"mission":showMission();break;default:screen="home";showHome();}
    }

    private LinearLayout navigation(boolean rail) {
        LinearLayout nav=rail?ui.vertical():ui.row();nav.setBackgroundColor(UiKit.INK);nav.setPadding(ui.dp(rail?18:8),ui.dp(rail?26:4),ui.dp(rail?18:8),ui.dp(rail?20:4));
        if(rail){
            LinearLayout brand=ui.row();brand.addView(new UiKit.Icon(this,"cube",UiKit.LIME),new LinearLayout.LayoutParams(ui.dp(28),ui.dp(28)));
            TextView name=ui.text("TV TOUCH",18,UiKit.PAPER,true);name.setPadding(ui.dp(10),0,0,0);brand.addView(name);nav.addView(brand);
            TextView caption=ui.text("Criar. Experimentar.\nAprender.",13,0xffa7bdc5,false);ui.addFull(nav,caption,18);
            View space=new View(this);nav.addView(space,new LinearLayout.LayoutParams(1,0,1));
        }
        String[][] destinations={{"home","Início"},{"explore","Explorar"},{"library","Biblioteca"},{"projects","Projetos"},{"settings","Ajustes"}};
        for(String[] d:destinations){
            boolean chosen=d[0].equals(screen)||("mission".equals(screen)&&"explore".equals(d[0]));
            LinearLayout item=rail?ui.row():ui.vertical();item.setGravity(Gravity.CENTER);item.setPadding(ui.dp(rail?14:2),ui.dp(10),ui.dp(rail?10:2),ui.dp(10));
            item.setBackground(ui.shape(chosen?0xff2d2a63:UiKit.INK,18));item.setClickable(true);item.setFocusable(true);item.setSelected(chosen);item.setContentDescription(d[1]+(chosen?", selecionado":""));
            item.addView(new UiKit.Icon(this,d[0],chosen?UiKit.LIME:0xffbfc6eb),new LinearLayout.LayoutParams(ui.dp(22),ui.dp(22)));
            TextView label=ui.text(d[1],rail?15:12,chosen?UiKit.PAPER:0xffc4d3d7,chosen);label.setGravity(rail?Gravity.CENTER_VERTICAL:Gravity.CENTER);if(rail)label.setPadding(ui.dp(12),0,0,0);else label.setPadding(0,ui.dp(4),0,0);item.addView(label);item.setOnClickListener(v->navigate(d[0]));
            LinearLayout.LayoutParams p=rail?new LinearLayout.LayoutParams(-1,ui.dp(56)):new LinearLayout.LayoutParams(0,-1,1);if(rail)p.topMargin=ui.dp(8);nav.addView(item,p);
        }
        if(rail){ui.addGap(nav,28);nav.addView(ui.text("Seu espaço de criação",12,0xffa7bdc5,false));}
        return nav;
    }

    private LinearLayout page(String eyebrow,String title,String description) {
        ScrollView scroll=new ScrollView(this);scroll.setFillViewport(true);scroll.setClipToPadding(false);
        LinearLayout p=ui.vertical();p.setPadding(ui.dp(wide?30:20),ui.dp(wide?28:22),ui.dp(wide?30:20),ui.dp(28));
        if(!wide){LinearLayout brand=ui.row();brand.addView(new UiKit.Icon(this,"cube",UiKit.VIOLET),new LinearLayout.LayoutParams(ui.dp(22),ui.dp(22)));TextView name=ui.text("TV TOUCH",14,UiKit.TEXT,true);name.setPadding(ui.dp(8),0,0,0);brand.addView(name);p.addView(brand);ui.addGap(p,26);}
        p.addView(ui.overline(eyebrow,UiKit.VIOLET));ui.addGap(p,10);p.addView(ui.text(title,wide?38:30,UiKit.TEXT,true));
        if(description!=null){TextView text=ui.text(description,16,UiKit.MUTED,false);ui.addFull(p,text,10);}
        ui.addGap(p,24);scroll.addView(p);content.addView(scroll,new FrameLayout.LayoutParams(-1,-1));return p;
    }
    private void showHome(){
        LinearLayout p=page("STUDIO / 02","Ideias ganham forma.","Um espaço para criar, explorar e descobrir no seu ritmo.");
        if(storageWarning!=null){ui.addFull(p,ui.text(storageWarning,14,UiKit.DANGER,false),0);ui.addGap(p,14);}
        LinearLayout hero=ui.featureCard(UiKit.INK,0xff43328f);
        hero.addView(ui.overline("SEU PRÓXIMO PROJETO  ✦",UiKit.LIME));
        ui.addFull(hero,ui.text("Um universo\npara inventar.",wide?38:29,UiKit.PAPER,true),13);
        ui.addFull(hero,ui.text("Construa mundos em 3D. O primeiro bloco é seu.",15,0xffdbd8fa,false),9);
        LinearLayout artRow=ui.row();
        Button create=ui.button("Criar agora  →",UiKit.LIME,UiKit.INK,()->newProject("free"));
        artRow.addView(create,new LinearLayout.LayoutParams(0,-2,1));
        UiKit.BlockArt art=new UiKit.BlockArt(this,null,true);
        LinearLayout.LayoutParams artParams=new LinearLayout.LayoutParams(0,ui.dp(wide?175:140),1);
        artParams.leftMargin=ui.dp(12);artRow.addView(art,artParams);
        ui.addFull(hero,artRow,12);
        p.addView(hero,new LinearLayout.LayoutParams(-1,-2));
        if(current!=null){
            LinearLayout resume=ui.card();
            resume.addView(ui.overline(dirty||!projectSaved?"RASCUNHO EM ANDAMENTO":"SEU ÚLTIMO PROJETO",UiKit.VIOLET));
            ui.addFull(resume,ui.text(current.name,21,UiKit.TEXT,true),9);
            ui.addFull(resume,ui.text(world.count()+" blocos  ·  "+missionTitle(current.mission),14,UiKit.MUTED,false),5);
            ui.addFull(resume,ui.button("Continuar de onde parei",false,()->{mission=current.mission;screen="builder";render();}),14);
            ui.addFull(p,resume,14);
        }
        if(!prefs.getBoolean("onboarding_done",false)){
            LinearLayout welcome=ui.featureCard(UiKit.LAVENDER,0xffe2f7fa);
            welcome.addView(ui.overline("PRIMEIRA VEZ AQUI?",UiKit.VIOLET));
            ui.addFull(welcome,ui.text("Conheça o Studio em 3 passos.",20,UiKit.TEXT,true),8);
            ui.addFull(welcome,ui.text("Veja como criar, explorar a cena e guardar suas ideias.",14,UiKit.MUTED,false),7);
            ui.addFull(welcome,ui.button("Começar visita guiada",false,this::showOnboarding),12);
            ui.addFull(p,welcome,14);
        }
        ui.addGap(p,26);
        LinearLayout head=ui.row();head.addView(ui.text("Para explorar hoje",22,UiKit.TEXT,true),new LinearLayout.LayoutParams(0,-2,1));
        head.addView(ui.button("Ver tudo",false,()->navigate("explore")));
        p.addView(head);
        LinearLayout cards=wide?ui.row():ui.vertical();cards.setGravity(Gravity.TOP);
        addResponsiveCard(cards,missionCard("bridge"),wide);
        addResponsiveCard(cards,missionCard("tower"),wide);
        ui.addFull(p,cards,12);
        ui.addGap(p,22);
        LinearLayout library=ui.featureCard(0xffdff7ed,0xffdceafc);
        library.addView(ui.overline("BIBLIOTECA CRIATIVA",UiKit.VIOLET));
        ui.addFull(library,ui.text("Não precisa começar do zero.",22,UiKit.TEXT,true),10);
        ui.addFull(library,ui.text("Seis modelos editáveis: foguete, robô, jardim e muito mais.",15,UiKit.MUTED,false),8);
        ui.addFull(library,ui.button("Explorar modelos  →",false,()->navigate("library")),16);
        ui.addFull(p,library,12);
        ui.addFull(p,ui.text("Crie offline. Seus projetos ficam apenas neste aparelho.",13,UiKit.MUTED,false),22);
    }
    private void showExplore(){
        LinearLayout p=page("JORNADA CRIATIVA","Aprender fazendo.","Quatro desafios de construção, do primeiro bloco à simetria.");
        int completed=0;String[] missions={"tower","stairs","bridge","symmetry"};
        for(String id:missions)if(prefs.getBoolean("mission_done_"+id,false))completed++;
        LinearLayout summary=ui.featureCard(UiKit.LAVENDER,0xffdceffa);
        summary.addView(ui.overline("SEU PROGRESSO",UiKit.VIOLET));
        ui.addFull(summary,ui.text(completed+" de 4 desafios concluídos",23,UiKit.TEXT,true),10);
        ui.addFull(summary,ui.text(completed==4?"Você dominou a jornada! Continue experimentando.":"Cada missão ensina uma nova maneira de construir.",14,UiKit.MUTED,false),8);
        ui.addFull(p,summary,2);
        ui.addGap(p,22);
        LinearLayout freestyle=ui.card();
        freestyle.addView(ui.overline("MODO LIVRE",UiKit.VIOLET));
        ui.addFull(freestyle,ui.text("Crie sem limites.",22,UiKit.TEXT,true),8);
        ui.addFull(freestyle,ui.text("Escolha materiais, experimente volumes e descubra novas possibilidades.",15,UiKit.MUTED,false),7);
        ui.addFull(freestyle,ui.button("Abrir Studio 3D  →",true,()->newProject("free")),14);
        ui.addFull(p,freestyle,4);
        ui.addGap(p,24);p.addView(ui.text("As missões",23,UiKit.TEXT,true));
        for(int i=0;i<missions.length;i+=wide?2:1){
            LinearLayout row=wide?ui.row():ui.vertical();row.setGravity(Gravity.TOP);
            addResponsiveCard(row,missionCard(missions[i]),wide);
            if(wide&&i+1<missions.length)addResponsiveCard(row,missionCard(missions[i+1]),true);
            ui.addFull(p,row,12);
        }
        LinearLayout future=ui.featureCard(0xffe5e8ff,0xffdaf7f5);
        future.addView(ui.overline("PRÓXIMOS LABORATÓRIOS",UiKit.VIOLET));
        ui.addFull(future,ui.text("O espaço vai participar.",21,UiKit.TEXT,true),9);
        ui.addFull(future,ui.text("Realidade aumentada e jogos com movimentos estão em preparação. Ainda não estão disponíveis neste APK.",15,UiKit.MUTED,false),8);
        ui.addFull(future,ui.button("Entender próximos módulos",false,this::cameraInfo),13);
        ui.addFull(p,future,22);
    }
    private void showLibrary(){
        LinearLayout p=page("BIBLIOTECA CRIATIVA","Comece com inspiração.","Escolha um modelo pronto e transforme cada bloco do seu jeito.");
        LinearLayout banner=ui.featureCard(UiKit.INK,0xff493b99);
        banner.addView(ui.overline("100% OFFLINE  ·  100% EDITÁVEL",UiKit.LIME));
        ui.addFull(banner,ui.text("Pequenas ideias.\nGrandes possibilidades.",wide?30:24,UiKit.PAPER,true),10);
        ui.addFull(banner,ui.text("Seis construções originais para experimentar, modificar e salvar como suas.",15,0xffe3e0fa,false),9);
        p.addView(banner);
        java.util.List<CreativeLibrary.Template> templates=CreativeLibrary.all();
        for(int i=0;i<templates.size();i+=wide?2:1){
            LinearLayout row=wide?ui.row():ui.vertical();row.setGravity(Gravity.TOP);
            ui.addFull(p,row,14);
            addResponsiveCard(row,templateCard(templates.get(i)),wide);
            if(wide&&i+1<templates.size())addResponsiveCard(row,templateCard(templates.get(i+1)),true);
        }
        ui.addFull(p,ui.text("Ao escolher um modelo, uma cópia editável é aberta. Seus projetos anteriores permanecem intactos.",13,UiKit.MUTED,false),20);
    }
    private LinearLayout templateCard(CreativeLibrary.Template template){
        LinearLayout card=ui.card();
        card.addView(new UiKit.BlockArt(this,template.blocks,false),new LinearLayout.LayoutParams(-1,ui.dp(wide?160:138)));
        card.addView(ui.overline(template.category+"  ·  "+template.blocks.size()+" BLOCOS",UiKit.VIOLET));
        ui.addFull(card,ui.text(template.title,21,UiKit.TEXT,true),9);
        ui.addFull(card,ui.text(template.description,15,UiKit.MUTED,false),7);
        ui.addFull(card,ui.button("Personalizar modelo  →",false,()->openTemplate(template)),16);
        return card;
    }
    private void openTemplate(CreativeLibrary.Template template){
        if(blockForTransfer())return;
        leaveEditor(()->{
            current=ProjectCodec.create(template.title,"free",template.blocks);
            world.initialize(current.blocks);mission="free";projectSaved=false;dirty=true;
            sessionChanged();resetEditorCamera=true;lastCamera=null;persistRecovery();
            screen="builder";render();toast("Modelo pronto. Personalize e salve sua versão.");
        });
    }
    private void showOnboarding(){
        String[] steps={
            "01  Crie um novo mundo\n\nComece do zero ou use um dos modelos da Biblioteca. Tudo pode ser editado.",
            "02  Toque, escolha e confirme\n\nSelecione um ponto na grade e depois toque em Colocar bloco. Arraste para girar e use a pinça para aproximar.",
            "03  Guarde e continue\n\nUse Salvar para manter seu projeto. Em Projetos você pode abrir, duplicar, favoritar e exportar."};
        showOnboardingStep(steps,0);
    }
    private void showOnboardingStep(String[] steps,int index){
        new AlertDialog.Builder(this)
            .setTitle("Bem-vindo ao TV Touch  ·  "+(index+1)+"/"+steps.length)
            .setMessage(steps[index])
            .setNegativeButton("Pular",(d,w)->{prefs.edit().putBoolean("onboarding_done",true).apply();render();})
            .setPositiveButton(index==steps.length-1?"Começar a criar":"Próximo",(d,w)->{
                if(index==steps.length-1){
                    prefs.edit().putBoolean("onboarding_done",true).apply();
                    newProject("free");
                }else showOnboardingStep(steps,index+1);
            }).show();
    }
    private LinearLayout missionCard(String id){
        LinearLayout c=ui.card();c.addView(new UiKit.BlockArt(this,VoxelWorld.goals(id),false),new LinearLayout.LayoutParams(-1,ui.dp(122)));
        c.addView(ui.overline((prefs.getBoolean("mission_done_"+id,false)?"✓ CONCLUÍDO  ·  ":"")+VoxelWorld.goals(id).size()+" POSIÇÕES-ALVO",UiKit.VIOLET));ui.addFull(c,ui.text(missionTitle(id),22,UiKit.TEXT,true),10);ui.addFull(c,ui.text(missionDescription(id),15,UiKit.MUTED,false),8);ui.addFull(c,ui.button("Ver missão",false,()->{briefingMission=id;screen="mission";render();}),18);return c;
    }
    private void addResponsiveCard(LinearLayout row,View card,boolean horizontal){LinearLayout.LayoutParams lp=horizontal?new LinearLayout.LayoutParams(0,-2,1):new LinearLayout.LayoutParams(-1,-2);if(horizontal){if(row.getChildCount()>0)lp.leftMargin=ui.dp(14);}else if(row.getChildCount()>0)lp.topMargin=ui.dp(14);row.addView(card,lp);}
    private void showMission(){
        String brief=briefingMission;
        LinearLayout p=page("MISSÃO GUIADA",missionTitle(brief),missionDescription(brief));
        LinearLayout c=ui.card();c.addView(new UiKit.BlockArt(this,VoxelWorld.goals(brief),false),new LinearLayout.LayoutParams(-1,ui.dp(wide?240:190)));
        ui.addFull(c,ui.text("Como funciona",22,UiKit.TEXT,true),8);ui.addFull(c,ui.text("1. Observe os contornos na cena.\n2. Toque no piso ou em uma face e confirme a posição.\n3. Complete as "+VoxelWorld.goals(brief).size()+" posições-alvo. Você pode usar qualquer material.",16,UiKit.TEXT,false),12);
        ui.addFull(c,ui.text("Precisa de precisão? A ferramenta Coordenadas também permite escolher cada posição.",14,UiKit.MUTED,false),14);
        ui.addFull(c,ui.button("Começar missão",true,()->newProject(brief)),22);ui.addFull(c,ui.button("Voltar a explorar",false,()->navigate("explore")),8);p.addView(c);
    }
    private void showBuilder(){
        if(current==null){newProject("free");return;}
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        builder=new BuilderScreen(this,world,mission,current.name,prefs.getInt("target_fps",30),new BuilderScreen.Host(){
            public void back(){navigate("home");}
            public void save(){saveDialog(null);}
            public void edited(){dirty=true;sessionChanged();updateBuilderState();persistRecovery();}
            public void completed(){missionResult();}
            public void stats(float fps,int contacts,String renderer){latestFps=fps;observedContacts=Math.max(observedContacts,contacts);gpu=renderer;}
        });
        builder.scene.restoreCamera(lastCamera);builder.restoreEditing(editorMaterial,editorTool);content.addView(builder,new FrameLayout.LayoutParams(-1,-1));updateBuilderState();
    }
    private void missionResult(){
        VoxelWorld.Progress progress=world.progress(mission);if(!progress.complete)return;
        prefs.edit().putBoolean("mission_done_"+mission,true).apply();
        LinearLayout panel=ui.vertical();panel.setPadding(ui.dp(22),0,ui.dp(22),ui.dp(12));panel.addView(new UiKit.BlockArt(this,world.blocks(),false),new LinearLayout.LayoutParams(-1,ui.dp(170)));
        panel.addView(ui.text("Você completou as "+progress.total+" posições de "+missionTitle(mission)+". Sua construção continua disponível para explorar.",16,UiKit.PAPER,false));
        new AlertDialog.Builder(this).setTitle("Objetivo concluído!").setView(panel).setPositiveButton("Salvar projeto",(d,w)->saveDialog(null)).setNegativeButton("Continuar criando",null).setNeutralButton("Ver outras missões",(d,w)->navigate("explore")).show();
    }

    private void showProjects(){
        LinearLayout p=page("SUAS CRIAÇÕES","Meus projetos","Abra, organize e leve suas construções para outro aparelho.");
        LinearLayout actions=ui.row();actions.addView(ui.button("Novo projeto",true,()->newProject("free")),new LinearLayout.LayoutParams(0,-2,1));LinearLayout.LayoutParams ap=new LinearLayout.LayoutParams(0,-2,1);ap.leftMargin=ui.dp(10);actions.addView(ui.button("Importar JSON",false,this::pickImport),ap);p.addView(actions);
        List<ProjectStore.ProjectSummary> projects;
        if(store==null){showStorageError();return;}
        try{projects=store.list();}catch(IOException e){ui.addFull(p,ui.text("Não foi possível ler os projetos. "+e.getMessage(),16,UiKit.DANGER,false),24);return;}
        if(projects.isEmpty()){LinearLayout empty=ui.card();empty.addView(new UiKit.BlockArt(this,Collections.emptyList(),false),new LinearLayout.LayoutParams(-1,ui.dp(160)));empty.addView(ui.text("Sua primeira ideia começa aqui.",24,UiKit.TEXT,true));ui.addFull(empty,ui.text("Quando você salvar uma construção, ela aparecerá nesta área.",16,UiKit.MUTED,false),12);ui.addFull(empty,ui.button("Criar meu primeiro projeto",true,()->newProject("free")),22);ui.addFull(p,empty,24);return;}
        LinearLayout row=null;
        for(int i=0;i<projects.size();i++){
            ProjectStore.ProjectSummary item=projects.get(i);
            if(!wide||i%2==0){row=wide?ui.row():ui.vertical();row.setGravity(Gravity.TOP);ui.addFull(p,row,18);}
            LinearLayout c=ui.card();
            if(!item.corrupt)try{c.addView(new UiKit.BlockArt(this,store.load(item.projectId).project.blocks,false),new LinearLayout.LayoutParams(-1,ui.dp(140)));}catch(IOException ignored){}
            c.addView(ui.text(item.name,22,UiKit.TEXT,true));
            ui.addFull(c,ui.text(item.blockCount+" blocos · "+date(item.updatedAt),13,UiKit.MUTED,false),8);
            if(item.corrupt||item.recovered)ui.addFull(c,ui.text(item.warning,14,UiKit.DANGER,false),10);
            Button open=ui.button("Abrir projeto",true,()->openProject(item.projectId));open.setEnabled(!item.corrupt);ui.addFull(c,open,16);ui.addFull(c,ui.button("Opções do projeto",false,()->projectMenu(item)),8);addResponsiveCard(row,c,wide);
        }
    }
    private void projectMenu(ProjectStore.ProjectSummary item){
        if(item.corrupt){new AlertDialog.Builder(this).setTitle("Arquivo indisponível").setMessage(item.warning).setPositiveButton("Fechar",null).setNegativeButton("Excluir arquivo",(d,w)->deleteProject(item)).show();return;}
        new AlertDialog.Builder(this).setTitle(item.name).setItems(new String[]{"Renomear","Exportar JSON","Excluir"},(d,index)->{
            if(index==0)renameProject(item);else if(index==1)try{exportProject(store.load(item.projectId).project);}catch(IOException e){error("Não foi possível exportar",e.getMessage());}else deleteProject(item);
        }).show();
    }
    private void renameProject(ProjectStore.ProjectSummary item){
        if(blockForTransfer())return;
        EditText field=nameField(item.name);AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Renomear projeto").setView(field).setPositiveButton("Salvar",null).setNegativeButton("Cancelar",null).create();
        dialog.setOnShowListener(d->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            String name=field.getText().toString().trim();if(name.isEmpty()){field.setError("Digite um nome.");return;}
            try{ProjectCodec.Project original=store.load(item.projectId).project;ProjectCodec.Project renamed=ProjectCodec.update(original,name,original.mission,original.blocks);store.save(renamed);if(current!=null&&current.projectId.equals(item.projectId)){current=renamed;mission=current.mission;world.initialize(current.blocks);dirty=false;projectSaved=true;sessionChanged();}dialog.dismiss();render();}catch(Exception e){field.setError(e.getMessage());}
        }));dialog.show();
    }
    private void deleteProject(ProjectStore.ProjectSummary item){
        if(blockForTransfer())return;
        new AlertDialog.Builder(this).setTitle("Excluir “"+item.name+"”?").setMessage("O projeto e sua cópia anterior serão removidos deste aparelho. Você pode exportar o JSON antes de excluir.").setNegativeButton("Cancelar",null).setPositiveButton("Excluir",(d,w)->{
            try{store.delete(item.projectId);if(current!=null&&current.projectId.equals(item.projectId)){current=null;world.initialize(Collections.emptyList());dirty=false;projectSaved=false;sessionChanged();clearRecoveryAfterSave();prefs.edit().remove("last_project").apply();}render();toast("Projeto excluído.");}catch(IOException e){error("Exclusão não concluída",e.getMessage());render();}
        }).show();
    }

    private void showSettings(){
        LinearLayout p=page("DO SEU JEITO","Ajustes","Adapte a interface e confira as informações deste aparelho.");
        LinearLayout controls=ui.card();controls.addView(ui.text("Experiência",22,UiKit.TEXT,true));
        String profile=prefs.getString("profile","auto");String profileLabel="tv".equals(profile)?"TV":"phone".equals(profile)?"Celular":"Automático";
        ui.addFull(controls,ui.button("Perfil de interface: "+profileLabel,false,this::chooseProfile),18);
        ui.addFull(controls,ui.text("TV usa alvos maiores e menu lateral quando há espaço. Celular mantém a barra inferior. O perfil não altera os recursos de câmera ou RA.",13,UiKit.MUTED,false),10);
        Switch motion=new Switch(this);motion.setText("Reduzir movimento");motion.setTextColor(UiKit.TEXT);motion.setTextSize(16);motion.setMinHeight(ui.dp(56));motion.setChecked(prefs.getBoolean("reduce_motion",false));motion.setOnCheckedChangeListener((v,on)->prefs.edit().putBoolean("reduce_motion",on).apply());ui.addFull(controls,motion,12);
        ui.addFull(controls,ui.text("O MVP usa movimento apenas nos controles da cena. Esta preferência será preservada para as próximas experiências.",13,UiKit.MUTED,false),4);
        ui.addFull(controls,ui.button("Limite de renderização: "+prefs.getInt("target_fps",30)+" FPS",false,()->new AlertDialog.Builder(this).setTitle("Limite de renderização").setItems(new String[]{"30 FPS · referência inicial","60 FPS · avaliar no aparelho"},(d,index)->{prefs.edit().putInt("target_fps",index==0?30:60).apply();render();}).setNegativeButton("Cancelar",null).show()),16);
        ui.addFull(controls,ui.text("Este é um limite configurado. O desempenho obtido será medido durante o uso.",13,UiKit.MUTED,false),10);p.addView(controls);
        LinearLayout updates=ui.card();updates.addView(ui.text("Atualizações do aplicativo",22,UiKit.TEXT,true));
        ui.addFull(updates,ui.text("Versão instalada: "+appVersion(),15,UiKit.TEXT,false),10);
        ui.addFull(updates,ui.text(updater==null?"Atualizador inicializando…":updater.status(),14,UiKit.MUTED,false),8);
        if(updater!=null&&updater.isEnabled()){
            Button checkUpdates=ui.button("Verificar atualizações",false,()->updater.check(true));
            checkUpdates.setEnabled(!updater.isBusy());
            ui.addFull(updates,checkUpdates,14);
            if(updater.hasUpdate()){
                ui.addFull(updates,ui.text(updater.releaseNotes(),14,UiKit.TEXT,false),10);
                ui.addFull(updates,ui.button("Baixar e instalar "+updater.latestVersion(),true,()->updater.download()),10);
            }
        }
        ui.addFull(updates,ui.text("Somente o canal Android de testes. A instalação de APKs exige autorização e confirmação do Android; seus projetos locais são preservados se o aplicativo for atualizado com a mesma identidade e assinatura.",13,UiKit.MUTED,false),12);
        ui.addFull(p,updates,18);
        LinearLayout diag=ui.card();diag.addView(ui.text("Diagnóstico local",22,UiKit.TEXT,true));
        diagLine(diag,"Aparelho",Build.MANUFACTURER+" "+Build.MODEL);diagLine(diag,"Sistema","Android "+Build.VERSION.RELEASE+" · API "+Build.VERSION.SDK_INT);diagLine(diag,"Arquiteturas",String.join(", ",Build.SUPPORTED_ABIS));
        android.util.DisplayMetrics metrics=getResources().getDisplayMetrics();diagLine(diag,"Janela",metrics.widthPixels+" × "+metrics.heightPixels+" px · "+getResources().getConfiguration().screenWidthDp+" dp de largura");
        diagLine(diag,"Renderizador",gpu);diagLine(diag,"Última amostra 3D",latestFps>0?String.format(Locale.US,"%.1f FPS",latestFps):"Abra e use o construtor");diagLine(diag,"Toques observados",String.valueOf(observedContacts));
        diagLine(diag,"Câmera informada pelo sistema",getPackageManager().hasSystemFeature(PackageManager.FEATURE_CAMERA_ANY)?"Presente; captura não testada":"Não informada");diagLine(diag,"RA e reconhecimento corporal","Em desenvolvimento; não incluídos neste APK");
        ui.addFull(diag,ui.text("S25 Ultra e WA86F têm aceite independente. Estes dados não representam certificação de compatibilidade.",14,UiKit.MUTED,false),16);ui.addFull(diag,ui.button("Exportar diagnóstico",false,this::exportDiagnostics),18);ui.addFull(p,diag,18);
        LinearLayout about=ui.card();about.addView(ui.label("TV TOUCH · "+appVersion()));ui.addFull(about,ui.text("Projetos locais, sem login, sem envio de dados e sem gravação de câmera nesta versão.",15,UiKit.TEXT,false),12);ui.addFull(about,ui.text("Use Exportar JSON para levar os projetos a outro aparelho ou guardar uma cópia fora do aplicativo.",14,UiKit.MUTED,false),12);ui.addFull(p,about,18);
    }
    private void chooseProfile(){String[] values={"auto","phone","tv"};String selected=prefs.getString("profile","auto");int index=selected.equals("phone")?1:selected.equals("tv")?2:0;new AlertDialog.Builder(this).setTitle("Perfil de interface").setSingleChoiceItems(new String[]{"Automático","Celular","TV"},index,(d,i)->{prefs.edit().putString("profile",values[i]).apply();d.dismiss();render();}).setNegativeButton("Cancelar",null).show();}
    private void diagLine(LinearLayout parent,String label,String value){ui.addFull(parent,ui.text(label,12,UiKit.MUTED,true),16);ui.addFull(parent,ui.text(value,15,UiKit.TEXT,false),4);}
    private void cameraInfo(){new AlertDialog.Builder(this).setTitle("Laboratório de câmera").setMessage("As próximas experiências são posicionar construções sobre superfícies com ARCore e interagir com jogos usando o corpo.\n\nElas ainda não estão incluídas neste APK. O S25 Ultra será o primeiro aparelho de teste. Na WA86F, a câmera e a forma de captura precisam ser verificadas na escola.\n\nO construtor e os projetos funcionam sem câmera.").setPositiveButton("Entendi",null).show();}

    private void navigate(String destination){
        if(blockForTransfer())return;
        if(destination.equals(screen))return;
        if("builder".equals(screen))leaveEditor(()->{screen=destination;render();});else{screen=destination;render();}
    }
    private void newProject(String selectedMission){
        if(blockForTransfer())return;
        leaveEditor(()->{world.initialize(Collections.emptyList());mission=selectedMission;current=ProjectCodec.create("free".equals(mission)?"Minha construção":missionTitle(mission),mission,world.blocks());dirty=false;projectSaved=false;sessionChanged();resetEditorCamera=true;lastCamera=null;screen="builder";render();});
    }
    private void leaveEditor(Runnable next){
        if(!dirty){next.run();return;}
        if(leaving)return;leaving=true;
        AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Guardar suas alterações?").setMessage("Salve o projeto para continuar depois. Ao descartar, a última versão salva será mantida.").setPositiveButton("Salvar",(d,w)->{leaving=false;saveDialog(next);}).setNegativeButton("Descartar",(d,w)->{leaving=false;if(discardDraft())next.run();}).setNeutralButton("Continuar editando",(d,w)->leaving=false).create();
        dialog.setOnCancelListener(d->leaving=false);dialog.show();
    }
    private boolean discardDraft(){
        try{
            ProjectStore.LoadResult replacement=null;
            if(current!=null&&store!=null)replacement=store.discardRecovery(current.projectId,projectSaved);
            current=replacement==null?null:replacement.project;projectSaved=current!=null;
            if(current!=null){mission=current.mission;world.initialize(current.blocks);}else world.initialize(Collections.emptyList());
            dirty=replacement!=null&&replacement.recovered;
            if(dirty)storageWarning=replacement.warning;
            sessionChanged();return true;
        }catch(IOException e){error("Não foi possível descartar",e.getMessage()+" Seu rascunho continua disponível.");return false;}
    }
    private void openProject(String id){if(blockForTransfer())return;leaveEditor(()->{try{ProjectStore.LoadResult r=store.load(id);current=r.project;mission=current.mission;world.initialize(current.blocks);dirty=r.recovered;projectSaved=true;sessionChanged();resetEditorCamera=true;lastCamera=null;prefs.edit().putString("last_project",id).apply();screen="builder";render();if(r.recovered)error("Versão anterior recuperada",r.warning+" Use Salvar para registrar esta versão.");}catch(IOException e){error("Não foi possível abrir",e.getMessage());}});}
    private ProjectCodec.Project snapshot(String name){return ProjectCodec.update(current,name,mission,world.blocks());}
    private void updateBuilderState(){if(builder!=null&&current!=null)builder.state(current.name,dirty||!projectSaved);}
    private EditText nameField(String name){EditText field=new EditText(this);field.setSingleLine(true);field.setText(name);field.setSelectAllOnFocus(true);field.setFilters(new InputFilter[]{new InputFilter.LengthFilter(60)});field.setPadding(ui.dp(24),ui.dp(16),ui.dp(24),ui.dp(16));field.setHint("Nome do projeto");field.setContentDescription("Nome do projeto");return field;}
    private void saveDialog(Runnable after){
        if(blockForTransfer())return;
        if(store==null){showStorageError();return;}if(current==null)return;
        EditText field=nameField(current.name);AlertDialog dialog=new AlertDialog.Builder(this).setTitle("Salvar projeto").setView(field).setPositiveButton("Salvar",null).setNegativeButton("Cancelar",null).create();
        dialog.setOnShowListener(d->dialog.getButton(AlertDialog.BUTTON_POSITIVE).setOnClickListener(v->{
            String name=field.getText().toString().trim();if(name.isEmpty()){field.setError("Digite um nome para o projeto.");return;}
            try{ProjectCodec.Project saved=snapshot(name);store.save(saved);current=saved;dirty=false;projectSaved=true;sessionChanged();clearRecoveryAfterSave();prefs.edit().putString("last_project",current.projectId).apply();updateBuilderState();dialog.dismiss();toast("Projeto salvo neste aparelho.");if(after!=null)after.run();}
            catch(Exception e){field.setError("Não foi possível concluir o salvamento. "+e.getMessage());}
        }));dialog.show();
    }
    private void persistRecovery(){if(!dirty||current==null||store==null)return;try{store.saveRecovery(snapshot(current.name));}catch(Exception e){storageWarning="Não foi possível atualizar a recuperação. Use Salvar e exporte uma cópia do projeto.";}}
    private void clearRecoveryAfterSave(){try{if(store!=null)store.clearRecovery();}catch(IOException e){storageWarning="O projeto foi salvo, mas um rascunho anterior ainda não pôde ser removido.";}}
    private void offerRecovery(boolean restoredSession){
        if(isFinishing()||isDestroyed()||store==null||transfers.hasPendingOperation())return;
        try{ProjectStore.LoadResult recovery=store.loadRecovery();if(recovery==null)return;
            if(restoredSession&&current!=null&&current.projectId.equals(recovery.project.projectId)&&
                    (current.updatedAt>=recovery.project.updatedAt||sameProjectContent(current,recovery.project)))return;
            try{ProjectStore.LoadResult saved=store.load(recovery.project.projectId);if(!saved.recovered&&saved.project.updatedAt>=recovery.project.updatedAt){clearRecoveryAfterSave();return;}}catch(IOException ignored){ }
            String recoveryMessage="Há alterações de “"+recovery.project.name+"” que ainda não foram salvas como projeto.";
            if(recovery.recovered)recoveryMessage+="\n\n"+recovery.warning;
            final boolean savedExists=store.hasSavedVersion(recovery.project.projectId);
            new AlertDialog.Builder(this).setTitle(recovery.recovered?"Cópia anterior do rascunho":"Encontramos um rascunho").setMessage(recoveryMessage).setPositiveButton("Recuperar",(d,w)->{current=recovery.project;mission=current.mission;world.initialize(current.blocks);dirty=true;projectSaved=savedExists;sessionChanged();resetEditorCamera=true;lastCamera=null;screen="builder";render();}).setNegativeButton("Descartar rascunho",(d,w)->{try{store.discardRecovery(recovery.project.projectId,savedExists);}catch(IOException e){error("Rascunho preservado",e.getMessage());}}).setCancelable(false).show();
        }catch(IOException e){error("Recuperação indisponível",e.getMessage()+" Os projetos salvos foram preservados.");}
    }

    private void pickImport(){
        if(blockForTransfer())return;
        leaveEditor(()->{pendingImportToken=sessionToken;Intent i=new Intent(Intent.ACTION_OPEN_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("*/*");try{startActivityForResult(i,IMPORT_PROJECT);}catch(Exception e){pendingImportToken=null;error("Importação indisponível","Este aparelho não disponibilizou um seletor de arquivos.");}});
    }
    private void exportProject(ProjectCodec.Project project){try{startExport(ProjectCodec.encode(project),"tv-touch-"+project.name.replaceAll("[^a-zA-Z0-9_-]","-")+".json");}catch(ProjectCodec.ProjectFormatException e){error("Não foi possível exportar",e.getMessage());}}
    private void startExport(String data,String name){if(blockForTransfer())return;pendingExport=data;Intent i=new Intent(Intent.ACTION_CREATE_DOCUMENT);i.addCategory(Intent.CATEGORY_OPENABLE);i.setType("application/json");i.putExtra(Intent.EXTRA_TITLE,name);try{startActivityForResult(i,EXPORT_DOCUMENT);}catch(Exception e){pendingExport=null;error("Exportação indisponível","Este aparelho não disponibilizou um seletor de arquivos.");}}
    private void exportDiagnostics(){
        try{JSONObject report=new JSONObject();report.put("app","TV Touch");report.put("versionName",appVersion());android.content.pm.PackageInfo info=getPackageManager().getPackageInfo(getPackageName(),0);report.put("versionCode",Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode);report.put("model",Build.MANUFACTURER+" "+Build.MODEL);report.put("android",Build.VERSION.RELEASE);report.put("api",Build.VERSION.SDK_INT);report.put("abis",new JSONArray(Build.SUPPORTED_ABIS));report.put("renderer",gpu);report.put("lastFpsSample",latestFps);report.put("observedTouchContacts",observedContacts);report.put("targetFps",prefs.getInt("target_fps",30));report.put("blocks",world.count());report.put("cameraCapture","not_implemented");report.put("ar","not_implemented");report.put("physicalAcceptance","not_recorded");startExport(report.toString(2),"tv-touch-diagnostico.json");}catch(Exception e){error("Não foi possível exportar",e.getMessage());}
    }
    @Override protected void onActivityResult(int request,int result,Intent data){
        super.onActivityResult(request,result,data);
        if(result!=RESULT_OK||data==null||data.getData()==null){if(request==EXPORT_DOCUMENT)pendingExport=null;if(request==IMPORT_PROJECT)pendingImportToken=null;return;}
        Uri uri=data.getData();
        if(request==IMPORT_PROJECT){
            if(store==null){showStorageError();return;}
            String token=pendingImportToken==null?sessionToken:pendingImportToken;pendingImportToken=null;
            if(!transfers.importProject(AndroidDocuments.input(this,uri),store,token))error("Transferência em andamento","Aguarde a operação atual e tente novamente.");
        }else if(request==EXPORT_DOCUMENT){
            if(pendingExport==null){error("Exportação interrompida","Selecione Exportar novamente para gerar uma nova cópia.");return;}
            String exported=pendingExport;pendingExport=null;
            if(!transfers.exportDocument(AndroidDocuments.output(this,uri),exported,sessionToken))error("Transferência em andamento","Aguarde a operação atual e tente novamente.");
        }
    }

    private void sessionChanged(){sessionToken=UUID.randomUUID().toString();}
    private String appVersion(){try{return getPackageManager().getPackageInfo(getPackageName(),0).versionName;}catch(PackageManager.NameNotFoundException e){return "versão indisponível";}}
    private static boolean sameProjectContent(ProjectCodec.Project a,ProjectCodec.Project b){return a.name.equals(b.name)&&a.mission.equals(b.mission)&&a.blocks.equals(b.blocks);}
    private boolean blockForTransfer(){if(transfers==null||!transfers.hasPendingOperation())return false;onTransferChanged();return transfers.hasPendingOperation();}
    private void dismissTransferDialog(){if(transferDialog!=null){transferDialog.dismiss();transferDialog=null;}}
    @Override public void onTransferChanged(){
        if(isFinishing()||isDestroyed()||transfers==null)return;
        ProjectTransfers.Result result=transfers.takeResult();
        if(result!=null){
            dismissTransferDialog();
            if(result.status==ProjectTransfers.Status.SUCCESS){
                if(result.kind==ProjectTransfers.Kind.IMPORT&&result.project!=null){
                    if(result.matchesSession(sessionToken)){
                        current=result.project;mission=current.mission;world.initialize(current.blocks);dirty=false;projectSaved=true;sessionChanged();resetEditorCamera=true;lastCamera=null;
                        prefs.edit().putString("last_project",current.projectId).apply();screen="builder";render();toast(result.message);
                    }else{if("projects".equals(screen))render();toast("Projeto importado em Projetos. Sua edição atual foi preservada.");}
                }else toast(result.message);
            }else if(result.status==ProjectTransfers.Status.CANCELLED)Toast.makeText(this,result.message,Toast.LENGTH_LONG).show();
            else error(result.kind==ProjectTransfers.Kind.IMPORT?"Arquivo não importado":"Exportação não concluída",result.message);
            return;
        }
        ProjectTransfers.Snapshot progress=transfers.snapshot();if(progress==null){dismissTransferDialog();return;}
        String title=progress.kind==ProjectTransfers.Kind.IMPORT?"Importando projeto":"Exportando arquivo";
        String message=progress.cancelRequested?"Cancelando a transferência…":progress.phase==ProjectTransfers.Phase.COMMITTING?"O arquivo foi validado. Salvando o novo projeto…":progress.kind==ProjectTransfers.Kind.IMPORT?"Lendo e verificando o arquivo. Seus projetos existentes serão preservados.":"Gravando e fechando o arquivo no destino escolhido…";
        if(transferDialog==null){
            transferDialog=new AlertDialog.Builder(this).setTitle(title).setMessage(message).setNegativeButton("Cancelar",null).setCancelable(false).create();
            transferDialog.show();transferDialog.getButton(AlertDialog.BUTTON_NEGATIVE).setOnClickListener(v->{if(!transfers.cancel())toast("O projeto está sendo salvo. Aguarde a conclusão.");});
        }else{transferDialog.setTitle(title);transferDialog.setMessage(message);}
        transferDialog.getButton(AlertDialog.BUTTON_NEGATIVE).setEnabled(progress.canCancel());
    }
    private void showStorageError(){error("Armazenamento indisponível",storageWarning==null?"Não foi possível acessar a pasta local de projetos.":storageWarning);}
    private void error(String title,String message){if(!isFinishing())new AlertDialog.Builder(this).setTitle(title).setMessage(message).setPositiveButton("Entendi",null).show();}
    private void toast(String message){Toast.makeText(this,message,Toast.LENGTH_SHORT).show();}
    private String date(long value){return DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT,new Locale("pt","BR")).format(new Date(value));}
    static String missionTitle(String id){switch(id){case"tower":return"Torre de possibilidades";case"stairs":return"Um passo de cada vez";case"bridge":return"Ponte de ideias";case"symmetry":return"Espelho de blocos";default:return"Construção livre";}}
    static String missionDescription(String id){switch(id){case"tower":return"Empilhe cinco blocos e explore a altura.";case"stairs":return"Construa três níveis que formam uma escada.";case"bridge":return"Construa duas bases e una o topo com um vão.";case"symmetry":return"Complete os dois lados e descubra a simetria.";default:return"Experimente materiais, formas e ideias.";}}
}
