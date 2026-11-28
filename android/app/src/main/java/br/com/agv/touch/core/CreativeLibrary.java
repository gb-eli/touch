package br.com.agv.touch.core;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Offline inspiration gallery. Every template is a real editable voxel model.
 * No accounts, third-party assets, networking or mock entries.
 */
public final class CreativeLibrary {
    public static final class Template {
        public final String id, title, category, description;
        public final List<VoxelWorld.Block> blocks;
        Template(String id,String title,String category,String description,List<VoxelWorld.Block> blocks){
            this.id=id;this.title=title;this.category=category;this.description=description;
            if(!VoxelWorld.validBlocks(blocks))throw new IllegalArgumentException("Invalid template: "+id);
            this.blocks=Collections.unmodifiableList(new ArrayList<>(blocks));
        }
    }
    private static final List<Template> LIBRARY;
    static {
        ArrayList<Template> list=new ArrayList<>();
        list.add(new Template("garden","Jardim de cores","NATUREZA",
            "Uma pequena praça pronta para reinventar.",garden()));
        list.add(new Template("rocket","Foguete criativo","ESPAÇO",
            "Comece um lançamento de muitas ideias.",rocket()));
        list.add(new Template("robot","Robô de blocos","PERSONAGENS",
            "Um personagem que pode mudar de humor.",robot()));
        list.add(new Template("castle","Castelo inventado","ARQUITETURA",
            "Torres, pátios e caminhos para explorar.",castle()));
        list.add(new Template("bridge","Ponte luminosa","ENGENHARIA",
            "Descubra novos jeitos de ligar dois lados.",bridge()));
        list.add(new Template("spiral","Escultura em espiral","ARTE 3D",
            "Uma forma que sobe e gira no espaço.",spiral()));
        LIBRARY=Collections.unmodifiableList(list);
    }
    private CreativeLibrary(){}
    public static List<Template> all(){return LIBRARY;}
    public static Template byId(String id){
        for(Template t:LIBRARY)if(t.id.equals(id))return t;
        return null;
    }
    private static void b(List<VoxelWorld.Block> list,int x,int y,int z,String material){
        list.add(new VoxelWorld.Block(x,y,z,material));
    }
    private static List<VoxelWorld.Block> garden(){
        ArrayList<VoxelWorld.Block> a=new ArrayList<>();
        for(int x=2;x<=5;x++)for(int z=2;z<=5;z++)b(a,x,0,z,"grass");
        for(int[] q:new int[][]{{2,2},{5,2},{2,5},{5,5}})b(a,q[0],1,q[1],"crystal");
        b(a,3,1,3,"wood");b(a,3,2,3,"grass");
        b(a,4,1,4,"wood");b(a,4,2,4,"lava");
        return a;
    }
    private static List<VoxelWorld.Block> rocket(){
        ArrayList<VoxelWorld.Block> a=new ArrayList<>();
        for(int y=0;y<=3;y++)for(int x=3;x<=4;x++)for(int z=3;z<=4;z++)
            b(a,x,y,z,y==0?"stone":y==2?"ice":"brick");
        for(int x=3;x<=4;x++)for(int z=3;z<=4;z++)b(a,x,4,z,"crystal");
        b(a,2,0,3,"lava");b(a,5,0,4,"lava");b(a,3,0,2,"lava");b(a,4,0,5,"lava");
        return a;
    }
    private static List<VoxelWorld.Block> robot(){
        ArrayList<VoxelWorld.Block> a=new ArrayList<>();
        for(int x=2;x<=4;x++)for(int y=1;y<=2;y++)b(a,x,y,3,"ice");
        for(int x=2;x<=4;x++)b(a,x,3,3,"stone");
        b(a,2,0,3,"wood");b(a,4,0,3,"wood");
        b(a,1,2,3,"crystal");b(a,5,2,3,"crystal");
        b(a,2,3,2,"lava");b(a,4,3,2,"lava");
        b(a,3,4,3,"crystal");return a;
    }
    private static List<VoxelWorld.Block> castle(){
        ArrayList<VoxelWorld.Block> a=new ArrayList<>();
        for(int x=2;x<=5;x++)for(int z=2;z<=5;z++){
            if(x==2||x==5||z==2||z==5)b(a,x,0,z,"stone");
        }
        for(int[] q:new int[][]{{2,2},{2,5},{5,2},{5,5}}){
            b(a,q[0],1,q[1],"brick");b(a,q[0],2,q[1],"crystal");
        }
        b(a,3,1,2,"wood");b(a,4,1,2,"wood");
        return a;
    }
    private static List<VoxelWorld.Block> bridge(){
        ArrayList<VoxelWorld.Block> a=new ArrayList<>();
        for(int x=1;x<=6;x++) {
            if(x<=2||x>=5)b(a,x,0,3,"stone");
            b(a,x,1,3,x==3||x==4?"crystal":"wood");
        }
        b(a,1,0,4,"stone");b(a,6,0,4,"stone");return a;
    }
    private static List<VoxelWorld.Block> spiral(){
        ArrayList<VoxelWorld.Block> a=new ArrayList<>();
        int[][] coords={{3,3},{4,3},{4,4},{3,4},{2,4},{2,3}};
        String[] materials={"crystal","ice","brick","grass","wood","lava"};
        for(int i=0;i<coords.length;i++){
            b(a,coords[i][0],i,coords[i][1],materials[i]);
            if(i>0)b(a,coords[i][0],i-1,coords[i][1],"stone");
        }
        return a;
    }
}
