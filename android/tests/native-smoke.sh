#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
(cd android && ./gradlew --no-daemon :app:assembleDebug)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell wm size 1080x2160
adb shell wm density 420
adb shell am start -n br.com.agv.touch.dev/br.com.agv.touch.MainActivity
sleep 5
mkdir -p native-artifacts
adb exec-out screencap -p > native-artifacts/01-home.png
python3 android/tests/native-smoke.py
adb logcat -d -s AndroidRuntime:E > native-artifacts/androidruntime.log
if grep -q 'FATAL EXCEPTION' native-artifacts/androidruntime.log; then
  echo 'Application crash detected'
  exit 1
fi
echo 'Native Android smoke passed'
