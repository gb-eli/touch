#!/usr/bin/env python3
"""Verify the development artifact without installing it or accessing a device."""

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import zipfile


def run(command):
    result = subprocess.run(command, check=True, text=True, capture_output=True)
    return result.stdout


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("apk", type=Path)
    parser.add_argument("--sdk", type=Path, default=os.environ.get("ANDROID_HOME")
                        or os.environ.get("ANDROID_SDK_ROOT"))
    parser.add_argument("--package", default="br.com.agv.touch.dev")
    args = parser.parse_args()
    if not args.sdk:
        parser.error("Set ANDROID_HOME or provide --sdk.")
    apk = args.apk.resolve(strict=True)
    build_tools = Path(args.sdk) / "build-tools" / "35.0.1"
    for name in ("aapt2", "zipalign", "apksigner"):
        if not (build_tools / name).is_file():
            parser.error("SDK Build Tools 35.0.1 not found: " + str(build_tools / name))

    signature = run([str(build_tools / "apksigner"), "verify", "--verbose", str(apk)])
    run([str(build_tools / "zipalign"), "-c", "-P", "16", "4", str(apk)])
    badging = run([str(build_tools / "aapt2"), "dump", "badging", str(apk)])
    permissions = run([str(build_tools / "aapt2"), "dump", "permissions", str(apk)])

    match = re.search(r"^package: name='([^']+)'", badging, re.MULTILINE)
    if not match or match.group(1) != args.package:
        raise ValueError("Unexpected application ID in APK.")
    if not re.search(r"^(?:minSdkVersion|sdkVersion):'26'$", badging, re.MULTILINE) or "targetSdkVersion:'35'" not in badging:
        raise ValueError("Unexpected SDK requirements in APK.")
    permission_names = re.findall(r"uses-permission[^:]*: name='([^']+)'", permissions)
    if permission_names:
        raise ValueError("The initial MVP must not request permissions: " + ", ".join(permission_names))
    with zipfile.ZipFile(apk) as archive:
        names = archive.namelist()
        if "classes.dex" not in names or "AndroidManifest.xml" not in names:
            raise ValueError("APK is missing application code or Android manifest.")
        private_files = [name for name in names if name.lower().endswith(
            (".keystore", ".jks", ".p12", ".pfx", ".pem", ".key", "/.env"))]
        if private_files:
            raise ValueError("Unexpected private configuration or key file in APK.")
        native_libraries = [name for name in names if name.startswith("lib/") and name.endswith(".so")]
    print(json.dumps({
        "apk": str(apk),
        "application_id": match.group(1),
        "bytes": apk.stat().st_size,
        "sha256": hashlib.sha256(apk.read_bytes()).hexdigest(),
        "minimum_api": 26,
        "target_api": 35,
        "permissions": permission_names,
        "native_libraries": native_libraries,
        "private_key_files": private_files,
        "signature_verified": "Verifies" in signature,
        "alignment_verified": True,
        "scope": "Static APK verification; physical device validation remains separate.",
    }, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, subprocess.CalledProcessError, zipfile.BadZipFile) as error:
        print("APK verification failed: " + str(error), file=sys.stderr)
        raise SystemExit(1)
