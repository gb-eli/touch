package br.com.agv.touch.core.tests;

import br.com.agv.touch.core.ProjectCodec;
import br.com.agv.touch.core.ProjectStore;
import br.com.agv.touch.core.ProjectTransfers;
import br.com.agv.touch.core.VoxelWorld;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

/** Provider failures and lifecycle transitions, exercising the same worker used by Android. */
public final class ProjectTransfersTest {
    private static final String VALID="{\"version\":1,\"name\":\"Maquete\",\"blocks\":[{\"x\":0,\"y\":0,\"z\":0,\"material\":\"grass\"}]}";
    private static int checks;
    public static void main(String[] args)throws Exception{
        testDiscardPreparesSavedCopy();
        testImportIsOffCallerAndKeepsIdentity();
        testInvalidUtf8AndReadCloseFailure();
        testOversizedAndOverlappingImports();
        testImportCancellationBeforeCommit();
        testCommitCannotReportCancellation();
        testExportCloseFailureAndCancellation();
        testResultSurvivesListenerReplacement();
        System.out.println("PASS: "+checks+" transfer/recovery assertions; provider IO, UTF-8, cancel/commit, close failure, session token and listener replacement.");
    }
    private static void testDiscardPreparesSavedCopy()throws Exception{
        Path root=Files.createTempDirectory("tv-touch-discard-");
        try{
            ProjectStore store=new ProjectStore(root.toFile());VoxelWorld world=new VoxelWorld();world.add(0,0,0,"grass");
            ProjectCodec.Project saved=ProjectCodec.create("Salvo","free",world.blocks());store.save(saved);
            world.add(1,0,0,"wood");ProjectCodec.Project draft=ProjectCodec.update(saved,saved.name,"free",world.blocks());store.saveRecovery(draft);
            check(store.hasSavedVersion(saved.projectId),"saved version existence");
            ProjectStore.LoadResult restored=store.discardRecovery(saved.projectId,false);
            check(restored.project.blocks.size()==1,"recovered draft discards to saved even when UI flag was false");
            check(store.loadRecovery()==null,"only clear recovery after loading saved");
            store.save(draft);store.saveRecovery(draft);
            Path dir=root.resolve("projects"),main=dir.resolve(saved.projectId+".json"),previous=dir.resolve(saved.projectId+".previous.json");
            Files.write(main,new byte[]{123});
            ProjectStore.LoadResult previousCopy=store.discardRecovery(saved.projectId,false);
            check(previousCopy.recovered&&previousCopy.warning!=null&&previousCopy.project.blocks.size()==1,"backup replacement preserves recovered warning");
            store.saveRecovery(draft);byte[] recovery=Files.readAllBytes(dir.resolve("recovery.json"));
            Files.write(previous,new byte[]{123});
            try{store.discardRecovery(saved.projectId,false);throw new AssertionError("corrupt saved copy must block discard");}catch(IOException expected){checks++;}
            check(Arrays.equals(recovery,Files.readAllBytes(dir.resolve("recovery.json"))),"corrupt saved copies cannot delete the only draft");
            check(store.loadRecovery().project.blocks.size()==2,"draft still opens after refused discard");
            ProjectCodec.Project fresh=ProjectCodec.create("Novo","free",Collections.emptyList());store.saveRecovery(fresh);
            check(!store.hasSavedVersion(fresh.projectId)&&store.discardRecovery(fresh.projectId,false)==null,"new unsaved draft may be explicitly discarded");
            check(store.loadRecovery()==null,"new draft cleared");
        }finally{deleteTree(root);}
    }
    private static void testImportIsOffCallerAndKeepsIdentity()throws Exception{
        Path root=Files.createTempDirectory("tv-touch-import-");ProjectTransfers transfers=new ProjectTransfers(Runnable::run);
        try{
            ProjectStore store=new ProjectStore(root.toFile());ProjectCodec.Project original=ProjectCodec.decodeImport(VALID);store.save(original);
            String exported=ProjectCodec.encode(original);Thread caller=Thread.currentThread();AtomicReference<Thread> ioThread=new AtomicReference<>();
            check(transfers.importProject(c->{ioThread.set(Thread.currentThread());return bytes(exported);},store,"session-A"),"import started");
            ProjectTransfers.Result result=awaitResult(transfers);
            check(ioThread.get()!=caller,"provider opened off caller thread");
            check(result.status==ProjectTransfers.Status.SUCCESS&&store.list().size()==2,"import committed new project");
            check(!original.projectId.equals(result.project.projectId)&&store.load(original.projectId).project.blocks.equals(original.blocks),"import does not replace original identity");
            check(result.matchesSession("session-A")&&!result.matchesSession("session-B"),"result is applicable only to originating session");
        }finally{transfers.close();deleteTree(root);}
    }
    private static void testInvalidUtf8AndReadCloseFailure()throws Exception{
        AtomicInteger saves=new AtomicInteger();ProjectTransfers transfers=new ProjectTransfers(Runnable::run);
        try{
            byte[] malformed="{\"version\":1,\"name\":\"X\",\"blocks\":[]}".getBytes(StandardCharsets.UTF_8);
            for(int i=0;i<malformed.length;i++)if(malformed[i]=='X')malformed[i]=(byte)0xff;
            transfers.importProject(c->new ByteArrayInputStream(malformed),p->saves.incrementAndGet(),"a");
            ProjectTransfers.Result invalid=awaitResult(transfers);
            check(invalid.status==ProjectTransfers.Status.FAILED&&invalid.message.contains("UTF-8")&&saves.get()==0,"malformed UTF-8 rejected before write");
            transfers.importProject(c->new ByteArrayInputStream(VALID.getBytes(StandardCharsets.UTF_8)){@Override public void close()throws IOException{throw new IOException("provider close failed");}},p->saves.incrementAndGet(),"a");
            check(awaitResult(transfers).status==ProjectTransfers.Status.FAILED&&saves.get()==0,"read close failure cannot import or report success");
        }finally{transfers.close();}
    }
    private static void testOversizedAndOverlappingImports()throws Exception{
        AtomicInteger saves=new AtomicInteger();ProjectTransfers transfers=new ProjectTransfers(Runnable::run);
        try{
            transfers.importProject(c->new ByteArrayInputStream(new byte[ProjectCodec.MAX_JSON_BYTES+1]),p->saves.incrementAndGet(),"a");
            check(awaitResult(transfers).status==ProjectTransfers.Status.FAILED&&saves.get()==0,"oversized stream bounded before decode/save");
            BlockingInput input=new BlockingInput();transfers.importProject(c->input,p->saves.incrementAndGet(),"a");await(input.entered);
            check(!transfers.importProject(c->bytes(VALID),p->saves.incrementAndGet(),"b"),"overlapping transfer refused");
            transfers.cancel();check(awaitResult(transfers).status==ProjectTransfers.Status.CANCELLED,"blocked first request cancels");
        }finally{transfers.close();}
    }
    private static void testImportCancellationBeforeCommit()throws Exception{
        AtomicInteger saves=new AtomicInteger();ProjectTransfers transfers=new ProjectTransfers(Runnable::run);BlockingInput input=new BlockingInput();
        try{
            transfers.importProject(c->input,p->saves.incrementAndGet(),"a");await(input.entered);
            check(transfers.cancel(),"read can be cancelled");ProjectTransfers.Result result=awaitResult(transfers);
            check(result.status==ProjectTransfers.Status.CANCELLED&&saves.get()==0,"cancelled import never reaches commit");
            check(input.closed,"cancellation closes blocking stream");
        }finally{input.close();transfers.close();}
    }
    private static void testCommitCannotReportCancellation()throws Exception{
        CountDownLatch commitEntered=new CountDownLatch(1),commitRelease=new CountDownLatch(1);AtomicInteger saves=new AtomicInteger();ProjectTransfers transfers=new ProjectTransfers(Runnable::run);
        try{
            transfers.importProject(c->bytes(VALID),p->{commitEntered.countDown();await(commitRelease);saves.incrementAndGet();},"a");await(commitEntered);
            check(transfers.snapshot().phase==ProjectTransfers.Phase.COMMITTING&&!transfers.cancel(),"cancel cannot race an already started save");
            commitRelease.countDown();check(awaitResult(transfers).status==ProjectTransfers.Status.SUCCESS&&saves.get()==1,"finished commit reports success once");
            check(transfers.takeResult()==null,"result consumption is once only");
        }finally{commitRelease.countDown();transfers.close();}
    }
    private static void testExportCloseFailureAndCancellation()throws Exception{
        ProjectTransfers transfers=new ProjectTransfers(Runnable::run);
        try{
            transfers.exportDocument(c->new ByteArrayOutputStream(){@Override public void close()throws IOException{throw new IOException("close failed");}},VALID,"a");
            ProjectTransfers.Result failed=awaitResult(transfers);
            check(failed.status==ProjectTransfers.Status.FAILED&&failed.message.contains("incompleto"),"export close failure is not false success");
            BlockingOutput output=new BlockingOutput();transfers.exportDocument(c->output,VALID,"a");await(output.entered);
            check(transfers.cancel(),"writing export can be cancelled");ProjectTransfers.Result cancelled=awaitResult(transfers);
            check(cancelled.status==ProjectTransfers.Status.CANCELLED&&cancelled.message.contains("incompleto"),"cancel acknowledges potentially partial destination");
            check(output.closed,"cancel closes export stream off caller");
            ByteArrayOutputStream complete=new ByteArrayOutputStream();transfers.exportDocument(c->complete,VALID,"a");
            check(awaitResult(transfers).status==ProjectTransfers.Status.SUCCESS&&VALID.equals(new String(complete.toByteArray(),StandardCharsets.UTF_8)),"completed export contains exact requested snapshot");
        }finally{transfers.close();}
    }
    private static void testResultSurvivesListenerReplacement()throws Exception{
        BlockingQueue<Runnable> ui=new LinkedBlockingQueue<>();ProjectTransfers transfers=new ProjectTransfers(ui::add);AtomicInteger oldActivity=new AtomicInteger(),newActivity=new AtomicInteger(),deliveries=new AtomicInteger();
        try{
            transfers.attach(oldActivity::incrementAndGet);transfers.exportDocument(c->new ByteArrayOutputStream(),VALID,"old-session");
            transfers.detach();waitUntil(()->transfers.snapshot()==null);
            Runnable pending;while((pending=ui.poll())!=null)pending.run();check(oldActivity.get()==0,"detached Activity receives no queued callback");
            transfers.attach(()->{newActivity.incrementAndGet();ProjectTransfers.Result r=transfers.takeResult();if(r!=null){check(r.matchesSession("old-session"),"retained result keeps original session token");deliveries.incrementAndGet();}});
            while((pending=ui.poll())!=null)pending.run();
            check(newActivity.get()>0&&deliveries.get()==1&&!transfers.hasPendingOperation(),"new listener receives retained result exactly once");
        }finally{transfers.close();}
    }
    private static InputStream bytes(String text){return new ByteArrayInputStream(text.getBytes(StandardCharsets.UTF_8));}
    private static ProjectTransfers.Result awaitResult(ProjectTransfers transfers)throws Exception{
        AtomicReference<ProjectTransfers.Result> result=new AtomicReference<>();waitUntil(()->{ProjectTransfers.Result r=transfers.takeResult();if(r!=null)result.set(r);return result.get()!=null;});return result.get();
    }
    private interface Condition{boolean ready()throws Exception;}
    private static void waitUntil(Condition condition)throws Exception{long end=System.nanoTime()+TimeUnit.SECONDS.toNanos(5);while(!condition.ready()){if(System.nanoTime()>end)throw new AssertionError("Timed out waiting for transfer");Thread.sleep(5);}}
    private static void await(CountDownLatch latch)throws Exception{if(!latch.await(5,TimeUnit.SECONDS))throw new AssertionError("Timed out waiting for latch");}
    private static void check(boolean value,String message){if(!value)throw new AssertionError(message);checks++;}
    private static void deleteTree(Path root)throws Exception{try(java.util.stream.Stream<Path> files=Files.walk(root)){for(Path p:(Iterable<Path>)files.sorted(Comparator.reverseOrder())::iterator)Files.deleteIfExists(p);}}
    private static final class BlockingInput extends InputStream{
        final CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);volatile boolean closed;
        @Override public int read()throws IOException{entered.countDown();try{if(!release.await(5,TimeUnit.SECONDS))throw new IOException("timeout");}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException(e);}return -1;}
        @Override public void close(){closed=true;release.countDown();}
    }
    private static final class BlockingOutput extends OutputStream{
        final CountDownLatch entered=new CountDownLatch(1),release=new CountDownLatch(1);volatile boolean closed;
        @Override public void write(int value)throws IOException{entered.countDown();try{if(!release.await(5,TimeUnit.SECONDS))throw new IOException("timeout");}catch(InterruptedException e){Thread.currentThread().interrupt();throw new IOException(e);}if(closed)throw new IOException("closed");}
        @Override public void close(){closed=true;release.countDown();}
    }
}
