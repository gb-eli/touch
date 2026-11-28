package br.com.agv.touch;

import android.app.AlertDialog;
import android.content.Context;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.LinearLayout;
import android.widget.NumberPicker;
import android.widget.TextView;
import br.com.agv.touch.core.VoxelWorld;
import br.com.agv.touch.render.RayPicker;
import br.com.agv.touch.render.VoxelSceneView;
import java.util.LinkedHashMap;
import java.util.Map;

/** Complete editing surface; selection and confirmation are separate actions. */
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
    private String material="grass",tool="add";
    private final TextView status,info,title,saveState;
    private final Button confirm,undo,redo,result;
    private final Map<String,Button> tools=new LinkedHashMap<>(),materials=new LinkedHashMap<>();

    BuilderScreen(Context context,VoxelWorld world,String mission,String name,int targetFps,Host host) {
        super(context);this.ui=new UiKit(context);this.world=world;this.mission=mission;this.host=host;
        setOrientation(VERTICAL);setBackgroundColor(UiKit.SURFACE);
        boolean compact=getResources().getConfiguration().screenHeightDp<500;
        LinearLayout header=ui.row();header.setPadding(ui.dp(12),ui.dp(10),ui.dp(12),ui.dp(10));
        Button back=ui.button("Voltar",false,host::back);header.addView(back);
        LinearLayout labels=ui.vertical();labels.setPadding(ui.dp(14),0,ui.dp(8),0);
        title=ui.text(name,18,UiKit.TEXT,true);title.setMaxLines(1);title.setEllipsize(android.text.TextUtils.TruncateAt.END);
        saveState=ui.text("Alterações não salvas",12,UiKit.MUTED,false);
        labels.addView(title);ui.addGap(labels,3);labels.addView(saveState);header.addView(labels,new LinearLayout.LayoutParams(0,-2,1));
        header.addView(ui.button("Salvar",true,host::save));addView(header,new LayoutParams(-1,-2));

        FrameLayout stage=new FrameLayout(context);
        scene=new VoxelSceneView(context,world,new VoxelSceneView.Listener(){
            @Override public void onSelection(RayPicker.Hit hit){updateSelection();}
            @Override public void onFrameStats(float fps,int contacts,String gpu){host.stats(fps,contacts,gpu);}
        });
        scene.setMission(mission);scene.setTargetFps(targetFps);
        stage.addView(scene,new FrameLayout.LayoutParams(-1,-1));
        info=ui.text("0 / 256 blocos",12,UiKit.TEXT,true);info.setPadding(ui.dp(12),ui.dp(8),ui.dp(12),ui.dp(8));info.setBackground(ui.shape(UiKit.PAPER,12));
        FrameLayout.LayoutParams badge=new FrameLayout.LayoutParams(-2,-2,Gravity.TOP|Gravity.START);badge.setMargins(ui.dp(12),ui.dp(12),ui.dp(12),0);stage.addView(info,badge);
        addView(stage,new LayoutParams(-1,0,1));

        LinearLayout dock=ui.vertical();dock.setPadding(ui.dp(12),ui.dp(10),ui.dp(12),ui.dp(10));dock.setBackgroundColor(UiKit.PAPER);
        LinearLayout toolRow=ui.row();
        addTool(toolRow,"add","Adicionar");addTool(toolRow,"erase","Apagar");addTool(toolRow,"orbit","Girar");
        if(compact)addSpaced(toolRow,ui.button("Material",false,this::chooseMaterial));
        addSpaced(toolRow,ui.button("Coordenadas",false,this::chooseCoordinates));
        addSpaced(toolRow,ui.button("Girar à esquerda",false,()->scene.orbit(30)));
        addSpaced(toolRow,ui.button("Girar à direita",false,()->scene.orbit(-30)));
        addSpaced(toolRow,ui.button("Aproximar",false,()->scene.zoom(.85f)));
        addSpaced(toolRow,ui.button("Afastar",false,()->scene.zoom(1.18f)));
        addSpaced(toolRow,ui.button("Vista inicial",false,scene::resetCamera));
        dock.addView(horizontal(toolRow));
        if(!compact){
            LinearLayout materialRow=ui.row();
            for(VoxelWorld.Material m:VoxelWorld.materials()) {
                Button b=ui.button(m.label,false,()->setMaterial(m.id));materials.put(m.id,b);
                android.graphics.drawable.GradientDrawable swatch=ui.shape(m.color,4);swatch.setSize(ui.dp(16),ui.dp(16));
                b.setCompoundDrawablesWithIntrinsicBounds(swatch,null,null,null);b.setCompoundDrawablePadding(ui.dp(8));addSpaced(materialRow,b);
            }
            LinearLayout.LayoutParams mp=new LinearLayout.LayoutParams(-1,-2);mp.topMargin=ui.dp(8);dock.addView(horizontal(materialRow),mp);
        }
        status=ui.text("Toque no piso ou em uma face para escolher a posição.",13,UiKit.MUTED,false);status.setPadding(0,ui.dp(8),0,ui.dp(8));status.setMinHeight(ui.dp(32));dock.addView(status);
        LinearLayout actions=ui.row();
        undo=ui.button("Desfazer",false,()->edit(world.undo()));redo=ui.button("Refazer",false,()->edit(world.redo()));
        addSpaced(actions,undo);addSpaced(actions,redo);
        confirm=ui.button("Colocar bloco",true,this::confirm);LayoutParams cp=new LayoutParams(0,-2,1);cp.leftMargin=ui.dp(4);actions.addView(confirm,cp);dock.addView(actions);
        result=ui.button("Ver resultado",UiKit.INK,UiKit.PAPER,host::completed);
        if(!"free".equals(mission)){LayoutParams rp=new LayoutParams(-1,-2);rp.topMargin=ui.dp(8);dock.addView(result,rp);}
        addView(dock,new LayoutParams(-1,-2));refresh();
    }
    private HorizontalScrollView horizontal(LinearLayout content){HorizontalScrollView h=new HorizontalScrollView(getContext());h.setHorizontalScrollBarEnabled(false);h.setFillViewport(false);h.addView(content);return h;}
    private void addSpaced(LinearLayout row,View child){LayoutParams p=new LayoutParams(-2,-2);p.rightMargin=ui.dp(6);row.addView(child,p);}
    private void addTool(LinearLayout row,String value,String label){Button b=ui.button(label,false,()->setTool(value));tools.put(value,b);addSpaced(row,b);}
    private void setTool(String value){tool=value;scene.setTool(value);refresh();}
    private void setMaterial(String value){material=value;scene.setMaterial(value);refresh();}
    private void chooseMaterial(){
        String[] labels=new String[VoxelWorld.materials().size()];for(int i=0;i<labels.length;i++)labels[i]=VoxelWorld.materials().get(i).label;
        new AlertDialog.Builder(getContext()).setTitle("Material do bloco").setItems(labels,(d,index)->setMaterial(VoxelWorld.materials().get(index).id)).setNegativeButton("Cancelar",null).show();
    }
    private void chooseCoordinates(){
        LinearLayout row=ui.row();row.setPadding(ui.dp(20),ui.dp(12),ui.dp(20),ui.dp(12));
        final NumberPicker[] pickers=new NumberPicker[3];String[] names={"X · coluna","Y · altura","Z · linha"};int[] max={7,5,7};
        for(int i=0;i<3;i++){LinearLayout col=ui.vertical();TextView label=ui.text(names[i],12,UiKit.TEXT,true);label.setGravity(Gravity.CENTER);col.addView(label);NumberPicker n=new NumberPicker(getContext());n.setMinValue(0);n.setMaxValue(max[i]);n.setWrapSelectorWheel(false);n.setContentDescription(names[i]);col.addView(n);pickers[i]=n;row.addView(col,new LayoutParams(0,-2,1));}
        new AlertDialog.Builder(getContext()).setTitle("Escolher posição na grade").setView(row).setPositiveButton("Selecionar",(d,w)->{for(NumberPicker picker:pickers)picker.clearFocus();if("orbit".equals(tool))setTool("add");scene.selectCell(pickers[0].getValue(),pickers[1].getValue(),pickers[2].getValue());}).setNegativeButton("Cancelar",null).show();
    }
    private void confirm(){
        RayPicker.Hit hit=scene.selection();if(hit==null)return;
        if("erase".equals(tool)&&hit.block!=null)edit(world.remove(hit.block.x,hit.block.y,hit.block.z));
        else if("add".equals(tool)&&hit.inBounds)edit(world.add(hit.x,hit.y,hit.z,material));
    }
    private void edit(boolean changed){
        if(!changed)return;host.edited();scene.clearSelection();refresh();
        String message="free".equals(mission)?"Construção atualizada.":world.progress(mission).complete?"Objetivo concluído. Você já pode ver o resultado.":"Construção atualizada. Continue seguindo os contornos.";
        status.setText(message);status.announceForAccessibility(message);
    }
    void state(String name,boolean dirty){title.setText(name);saveState.setText(dirty?"Alterações não salvas":"Projeto salvo neste aparelho");}
    String material(){return material;}
    String tool(){return tool;}
    void restoreEditing(String savedMaterial,String savedTool){
        if(VoxelWorld.isMaterial(savedMaterial)){material=savedMaterial;scene.setMaterial(material);}
        if("add".equals(savedTool)||"erase".equals(savedTool)||"orbit".equals(savedTool)){tool=savedTool;scene.setTool(tool);}
        refresh();
    }
    void refresh(){
        for(Map.Entry<String,Button> e:tools.entrySet()){e.getValue().setSelected(e.getKey().equals(tool));e.getValue().setBackground(ui.outline(e.getKey().equals(tool)?UiKit.INK:UiKit.SURFACE,14,UiKit.BORDER));e.getValue().setTextColor(e.getKey().equals(tool)?UiKit.PAPER:UiKit.TEXT);}
        for(Map.Entry<String,Button> e:materials.entrySet()){boolean chosen=e.getKey().equals(material);e.getValue().setSelected(chosen);e.getValue().setBackground(ui.outline(chosen?UiKit.LIME:UiKit.PAPER,14,chosen?UiKit.TEXT:UiKit.BORDER));e.getValue().setContentDescription(VoxelWorld.materialLabel(e.getKey())+(chosen?", selecionado":""));}
        undo.setEnabled(world.canUndo());redo.setEnabled(world.canRedo());
        VoxelWorld.Progress p=world.progress(mission);String caption=world.count()+" / 256 blocos";
        if(p.total>0)caption+="  ·  Missão "+p.done+" / "+p.total;
        info.setText(caption);result.setEnabled(p.complete);result.setText(p.complete?"Objetivo concluído · Ver resultado":"Siga os contornos · "+p.done+" de "+p.total);
        updateSelection();
    }
    private void updateSelection(){
        if(confirm==null||status==null)return;
        RayPicker.Hit hit=scene.selection();
        if("orbit".equals(tool)){confirm.setText("Modo girar");confirm.setEnabled(false);status.setText("Arraste para girar. Use dois dedos ou os botões para aproximar.");return;}
        boolean erase="erase".equals(tool);confirm.setText(erase?"Apagar bloco":"Colocar bloco");
        if(hit==null){confirm.setEnabled(false);status.setText(erase?"Toque no bloco que deseja apagar.":"Selecione uma posição. Material: "+VoxelWorld.materialLabel(material)+".");return;}
        boolean valid=erase?hit.block!=null:hit.inBounds&&world.canPlace(hit.x,hit.y,hit.z);
        confirm.setEnabled(valid);
        if(erase)status.setText(valid?"Bloco selecionado. Confirme para apagar.":"Nenhum bloco selecionado para apagar.");
        else if(valid)status.setText("Posição "+hit.x+", "+hit.y+", "+hit.z+" · "+VoxelWorld.materialLabel(material)+". Confirme para colocar.");
        else status.setText(world.count()>=256?"Limite de 256 blocos. Remova um bloco para continuar.":"Posição ocupada, fora da grade ou sem apoio. Escolha outra face.");
    }
}
