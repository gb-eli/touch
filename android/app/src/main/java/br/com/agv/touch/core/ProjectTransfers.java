package br.com.agv.touch.core;

import java.io.ByteArrayOutputStream;
import java.io.Closeable;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicLong;

/** One retained transfer, immutable results, and no Activity or View references. */
public final class ProjectTransfers {
    public interface Dispatcher { void post(Runnable action); }
    public interface Listener { void onTransferChanged(); }
    public interface InputSource { InputStream open(Cancellation cancellation) throws Exception; }
    public interface OutputSource { OutputStream open(Cancellation cancellation) throws Exception; }
    public interface ProjectSink { void save(ProjectCodec.Project project) throws Exception; }
    public enum Kind { IMPORT, EXPORT }
    public enum Phase { READING, WRITING, COMMITTING }
    public enum Status { SUCCESS, FAILED, CANCELLED }

    public static final class Snapshot {
        public final long id;
        public final Kind kind;
        public final Phase phase;
        public final boolean cancelRequested;
        private Snapshot(Job job) {
            id=job.id;kind=job.kind;phase=job.phase;cancelRequested=job.cancellation.isCancelled();
        }
        public boolean canCancel() { return phase!=Phase.COMMITTING && !cancelRequested; }
    }
    public static final class Result {
        public final long id;
        public final Kind kind;
        public final Status status;
        public final String sessionToken;
        public final ProjectCodec.Project project;
        public final String message;
        private Result(Job job,Status status,ProjectCodec.Project project,String message) {
            id=job.id;kind=job.kind;sessionToken=job.sessionToken;this.status=status;this.project=project;this.message=message;
        }
        public boolean matchesSession(String token){return sessionToken!=null&&sessionToken.equals(token);}
    }
    public static final class Cancellation {
        private final ExecutorService executor;
        private final List<Runnable> actions=new ArrayList<>();
        private boolean cancelled;
        private Cancellation(ExecutorService executor) { this.executor=executor; }
        public synchronized boolean isCancelled() { return cancelled; }
        public void throwIfCancelled() throws IOException {
            if(isCancelled())throw new IOException("Transferência cancelada.");
        }
        public void onCancel(Runnable action) {
            boolean run;
            synchronized(this){run=cancelled;if(!run)actions.add(action);}
            if(run)executor.execute(action);
        }
        public void closeOnCancel(Closeable stream) {
            onCancel(()->{try{stream.close();}catch(IOException ignored){ }});
        }
        private void cancel() {
            List<Runnable> pending;
            synchronized(this){if(cancelled)return;cancelled=true;pending=new ArrayList<>(actions);actions.clear();}
            for(Runnable action:pending)executor.execute(action);
        }
        private synchronized void clear() { actions.clear(); }
    }
    private static final class Job {
        final long id;
        final Kind kind;
        final String sessionToken;
        final Cancellation cancellation;
        Phase phase;
        Job(long id,Kind kind,String token,Cancellation cancellation){this.id=id;this.kind=kind;sessionToken=token;this.cancellation=cancellation;phase=kind==Kind.IMPORT?Phase.READING:Phase.WRITING;}
    }
    private final Dispatcher dispatcher;
    private final ExecutorService worker=Executors.newSingleThreadExecutor(threadFactory("tv-touch-transfer"));
    private final ExecutorService cancellationWorker=Executors.newSingleThreadExecutor(threadFactory("tv-touch-cancel"));
    private final AtomicLong nextId=new AtomicLong();
    private Listener listener;
    private Job active;
    private Result result;
    private boolean closed;

    public ProjectTransfers(Dispatcher dispatcher) { this.dispatcher=dispatcher; }
    private static ThreadFactory threadFactory(String name){return action->{Thread t=new Thread(action,name);t.setDaemon(true);return t;};}
    public void attach(Listener listener){synchronized(this){this.listener=listener;}notifyChanged();}
    public synchronized void detach(){listener=null;}
    public synchronized boolean hasPendingOperation(){return active!=null||result!=null;}
    public synchronized Snapshot snapshot(){return active==null?null:new Snapshot(active);}
    public synchronized Result takeResult(){Result value=result;result=null;return value;}

    public boolean importProject(InputSource source,ProjectStore store,String sessionToken){
        return importProject(source,store::save,sessionToken);
    }
    public boolean importProject(InputSource source,ProjectSink sink,String sessionToken){
        Job job=start(Kind.IMPORT,sessionToken);if(job==null)return false;
        worker.execute(()->{
            try{
                byte[] bytes;
                job.cancellation.throwIfCancelled();
                try(InputStream input=source.open(job.cancellation)){
                    if(input==null)throw new IOException("Arquivo indisponível.");
                    job.cancellation.closeOnCancel(input);
                    ByteArrayOutputStream data=new ByteArrayOutputStream();byte[] buffer=new byte[4096];int count;
                    while(true){
                        job.cancellation.throwIfCancelled();
                        count=input.read(buffer);if(count==-1)break;
                        if(data.size()+count>ProjectCodec.MAX_JSON_BYTES)throw new ProjectCodec.ProjectFormatException("O arquivo é grande demais para um projeto.");
                        data.write(buffer,0,count);
                    }
                    bytes=data.toByteArray();
                }
                job.cancellation.throwIfCancelled();
                ProjectCodec.Project imported=ProjectCodec.decodeImport(ProjectCodec.decodeUtf8(bytes));
                if(!beginCommit(job)){finish(job,Status.CANCELLED,null,cancelMessage(job.kind));return;}
                sink.save(imported);
                finish(job,Status.SUCCESS,imported,"Projeto importado e salvo.");
            }catch(Exception error){finishFailure(job,error);}
        });
        return true;
    }
    public boolean exportDocument(OutputSource source,String text,String sessionToken){
        if(text==null)return false;
        Job job=start(Kind.EXPORT,sessionToken);if(job==null)return false;
        worker.execute(()->{
            try{
                byte[] bytes=text.getBytes(StandardCharsets.UTF_8);
                job.cancellation.throwIfCancelled();
                try(OutputStream output=source.open(job.cancellation)){
                    if(output==null)throw new IOException("Destino indisponível.");
                    job.cancellation.closeOnCancel(output);
                    for(int offset=0;offset<bytes.length;offset+=4096){
                        job.cancellation.throwIfCancelled();output.write(bytes,offset,Math.min(4096,bytes.length-offset));
                    }
                    job.cancellation.throwIfCancelled();output.flush();
                }
                // Success is published only after the provider also closes the destination.
                finish(job,Status.SUCCESS,null,"Arquivo exportado.");
            }catch(Exception error){finishFailure(job,error);}
        });
        return true;
    }
    private synchronized Job start(Kind kind,String token){
        if(closed||active!=null||result!=null)return null;
        active=new Job(nextId.incrementAndGet(),kind,token,new Cancellation(cancellationWorker));notifyChanged();return active;
    }
    private boolean beginCommit(Job job){
        synchronized(this){if(active!=job||job.cancellation.isCancelled())return false;job.phase=Phase.COMMITTING;}
        notifyChanged();return true;
    }
    /** Import commit cannot be cancelled after its atomic-save boundary has begun. */
    public boolean cancel(){
        synchronized(this){if(active==null||active.phase==Phase.COMMITTING)return false;active.cancellation.cancel();}
        notifyChanged();return true;
    }
    private void finishFailure(Job job,Exception error){
        boolean cancelled=job.cancellation.isCancelled();
        String message=cancelled?cancelMessage(job.kind):error instanceof ProjectCodec.ProjectFormatException?error.getMessage():job.kind==Kind.IMPORT?
                "Não foi possível ler e salvar o arquivo. Seus projetos existentes foram preservados.":
                "Não foi possível concluir a exportação. O arquivo de destino pode estar incompleto; tente exportar novamente.";
        finish(job,cancelled?Status.CANCELLED:Status.FAILED,null,message);
    }
    private void finish(Job job,Status status,ProjectCodec.Project project,String message){
        synchronized(this){
            if(active!=job)return;
            if(job.cancellation.isCancelled()&&job.phase!=Phase.COMMITTING){status=Status.CANCELLED;project=null;message=cancelMessage(job.kind);}
            job.cancellation.clear();result=new Result(job,status,project,message);active=null;
            if(closed)cancellationWorker.shutdown();
        }
        notifyChanged();
    }
    private static String cancelMessage(Kind kind){return kind==Kind.IMPORT?"Importação cancelada. Nenhum projeto foi criado.":"Exportação cancelada. O arquivo de destino pode estar incompleto.";}
    private void notifyChanged(){dispatcher.post(()->{Listener target;synchronized(this){target=listener;}if(target!=null)target.onTransferChanged();});}
    /** Called only when the owning Activity finishes, not during configuration changes. */
    public void close(){
        synchronized(this){closed=true;listener=null;if(active!=null&&active.phase!=Phase.COMMITTING)active.cancellation.cancel();if(active==null)cancellationWorker.shutdown();}
        worker.shutdown();
    }
}
