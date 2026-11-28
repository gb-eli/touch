#!/usr/bin/env bash
set -euo pipefail
TV_TOUCH_REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
: "${TV_TOUCH_ANDROID_JAR:?Set TV_TOUCH_ANDROID_JAR to platforms/android-35/android.jar}"
: "${TV_TOUCH_JSON_JAR:?Set TV_TOUCH_JSON_JAR to the org.json 20240303 test runtime jar}"
TV_TOUCH_CLASSES_DIR="$(mktemp -d "${TMPDIR:-/tmp}/tv-touch-core-tests.XXXXXX")"
trap 'rm -rf "$TV_TOUCH_CLASSES_DIR"' EXIT
TV_TOUCH_TEST_CP="$TV_TOUCH_JSON_JAR:$TV_TOUCH_ANDROID_JAR"
java com.sun.tools.javac.Main -source 8 -target 8 -Xlint:-options -encoding UTF-8 -cp "$TV_TOUCH_TEST_CP" \
  -d "$TV_TOUCH_CLASSES_DIR" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/core/VoxelWorld.java" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/core/ProjectCodec.java" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/core/ProjectStore.java" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/core/ProjectTransfers.java" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/render/RayPicker.java" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/render/SceneCamera.java" \
  "$TV_TOUCH_REPO_ROOT/android/tests/CoreContractTest.java" \
  "$TV_TOUCH_REPO_ROOT/android/tests/ProjectTransfersTest.java" \
  "$TV_TOUCH_REPO_ROOT/android/tests/RayPickerContractTest.java" \
  "$TV_TOUCH_REPO_ROOT/android/app/src/main/java/br/com/agv/touch/updates/UpdateFeed.java" \
  "$TV_TOUCH_REPO_ROOT/android/tests/UpdateFeedTest.java" \
  "$TV_TOUCH_REPO_ROOT/android/tests/CameraFramingContractTest.java"
java -cp "$TV_TOUCH_CLASSES_DIR:$TV_TOUCH_TEST_CP" br.com.agv.touch.core.tests.CoreContractTest \
  "$TV_TOUCH_REPO_ROOT/tests/fixtures/voxel-contract.json"
java -cp "$TV_TOUCH_CLASSES_DIR:$TV_TOUCH_TEST_CP" br.com.agv.touch.core.tests.RayPickerContractTest \
  "$TV_TOUCH_REPO_ROOT/tests/fixtures/voxel-contract.json"
java -cp "$TV_TOUCH_CLASSES_DIR:$TV_TOUCH_TEST_CP" br.com.agv.touch.core.tests.ProjectTransfersTest
java -cp "$TV_TOUCH_CLASSES_DIR:$TV_TOUCH_TEST_CP" br.com.agv.touch.render.tests.CameraFramingContractTest
java -cp "$TV_TOUCH_CLASSES_DIR:$TV_TOUCH_TEST_CP" br.com.agv.touch.updates.tests.UpdateFeedTest
