import fs from "fs";
import path from "path";
import { Project, Task, Decision } from "../models/Schemas.js";

export class MemoryBrain {
  /**
   * Guarantees that the local .nova/ directory and all foundational configuration
   * and tracking files exist inside the project path.
   * Places `opencode.json` directly in the project root for OpenCode CLI discovery.
   */
  public static ensureNovaDirectory(projectPath: string): void {
    const novaPath = path.join(projectPath, ".nova");
    if (!fs.existsSync(novaPath)) {
      fs.mkdirSync(novaPath, { recursive: true });
    }

    // Modern OpenCode AI Configuration for MalangCode using MiniMax M3 Cloud via Ollama
    const defaultOpenCodeConfig = {
      $schema: "https://opencode.ai/config.json",
      model: "ollama/minimax-m3:cloud",
      permission: "allow",
      provider: {
        ollama: {
          npm: "@ai-sdk/openai-compatible",
          name: "Ollama Cloud",
          options: {
            baseURL: "http://127.0.0.1:11434/v1",
            timeout: 1200000,
          },
          models: {
            "minimax-m3:cloud": {
              name: "MiniMax M3 (Cloud)"
            },
          },
        },
      },
    };

    // Ensure opencode.json exists directly in the ROOT directory
    const rootOpenCodePath = path.join(projectPath, "opencode.json");
    if (!fs.existsSync(rootOpenCodePath)) {
      fs.writeFileSync(
        rootOpenCodePath,
        JSON.stringify(defaultOpenCodeConfig, null, 2),
        "utf8",
      );
    }

    // Internal Nova files remain in .nova/
    const defaultNovaFiles: Record<string, string> = {
      "project.json": JSON.stringify(
        { name: path.basename(projectPath), status: "initialized" },
        null,
        2,
      ),
      "roadmap.md":
        "# Project Roadmap\n\n- [ ] Initial prototype implementation\n",
      "tasks.json": "[]",
      "decisions.json": "[]",
      "context.json": JSON.stringify(
        { activeTask: null, currentSprint: "Sprint 1", guidelines: [] },
        null,
        2,
      ),
      "session.json": JSON.stringify(
        { lastActive: new Date().toISOString(), interactionCount: 0 },
        null,
        2,
      ),
    };

    for (const [filename, defaultContent] of Object.entries(defaultNovaFiles)) {
      const filePath = path.join(novaPath, filename);
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, defaultContent, "utf8");
      }
    }
  }

  public static loadLocalNova(projectPath: string, file: string): any {
    this.ensureNovaDirectory(projectPath);
    const filePath = path.join(projectPath, ".nova", file);
    try {
      if (file.endsWith(".json")) {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
      }
      return fs.readFileSync(filePath, "utf8");
    } catch (e) {
      console.error(
        `[MemoryBrain] Error reading local memory file: ${file}`,
        e,
      );
      return file.endsWith(".json") ? [] : "";
    }
  }

  public static saveLocalNova(
    projectPath: string,
    file: string,
    data: any,
  ): void {
    this.ensureNovaDirectory(projectPath);
    const filePath = path.join(projectPath, ".nova", file);
    try {
      const content =
        typeof data === "string" ? data : JSON.stringify(data, null, 2);
      fs.writeFileSync(filePath, content, "utf8");
    } catch (e) {
      console.error(
        `[MemoryBrain] Error writing local memory file: ${file}`,
        e,
      );
    }
  }

  public static async syncLocalToCloud(
    projectPath: string,
    projectId: string,
  ): Promise<void> {
    console.log(
      `[MemoryBrain] Syncing local .nova memory to MongoDB for Project ID: ${projectId}`,
    );
    this.ensureNovaDirectory(projectPath);

    try {
      const projectMeta = this.loadLocalNova(projectPath, "project.json");
      await Project.findByIdAndUpdate(projectId, {
        name: projectMeta.name || path.basename(projectPath),
        healthStatus: projectMeta.healthStatus || "healthy",
        lastSync: new Date(),
      });

      const localTasks: any[] = this.loadLocalNova(projectPath, "tasks.json");
      if (Array.isArray(localTasks)) {
        for (const t of localTasks) {
          if (!t.title) continue;
          await Task.findOneAndUpdate(
            { projectId, title: t.title },
            {
              projectId,
              description: t.description || "",
              status: t.status || "pending",
              assignedAgent: t.assignedAgent || "None",
              dependsOn: t.dependsOn || [],
              completedAt: t.completedAt ? new Date(t.completedAt) : undefined,
            },
            { upsert: true, new: true },
          );
        }
      }

      const localDecisions: any[] = this.loadLocalNova(
        projectPath,
        "decisions.json",
      );
      if (Array.isArray(localDecisions)) {
        for (const d of localDecisions) {
          if (!d.title) continue;
          await Decision.findOneAndUpdate(
            { projectId, title: d.title },
            {
              projectId,
              content: d.content || "",
              rationale: d.rationale || "",
              impact: d.impact || "",
              timestamp: d.timestamp ? new Date(d.timestamp) : new Date(),
            },
            { upsert: true, new: true },
          );
        }
      }
    } catch (e) {
      console.error("[MemoryBrain] Failed to sync local memory to MongoDB", e);
    }
  }

  public static async syncCloudToLocal(
    projectPath: string,
    projectId: string,
  ): Promise<void> {
    console.log(
      `[MemoryBrain] Syncing MongoDB records to local .nova/ files for Project ID: ${projectId}`,
    );
    this.ensureNovaDirectory(projectPath);

    try {
      const projDoc = await Project.findById(projectId);
      if (projDoc) {
        const localProj = this.loadLocalNova(projectPath, "project.json");
        this.saveLocalNova(projectPath, "project.json", {
          ...localProj,
          name: projDoc.name,
          healthStatus: projDoc.healthStatus,
          framework: projDoc.framework,
          activeBranch: projDoc.activeBranch,
          packageManager: projDoc.packageManager,
          buildTools: projDoc.buildTools,
          lastSync: projDoc.lastSync,
        });
      }

      const tasks = await Task.find({ projectId });
      const taskList = tasks.map((t: any) => ({
        title: t.title,
        description: t.description,
        status: t.status,
        assignedAgent: t.assignedAgent,
        dependsOn: t.dependsOn,
        createdAt: t.createdAt,
        completedAt: t.completedAt,
      }));
      this.saveLocalNova(projectPath, "tasks.json", taskList);

      const decisions = await Decision.find({ projectId });
      const decisionList = decisions.map((d: any) => ({
        title: d.title,
        content: d.content,
        rationale: d.rationale,
        impact: d.impact,
        timestamp: d.timestamp,
      }));
      this.saveLocalNova(projectPath, "decisions.json", decisionList);
    } catch (e) {
      console.error(
        "[MemoryBrain] Failed to sync MongoDB records to local .nova memory",
        e,
      );
    }
  }
}