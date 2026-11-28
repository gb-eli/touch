package br.com.agv.touch;

import android.app.AlertDialog;
import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.NumberPicker;
import android.widget.ScrollView;
import android.widget.TextView;
import br.com.agv.touch.core.VoxelWorld;
import br.com.agv.touch.render.RayPicker;
import br.com.agv.touch.render.VoxelSceneView;
import java.util.LinkedHashMap;
import java.util.Map;

/** Editing controls adapt to the usable shape of the window, not the device label. */
final class BuilderScreen extends LinearLayout {
    interface Host {
        void back();
        void save();
        void edited();
        void completed();
        void stats(float fps,int contacts,String gpu);
    }

    final VoxelSceneView scene;
    private final UiKit ui;
    private final VoxelWorld world;
    private final Host host;
    private final String mission;
    private final boolean sideDock,wide,reduceMotion;
    private String material="grass",tool="add";
    private final TextView status,info,title,saveState,feedback;
    private final Button confirm,undo,redo,result,save;
    private Button materialChoice,footerSave;
    private ScrollView dockScroll;
    private final Map<String,Button> tools=new LinkedHashMap<>();
    private final Map<String,Button> materials=new LinkedHashMap<>();
    private final int[] lastCoordinates={0,0,0};
    private final Runnable hideFeedback=this::finishFeedback;

    BuilderScreen(Context context,VoxelWorld world,String mission,String name,int targetFps,Host host) {
        super(context);
        this.ui=new UiKit(context);this.world=world;this.mission=mission;this.host=host;
        int width=getResources().getConfiguration().screenWidthDp;
        int height=getResources().getConfiguration().screenHeightDp;
        sideDock=width>=600&&height<520;
        wide=width>=840&&!sideDock;
        reduceMotion=context.getSharedPreferences("preferences",Context.MODE_PRIVATE).getBoolean("reduce_motion",false);
        setOrientation(VERTICAL);setBackgroundColor(UiKit.SURFACE);

        scene=new VoxelSceneView(context,world,new VoxelSceneView.Listener(){
            @Override public void onSelection(RayPicker.Hit hit){updateSelection();}
            @Override public void onFrameStats(float fps,int contacts,String gpu){host.stats(fps,contacts,gpu);}
        });
        scene.setMission(mission);scene.setTargetFps(targetFps);
        title=ui.text(name,sideDock?16:18,UiKit.TEXT,true);
        title.setMaxLines(1);title.setEllipsize(TextUtils.TruncateAt.END);
        saveState=ui.text("Alterações não salvas",12,UiKit.MUTED,false);
        saveState.setMaxLines(1);saveState.setEllipsize(TextUtils.TruncateAt.END);
        save=ui.button("Salvar",true,host::save);save.setId(R.id.builder_save);
        info=ui.text("0 / 256 blocos",12,UiKit.TEXT,true);
        status=ui.text("",13,UiKit.MUTED,false);status.setId(R.id.builder_status);
        status.setPadding(0,ui.dp(8),0,ui.dp(8));status.setMinHeight(ui.dp(36));
        feedback=ui.text("",14,UiKit.TEXT,true);feedback.setId(R.id.builder_feedback);
        feedback.setPadding(ui.dp(14),ui.dp(10),ui.dp(14),ui.dp(10));
        feedback.setBackground(ui.outline(UiKit.LAVENDER,16,0xffd2cafd));
        feedback.setAccessibilityLiveRegion(ACCESSIBILITY_LIVE_REGION_POLITE);feedback.setVisibility(GONE);
        undo=ui.button("Desfazer",false,()->edit(world.undo(),"Edição desfeita"));undo.setId(R.id.builder_undo);
        redo=ui.button("Refazer",false,()->edit(world.redo(),"Edição refeita"));redo.setId(R.id.builder_redo);
        confirm=ui.button("Colocar bloco",true,this::confirm);confirm.setId(R.id.builder_confirm);
        result=ui.button("Ver resultado",UiKit.VIOLET,UiKit.PAPER,host::completed);result.setId(R.id.builder_result);
        result.setVisibility(GONE);

        addView(header(),new LayoutParams(-1,-2));
        FrameLayout stage=stage();
        if(sideDock){
            LinearLayout body=ui.row();body.setGravity(Gravity.TOP);
            addView(body,new LayoutParams(-1,0,1));
            body.addView(stage,new LayoutParams(0,-1,1));
            int panelWidth=Math.min(280,Math.max(244,Math.round(width*.31f)));
            body.addView(sideControls(),new LayoutParams(ui.dp(panelWidth),-1));
        }else{
            addView(stage,new LayoutParams(-1,0,1));
            addView(bottomControls(),new LayoutParams(-1,-2));
        }
        refresh();
    }

    private LinearLayout header(){
        LinearLayout header=ui.row();header.setPadding(ui.dp(12),ui.dp(6),ui.dp(12),ui.dp(6));
        Button back=ui.button("Voltar",false,host::back);back.setId(R.id.builder_back);header.addView(back);
        LinearLayout labels=ui.vertical();labels.setPadding(ui.dp(12),0,ui.dp(8),0);
        labels.addView(title);ui.addGap(labels,3);labels.addView(saveState);
        header.addView(labels,new LayoutParams(0,-2,1));header.addView(save);return header;
    }

    private FrameLayout stage(){
        FrameLayout stage=new FrameLayout(getContext());stage.setId(R.id.builder_stage);
        stage.addView(scene,new FrameLayout.LayoutParams(-1,-1));
        info.setPadding(ui.dp(13),ui.dp(9),ui.dp(13),ui.dp(9));info.setBackground(ui.outline(UiKit.PAPER,14,UiKit.BORDER));
        FrameLayout.LayoutParams badge=new FrameLayout.LayoutParams(-2,-2,Gravity.TOP|Gravity.START);
        badge.setMargins(ui.dp(12),ui.dp(12),ui.dp(12),0);stage.addView(info,badge);
        FrameLayout.LayoutParams note=new FrameLayout.LayoutParams(-2,-2,Gravity.BOTTOM|Gravity.CENTER_HORIZONTAL);
        note.setMargins(ui.dp(12),ui.dp(12),ui.dp(12),ui.dp(14));stage.addView(feedback,note);
        return stage;
    }

    private LinearLayout toolGroup(){
        LinearLayout row=ui.row();
        String[][] choices={{"add","Adicionar"},{"erase","Apagar"},{"orbit","Girar"}};
        for(String[] choice:choices){
            Button b=ui.button(choice[1],false,()->setTool(choice[0]));
            b.setTextSize(sideDock?13:14);b.setPadding(ui.dp(6),ui.dp(9),ui.dp(6),ui.dp(9));
            tools.put(choice[0],b);weighted(row,b,row.getChildCount()==0?0:6);
        }
        return row;
    }

    private LinearLayout dock(){
        LinearLayout dock=ui.vertical();dock.setId(R.id.builder_dock);
        dock.setPadding(ui.dp(12),ui.dp(10),ui.dp(12),ui.dp(10));dock.setBackground(ui.outline(UiKit.PAPER,22,UiKit.BORDER));
        return dock;
    }

    private Button materialButton(){
        Button b=ui.button("Grama ▾",false,this::chooseMaterial);b.setId(R.id.builder_material);
        b.setPadding(ui.dp(10),ui.dp(8),ui.dp(10),ui.dp(8));b.setTextSize(14);materialChoice=b;return b;
    }

    private Button optionsButton(){
        Button b=ui.button("Ferramentas",false,this::showTools);b.setId(R.id.builder_options);
        b.setTextSize(14);b.setPadding(ui.dp(10),ui.dp(8),ui.dp(10),ui.dp(8));
        b.setContentDescription("Ferramentas: coordenadas, zoom e enquadramento da vista");return b;
    }

    private HorizontalScrollView materialStrip(){
        HorizontalScrollView scroll=new HorizontalScrollView(getContext());
        scroll.setHorizontalScrollBarEnabled(false);
        scroll.setFillViewport(false);
        LinearLayout chips=ui.row();
        for(VoxelWorld.Material item:VoxelWorld.materials()){
            Button chip=ui.button(item.label,false,()->setMaterial(item.id));
            chip.setTextSize(12);chip.setPadding(ui.dp(9),ui.dp(8),ui.dp(9),ui.dp(8));
            GradientDrawable swatch=ui.shape(item.color,6);
            swatch.setSize(ui.dp(16),ui.dp(16));
            chip.setCompoundDrawablesWithIntrinsicBounds(swatch,null,null,null);
            chip.setCompoundDrawablePadding(ui.dp(5));
            materials.put(item.id,chip);
            LayoutParams lp=new LayoutParams(ui.dp(106),-2);
            if(chips.getChildCount()>0)lp.leftMargin=ui.dp(7);
            chips.addView(chip,lp);
        }
        scroll.addView(chips);
        scroll.setContentDescription("Materiais. Deslize horizontalmente para ver mais cores.");
        return scroll;
    }

    private LinearLayout sideControls(){
        LinearLayout dock=dock();
        dockScroll=new ScrollView(getContext());dockScroll.setFillViewport(false);dockScroll.setVerticalScrollBarEnabled(true);
        LinearLayout contents=ui.vertical();contents.addView(toolGroup(),new LayoutParams(-1,-2));
        LinearLayout choices=ui.row();weighted(choices,materialButton(),0);weighted(choices,optionsButton(),6);
        ui.addFull(contents,choices,8);ui.addFull(contents,ui.overline("MATERIAIS",UiKit.VIOLET),11);ui.addFull(contents,materialStrip(),7);contents.addView(status,new LayoutParams(-1,-2));
        LinearLayout history=ui.row();weighted(history,undo,0);weighted(history,redo,6);contents.addView(history);
        ui.addFull(contents,result,8);dockScroll.addView(contents);
        dock.addView(dockScroll,new LayoutParams(-1,0,1));
        footerSave=ui.button("Salvar projeto",false,host::save);ui.addFull(dock,footerSave,8);
        LayoutParams place=new LayoutParams(-1,-2);place.topMargin=ui.dp(6);dock.addView(confirm,place);
        return dock;
    }

    private LinearLayout bottomControls(){
        LinearLayout dock=dock();
        if(wide){
            LinearLayout row=ui.row();
            spaced(row,ui.button("Voltar",false,host::back));
            row.addView(toolGroup(),new LayoutParams(0,-2,1));
            Button coordinate=ui.button("Coordenadas",false,this::chooseCoordinates);
            marginLeft(row,coordinate,8);marginLeft(row,ui.button("Vista",false,this::showViewControls),6);
            footerSave=ui.button("Salvar projeto",true,host::save);marginLeft(row,footerSave,8);
            dock.addView(row,new LayoutParams(-1,-2));
            LinearLayout palette=ui.row();
            for(VoxelWorld.Material material:VoxelWorld.materials()){
                Button b=ui.button(material.label,false,()->setMaterial(material.id));
                b.setTextSize(13);b.setPadding(ui.dp(4),ui.dp(6),ui.dp(4),ui.dp(6));
                GradientDrawable swatch=ui.shape(material.color,4);swatch.setSize(ui.dp(18),ui.dp(14));
                b.setCompoundDrawablesWithIntrinsicBounds(null,swatch,null,null);b.setCompoundDrawablePadding(ui.dp(4));
                materials.put(material.id,b);weighted(palette,b,palette.getChildCount()==0?0:6);
            }
            ui.addFull(dock,palette,8);
        }else{
            dock.addView(toolGroup(),new LayoutParams(-1,-2));
            LinearLayout choices=ui.row();weighted(choices,materialButton(),0);weighted(choices,optionsButton(),8);
            ui.addFull(dock,choices,7);
            ui.addFull(dock,materialStrip(),8);
        }
        dock.addView(status,new LayoutParams(-1,-2));
        LinearLayout actions=ui.row();
        if(!wide){
            weighted(actions,undo,0);weighted(actions,redo,7);
            footerSave=ui.button("Salvar",false,host::save);
            weighted(actions,footerSave,7);
            dock.addView(actions,new LayoutParams(-1,-2));
            ui.addFull(dock,confirm,8);
        }else{
            spaced(actions,undo);spaced(actions,redo);
            actions.addView(confirm,new LayoutParams(0,-2,1));
            dock.addView(actions,new LayoutParams(-1,-2));
        }
        ui.addFull(dock,result,8);return dock;
    }

    private void weighted(LinearLayout row,View view,int margin){
        LayoutParams p=new LayoutParams(0,-2,1);p.leftMargin=ui.dp(margin);row.addView(view,p);
    }
    private void spaced(LinearLayout row,View view){
        LayoutParams p=new LayoutParams(-2,-2);p.rightMargin=ui.dp(6);row.addView(view,p);
    }
    private void marginLeft(LinearLayout row,View view,int margin){
        LayoutParams p=new LayoutParams(-2,-2);p.leftMargin=ui.dp(margin);row.addView(view,p);
    }

    private void showTools(){
        new AlertDialog.Builder(getContext()).setTitle("Ferramentas de construção")
            .setItems(new String[]{"Escolher coordenadas","Enquadrar construção","Aproximar","Afastar","Girar à esquerda","Girar à direita"},
                (d,index)->{if(index==0)chooseCoordinates();else viewAction(index-1);})
            .setNegativeButton("Fechar",null).show();
    }
    private void showViewControls(){
        new AlertDialog.Builder(getContext()).setTitle("Ajustar a vista")
            .setItems(new String[]{"Enquadrar construção","Aproximar","Afastar","Girar à esquerda","Girar à direita"},
                (d,index)->viewAction(index)).setNegativeButton("Fechar",null).show();
    }
    private void viewAction(int index){
        if(index==0){scene.resetCamera();showFeedback("Construção enquadrada");}
        else if(index==1)scene.zoom(.85f);
        else if(index==2)scene.zoom(1.18f);
        else if(index==3)scene.orbit(30);
        else scene.orbit(-30);
    }
    private void setTool(String value){tool=value;scene.setTool(value);refresh();}
    private void setMaterial(String value){material=value;scene.setMaterial(value);refresh();showFeedback("Material: "+VoxelWorld.materialLabel(value));}
    private void chooseMaterial(){
        String[] labels=new String[VoxelWorld.materials().size()];int selected=0;
        for(int i=0;i<labels.length;i++){
            VoxelWorld.Material value=VoxelWorld.materials().get(i);labels[i]=value.label;if(value.id.equals(material))selected=i;
        }
        new AlertDialog.Builder(getContext()).setTitle("Material do bloco")
            .setSingleChoiceItems(labels,selected,(d,index)->{setMaterial(VoxelWorld.materials().get(index).id);d.dismiss();})
            .setNegativeButton("Cancelar",null).show();
    }
    private void chooseCoordinates(){
        RayPicker.Hit hit=scene.selection();
        if(hit!=null&&"erase".equals(tool)&&hit.block!=null){
            lastCoordinates[0]=hit.block.x;lastCoordinates[1]=hit.block.y;lastCoordinates[2]=hit.block.z;
        }else if(hit!=null&&hit.inBounds){lastCoordinates[0]=hit.x;lastCoordinates[1]=hit.y;lastCoordinates[2]=hit.z;}
        LinearLayout row=ui.row();row.setPadding(ui.dp(20),ui.dp(12),ui.dp(20),ui.dp(12));
        NumberPicker[] pickers=new NumberPicker[3];String[] names={"X · coluna","Y · altura","Z · linha"};int[] max={7,5,7};
        for(int i=0;i<3;i++){
            LinearLayout col=ui.vertical();TextView label=ui.text(names[i],12,UiKit.PAPER,true);label.setGravity(Gravity.CENTER);col.addView(label);
            NumberPicker picker=new NumberPicker(getContext());picker.setMinValue(0);picker.setMaxValue(max[i]);picker.setValue(lastCoordinates[i]);
            picker.setWrapSelectorWheel(false);picker.setContentDescription(names[i]);col.addView(picker);pickers[i]=picker;row.addView(col,new LayoutParams(0,-2,1));
        }
        new AlertDialog.Builder(getContext()).setTitle("Escolher posição na grade").setView(row)
            .setPositiveButton("Selecionar",(d,w)->{
                for(int i=0;i<3;i++){pickers[i].clearFocus();lastCoordinates[i]=pickers[i].getValue();}
                if("orbit".equals(tool))setTool("add");scene.selectCell(lastCoordinates[0],lastCoordinates[1],lastCoordinates[2]);
            }).setNegativeButton("Cancelar",null).show();
    }

    private void confirm(){
        RayPicker.Hit hit=scene.selection();if(hit==null)return;
        if("erase".equals(tool)&&hit.block!=null)edit(world.remove(hit.block.x,hit.block.y,hit.block.z),"Bloco removido");
        else if("add".equals(tool)&&hit.inBounds)edit(world.add(hit.x,hit.y,hit.z,material),"Bloco adicionado");
    }
    private void edit(boolean changed,String message){
        if(!changed)return;
        boolean wasComplete=result.getVisibility()==VISIBLE;
        host.edited();scene.clearSelection();refresh();
        boolean complete=!"free".equals(mission)&&world.progress(mission).complete;
        showFeedback(complete&&!wasComplete?"Objetivo concluído. Veja o resultado.":message+" · "+world.count()+" blocos");
        if(complete&&!wasComplete&&dockScroll!=null)dockScroll.post(()->{
            if(reduceMotion)dockScroll.scrollTo(0,dockScroll.getChildAt(0).getHeight());
            else dockScroll.smoothScrollTo(0,dockScroll.getChildAt(0).getHeight());
        });
    }
    private void showFeedback(String message){
        removeCallbacks(hideFeedback);feedback.animate().cancel();feedback.animate().withEndAction(null);
        feedback.setText(message);feedback.setVisibility(VISIBLE);
        if(reduceMotion)feedback.setAlpha(1);else{feedback.setAlpha(0);feedback.animate().alpha(1).setDuration(120).start();}
        postDelayed(hideFeedback,2200);
    }
    private void finishFeedback(){
        if(reduceMotion)feedback.setVisibility(GONE);
        else feedback.animate().alpha(0).setDuration(140).withEndAction(()->feedback.setVisibility(GONE)).start();
    }
    @Override protected void onDetachedFromWindow(){removeCallbacks(hideFeedback);feedback.animate().cancel();super.onDetachedFromWindow();}

    void state(String name,boolean dirty){
        title.setText(name);saveState.setText(dirty?"Alterações não salvas":"Projeto salvo neste aparelho");
        save.setText(dirty?"Salvar":"Salvo");save.setEnabled(dirty);
        if(footerSave!=null){footerSave.setText(dirty?"Salvar projeto":"Projeto salvo");footerSave.setEnabled(dirty);}
    }
    String material(){return material;}
    String tool(){return tool;}
    void restoreEditing(String savedMaterial,String savedTool){
        if(VoxelWorld.isMaterial(savedMaterial)){material=savedMaterial;scene.setMaterial(material);}
        if("add".equals(savedTool)||"erase".equals(savedTool)||"orbit".equals(savedTool)){tool=savedTool;scene.setTool(tool);}
        refresh();
    }
    void refresh(){
        for(Map.Entry<String,Button> entry:tools.entrySet()){
            boolean chosen=entry.getKey().equals(tool);Button b=entry.getValue();
            ui.styleButton(b,chosen?UiKit.VIOLET:UiKit.SURFACE,chosen?UiKit.PAPER:UiKit.TEXT,chosen);
            b.setContentDescription(b.getText()+(chosen?", selecionado":""));
        }
        for(Map.Entry<String,Button> entry:materials.entrySet()){
            boolean chosen=entry.getKey().equals(material);Button b=entry.getValue();
            ui.styleButton(b,chosen?UiKit.LAVENDER:UiKit.PAPER,UiKit.TEXT,chosen);
            b.setContentDescription(VoxelWorld.materialLabel(entry.getKey())+(chosen?", selecionado":""));
        }
        if(materialChoice!=null){
            materialChoice.setText(VoxelWorld.materialLabel(material)+" ▾");
            GradientDrawable swatch=ui.shape(VoxelWorld.materialColor(material),4);swatch.setSize(ui.dp(18),ui.dp(18));
            materialChoice.setCompoundDrawablesWithIntrinsicBounds(swatch,null,null,null);materialChoice.setCompoundDrawablePadding(ui.dp(6));
            materialChoice.setContentDescription("Material atual: "+VoxelWorld.materialLabel(material)+". Escolher material");
        }
        undo.setEnabled(world.canUndo());redo.setEnabled(world.canRedo());
        VoxelWorld.Progress progress=world.progress(mission);
        info.setText(world.count()+" / 256 blocos"+(progress.total>0?"\nMissão "+progress.done+" de "+progress.total:""));
        result.setVisibility(progress.complete&&!"free".equals(mission)?VISIBLE:GONE);
        result.setText("Objetivo concluído · Ver resultado");
        ui.styleButton(confirm,"erase".equals(tool)?UiKit.DANGER:UiKit.VIOLET,UiKit.PAPER,false);
        updateSelection();
    }
    private void updateSelection(){
        if(confirm==null||status==null)return;
        RayPicker.Hit hit=scene.selection();
        if("orbit".equals(tool)){
            confirm.setText("Modo girar");confirm.setEnabled(false);status.setText("Arraste para girar. Use dois dedos para aproximar.");return;
        }
        boolean erase="erase".equals(tool);confirm.setText(erase?"Apagar bloco":"Colocar bloco");
        if(hit==null){
            confirm.setEnabled(false);status.setText(erase?"Toque no bloco que deseja apagar.":"Toque no piso ou em uma face. Depois confirme.");return;
        }
        boolean valid=erase?hit.block!=null:hit.inBounds&&world.canPlace(hit.x,hit.y,hit.z);confirm.setEnabled(valid);
        if(erase)status.setText(valid?"Bloco selecionado. Confirme para apagar.":"Nenhum bloco selecionado para apagar.");
        else if(valid)status.setText("Posição "+hit.x+", "+hit.y+", "+hit.z+" · "+VoxelWorld.materialLabel(material)+". Confirme para colocar.");
        else status.setText(world.count()>=256?"Limite de 256 blocos. Remova um bloco para continuar.":"Posição ocupada, fora da grade ou sem apoio.");
    }
}
