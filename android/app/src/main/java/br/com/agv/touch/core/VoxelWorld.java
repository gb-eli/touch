package br.com.agv.touch.core;

import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Engine-independent voxel rules, ported from public/js/voxel-world.js. */
public final class VoxelWorld {
    public static final int SIZE = 8;
    public static final int HEIGHT = 6;
    public static final int MAX_BLOCKS = 256;
    public static final int HISTORY_LIMIT = 40;

    public static final class Block {
        public final int x;
        public final int y;
        public final int z;
        public final String material;

        public Block(int x, int y, int z, String material) {
            this.x = x;
            this.y = y;
            this.z = z;
            this.material = material;
        }

        @Override public boolean equals(Object other) {
            if (!(other instanceof Block)) return false;
            Block b = (Block) other;
            return x == b.x && y == b.y && z == b.z
                    && (material == null ? b.material == null : material.equals(b.material));
        }

        @Override public int hashCode() {
            return (((x * 31) + y) * 31 + z) * 31 + (material == null ? 0 : material.hashCode());
        }

        @Override public String toString() {
            return x + "," + y + "," + z + ":" + material;
        }
    }

    public static final class Material {
        public final String id;
        public final String label;
        /** Opaque ARGB color; no Android dependency is needed in this class. */
        public final int color;

        private Material(String id, String label, int color) {
            this.id = id;
            this.label = label;
            this.color = color;
        }
    }

    public static final class Progress {
        public final int done;
        public final int total;
        public final boolean complete;

        private Progress(int done, int total) {
            this.done = done;
            this.total = total;
            this.complete = total > 0 && done == total;
        }
    }

    private static final List<Material> MATERIALS;
    private static final Map<String, List<Block>> GOALS;
    static {
        List<Material> materials = new ArrayList<>();
        materials.add(new Material("grass", "Grama", 0xff51b95b));
        materials.add(new Material("dirt", "Terra", 0xff966240));
        materials.add(new Material("sand", "Areia", 0xffe1be76));
        materials.add(new Material("stone", "Pedra", 0xff8f9da8));
        materials.add(new Material("lava", "Lava", 0xffff6337));
        materials.add(new Material("ice", "Gelo", 0xff87e8f9));
        materials.add(new Material("wood", "Madeira", 0xffb98044));
        materials.add(new Material("brick", "Tijolos", 0xffcd705b));
        materials.add(new Material("crystal", "Cristal", 0xffaa79f9));
        MATERIALS = Collections.unmodifiableList(materials);
        Map<String, List<Block>> goals = new LinkedHashMap<>();
        goals.put("free", Collections.<Block>emptyList());
        goals.put("tower", target(new int[][]{{3,0,3},{3,1,3},{3,2,3},{3,3,3},{3,4,3}}));
        goals.put("stairs", target(new int[][]{{2,0,3},{3,0,3},{3,1,3},{4,0,3},{4,1,3},{4,2,3}}));
        goals.put("bridge", target(new int[][]{{2,0,3},{4,0,3},{2,1,3},{3,1,3},{4,1,3}}));
        goals.put("symmetry", target(new int[][]{{2,0,2},{5,0,2},{2,1,2},{5,1,2},{3,0,3},{4,0,3}}));
        GOALS = Collections.unmodifiableMap(goals);
    }

    private final LinkedHashMap<Integer, Block> blocks = new LinkedHashMap<>();
    private final Deque<List<Block>> undo = new ArrayDeque<>();
    private final Deque<List<Block>> redo = new ArrayDeque<>();
    private long revision;

    public VoxelWorld() { }

    public static List<Material> materials() { return MATERIALS; }

    public static boolean isMaterial(String id) {
        for (Material material : MATERIALS) if (material.id.equals(id)) return true;
        return false;
    }

    public static String materialLabel(String id) {
        for (Material material : MATERIALS) if (material.id.equals(id)) return material.label;
        return "Material desconhecido";
    }

    public static int materialColor(String id) {
        for (Material material : MATERIALS) if (material.id.equals(id)) return material.color;
        return 0xff8f9da8;
    }

    public static boolean isMission(String id) { return GOALS.containsKey(id); }

    /** Goal materials are placeholders: completion only considers coordinates. */
    public static List<Block> goals(String mission) {
        List<Block> goal = GOALS.get(mission);
        return goal == null ? GOALS.get("free") : goal;
    }

    public static boolean valid(int x, int y, int z) {
        return x >= 0 && x < SIZE && z >= 0 && z < SIZE && y >= 0 && y < HEIGHT;
    }

    public synchronized int count() { return blocks.size(); }
    public synchronized long revision() { return revision; }
    public synchronized boolean canUndo() { return !undo.isEmpty(); }
    public synchronized boolean canRedo() { return !redo.isEmpty(); }

    /** Immutable list and immutable elements; safe to hand to the renderer thread. */
    public synchronized List<Block> blocks() {
        return Collections.unmodifiableList(snapshot());
    }

    public synchronized boolean has(int x, int y, int z) {
        return valid(x, y, z) && blocks.containsKey(key(x, y, z));
    }

    public synchronized Block get(int x, int y, int z) {
        return valid(x, y, z) ? blocks.get(key(x, y, z)) : null;
    }

    public synchronized boolean canPlace(int x, int y, int z) {
        return canPlaceExcept(x, y, z, -1);
    }

    public synchronized boolean add(int x, int y, int z, String material) {
        if (!isMaterial(material) || !canPlaceExcept(x, y, z, -1)) return false;
        remember();
        blocks.put(key(x, y, z), new Block(x, y, z, material));
        revision++;
        return true;
    }

    /** Legacy behavior deliberately permits remaining blocks to be unsupported. */
    public synchronized boolean remove(int x, int y, int z) {
        if (!has(x, y, z)) return false;
        remember();
        blocks.remove(key(x, y, z));
        revision++;
        return true;
    }

    public synchronized boolean move(int fromX, int fromY, int fromZ, int toX, int toY, int toZ) {
        if (!has(fromX, fromY, fromZ)) return false;
        int source = key(fromX, fromY, fromZ);
        if (!valid(toX, toY, toZ) || blocks.containsKey(key(toX, toY, toZ))
                || !canPlaceExcept(toX, toY, toZ, source)) return false;
        Block original = blocks.get(source);
        remember();
        blocks.remove(source);
        blocks.put(key(toX, toY, toZ), new Block(toX, toY, toZ, original.material));
        revision++;
        return true;
    }

    public synchronized boolean move(Block from, Block to) {
        return from != null && to != null && move(from.x, from.y, from.z, to.x, to.y, to.z);
    }

    public synchronized boolean clear() {
        if (blocks.isEmpty()) return false;
        remember();
        blocks.clear();
        revision++;
        return true;
    }

    public synchronized boolean undo() {
        if (undo.isEmpty()) return false;
        redo.addLast(snapshot());
        restore(undo.removeLast());
        return true;
    }

    public synchronized boolean redo() {
        if (redo.isEmpty()) return false;
        undo.addLast(snapshot());
        restore(redo.removeLast());
        return true;
    }

    /** Undoable load, matching the web model. Invalid input leaves all state intact. */
    public synchronized boolean load(List<Block> input) {
        List<Block> checked = checkedCopy(input);
        if (checked == null) return false;
        remember();
        restore(checked);
        return true;
    }

    /** Open a different project without carrying the previous project's undo history. */
    public synchronized boolean initialize(List<Block> input) {
        List<Block> checked = checkedCopy(input);
        if (checked == null) return false;
        undo.clear();
        redo.clear();
        restore(checked);
        return true;
    }

    public synchronized Progress progress(String mission) {
        List<Block> goal = goals(mission);
        int done = 0;
        for (Block block : goal) if (has(block.x, block.y, block.z)) done++;
        return new Progress(done, goal.size());
    }

    /** Validation is independent of gravity or insertion order, as in legacy JSON. */
    public static boolean validBlocks(List<Block> input) { return checkedCopy(input) != null; }

    private boolean canPlaceExcept(int x, int y, int z, int ignoredKey) {
        if (!valid(x, y, z) || blocks.containsKey(key(x, y, z))) return false;
        int count = blocks.size() - (ignoredKey >= 0 && blocks.containsKey(ignoredKey) ? 1 : 0);
        if (count >= MAX_BLOCKS) return false;
        if (y == 0) return true;
        int[][] offsets = {{1,0,0},{-1,0,0},{0,1,0},{0,-1,0},{0,0,1},{0,0,-1}};
        for (int[] d : offsets) {
            int nx = x + d[0], ny = y + d[1], nz = z + d[2];
            if (valid(nx, ny, nz)) {
                int neighbor = key(nx, ny, nz);
                if (neighbor != ignoredKey && blocks.containsKey(neighbor)) return true;
            }
        }
        return false;
    }

    private static int key(int x, int y, int z) { return x + SIZE * z + SIZE * SIZE * y; }

    private static List<Block> checkedCopy(List<Block> input) {
        if (input == null || input.size() > MAX_BLOCKS) return null;
        Map<Integer, Block> checked = new LinkedHashMap<>();
        for (Block block : input) {
            if (block == null || !valid(block.x, block.y, block.z) || !isMaterial(block.material)) return null;
            int key = key(block.x, block.y, block.z);
            if (checked.containsKey(key)) return null;
            checked.put(key, block);
        }
        return new ArrayList<>(checked.values());
    }

    private List<Block> snapshot() { return new ArrayList<>(blocks.values()); }

    private void remember() {
        undo.addLast(snapshot());
        if (undo.size() > HISTORY_LIMIT) undo.removeFirst();
        redo.clear();
    }

    private void restore(List<Block> input) {
        blocks.clear();
        for (Block block : input) blocks.put(key(block.x, block.y, block.z), block);
        revision++;
    }

    private static List<Block> target(int[][] coordinates) {
        List<Block> result = new ArrayList<>();
        for (int[] cell : coordinates) result.add(new Block(cell[0], cell[1], cell[2], "stone"));
        return Collections.unmodifiableList(result);
    }
}
