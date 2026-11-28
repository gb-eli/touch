package br.com.agv.touch.updates;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Locale;
import org.json.JSONException;
import org.json.JSONObject;

/** Strict metadata contract for the sideloaded development channel. */
public final class UpdateFeed {
    public static final String FEED_URL =
        "https://raw.githubusercontent.com/gb-eli/touch/main/docs/android/updates/dev.json";
    public static final long MAX_APK_BYTES = 300L * 1024L * 1024L;
    private static final String RELEASE_PREFIX = "/gb-eli/touch/releases/download/";

    public final String packageName, versionName, releaseNotes, apkUrl, sha256;
    public final long versionCode, sizeBytes;
    public final int minSdk;

    private UpdateFeed(String packageName, String versionName, String releaseNotes,
                       String apkUrl, String sha256, long versionCode,
                       long sizeBytes, int minSdk) {
        this.packageName=packageName;
        this.versionName=versionName;
        this.releaseNotes=releaseNotes;
        this.apkUrl=apkUrl;
        this.sha256=sha256;
        this.versionCode=versionCode;
        this.sizeBytes=sizeBytes;
        this.minSdk=minSdk;
    }

    public static UpdateFeed parse(String json, String expectedPackage)
            throws JSONException {
        JSONObject obj=new JSONObject(json);
        if(obj.optInt("schema",-1)!=1)
            throw new JSONException("Formato do catálogo de atualização não reconhecido.");
        String pkg=obj.optString("packageName","").trim();
        String name=obj.optString("versionName","").trim();
        long code=obj.optLong("versionCode",0);
        int min=obj.optInt("minSdk",26);
        String notes=obj.optString("notes","").trim();
        String url=obj.optString("apkUrl","").trim();
        String sha=obj.optString("sha256","").trim().toLowerCase(Locale.ROOT);
        long size=obj.optLong("sizeBytes",0);
        if(!expectedPackage.equals(pkg) || name.isEmpty() || name.length()>80
                || code<=0 || code>Integer.MAX_VALUE || min<26 || min>100
                || notes.length()>1400)
            throw new JSONException("Metadados inválidos para este aplicativo.");
        if(url.isEmpty()) {
            if(!sha.isEmpty() || size!=0)
                throw new JSONException("Catálogo incompleto: arquivo de instalação ausente.");
        } else {
            if(!isTrustedReleaseUrl(url)
                    || !sha.matches("[0-9a-f]{64}")
                    || size<1024 || size>MAX_APK_BYTES)
                throw new JSONException("Origem ou integridade do APK inválida.");
        }
        return new UpdateFeed(pkg,name,notes,url,sha,code,size,min);
    }

    public boolean available(long installedCode, int deviceSdk) {
        return versionCode>installedCode && minSdk<=deviceSdk
            && !apkUrl.isEmpty();
    }

    public boolean newerButUnavailable(long installedCode) {
        return versionCode>installedCode && apkUrl.isEmpty();
    }

    public static boolean isTrustedReleaseUrl(String value) {
        try {
            URI u=new URI(value);
            return "https".equalsIgnoreCase(u.getScheme())
                && "github.com".equalsIgnoreCase(u.getHost())
                && u.getRawUserInfo()==null
                && u.getRawQuery()==null && u.getRawFragment()==null
                && u.getRawPath()!=null
                && u.getRawPath().startsWith(RELEASE_PREFIX)
                && u.getRawPath().length()>RELEASE_PREFIX.length()
                && !u.getRawPath().contains("..")
                && !u.getRawPath().contains("//")
                && u.getPort()==-1;
        } catch(URISyntaxException e) {return false;}
    }
}
