$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) { throw "Configure o Android SDK." }
& javac -version
if ($LASTEXITCODE -ne 0) { throw "JDK indisponível" }
$tmp = Join-Path ([System.IO.Path]::GetTempPath()) ("agv-filament-" + [guid]::NewGuid())
New-Item -ItemType Directory -Path $tmp | Out-Null
try {
    & javac -d $tmp filament-lab/app/src/main/java/br/com/agv/touch/filamentlab/FrameStats.java filament-lab/tests/FrameStatsTest.java
    if ($LASTEXITCODE -ne 0) { throw "Falha no teste Java" }
    & java -cp $tmp br.com.agv.touch.filamentlab.FrameStatsTest
    if ($LASTEXITCODE -ne 0) { throw "Falha no contrato FrameStats" }
    & .\gradlew.bat -p filament-lab --no-daemon :app:assembleDebug :app:lintDebug
    if ($LASTEXITCODE -ne 0) { throw "Falha na build/lint" }
    & python filament-lab/tools/verify_apk.py filament-lab/app/build/outputs/apk/debug/app-debug.apk --out filament-lab/app/build/apk-verification.json
    if ($LASTEXITCODE -ne 0) { throw "APK não aprovado" }
} finally { Remove-Item -LiteralPath $tmp -Recurse -Force }
