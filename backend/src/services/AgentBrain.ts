import { AgentReport, Task } from "../models/Schemas.js";
import { MemoryBrain } from "./MemoryBrain.js";
import path from "path";
import { ChildProcess, exec, execSync, spawn } from "child_process";
import { execFile } from "child_process";
import fs from "fs";

export interface AgentAssignment {
  agentName: string;
  model: string;
  taskPayload: string;
}

export interface StructuredOpenCodeOutput {
  status: "SUCCESS" | "ERROR";
  summary: string;
  filesChanged: string[];
  explanation: string;
  commandsRun: string;
  errorDetails?: string;
}

export class AgentBrain {
  /**
   * Opens Visual Studio Code at the project root.
   */
  public static async openVSCode(projectPath: string): Promise<void> {
    return new Promise((resolve) => {
      console.log(
        `[AgentBrain] Opening VS Code at project root: ${projectPath}`,
      );

      const command = `code "${projectPath}"`;

      exec(command, { cwd: projectPath }, (error, stdout, stderr) => {
        if (error) {
          console.warn("[AgentBrain] Could not open VS Code automatically.");
          console.warn(
            "[AgentBrain] Make sure the VS Code 'code' CLI is available in PATH.",
          );
          console.warn(`[AgentBrain] VS Code error: ${error.message}`);
          resolve();
          return;
        }

        console.log(
          `[AgentBrain] VS Code opened successfully at: ${projectPath}`,
        );

        if (stdout.trim()) console.log(`[VS Code] ${stdout.trim()}`);
        if (stderr.trim()) console.log(`[VS Code] ${stderr.trim()}`);

        resolve();
      });
    });
  }

  /**
   * Invokes OpenCode CLI using spawn for real-time output streaming & safe argument handling.
   */
  public static async runOpenCodeCli(
    projectPath: string,
    promptInstructions: string,
    timeoutMs: number = 300000,
  ): Promise<string> {
    MemoryBrain.ensureNovaDirectory(projectPath);

    const absoluteProjectPath = path.resolve(projectPath);
    const backendRoot = process.cwd();

    const isWindows = process.platform === "win32";

    const openCodeCli = isWindows
      ? path.join(backendRoot, "node_modules", ".bin", "opencode.cmd")
      : path.join(backendRoot, "node_modules", ".bin", "opencode");

    const safeTimeout =
      Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 300000;

    console.log(
      `[AgentBrain] Starting OpenCode execution in: ${absoluteProjectPath}`,
    );

    console.log(`[AgentBrain] OpenCode CLI: ${openCodeCli}`);

    // Make sure the CLI actually exists.
    if (!fs.existsSync(openCodeCli)) {
      return (
        `STATUS: ERROR\n` +
        `ERROR_DETAILS: OpenCode CLI not found at: ${openCodeCli}`
      );
    }

    const args = [
      "run",
      "--dir",
      absoluteProjectPath,
      "--auto",
      promptInstructions,
    ];
    console.log(promptInstructions);

    console.log("[AgentBrain] OpenCode arguments:", args);

    return new Promise((resolve) => {
      let finished = false;

      const finish = (result: string) => {
        if (finished) return;

        finished = true;

        if (timer) {
          clearTimeout(timer);
        }

        resolve(result);
      };

      console.log(`[AgentBrain] OpenCode timeout: ${safeTimeout / 1000}s`);

      const child = spawn(openCodeCli, args, {
        cwd: backendRoot,

        // Critical on Windows for .cmd files.
        shell: true,

        windowsHide: true,

        stdio: ["ignore", "pipe", "pipe"],

        env: {
          ...process.env,

          CI: "true",
          FORCE_COLOR: "0",

          // Prevent npm/npx confirmation prompts.
          npm_config_yes: "true",
        },
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (data) => {
        const chunk = data.toString();

        stdout += chunk;

        process.stdout.write(chunk);
      });

      child.stderr?.on("data", (data) => {
        const chunk = data.toString();

        stderr += chunk;

        process.stderr.write(chunk);
      });

      child.on("error", (error) => {
        console.error("[AgentBrain] OpenCode process error:", error);

        finish(
          `STATUS: ERROR\n` +
            `ERROR_DETAILS: ${error.message}\n` +
            `STDERR: ${stderr}\n` +
            `STDOUT: ${stdout}`,
        );
      });

      child.on("close", (code) => {
        console.log(`[AgentBrain] OpenCode process closed with code: ${code}`);

        if (code !== 0) {
          finish(
            `STATUS: ERROR\n` +
              `ERROR_DETAILS: OpenCode exited with code ${code}\n` +
              `STDERR: ${stderr}\n` +
              `STDOUT: ${stdout}`,
          );

          return;
        }

        finish(
          stdout.trim() ||
            `STATUS: SUCCESS\n` + `SUMMARY: OpenCode completed successfully.`,
        );
      });

      const timer = setTimeout(() => {
        console.error(
          `[AgentBrain] OpenCode timeout after ${safeTimeout / 1000} seconds`,
        );

        try {
          child.kill();
        } catch (error) {
          console.error("[AgentBrain] Failed to kill OpenCode:", error);
        }

        finish(
          `STATUS: ERROR\n` +
            `ERROR_DETAILS: OpenCode timed out after ${
              safeTimeout / 1000
            } seconds.`,
        );
      }, safeTimeout);
    });
  }
  /**
   * Selects agent and standardizes on ollama/minimax-m3:cloud for testing.
   */
  public static selectAgent(
    taskTitle: string,
    taskDescription: string,
  ): AgentAssignment {
    const titleLower = taskTitle.toLowerCase();
    const descLower = taskDescription.toLowerCase();

    let agentName = "CoderAgent";
    const model = "ollama/minimax-m3:cloud";

    if (
      titleLower.includes("design") ||
      titleLower.includes("architecture") ||
      descLower.includes("solid")
    ) {
      agentName = "ArchitectAgent";
    } else if (
      titleLower.includes("ui") ||
      titleLower.includes("frontend") ||
      titleLower.includes("page") ||
      titleLower.includes("component")
    ) {
      agentName = "FrontendAgent";
    } else if (
      titleLower.includes("test") ||
      titleLower.includes("qa") ||
      titleLower.includes("verify")
    ) {
      agentName = "QA_Agent";
    }

    const taskPayload = JSON.stringify({
      task: taskTitle,
      instructions: taskDescription,
      timestamp: new Date().toISOString(),
      standards: ["clean-code", "strict-typescript"],
    });

    return {
      agentName,
      model,
      taskPayload,
    };
  }

  /**
   * Parses structured OpenCode output.
   */
  private static parseOpenCodeOutput(
    rawOutput: string,
  ): StructuredOpenCodeOutput {
    const isError =
      rawOutput.includes("STATUS: ERROR") || rawOutput.includes("Error:");

    const summaryMatch = rawOutput.match(
      /SUMMARY:\s*([\s\S]*?)(?=FILES_CHANGED:|$)/i,
    );
    const filesMatch = rawOutput.match(
      /FILES_CHANGED:\s*([\s\S]*?)(?=EXPLANATION:|$)/i,
    );
    const explanationMatch = rawOutput.match(
      /EXPLANATION:\s*([\s\S]*?)(?=COMMANDS_RUN:|$)/i,
    );
    const commandsMatch = rawOutput.match(
      /COMMANDS_RUN:\s*([\s\S]*?)(?=ERROR_DETAILS:|$)/i,
    );
    const errorMatch = rawOutput.match(/ERROR_DETAILS:\s*([\s\S]*?)$/i);

    const filesChanged = filesMatch?.[1]
      ? filesMatch[1]
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean)
      : [];

    return {
      status: isError ? "ERROR" : "SUCCESS",
      summary:
        summaryMatch?.[1]?.trim() ||
        (isError
          ? "Task failed during execution."
          : "Task completed successfully."),
      filesChanged,
      explanation: explanationMatch?.[1]?.trim() || rawOutput,
      commandsRun:
        commandsMatch?.[1]?.trim() || "No terminal commands recorded.",
      errorDetails:
        errorMatch?.[1]?.trim() || (isError ? rawOutput : undefined),
    };
  }

  /**
   * Executes a Nova task.
   */
  public static async executeAgentTask(
    projectId: string,
    taskId: string,
    projectPath: string,
  ): Promise<{
    report: any;
    parsedOutput: StructuredOpenCodeOutput;
    task: any;
  }> {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    const assignment = this.selectAgent(task.title, task.description);

    if (task.dependsOn && task.dependsOn.length > 0) {
      const parentTasks = await Task.find({
        projectId: task.projectId,
        title: { $in: task.dependsOn },
      });

      const incomplete = parentTasks.filter((p) => p.status !== "completed");

      if (incomplete.length > 0) {
        throw new Error(
          `Cannot execute task "${task.title}". Prerequisites are not completed: ${incomplete
            .map((i) => i.title)
            .join(", ")}`,
        );
      }
    }

    task.status = "in_progress";
    task.assignedAgent = assignment.agentName;
    await task.save();

    console.log(
      `[AgentBrain] Dispatching '${task.title}' to OpenCode (${assignment.agentName} via ${assignment.model})`,
    );

    await this.openVSCode(projectPath);

    const promptInstructions = `
Execute the following task:

${task.description}

CRITICAL REQUIREMENT:
Complete the task and respond ONLY in this format:

STATUS: [SUCCESS or ERROR]

SUMMARY:[Short 2-sentence executive summary]

FILES_CHANGED:[Comma-separated relative file paths modified]

EXPLANATION:[Detailed line-by-line breakdown of changes]

COMMANDS_RUN:[Terminal commands executed]

ERROR_DETAILS:[If STATUS is ERROR, provide stack trace and cause]
`.trim();

    const taskFilePath = path.join(projectPath, ".nova", "current-task.md");

    fs.writeFileSync(taskFilePath, promptInstructions, "utf8");

    if (!fs.existsSync(taskFilePath)) {
  throw new Error(
    `Failed to create Nova task file: ${taskFilePath}`
  );
}

console.log(
  `[AgentBrain] Task written to: ${taskFilePath}`
);

console.log(
  `[AgentBrain] Task file size: ${Buffer.byteLength(
    promptInstructions,
    "utf8"
  )} bytes`
);

    const runnerPrompt = `
Read .nova/current-task.md and execute the task described in that file completely.
Do not ask me what task to execute.
Do not summarize the task before executing it.
Actually perform the requested changes in the project.
`.trim();

    const rawOutput = await this.runOpenCodeCli(projectPath, runnerPrompt);

    const parsed = AgentBrain.parseOpenCodeOutput(rawOutput);
    const isFailure = parsed.status === "ERROR";

    const report = new AgentReport({
      projectId,
      taskId,
      agentName: assignment.agentName,
      modelUsed: assignment.model,
      filesChanged: parsed.filesChanged,
      buildResult: isFailure ? "failure" : "success",
      testResult: isFailure
        ? "failed"
        : task.title.toLowerCase().includes("test")
          ? "passed"
          : "none",
      reportText:
        `[Agent Report - ${assignment.agentName}]\n` +
        `Summary: ${parsed.summary}\n\n` +
        `Explanation:\n${parsed.explanation}\n\n` +
        `Commands Executed:\n${parsed.commandsRun}` +
        (parsed.errorDetails ? `\n\nError Log:\n${parsed.errorDetails}` : ""),
      timestamp: new Date(),
    });

    await report.save();

    task.status = isFailure ? "pending" : "completed";
    if (!isFailure) {
      task.completedAt = new Date();
    }
    await task.save();

    await MemoryBrain.syncCloudToLocal(projectPath, projectId);

    return {
      report,
      parsedOutput: parsed,
      task,
    };
  }
}
