package br.com.agv.touch.updates;

import android.content.ContentProvider;
import android.content.ContentValues;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.provider.OpenableColumns;
import android.net.Uri;
import android.os.ParcelFileDescriptor;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.IOException;

/** Read-only grant to a single verified APK in this app's private update cache. */
public final class UpdateApkProvider extends ContentProvider {
    @Override public boolean onCreate(){return true;}

    @Override public ParcelFileDescriptor openFile(Uri uri,String mode) throws FileNotFoundException {
        if(!"r".equals(mode) || uri==null
                || !"update.apk".equals(uri.getLastPathSegment())
                || uri.getPathSegments().size()!=1
                || !getContext().getPackageName().concat(".updates").equals(uri.getAuthority()))
            throw new FileNotFoundException("Arquivo não disponível.");
        File root=new File(getContext().getCacheDir(),"updates");
        File apk=new File(root,"update.apk");
        try {
            if(!apk.getCanonicalFile().getParentFile().equals(root.getCanonicalFile())
                    || !apk.isFile() || apk.length()==0)
                throw new FileNotFoundException("Atualização indisponível.");
        } catch(IOException e){throw new FileNotFoundException("Arquivo inválido.");}
        return ParcelFileDescriptor.open(apk,ParcelFileDescriptor.MODE_READ_ONLY);
    }
    @Override public String getType(Uri uri) {
        return "application/vnd.android.package-archive";
    }
    @Override public Cursor query(Uri uri,String[] projection,String selection,String[] selectionArgs,String sortOrder){
        if(uri==null || !"update.apk".equals(uri.getLastPathSegment()))return null;
        if(projection==null)projection=new String[]{OpenableColumns.DISPLAY_NAME,OpenableColumns.SIZE};
        MatrixCursor cursor=new MatrixCursor(projection,1);Object[] row=new Object[projection.length];
        for(int i=0;i<projection.length;i++){
            if(OpenableColumns.DISPLAY_NAME.equals(projection[i]))row[i]="tv-touch-update.apk";
            else if(OpenableColumns.SIZE.equals(projection[i]))row[i]=new File(new File(getContext().getCacheDir(),"updates"),"update.apk").length();
        }
        cursor.addRow(row);return cursor;
    }
    @Override public Uri insert(Uri uri,ContentValues values){throw new UnsupportedOperationException();}
    @Override public int delete(Uri uri,String selection,String[] args){throw new UnsupportedOperationException();}
    @Override public int update(Uri uri,ContentValues values,String selection,String[] args){throw new UnsupportedOperationException();}
}
