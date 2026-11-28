package br.com.agv.touch.updates.tests;

import br.com.agv.touch.updates.UpdateFeed;
import org.json.JSONException;

/** Host-side contract: reject untrusted update metadata before network or installation. */
public final class UpdateFeedTest {
    private static final String PKG="br.com.agv.touch.dev";
    private static final String URL="https://github.com/gb-eli/touch/releases/download/v0.1.3-dev/tv-touch.apk";
    private static final String HASH="0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    private static int checks;

    private static String json(String pkg,long version,int sdk,String url,long bytes,String sha){
        return "{\"schema\":1,\"packageName\":\""+pkg+"\",\"versionCode\":"+version+
            ",\"versionName\":\"0.1.3-dev\",\"minSdk\":"+sdk+
            ",\"notes\":\"Corrige a interface\",\"apkUrl\":\""+url+
            "\",\"sizeBytes\":"+bytes+",\"sha256\":\""+sha+"\"}";
    }
    private static void check(boolean value,String msg){
        checks++;if(!value)throw new AssertionError(msg);
    }
    private static void reject(String data){
        checks++;
        try{UpdateFeed.parse(data,PKG);throw new AssertionError("Expected rejection: "+data);}
        catch(JSONException expected){}
    }
    public static void main(String[] args) throws Exception {
        UpdateFeed feed=UpdateFeed.parse(json(PKG,7,26,URL,150000,HASH),PKG);
        check(feed.available(5,35),"new version should be available");
        check(!feed.available(7,35),"same version is not an update");
        check(!feed.available(5,25),"unsupported Android version");
        check(feed.versionCode==7 && feed.sizeBytes==150000,"metadata");
        UpdateFeed unpublished=UpdateFeed.parse(json(PKG,7,26,"",0,""),PKG);
        check(unpublished.newerButUnavailable(5),"do not offer an unpublished binary");
        check(!unpublished.available(5,35),"no APK to download");
        reject(json("br.com.other.app",7,26,URL,150000,HASH));
        reject(json(PKG,0,26,URL,150000,HASH));
        reject(json(PKG,7,26,"http://github.com/gb-eli/touch/releases/download/x/app.apk",150000,HASH));
        reject(json(PKG,7,26,"https://evil.example/app.apk",150000,HASH));
        reject(json(PKG,7,26,"https://github.com/other/repo/releases/download/x/app.apk",150000,HASH));
        reject(json(PKG,7,26,"https://github.com/gb-eli/touch/releases/download/v1/../file.apk",150000,HASH));
        reject(json(PKG,7,26,URL,0,HASH));
        reject(json(PKG,7,26,URL,150000,"invalid"));
        reject(json(PKG,7,26,"",0,HASH));
        reject(json(PKG,7,26,"",120000,""));
        reject("{\"schema\":2}");
        check(!UpdateFeed.isTrustedReleaseUrl("https://github.com.evil.test/gb-eli/touch/releases/download/x/a.apk"),"host spoof");
        System.out.println("Update feed contract passed: "+checks+" checks");
    }
}
