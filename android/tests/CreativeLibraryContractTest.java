package br.com.agv.touch.core.tests;

import br.com.agv.touch.core.CreativeLibrary;
import br.com.agv.touch.core.ProjectCodec;
import br.com.agv.touch.core.VoxelWorld;
import java.util.HashSet;
import java.util.Set;

public final class CreativeLibraryContractTest {
    private static int checks;
    private static void require(boolean ok,String reason){
        checks++; if(!ok)throw new AssertionError(reason);
    }
    public static void main(String[] args) throws Exception {
        require(CreativeLibrary.all().size()==6,"Six real presets");
        Set<String> ids=new HashSet<>();
        for(CreativeLibrary.Template template:CreativeLibrary.all()){
            require(ids.add(template.id),"Unique template identifiers");
            require(template.title.length()>2,"Human-readable title");
            require(!template.blocks.isEmpty(),"Template must be real geometry");
            require(VoxelWorld.validBlocks(template.blocks),"All voxels valid");
            VoxelWorld world=new VoxelWorld();
            require(world.initialize(template.blocks),"Fresh model accepted");
            require(world.count()==template.blocks.size(),"All voxels restored");
            ProjectCodec.Project copy=ProjectCodec.create(template.title,"free",template.blocks);
            ProjectCodec.Project reopened=ProjectCodec.decodeStored(ProjectCodec.encode(copy));
            require(copy.blocks.equals(reopened.blocks),"Preserve entire structure");
            require(reopened.projectId.equals(copy.projectId),"Project ID stable across reopen");
            require(CreativeLibrary.byId(template.id)==template,"Lookup stable");
        }
        require(CreativeLibrary.byId("unknown")==null,"Unknown model unavailable");
        System.out.println("CreativeLibrary contract passed: "+checks+" checks");
    }
}
