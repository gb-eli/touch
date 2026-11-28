package br.com.agv.touch;

import android.content.ContentResolver;
import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.net.Uri;
import android.os.CancellationSignal;
import br.com.agv.touch.core.ProjectTransfers;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

/** Android providers are opened on the transfer worker using application context only. */
final class AndroidDocuments {
    private AndroidDocuments(){ }
    static ProjectTransfers.InputSource input(Context context,Uri uri){
        ContentResolver resolver=context.getApplicationContext().getContentResolver();
        return cancellation->{
            CancellationSignal signal=new CancellationSignal();cancellation.onCancel(signal::cancel);cancellation.throwIfCancelled();
            AssetFileDescriptor file=resolver.openAssetFileDescriptor(uri,"r",signal);
            if(file==null)throw new IOException("Arquivo indisponível.");
            try{return file.createInputStream();}catch(Exception error){try{file.close();}catch(IOException close){error.addSuppressed(close);}throw error;}
        };
    }
    static ProjectTransfers.OutputSource output(Context context,Uri uri){
        ContentResolver resolver=context.getApplicationContext().getContentResolver();
        return cancellation->{
            CancellationSignal signal=new CancellationSignal();cancellation.onCancel(signal::cancel);cancellation.throwIfCancelled();
            AssetFileDescriptor file=resolver.openAssetFileDescriptor(uri,"wt",signal);
            if(file==null)throw new IOException("Destino indisponível.");
            try{return file.createOutputStream();}catch(Exception error){try{file.close();}catch(IOException close){error.addSuppressed(close);}throw error;}
        };
    }
}
