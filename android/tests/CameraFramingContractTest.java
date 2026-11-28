package br.com.agv.touch.render.tests;

import br.com.agv.touch.render.SceneCamera;

/** Projects scene corners independently of the production framing formula. */
public final class CameraFramingContractTest {
    private static int projectedCorners;

    public static void main(String[] args) {
        verifyOriginalClippingRegression();
        float[][] viewports = {
            {412, 600}, {720, 980}, {550, 280}, {914, 85},
            {1600, 368}, {1920, 800}, {3840, 1640}, {240, 1200}
        };
        float[] heights = {1, 2, 5, 6};
        float[] yaws = {0, 45, 90, 135, 180, 270, 359};
        float[] pitches = {15, 36, 75};
        for (float[] viewport : viewports) {
            float aspect = viewport[0] / viewport[1];
            for (float height : heights) for (float yaw : yaws) for (float pitch : pitches) {
                SceneCamera camera = SceneCamera.initial(height).rotateBy(yaw - 45, pitch - 36);
                verifyBounds(camera, aspect, height);
            }
        }
        verifyManualZoomAndOrbit();
        verifySavedState();
        verifyInvalidInput();
        System.out.println("PASS camera framing: " + projectedCorners
            + " independently projected floor/construction corners, original clipping regression, zoom, orbit and state compatibility.");
    }

    private static void verifyOriginalClippingRegression() {
        // The old reset camera clipped this floor corner in the recorded wide APK.
        double[] point = project(new double[]{4, 0, 4}, 45, 36, 14, 1, 1600d / 368d);
        check(point[1] < -1.07, "The regression fixture must reproduce the old clipped corner.");
        SceneCamera fixed = SceneCamera.initial(1);
        double[] framed = project(new double[]{4, 0, 4}, fixed.yaw, fixed.pitch,
            fixed.distance(1600f / 368f), fixed.targetY, 1600d / 368d);
        check(Math.abs(framed[1]) < .98, "Enquadrar must restore the front floor corner with margin.");
    }

    private static void verifyBounds(SceneCamera camera, float aspect, float height) {
        // The real floor is -0.015; the reference includes a small tolerance around it.
        for (double x : new double[]{-4, 4}) for (double y : new double[]{-.03, height})
            for (double z : new double[]{-4, 4}) {
                double[] p = project(new double[]{x, y, z}, camera.yaw, camera.pitch,
                    camera.distance(aspect), camera.targetY, aspect);
                check(Math.abs(p[0]) <= .98 && Math.abs(p[1]) <= .98,
                    "Corner outside framing margin: aspect=" + aspect + ", height=" + height
                    + ", yaw=" + camera.yaw + ", pitch=" + camera.pitch
                    + ", ndc=" + p[0] + "," + p[1]);
                check(p[2] > SceneCamera.NEAR_PLANE && p[2] < camera.farPlane(aspect),
                    "Framed corner must lie between the clipping planes.");
                projectedCorners++;
            }
    }

    private static void verifyManualZoomAndOrbit() {
        SceneCamera fitted = SceneCamera.initial(6);
        SceneCamera zoomed = fitted.zoomBy(.8f).rotateBy(75, 12);
        for (float aspect : new float[]{.4f, 1f, 4f}) {
            close(zoomed.distance(aspect), fitted.distance(aspect) * .8f, .0001f,
                "Manual zoom must survive the change of aspect.");
        }
        close(zoomed.framingHeight, 6, 0, "Orbit must retain the captured construction height.");
        close(fitted.rotateBy(90, 20).distance(2), fitted.distance(2), 0,
            "Orbit must not continuously resize the fitted scene.");
        close(zoomed.zoomBy(1f / .8f).zoomFactor, 1, .00001f, "Zoom must be reversible.");
        close(fitted.zoomBy(100).zoomFactor, SceneCamera.MAX_ZOOM, 0, "Zoom-out bound.");
        close(fitted.zoomBy(.001f).zoomFactor, SceneCamera.MIN_ZOOM, 0, "Zoom-in bound.");
    }

    private static void verifySavedState() {
        SceneCamera before = SceneCamera.initial(5).rotateBy(85, -10).zoomBy(.85f);
        float[] saved = before.save();
        check(saved.length == 4, "Current state has a captured framing height.");
        SceneCamera after = SceneCamera.restore(saved, 1);
        close(after.yaw, before.yaw, 0, "Saved yaw.");
        close(after.pitch, before.pitch, 0, "Saved pitch.");
        close(after.zoomFactor, before.zoomFactor, 0, "Saved manual zoom.");
        close(after.framingHeight, 5, 0, "Rotation must not recapture a different height.");
        saved[0] = 0;
        close(after.yaw, before.yaw, 0, "Restored state is independent from the input array.");
        SceneCamera legacy = SceneCamera.restore(new float[]{120, 40, 21}, 6);
        close(legacy.yaw, 120, 0, "Legacy yaw.");
        close(legacy.pitch, 40, 0, "Legacy pitch.");
        close(legacy.zoomFactor, 1.5f, 0, "Legacy distance converts to relative zoom.");
        close(legacy.framingHeight, 6, 0, "Legacy state uses current content height.");
    }

    private static void verifyInvalidInput() {
        SceneCamera camera = SceneCamera.initial(2);
        check(camera.zoomBy(0) == camera && camera.zoomBy(-1) == camera
            && camera.zoomBy(Float.NaN) == camera && camera.zoomBy(Float.POSITIVE_INFINITY) == camera,
            "Invalid scale gestures must not poison camera state.");
        check(camera.rotateBy(Float.NaN, 0) == camera, "Invalid orbit must be ignored.");
        for (float[] invalid : new float[][]{null, {}, {1, 2}, {1, Float.NaN, 3},
            {1, 2, Float.POSITIVE_INFINITY, 6}}) {
            SceneCamera restored = SceneCamera.restore(invalid, 2);
            close(restored.zoomFactor, 1, 0, "Invalid saved state restores safe framing.");
            check(!Float.isNaN(restored.distance(1)), "Safe distance after invalid state.");
        }
        close(camera.distance(0), camera.distance(1), 0, "Unset aspect falls back safely.");
        close(camera.distance(Float.NaN), camera.distance(1), 0, "Invalid aspect falls back safely.");
    }

    /** Independent look-at basis and perspective projection; no Android Matrix dependency. */
    private static double[] project(double[] point, double yaw, double pitch,
            double distance, double targetY, double aspect) {
        double azimuth = Math.toRadians(yaw), elevation = Math.toRadians(pitch);
        double[] eye = {Math.cos(azimuth) * Math.cos(elevation) * distance,
            targetY + Math.sin(elevation) * distance, Math.sin(azimuth) * Math.cos(elevation) * distance};
        double[] forward = normalize(new double[]{-eye[0], targetY - eye[1], -eye[2]});
        double[] right = normalize(cross(forward, new double[]{0, 1, 0}));
        double[] up = cross(right, forward);
        double[] delta = {point[0] - eye[0], point[1] - eye[1], point[2] - eye[2]};
        double depth = dot(delta, forward), tangent = Math.tan(Math.toRadians(42d / 2d));
        return new double[]{dot(delta, right) / (depth * tangent * aspect),
            dot(delta, up) / (depth * tangent), depth};
    }

    private static double[] cross(double[] a, double[] b) {
        return new double[]{a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]};
    }
    private static double dot(double[] a, double[] b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
    private static double[] normalize(double[] v) {
        double length = Math.sqrt(dot(v, v));
        return new double[]{v[0] / length, v[1] / length, v[2] / length};
    }
    private static void close(float actual, float expected, float tolerance, String message) {
        check(Math.abs(actual - expected) <= tolerance, message + ": " + actual + " != " + expected);
    }
    private static void check(boolean valid, String message) { if (!valid) throw new AssertionError(message); }
}
