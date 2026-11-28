package br.com.agv.touch.core.tests;

import br.com.agv.touch.core.VoxelWorld;
import br.com.agv.touch.render.RayPicker;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/** Tests the real pure-Java picker against rays produced by the web implementation. */
public final class RayPickerContractTest {
    public static void main(String[] args) throws Exception {
        JSONObject fixture = new JSONObject(new String(Files.readAllBytes(new File(args[0]).toPath()), StandardCharsets.UTF_8));
        JSONArray rays = fixture.getJSONArray("rays");
        for (int i = 0; i < rays.length(); i++) {
            JSONObject ray = rays.getJSONObject(i);
            String id = ray.getString("id");
            List<VoxelWorld.Block> blocks = new ArrayList<>();
            JSONArray cells = ray.getJSONArray("blocks");
            for (int j = 0; j < cells.length(); j++) {
                JSONObject b = cells.getJSONObject(j);
                blocks.add(new VoxelWorld.Block(b.getInt("x"), b.getInt("y"), b.getInt("z"), b.getString("material")));
            }
            RayPicker.Hit hit = RayPicker.pick(vector(ray.getJSONObject("origin")), vector(ray.getJSONObject("direction")), blocks);
            if (ray.isNull("expected")) { check(hit == null, id + ": miss"); continue; }
            check(hit != null, id + ": hit");
            JSONObject expected = ray.getJSONObject("expected");
            check(Math.abs(hit.distance - expected.getDouble("distance")) < 0.0001, id + ": normalized distance");
            if (expected.isNull("block")) check(hit.block == null, id + ": floor");
            else {
                JSONObject block = expected.getJSONObject("block");
                check(hit.block != null && hit.block.x == block.getInt("x")
                        && hit.block.y == block.getInt("y") && hit.block.z == block.getInt("z"), id + ": selected block");
            }
            if (expected.isNull("target")) check(!hit.inBounds, id + ": no cell outside the grid");
            else {
                JSONObject target = expected.getJSONObject("target");
                check(hit.inBounds && hit.x == target.getInt("x") && hit.y == target.getInt("y")
                        && hit.z == target.getInt("z"), id + ": placement target");
            }
        }
        check(RayPicker.pick(new float[]{0,8,0}, new float[]{0,0,0}, Collections.<VoxelWorld.Block>emptyList()) == null,
                "zero direction never selects a cell");
        List<VoxelWorld.Block> stacked = Arrays.asList(new VoxelWorld.Block(4,0,4,"stone"), new VoxelWorld.Block(4,3,4,"wood"));
        RayPicker.Hit nearest = RayPicker.pick(new float[]{.5f,8,.5f}, new float[]{0,-1,0}, stacked);
        check(nearest != null && nearest.block.y == 3 && nearest.y == 4, "nearest visible face wins independent of insertion order");
        check(RayPicker.pick(new float[]{.5f,8,.5f}, new float[]{0,1,0}, stacked) == null,
                "objects behind the ray are not selected");
        System.out.println("PASS: " + rays.length() + " legacy picking vectors; zero direction, nearest face and backward ray.");
    }

    private static float[] vector(JSONObject value) throws Exception {
        return new float[]{(float)value.getDouble("x"), (float)value.getDouble("y"), (float)value.getDouble("z")};
    }
    private static void check(boolean okay, String message) { if (!okay) throw new AssertionError(message); }
}
