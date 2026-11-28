#!/usr/bin/env python3
"""Verify an isolated debug APK before installing; never modifies the APK."""
import argparse, hashlib, json, os, pathlib, re, subprocess, zipfile
def main():
    p=argparse.ArgumentParser()
    p.add_argument("apk",type=pathlib.Path)
    p.add_argument("--sdk",default=os.environ.get("ANDROID_HOME") or os.environ.get("ANDROID_SDK_ROOT"))
    p.add_argument("--out",type=pathlib.Path)
    a=p.parse_args()
    if not a.sdk: p.error("Set ANDROID_HOME or --sdk")
    tools=pathlib.Path(a.sdk)/"build-tools"/"35.0.1"
    def run(name,*args):
        suffix=(".bat" if name=="apksigner" else ".exe") if os.name=="nt" else ""
        return subprocess.check_output([str(tools/(name+suffix)),*map(str,args)],text=True,stderr=subprocess.STDOUT)
    apk=a.apk.resolve(strict=True)
    badging=run("aapt2","dump","badging",apk)
    package=re.search(r"package: name='([^']+)' versionCode='([^']+)' versionName='([^']+)'",badging)
    if not package or package.groups()!=("br.com.agv.touch.filamentlab","2","2.0-alpha.2"):
        raise SystemExit("Unexpected package or version; do not install")
    if not re.search(r"sdkVersion:'26'",badging): raise SystemExit("Unexpected minSdk")
    if re.search(r"uses-permission[^:]*:",badging): raise SystemExit("Unexpected APK permission")
    signing=run("apksigner","verify","--verbose","--print-certs",apk)
    if "Verified using v2 scheme (APK Signature Scheme v2): true" not in signing: raise SystemExit("APK v2 signature not verified")
    cert=re.search(r"certificate SHA-256 digest:\s*([0-9a-fA-F]{64})",signing)
    if not cert: raise SystemExit("Signing certificate unavailable")
    with zipfile.ZipFile(apk) as z:
        if z.testzip(): raise SystemExit("Corrupt ZIP entry")
        names=set(z.namelist())
        abis=sorted({n.split("/")[1] for n in names if n.startswith("lib/") and n.endswith(".so")})
        if not abis: raise SystemExit("No native libraries")
        for abi in abis:
            for lib in ("libfilament-jni.so","libgltfio-jni.so"):
                if f"lib/{abi}/{lib}" not in names: raise SystemExit(f"Missing {abi}/{lib}")
        model=z.read("assets/metal-rough.glb")
        blob=hashlib.sha1(b"blob "+str(len(model)).encode()+b"\0"+model).hexdigest()
        if blob!="278b83ac0ffa12aeb025f7bd963b1a993b91a8d7": raise SystemExit("Unexpected sample asset")
    result={"package":package[1],"versionCode":2,"versionName":package[3],"minSdk":26,"abis":abis,"sha256":hashlib.sha256(apk.read_bytes()).hexdigest(),"bytes":apk.stat().st_size,"certificateSha256":cert[1],"sampleGitBlob":blob,"signatureVerified":True,"deviceTested":False}
    output=json.dumps(result,indent=2)
    if a.out: a.out.write_text(output+"\n",encoding="utf-8")
    print(output)
if __name__=="__main__": main()
