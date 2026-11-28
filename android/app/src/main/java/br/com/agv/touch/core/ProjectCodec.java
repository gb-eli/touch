package br.com.agv.touch.core;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

/** Strict legacy-compatible project JSON. Imported identities never become paths. */
public final class ProjectCodec {
    public static final int FORMAT_VERSION = 1;
    public static final int MAX_JSON_CHARS = 60000;
    public static final int MAX_JSON_BYTES = MAX_JSON_CHARS * 4;
    public static final int MAX_NAME_CHARS = 80;

    private ProjectCodec() { }

    public static final class ProjectFormatException extends Exception {
        public ProjectFormatException(String message) { super(message); }
        public ProjectFormatException(String message, Throwable cause) { super(message, cause); }
    }

    public static final class Project {
        public final String projectId;
        public final String name;
        /** UTC epoch milliseconds, generated locally for new/imported projects. */
        public final long updatedAt;
        public final String mission;
        public final List<VoxelWorld.Block> blocks;

        private Project(String projectId, String name, long updatedAt, String mission,
                        List<VoxelWorld.Block> blocks) {
            this.projectId = projectId;
            this.name = name;
            this.updatedAt = updatedAt;
            this.mission = mission;
            this.blocks = Collections.unmodifiableList(new ArrayList<>(blocks));
        }
    }

    public static Project create(String name, String mission, List<VoxelWorld.Block> blocks) {
        requireBlocks(blocks);
        return new Project(UUID.randomUUID().toString(), normalizedName(name),
                System.currentTimeMillis(), normalizedMission(mission), blocks);
    }

    public static Project update(Project original, String name, String mission,
                                 List<VoxelWorld.Block> blocks) {
        if (original == null || !isProjectId(original.projectId))
            throw new IllegalArgumentException("Projeto de origem inválido.");
        requireBlocks(blocks);
        long now = Math.max(System.currentTimeMillis(), original.updatedAt + 1L);
        return new Project(original.projectId, normalizedName(name), now,
                normalizedMission(mission), blocks);
    }

    public static String encode(Project project) throws ProjectFormatException {
        if (project == null || !isProjectId(project.projectId)
                || !VoxelWorld.validBlocks(project.blocks))
            throw new ProjectFormatException("Projeto inválido para salvar.");
        try {
            JSONObject json = new JSONObject();
            json.put("version", FORMAT_VERSION);
            json.put("projectId", project.projectId);
            json.put("name", project.name);
            json.put("updatedAt", project.updatedAt);
            json.put("mission", project.mission);
            JSONArray blocks = new JSONArray();
            for (VoxelWorld.Block block : project.blocks) {
                JSONObject cell = new JSONObject();
                cell.put("x", block.x);
                cell.put("y", block.y);
                cell.put("z", block.z);
                cell.put("material", block.material);
                blocks.put(cell);
            }
            json.put("blocks", blocks);
            String encoded = json.toString();
            if (encoded.length() > MAX_JSON_CHARS)
                throw new ProjectFormatException("Projeto excede o limite de tamanho.");
            return encoded;
        } catch (JSONException error) {
            throw new ProjectFormatException("Não foi possível codificar o projeto.", error);
        }
    }

    /** Every import gets a fresh UUID, including imports of this app's own exports. */
    public static Project decodeImport(String json) throws ProjectFormatException {
        return decode(json, null, true);
    }

    /** Reject malformed bytes instead of silently changing imported names or data. */
    public static String decodeUtf8(byte[] bytes) throws ProjectFormatException {
        if (bytes == null || bytes.length > MAX_JSON_BYTES)
            throw new ProjectFormatException("Arquivo vazio ou acima do limite de tamanho.");
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes)).toString();
        } catch (CharacterCodingException error) {
            throw new ProjectFormatException("O arquivo contém codificação UTF-8 inválida.", error);
        }
    }

    /** Read app-owned storage and require the identity associated with its filename. */
    public static Project decodeStored(String json, String expectedId) throws ProjectFormatException {
        if (!isProjectId(expectedId)) throw new ProjectFormatException("Identidade local inválida.");
        return decode(json, expectedId, false);
    }

    /** For the fixed recovery slot only; its filename never derives from this identity. */
    public static Project decodeStored(String json) throws ProjectFormatException {
        return decode(json, null, false);
    }

    public static boolean isProjectId(String id) {
        if (id == null || !id.matches("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"))
            return false;
        try { return UUID.fromString(id).toString().equals(id); }
        catch (IllegalArgumentException error) { return false; }
    }

    private static Project decode(String source, String expectedId, boolean imported)
            throws ProjectFormatException {
        if (source == null || source.length() > MAX_JSON_CHARS)
            throw new ProjectFormatException("Arquivo vazio ou acima do limite de 60.000 caracteres.");
        // Android's JSONTokener accepts some non-JSON syntax. Validate JSON grammar first.
        new JsonSyntax(source).validate();
        try {
            JSONObject json = new JSONObject(source);
            if (integer(json, "version", 1, 1) != FORMAT_VERSION)
                throw new ProjectFormatException("Versão de projeto não suportada.");
            Object rawBlocks = json.opt("blocks");
            if (!(rawBlocks instanceof JSONArray))
                throw new ProjectFormatException("O projeto deve conter uma lista de blocos.");
            JSONArray array = (JSONArray) rawBlocks;
            if (array.length() > VoxelWorld.MAX_BLOCKS)
                throw new ProjectFormatException("O projeto pode conter no máximo 256 blocos.");
            List<VoxelWorld.Block> blocks = new ArrayList<>();
            for (int i = 0; i < array.length(); i++) {
                Object raw = array.get(i);
                if (!(raw instanceof JSONObject))
                    throw new ProjectFormatException("Bloco " + (i + 1) + " inválido.");
                JSONObject block = (JSONObject) raw;
                int x = integer(block, "x", 0, VoxelWorld.SIZE - 1);
                int y = integer(block, "y", 0, VoxelWorld.HEIGHT - 1);
                int z = integer(block, "z", 0, VoxelWorld.SIZE - 1);
                Object material = block.opt("material");
                if (!(material instanceof String) || !VoxelWorld.isMaterial((String) material))
                    throw new ProjectFormatException("Material de bloco desconhecido.");
                blocks.add(new VoxelWorld.Block(x, y, z, (String) material));
            }
            if (!VoxelWorld.validBlocks(blocks))
                throw new ProjectFormatException("Há blocos duplicados ou fora da grade.");

            String name = optionalString(json, "name", imported ? "Projeto importado" : null);
            if (name == null || name.trim().isEmpty() || name.length() > MAX_NAME_CHARS
                    || containsControls(name))
                throw new ProjectFormatException("Nome de projeto inválido; use até 80 caracteres.");
            String mission = optionalString(json, "mission", imported ? "free" : null);
            if (mission == null) throw new ProjectFormatException("Desafio local ausente.");
            if (!VoxelWorld.isMission(mission)) {
                if (imported) mission = "free";
                else throw new ProjectFormatException("Desafio local inválido.");
            }
            String id;
            long updated;
            if (imported) {
                id = UUID.randomUUID().toString();
                updated = System.currentTimeMillis();
            } else {
                id = optionalString(json, "projectId", null);
                if (!isProjectId(id) || (expectedId != null && !expectedId.equals(id)))
                    throw new ProjectFormatException("A identidade do arquivo não corresponde ao projeto.");
                Object timestamp = json.opt("updatedAt");
                if (!(timestamp instanceof Number))
                    throw new ProjectFormatException("Data local de atualização inválida.");
                double value = ((Number) timestamp).doubleValue();
                if (Double.isNaN(value) || Double.isInfinite(value) || value < 0
                        || value > 9007199254740991d || value != Math.rint(value))
                    throw new ProjectFormatException("Data local de atualização inválida.");
                updated = ((Number) timestamp).longValue();
            }
            return new Project(id, name.trim(), updated, mission, blocks);
        } catch (JSONException error) {
            throw new ProjectFormatException("O arquivo não contém um projeto JSON válido.", error);
        }
    }

    private static int integer(JSONObject json, String field, int minimum, int maximum)
            throws ProjectFormatException {
        // optInt/getInt coerce strings and default missing values; neither is safe here.
        Object raw = json.opt(field);
        if (!(raw instanceof Number)) throw new ProjectFormatException("Campo numérico inválido: " + field + ".");
        double value = ((Number) raw).doubleValue();
        if (Double.isNaN(value) || Double.isInfinite(value) || value != Math.rint(value)
                || value < minimum || value > maximum)
            throw new ProjectFormatException("Coordenada ou versão inválida: " + field + ".");
        return (int) value;
    }

    private static String optionalString(JSONObject json, String field, String fallback)
            throws ProjectFormatException {
        if (!json.has(field)) return fallback;
        Object value = json.opt(field);
        if (!(value instanceof String)) throw new ProjectFormatException("Campo de texto inválido: " + field + ".");
        return (String) value;
    }

    private static String normalizedName(String name) {
        String result = name == null ? "Sem título" : name.trim();
        if (result.isEmpty()) result = "Sem título";
        if (result.length() > MAX_NAME_CHARS || containsControls(result))
            throw new IllegalArgumentException("Use um nome de até 80 caracteres, sem caracteres de controle.");
        return result;
    }

    private static String normalizedMission(String mission) {
        return VoxelWorld.isMission(mission) ? mission : "free";
    }

    private static boolean containsControls(String value) {
        for (int i = 0; i < value.length(); i++) if (value.charAt(i) < 0x20) return true;
        return false;
    }

    private static void requireBlocks(List<VoxelWorld.Block> blocks) {
        if (!VoxelWorld.validBlocks(blocks)) throw new IllegalArgumentException("Blocos de projeto inválidos.");
    }

    /** Grammar-only guard; objects are decoded by Android's org.json afterwards. */
    private static final class JsonSyntax {
        private final String text;
        private int position;

        JsonSyntax(String text) { this.text = text; }

        void validate() throws ProjectFormatException {
            value(0);
            whitespace();
            if (position != text.length()) invalid();
        }

        private void value(int depth) throws ProjectFormatException {
            if (depth > 16) invalid();
            whitespace();
            if (position >= text.length()) invalid();
            char c = text.charAt(position);
            if (c == '{') object(depth + 1);
            else if (c == '[') array(depth + 1);
            else if (c == '"') string();
            else if (c == 't') literal("true");
            else if (c == 'f') literal("false");
            else if (c == 'n') literal("null");
            else number();
        }

        private void object(int depth) throws ProjectFormatException {
            position++;
            whitespace();
            if (take('}')) return;
            do {
                whitespace();
                string();
                whitespace();
                if (!take(':')) invalid();
                value(depth);
                whitespace();
                if (take('}')) return;
                if (!take(',')) invalid();
            } while (true);
        }

        private void array(int depth) throws ProjectFormatException {
            position++;
            whitespace();
            if (take(']')) return;
            do {
                value(depth);
                whitespace();
                if (take(']')) return;
                if (!take(',')) invalid();
            } while (true);
        }

        private void string() throws ProjectFormatException {
            if (!take('"')) invalid();
            while (position < text.length()) {
                char c = text.charAt(position++);
                if (c == '"') return;
                if (c < 0x20) invalid();
                if (c == '\\') {
                    if (position >= text.length()) invalid();
                    char escape = text.charAt(position++);
                    if (escape == 'u') {
                        for (int i = 0; i < 4; i++) {
                            if (position >= text.length() || !hex(text.charAt(position++))) invalid();
                        }
                    } else if ("\"\\/bfnrt".indexOf(escape) < 0) invalid();
                }
            }
            invalid();
        }

        private void number() throws ProjectFormatException {
            take('-');
            if (take('0')) {
                if (digit()) invalid();
            } else {
                if (position >= text.length() || text.charAt(position) < '1' || text.charAt(position) > '9') invalid();
                while (digit()) position++;
            }
            if (take('.')) {
                if (!digit()) invalid();
                while (digit()) position++;
            }
            if (take('e') || take('E')) {
                if (!take('+')) take('-');
                if (!digit()) invalid();
                while (digit()) position++;
            }
        }

        private boolean digit() {
            return position < text.length() && text.charAt(position) >= '0' && text.charAt(position) <= '9';
        }

        private boolean hex(char c) {
            return (c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F');
        }

        private void literal(String value) throws ProjectFormatException {
            if (!text.startsWith(value, position)) invalid();
            position += value.length();
        }

        private boolean take(char c) {
            if (position < text.length() && text.charAt(position) == c) { position++; return true; }
            return false;
        }

        private void whitespace() {
            while (position < text.length()) {
                char c = text.charAt(position);
                if (c != ' ' && c != '\t' && c != '\n' && c != '\r') break;
                position++;
            }
        }

        private void invalid() throws ProjectFormatException {
            throw new ProjectFormatException("JSON inválido próximo ao caractere " + position + ".");
        }
    }
}
