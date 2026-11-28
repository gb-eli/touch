# AGV Filament Lab — 2.0-alpha.1
Experimental app completely separate from Studio Prism. Base Android branch `app/studio-0.2.1-update-test` (1985c0dd7f1f58731a9bf68c24cfb8e6a5fee8d5). Package `br.com.agv.touch.filamentlab`; no update feed, signing key, project storage, network or installation permission. No changes to existing Android source.
- Filament and gltfio pinned at 1.56.0 (Apache 2.0); official API source: https://github.com/google/filament/tree/v1.56.0. This is a deliberately fixed POC baseline, not latest; review current maintained versions/security before integration.
- Local sample Khronos MetalRoughSpheresNoTextures, CC0 1.0, same binary blob as Web Graphics Lab. https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MetalRoughSpheresNoTextures
- OpenGL/Vulkan selection before creating the engine; capability flags are reported by Android, not proof. Native crash cannot be caught by Java; relaunch the lab and choose another backend. No automatic migration or fallback into the existing app.
- Direct PBR lights, diffuse spherical-harmonic ambient and constant skybox. No HDR reflection cubemap, AR, voxel editing, picking or project data. Benchmark counts accepted beginFrame/render/endFrame cycles, not presented frames or GPU timing.
## Build locally (Windows, from repo root)
Requires JDK 17, Android SDK 35 and network access to Google/Maven Central; use existing wrapper. Do not supply AGV_DEBUG_KEYSTORE.
```powershell
cd android
.\gradlew.bat -p filament-lab :app:assembleDebug
adb install -r filament-lab/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n br.com.agv.touch.filamentlab/.LauncherActivity
```
Verify package identity, ABI, APK size, dependencies and signature before installing. Debug lab is a separate package, so do not uninstall existing AGV Touch. No APK was generated in this revision.
## Acceptance
1. Run OpenGL then Vulkan if exposed on S25 Ultra and WA86F. Record actual engine backend, device/OS/ABI, screenshots, failures/logcat.
2. Rotate, pinch, back/reopen, rotate screen, background/foreground and repeated surface recreation. Confirm no crashes, no lingering frames and no impact to Studio projects.
3. Compare three 12-second runs per backend at same effective resolution; record accepted FPS, p95 and skipped frames. Use separate equivalent scene before comparing against GLES2 voxel renderer; the current sample is not comparable.
4. Export/record projects in the existing app and verify its version unchanged. No production release, APK feed change or signing changes.
Status: source POC only. Android SDK/Gradle/ADB unavailable in current runtime; Maven artifacts and Java API signatures inspected remotely, build/device execution not verified. Web 1.7 remains independently pending.
