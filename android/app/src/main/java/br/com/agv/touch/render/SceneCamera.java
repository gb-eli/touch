package br.com.agv.touch.render;

/**
 * Immutable camera state, independent of Android and OpenGL.
 *
 * A sphere around the whole floor and the captured construction height fits inside
 * both camera angles. Its size is fixed until the user requests a new framing, so
 * placing a piece or orbiting does not unexpectedly move the camera backwards.
 */
public final class SceneCamera {
    public static final float VERTICAL_FOV_DEGREES = 42f;
    public static final float NEAR_PLANE = .5f;
    public static final float FLOOR_Y = -.03f;
    public static final float FRAMING_MARGIN = 1.06f;
    public static final float MIN_ZOOM = .4f, MAX_ZOOM = 2.5f;
    private static final double TAN_HALF_FOV = Math.tan(Math.toRadians(VERTICAL_FOV_DEGREES / 2));

    public final float yaw, pitch, zoomFactor, framingHeight, targetY;
    private final float radius;

    private SceneCamera(float yaw, float pitch, float zoomFactor, float height) {
        this.yaw = ((yaw % 360f) + 360f) % 360f;
        this.pitch = clamp(pitch, 15f, 75f);
        this.zoomFactor = clamp(zoomFactor, MIN_ZOOM, MAX_ZOOM);
        this.framingHeight = clamp(height, 1f, 6f);
        this.targetY = (this.framingHeight + FLOOR_Y) / 2f;
        double halfHeight = (this.framingHeight - FLOOR_Y) / 2d;
        this.radius = (float) Math.sqrt(4d * 4d + 4d * 4d + halfHeight * halfHeight);
    }

    public static SceneCamera initial(float height) {
        return new SceneCamera(45f, 36f, 1f, finite(height) ? height : 1f);
    }

    public SceneCamera withFramingHeight(float height) {
        return finite(height) ? new SceneCamera(yaw, pitch, zoomFactor, height) : this;
    }

    public SceneCamera rotateBy(float yawDelta, float pitchDelta) {
        if (!finite(yawDelta) || !finite(pitchDelta)) return this;
        return new SceneCamera(yaw + yawDelta, pitch + pitchDelta, zoomFactor, framingHeight);
    }

    public SceneCamera zoomBy(float factor) {
        if (!finite(factor) || factor <= 0f) return this;
        return new SceneCamera(yaw, pitch, clamp(zoomFactor * factor, MIN_ZOOM, MAX_ZOOM), framingHeight);
    }

    /** Distance fits the reference bounds at zoom 1; explicit zoom may crop them. */
    public float distance(float aspect) {
        double safeAspect = finite(aspect) && aspect > 0f ? aspect : 1d;
        double tangent = TAN_HALF_FOV * Math.min(1d, safeAspect);
        double sine = tangent / Math.sqrt(1d + tangent * tangent);
        return (float) (radius * FRAMING_MARGIN / sine * zoomFactor);
    }

    public float farPlane(float aspect) {
        return Math.max(100f, distance(aspect) + radius * 2f + 10f);
    }

    /** Four-value state: yaw, pitch, relative zoom and height captured by framing. */
    public float[] save() { return new float[]{yaw, pitch, zoomFactor, framingHeight}; }

    /** Also accepts the previous three-value yaw/pitch/distance format. */
    public static SceneCamera restore(float[] values, float fallbackHeight) {
        SceneCamera fallback = initial(fallbackHeight);
        if (values == null || (values.length != 3 && values.length != 4)) return fallback;
        for (float value : values) if (!finite(value)) return fallback;
        float zoom = values.length == 3 ? values[2] / 14f : values[2];
        float height = values.length == 4 ? values[3] : fallback.framingHeight;
        return new SceneCamera(values[0], values[1], zoom, height);
    }

    private static float clamp(float value, float min, float max) {
        return Math.max(min, Math.min(max, value));
    }
    private static boolean finite(float value) { return !Float.isNaN(value) && !Float.isInfinite(value); }
}
