package br.com.agv.touch.core;

import android.content.Context;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.CharacterCodingException;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** App-private projects with atomic replacement, a prior valid version, and a separate recovery slot. */
public final class ProjectStore {
    private static final int MAX_FILE_BYTES = ProjectCodec.MAX_JSON_CHARS * 4;
    private final File directory;

    public static final class LoadResult {
        public final ProjectCodec.Project project;
        /** True means the primary file failed and the previous valid version was used. */
        public final boolean recovered;
        public final String warning;

        private LoadResult(ProjectCodec.Project project, boolean recovered, String warning) {
            this.project = project;
            this.recovered = recovered;
            this.warning = warning;
        }
    }

    public static final class ProjectSummary {
        public final String projectId;
        public final String name;
        public final long updatedAt;
        public final String mission;
        public final int blockCount;
        public final boolean recovered;
        public final boolean corrupt;
        public final String warning;

        private ProjectSummary(String id, LoadResult result) {
            this.projectId = id;
            this.name = result.project.name;
            this.updatedAt = result.project.updatedAt;
            this.mission = result.project.mission;
            this.blockCount = result.project.blocks.size();
            this.recovered = result.recovered;
            this.corrupt = false;
            this.warning = result.warning;
        }

        private ProjectSummary(String id, long modified) {
            this.projectId = id;
            this.name = "Projeto indisponível";
            this.updatedAt = modified;
            this.mission = "free";
            this.blockCount = 0;
            this.recovered = false;
            this.corrupt = true;
            this.warning = "O arquivo e sua cópia anterior não puderam ser lidos. Nenhum deles foi apagado.";
        }
    }

    public ProjectStore(Context context) throws IOException {
        this(context.getApplicationContext().getFilesDir());
    }

    /** Same implementation for headless tests; pass the equivalent of Context.filesDir. */
    public ProjectStore(File filesDirectory) throws IOException {
        if (filesDirectory == null) throw new IOException("Pasta local indisponível.");
        directory = new File(filesDirectory, "projects");
        if (!directory.isDirectory() && !directory.mkdirs())
            throw new IOException("Não foi possível preparar a pasta de projetos.");
    }

    /** Explicit save. This never creates or clears the separate recovery draft. */
    public synchronized void save(ProjectCodec.Project project) throws IOException {
        requireId(project == null ? null : project.projectId);
        write(primary(project.projectId), previous(project.projectId), project, project.projectId);
    }

    /** Loading a previous copy reports recovery, without silently replacing either file. */
    public synchronized LoadResult load(String projectId) throws IOException {
        requireId(projectId);
        return readWithBackup(primary(projectId), previous(projectId), projectId);
    }

    /** Restore the previous valid saved version. The caller decides when to request this action. */
    public synchronized LoadResult recover(String projectId) throws IOException {
        requireId(projectId);
        ProjectCodec.Project project = read(previous(projectId), projectId);
        write(primary(projectId), previous(projectId), project, projectId);
        return new LoadResult(project, true, "A versão anterior foi restaurada. Confira a construção antes de continuar.");
    }

    /** Unreadable projects remain visible in the list instead of disappearing silently. */
    public synchronized List<ProjectSummary> list() throws IOException {
        File[] files = directory.listFiles();
        if (files == null) throw new IOException("Não foi possível listar os projetos.");
        Set<String> ids = new LinkedHashSet<>();
        for (File file : files) {
            String name = file.getName();
            String id = null;
            if (name.endsWith(".previous.json")) id = name.substring(0, name.length() - 14);
            else if (name.endsWith(".json")) id = name.substring(0, name.length() - 5);
            if (ProjectCodec.isProjectId(id)) ids.add(id);
        }
        List<ProjectSummary> result = new ArrayList<>();
        for (String id : ids) {
            try { result.add(new ProjectSummary(id, load(id))); }
            catch (IOException error) {
                result.add(new ProjectSummary(id, Math.max(primary(id).lastModified(), previous(id).lastModified())));
            }
        }
        Collections.sort(result, new Comparator<ProjectSummary>() {
            @Override public int compare(ProjectSummary a, ProjectSummary b) {
                int time = Long.compare(b.updatedAt, a.updatedAt);
                return time != 0 ? time : a.projectId.compareTo(b.projectId);
            }
        });
        return Collections.unmodifiableList(result);
    }

    public synchronized boolean delete(String projectId) throws IOException {
        requireId(projectId);
        File main = primary(projectId), backup = previous(projectId);
        boolean existed = main.exists() || backup.exists();
        // Delete backup first: a failed deletion must not leave an apparent resurrected project.
        removeIfPresent(new File(backup.getPath() + ".tmp"));
        removeIfPresent(backup);
        removeIfPresent(new File(main.getPath() + ".tmp"));
        removeIfPresent(main);
        return existed;
    }

    /** Automatic crash-recovery draft, kept outside the user's explicitly saved project list. */
    public synchronized void saveRecovery(ProjectCodec.Project project) throws IOException {
        requireId(project == null ? null : project.projectId);
        write(recovery(), recoveryPrevious(), project, null);
    }

    /** Null means no committed recovery draft exists. */
    public synchronized LoadResult loadRecovery() throws IOException {
        if (!recovery().exists() && !recoveryPrevious().exists()) return null;
        return readWithBackup(recovery(), recoveryPrevious(), null);
    }

    public synchronized void clearRecovery() throws IOException {
        removeIfPresent(new File(recoveryPrevious().getPath() + ".tmp"));
        removeIfPresent(recoveryPrevious());
        removeIfPresent(new File(recovery().getPath() + ".tmp"));
        removeIfPresent(recovery());
    }

    private LoadResult readWithBackup(File main, File backup, String id) throws IOException {
        IOException original;
        try { return new LoadResult(read(main, id), false, null); }
        catch (IOException error) { original = error; }
        try {
            ProjectCodec.Project previous = read(backup, id);
            return new LoadResult(previous, true,
                    "O arquivo principal não pôde ser lido. Foi aberta a cópia anterior válida; confira e salve para recuperá-la.");
        } catch (IOException backupError) {
            IOException error = new IOException("Não foi possível abrir o projeto nem recuperar uma cópia válida.", original);
            error.addSuppressed(backupError);
            throw error;
        }
    }

    private void write(File main, File backup, ProjectCodec.Project project, String expectedId)
            throws IOException {
        final String encoded;
        try { encoded = ProjectCodec.encode(project); }
        catch (ProjectCodec.ProjectFormatException error) {
            throw new IOException("O projeto não foi salvo porque seus dados são inválidos.", error);
        }
        File candidate = new File(main.getPath() + ".tmp");
        try {
            writeSynced(candidate, encoded);
            // Only a validated current file is allowed to replace the previous valid copy.
            if (main.isFile()) {
                ProjectCodec.Project current = null;
                try { current = read(main, expectedId); }
                catch (IOException ignored) { /* Keep the existing backup when the main file is corrupt. */ }
                if (current != null) {
                    File backupCandidate = new File(backup.getPath() + ".tmp");
                    try {
                        writeSynced(backupCandidate, readUtf8(main));
                        replace(backupCandidate, backup);
                    } finally {
                        if (backupCandidate.exists()) backupCandidate.delete();
                    }
                }
            }
            replace(candidate, main);
        } finally {
            if (candidate.exists()) candidate.delete();
        }
    }

    private static void writeSynced(File file, String value) throws IOException {
        byte[] bytes = value.getBytes(StandardCharsets.UTF_8);
        try (FileOutputStream stream = new FileOutputStream(file)) {
            stream.write(bytes);
            stream.flush();
            stream.getFD().sync();
        }
    }

    private static void replace(File candidate, File target) throws IOException {
        // Both files are in the same private directory. Fail safely if atomic move is unavailable.
        Files.move(candidate.toPath(), target.toPath(), StandardCopyOption.ATOMIC_MOVE,
                StandardCopyOption.REPLACE_EXISTING);
    }

    private static ProjectCodec.Project read(File file, String expectedId) throws IOException {
        String json = readUtf8(file);
        try {
            return expectedId == null ? ProjectCodec.decodeStored(json) : ProjectCodec.decodeStored(json, expectedId);
        } catch (ProjectCodec.ProjectFormatException error) {
            throw new IOException("Arquivo de projeto inválido: " + file.getName(), error);
        }
    }

    private static String readUtf8(File file) throws IOException {
        if (!file.isFile()) throw new FileNotFoundException("Arquivo de projeto ausente: " + file.getName());
        if (file.length() > MAX_FILE_BYTES) throw new IOException("Arquivo de projeto acima do limite.");
        ByteArrayOutputStream bytes = new ByteArrayOutputStream();
        try (FileInputStream input = new FileInputStream(file)) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = input.read(buffer)) != -1) {
                if (bytes.size() + read > MAX_FILE_BYTES) throw new IOException("Arquivo de projeto acima do limite.");
                bytes.write(buffer, 0, read);
            }
        }
        try {
            return StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPORT)
                    .onUnmappableCharacter(CodingErrorAction.REPORT)
                    .decode(ByteBuffer.wrap(bytes.toByteArray())).toString();
        } catch (CharacterCodingException error) {
            throw new IOException("Codificação UTF-8 inválida no projeto.", error);
        }
    }

    private static void removeIfPresent(File file) throws IOException {
        if (file.exists() && !file.delete()) throw new IOException("Não foi possível remover o arquivo " + file.getName() + ".");
    }

    private static void requireId(String id) throws IOException {
        if (!ProjectCodec.isProjectId(id)) throw new IOException("Identidade de projeto inválida.");
    }

    private File primary(String id) { return new File(directory, id + ".json"); }
    private File previous(String id) { return new File(directory, id + ".previous.json"); }
    private File recovery() { return new File(directory, "recovery.json"); }
    private File recoveryPrevious() { return new File(directory, "recovery.previous.json"); }
}
