package br.com.agv.touch.updates;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.content.ClipData;
import android.provider.Settings;
import android.widget.Toast;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Locale;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Opt-in update downloader for sideloaded .dev builds only.
 * The device owner always confirms installation in Android's package installer.
 * No projects, diagnostics or device identifiers are sent to the update feed.
 */
public final class AppUpdater {
    private static final long CHECK_INTERVAL_MS=24L*60L*60L*1000L;
    private static final int MAX_FEED_BYTES=16*1024;
    private static final String APK_MIME="application/vnd.android.package-archive";
    private final Activity activity;
    private final SharedPreferences prefs;
    private final Runnable onChange;
    private final Handler main=new Handler(Looper.getMainLooper());
    private final ExecutorService executor=Executors.newSingleThreadExecutor(r->{
        Thread t=new Thread(r,"TVTouch-Updates");t.setDaemon(true);return t;
    });
    private final AtomicBoolean cancelDownload=new AtomicBoolean();
    private final long installedCode;
    private boolean busy,closed,waitingInstallerPermission;
    private UpdateFeed currentFeed;
    private File readyApk;
    private AlertDialog progressDialog;
    private int lastProgress=-1;

    public AppUpdater(Activity activity,SharedPreferences preferences,Runnable onChange) {
        this.activity=activity;
        this.prefs=preferences;
        this.onChange=onChange;
        this.installedCode=getInstalledVersionCode();
    }

    public boolean isEnabled(){return activity.getPackageName().endsWith(".dev");}
    public boolean isBusy(){return busy;}
    public boolean hasUpdate(){return currentFeed!=null&&currentFeed.available(installedCode,Build.VERSION.SDK_INT);}
    public String latestVersion(){return hasUpdate()?currentFeed.versionName:null;}
    public String releaseNotes(){return hasUpdate()?currentFeed.releaseNotes:"";}
    public String status() {
        if(!isEnabled())return "Atualizações da versão de produção serão feitas pela loja oficial.";
        if(busy)return "Consultando ou baixando uma atualização…";
        if(hasUpdate())return "Versão "+currentFeed.versionName+" disponível para instalar.";
        if(currentFeed!=null&&currentFeed.apkUrl.isEmpty())
            return "Canal de testes preparado. Ainda não existe APK assinado publicado para download.";
        if(currentFeed!=null&&currentFeed.versionCode>installedCode
                &&currentFeed.minSdk>Build.VERSION.SDK_INT)
            return "Uma nova versão existe, mas exige um Android mais recente.";
        if(currentFeed!=null)return "Você está usando a última versão publicada para testes.";
        return "Consulte o canal de testes quando houver conexão com a internet.";
    }

    public void checkIfDue(){
        if(!isEnabled()||busy)return;
        long last=prefs.getLong("update_checked_at",0);
        long now=System.currentTimeMillis();
        if(last>0 && now>=last && now-last<CHECK_INTERVAL_MS)return;
        check(false);
    }
    public void check(boolean manual){
        if(!isEnabled()){if(manual)message("Atualizações","Esta modalidade é exclusiva do canal de testes.");return;}
        if(closed||busy){if(manual)toast("Já existe uma verificação ou download em andamento.");return;}
        busy=true;onChange.run();
        executor.execute(()->{
            try{
                UpdateFeed feed=UpdateFeed.parse(fetchText(UpdateFeed.FEED_URL),activity.getPackageName());
                post(()->{
                    busy=false;currentFeed=feed;
                    prefs.edit().putLong("update_checked_at",System.currentTimeMillis()).apply();
                    onChange.run();
                    if(manual)showCheckResult(feed);
                    else if(hasUpdate() && prefs.getLong("update_seen_code",0)!=feed.versionCode){
                        prefs.edit().putLong("update_seen_code",feed.versionCode).apply();
                        toast("Nova versão do TV Touch disponível em Ajustes.");
                    }
                });
            }catch(Exception e){
                post(()->{
                    busy=false;onChange.run();
                    if(manual)message("Não foi possível verificar",safeMessage(e)+
                        "\n\nSe estiver offline, suas construções continuam funcionando normalmente.");
                });
            }
        });
    }

    private void showCheckResult(UpdateFeed feed){
        if(feed.available(installedCode,Build.VERSION.SDK_INT)){
            new AlertDialog.Builder(activity).setTitle("Nova versão: "+feed.versionName)
                .setMessage(notes(feed)+"\n\nO download é opcional. O Android pedirá sua confirmação para instalar.")
                .setNegativeButton("Agora não",null)
                .setPositiveButton("Baixar atualização",(d,w)->download())
                .show();
        }else message("Atualizações",status());
    }

    public void download(){
        if(!hasUpdate()){check(true);return;}
        if(closed||busy){toast("Já existe uma operação em andamento.");return;}
        UpdateFeed feed=currentFeed;
        if(readyApk!=null&&readyApk.isFile()){
            installReady();
            return;
        }
        new AlertDialog.Builder(activity)
            .setTitle("Baixar TV Touch "+feed.versionName)
            .setMessage(notes(feed)+"\n\nTamanho: "+(feed.sizeBytes/1024L)+" KB. Seus projetos continuarão guardados. A instalação depende da confirmação do Android.")
            .setNegativeButton("Cancelar",null)
            .setPositiveButton("Baixar",(d,w)->startDownload(feed))
            .show();
    }

    private void startDownload(UpdateFeed feed){
        if(busy||closed)return;
        busy=true;cancelDownload.set(false);lastProgress=-1;
        progressDialog=new AlertDialog.Builder(activity)
            .setTitle("Baixando atualização")
            .setMessage("Conectando ao servidor…")
            .setNegativeButton("Cancelar",(d,w)->cancelDownload.set(true))
            .setCancelable(false).create();
        progressDialog.show();
        onChange.run();
        executor.execute(()->{
            File partial=null;
            try{
                File folder=new File(activity.getCacheDir(),"updates");
                if(!folder.isDirectory()&&!folder.mkdirs())throw new IOException("Não foi possível preparar a pasta de atualização.");
                partial=new File(folder,"candidate.part");
                File apk=new File(folder,"update.apk");
                if(apk.exists()&&!apk.delete())throw new IOException("Não foi possível remover uma atualização antiga.");
                downloadAndVerify(feed,partial);
                if(cancelDownload.get())throw new IOException("Download cancelado");
                Files.move(partial.toPath(),apk.toPath(),StandardCopyOption.REPLACE_EXISTING);
                post(()->{
                    busy=false;readyApk=apk;dismissProgress();onChange.run();
                    new AlertDialog.Builder(activity)
                        .setTitle("Download verificado")
                        .setMessage("O APK corresponde à versão "+feed.versionName+" e tem a mesma assinatura do aplicativo instalado.\n\nDeseja abrir o instalador do Android agora?")
                        .setNegativeButton("Depois",null)
                        .setPositiveButton("Instalar", (d,w)->installReady()).show();
                });
            }catch(Exception e){
                if(partial!=null)partial.delete();
                final boolean cancelled=cancelDownload.get();
                post(()->{
                    busy=false;dismissProgress();onChange.run();
                    if(!cancelled)message("Atualização não concluída",safeMessage(e)+
                       "\n\nNenhum projeto foi removido.");
                });
            }
        });
    }

    private void downloadAndVerify(UpdateFeed feed,File target) throws Exception{
        if(!UpdateFeed.isTrustedReleaseUrl(feed.apkUrl))
            throw new IOException("Origem do download não autorizada.");
        HttpURLConnection conn=openHttps(feed.apkUrl);
        try{
            if(conn.getResponseCode()!=HttpURLConnection.HTTP_OK)
                throw new IOException("O servidor devolveu HTTP "+conn.getResponseCode()+".");
            MessageDigest digest=MessageDigest.getInstance("SHA-256");
            long total=0;
            try(InputStream in=conn.getInputStream();FileOutputStream out=new FileOutputStream(target)){
                byte[] buffer=new byte[32768];
                int read;
                while((read=in.read(buffer))!=-1){
                    if(cancelDownload.get()||Thread.currentThread().isInterrupted())
                        throw new IOException("Download interrompido");
                    total+=read;
                    if(total>feed.sizeBytes||total>UpdateFeed.MAX_APK_BYTES)
                        throw new IOException("O arquivo ultrapassou o tamanho publicado.");
                    digest.update(buffer,0,read);out.write(buffer,0,read);
                    int pct=(int)(total*100/feed.sizeBytes);
                    if(pct/5>lastProgress/5){
                        lastProgress=pct;
                        post(()->{if(progressDialog!=null)progressDialog.setMessage(
                            "Baixando "+feed.versionName+" · "+pct+"%");});
                    }
                }
                out.getFD().sync();
            }
            if(total!=feed.sizeBytes)
                throw new IOException("Tamanho do APK diferente do publicado.");
            String actual=hex(digest.digest());
            if(!feed.sha256.equals(actual))
                throw new IOException("A integridade do APK não corresponde à versão publicada.");
            verifyCandidate(target,feed);
        }finally{conn.disconnect();}
    }

    private void verifyCandidate(File apk,UpdateFeed feed) throws Exception{
        PackageManager pm=activity.getPackageManager();
        int flags=Build.VERSION.SDK_INT>=28?
                PackageManager.GET_SIGNING_CERTIFICATES:PackageManager.GET_SIGNATURES;
        PackageInfo candidate=pm.getPackageArchiveInfo(apk.getAbsolutePath(),flags);
        PackageInfo installed=pm.getPackageInfo(activity.getPackageName(),flags);
        if(candidate==null || !feed.packageName.equals(candidate.packageName))
            throw new IOException("O arquivo não pertence ao TV Touch instalado.");
        long candidateCode=versionCode(candidate);
        if(candidateCode!=feed.versionCode||candidateCode<=installedCode)
            throw new IOException("A versão do APK não corresponde ao catálogo.");
        if(candidate.applicationInfo==null
                || candidate.applicationInfo.minSdkVersion>Build.VERSION.SDK_INT)
            throw new IOException("Esta versão não é compatível com o Android do aparelho.");
        Signature[] candidateSigners=signers(candidate);
        Signature[] installedSigners=signers(installed);
        if(candidateSigners==null || installedSigners==null
                || candidateSigners.length==0
                || !Arrays.equals(candidateSigners,installedSigners))
            throw new IOException("A assinatura do APK é diferente da versão instalada.");
    }

    private static long versionCode(PackageInfo info){
        return Build.VERSION.SDK_INT>=28?info.getLongVersionCode():info.versionCode;
    }
    private static Signature[] signers(PackageInfo info){
        if(Build.VERSION.SDK_INT>=28){
            return info.signingInfo==null?null:info.signingInfo.getApkContentsSigners();
        }
        return info.signatures;
    }

    private static HttpURLConnection openHttps(String address) throws IOException {
        URL url=new URL(address);
        for(int redirects=0;redirects<6;redirects++){
            if(!"https".equalsIgnoreCase(url.getProtocol()) || url.getUserInfo()!=null)
                throw new IOException("Só são aceitos endereços HTTPS.");
            String host=url.getHost().toLowerCase(Locale.ROOT);
            if(!host.equals("github.com")
                    &&!host.equals("raw.githubusercontent.com")
                    &&!host.equals("release-assets.githubusercontent.com")
                    &&!host.equals("objects.githubusercontent.com"))
                throw new IOException("Origem do arquivo não autorizada.");
            HttpURLConnection c=(HttpURLConnection)url.openConnection();
            c.setConnectTimeout(12000);c.setReadTimeout(25000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent","TVTouch-Android-Updater");
            int code=c.getResponseCode();
            if(code==301||code==302||code==303||code==307||code==308){
                String location=c.getHeaderField("Location");
                c.disconnect();
                if(location==null)throw new IOException("Redirecionamento sem destino.");
                url=new URL(url,location);
                continue;
            }
            return c;
        }
        throw new IOException("A atualização foi redirecionada muitas vezes.");
    }
    private static String fetchText(String url) throws Exception{
        HttpURLConnection conn=openHttps(url);
        try{
            if(conn.getResponseCode()!=HttpURLConnection.HTTP_OK)
                throw new IOException("Catálogo indisponível (HTTP "+conn.getResponseCode()+").");
            try(InputStream input=conn.getInputStream();ByteArrayOutputStream out=new ByteArrayOutputStream()){
                byte[] b=new byte[2048];int n;
                while((n=input.read(b))!=-1){
                    if(out.size()+n>MAX_FEED_BYTES)throw new IOException("Catálogo maior que o permitido.");
                    out.write(b,0,n);
                }
                return new String(out.toByteArray(),java.nio.charset.StandardCharsets.UTF_8);
            }
        }finally{conn.disconnect();}
    }

    private long getInstalledVersionCode(){
        try{return versionCode(activity.getPackageManager().getPackageInfo(activity.getPackageName(),0));}
        catch(PackageManager.NameNotFoundException e){return 0;}
    }
    private static String fileSha256(File file) throws Exception{
        MessageDigest digest=MessageDigest.getInstance("SHA-256");
        try(InputStream input=new java.io.FileInputStream(file)){
            byte[] block=new byte[32768];int n;
            while((n=input.read(block))!=-1)digest.update(block,0,n);
        }
        return hex(digest.digest());
    }
    private static String hex(byte[] bytes){
        StringBuilder s=new StringBuilder();
        for(byte b:bytes)s.append(String.format(Locale.US,"%02x",b&0xff));
        return s.toString();
    }
    private static String safeMessage(Exception e){
        String s=e.getMessage();
        return s==null?"Falha desconhecida":s.length()>170?s.substring(0,170):s;
    }
    private static String notes(UpdateFeed feed){
        return feed.releaseNotes.isEmpty()?"Melhorias e correções desta versão.":feed.releaseNotes;
    }

    public void onResume(){
        if(!isEnabled()||closed||!waitingInstallerPermission)return;
        if(activity.getPackageManager().canRequestPackageInstalls()){
            waitingInstallerPermission=false;
            main.postDelayed(this::installReady,200);
        }
    }
    public void installReady(){
        if(closed||readyApk==null||!readyApk.isFile()){
            message("Arquivo não disponível","Baixe novamente a atualização em Ajustes.");
            return;
        }
        if(!activity.getPackageManager().canRequestPackageInstalls()){
            new AlertDialog.Builder(activity)
                .setTitle("Autorizar atualização")
                .setMessage("Para instalar APKs de teste, autorize o TV Touch como origem de instalação nas configurações do Android. Essa permissão pode ser revogada depois. O Android ainda pedirá a confirmação da atualização.")
                .setNegativeButton("Cancelar",null)
                .setPositiveButton("Abrir configurações",(d,w)->{
                    waitingInstallerPermission=true;
                    try{
                        Intent settings=new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                            Uri.parse("package:"+activity.getPackageName()));
                        activity.startActivity(settings);
                    }catch(Exception e){waitingInstallerPermission=false;message(
                        "Configuração indisponível","Este aparelho pode restringir instalação de APKs. "+safeMessage(e));}
                }).show();
            return;
        }
        try{
            // Recheck the exact cached APK before opening Android's installer.
            if(currentFeed==null || !readyApk.isFile()
                    || readyApk.length()!=currentFeed.sizeBytes
                    || !currentFeed.sha256.equals(fileSha256(readyApk))) {
                readyApk=null;
                message("Arquivo alterado","O pacote não passou pela nova conferência de integridade. Baixe novamente.");
                return;
            }
            verifyCandidate(readyApk,currentFeed);
            Uri uri=Uri.parse("content://"+activity.getPackageName()+".updates/update.apk");
            Intent installer=new Intent(Intent.ACTION_VIEW);
            installer.setDataAndType(uri,APK_MIME);
            installer.setClipData(ClipData.newRawUri("TV Touch",uri));
            installer.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            activity.startActivity(installer);
        }catch(Exception e){message("Instalador indisponível",
            "O aparelho não abriu a instalação: "+safeMessage(e));}
    }

    private void post(Runnable action){main.post(()->{if(!closed&&!activity.isFinishing()&&!activity.isDestroyed())action.run();});}
    private void message(String title,String content){if(!closed)new AlertDialog.Builder(activity)
        .setTitle(title).setMessage(content).setPositiveButton("Entendi",null).show();}
    private void toast(String msg){Toast.makeText(activity,msg,Toast.LENGTH_LONG).show();}
    private void dismissProgress(){if(progressDialog!=null){progressDialog.dismiss();progressDialog=null;}}
    public void close(){
        closed=true;cancelDownload.set(true);executor.shutdownNow();dismissProgress();
    }
}
