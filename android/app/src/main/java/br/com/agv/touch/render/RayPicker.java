package br.com.agv.touch.render;

import br.com.agv.touch.core.VoxelWorld;
import java.util.List;

/** Grid picking independent of Android and the renderer. Coordinates match the web format. */
public final class RayPicker {
    private RayPicker() {}

    public static final class Hit {
        public final VoxelWorld.Block block;
        public final int x, y, z;
        public final boolean inBounds;
        public final float distance;
        Hit(VoxelWorld.Block block, int x, int y, int z, float distance) {
            this.block = block; this.x = x; this.y = y; this.z = z;
            this.distance = distance;
            this.inBounds = x >= 0 && x < 8 && z >= 0 && z < 8 && y >= 0 && y < 6;
        }
    }

    public static Hit pick(float[] origin, float[] direction, List<VoxelWorld.Block> blocks) {
        double length = Math.sqrt(direction[0]*direction[0] + direction[1]*direction[1] + direction[2]*direction[2]);
        if (length < 1e-8 || Double.isNaN(length)) return null;
        float[] dir = {(float)(direction[0]/length),(float)(direction[1]/length),(float)(direction[2]/length)};
        float nearest = Float.POSITIVE_INFINITY;
        Hit selected = null;
        for (VoxelWorld.Block b : blocks) {
            float[] center = {b.x-3.5f, b.y+0.5f, b.z-3.5f};
            float near = Float.NEGATIVE_INFINITY, far = Float.POSITIVE_INFINITY;
            int axisHit = -1, normalSign = 0;
            boolean misses = false;
            for (int axis = 0; axis < 3; axis++) {
                float min = center[axis]-.5f, max = center[axis]+.5f;
                if (Math.abs(dir[axis]) < 1e-8) {
                    if (origin[axis] < min || origin[axis] > max) { misses = true; break; }
                } else {
                    float a = (min-origin[axis])/dir[axis], c = (max-origin[axis])/dir[axis];
                    float entry = Math.min(a,c), exit = Math.max(a,c);
                    if (entry > near) { near = entry; axisHit = axis; normalSign = dir[axis] > 0 ? -1 : 1; }
                    far = Math.min(far,exit);
                    if (near > far) { misses = true; break; }
                }
            }
            if (misses || far < 0 || axisHit < 0) continue;
            float distance = near >= 0 ? near : far;
            if (distance > 0 && distance < nearest) {
                int[] target = {b.x,b.y,b.z}; target[axisHit] += normalSign;
                selected = new Hit(b,target[0],target[1],target[2],distance);
                nearest = distance;
            }
        }
        if (dir[1] < -.00001f) {
            float distance = -origin[1]/dir[1];
            if (distance > 0 && distance < nearest) {
                int x=(int)Math.floor(origin[0]+dir[0]*distance+4);
                int z=(int)Math.floor(origin[2]+dir[2]*distance+4);
                if (x >= 0 && x < 8 && z >= 0 && z < 8) return new Hit(null,x,0,z,distance);
            }
        }
        return selected;
    }
}
