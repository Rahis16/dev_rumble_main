import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage } from "http";
import { getSystemPrompt } from "../prompts/systemPrompts.js";
import { Project, Task, Decision } from "../models/Schemas.js";
import { PlanningBrain } from "../services/PlanningBrain.js";
import { AgentBrain } from "../services/AgentBrain.js";
import { ReviewBrain } from "../services/ReviewBrain.js";
import { ProjectBrain } from "../services/ProjectBrain.js";
import { MemoryBrain } from "../services/MemoryBrain.js";
import path from "path";
import os from "os";
import fs from "fs";

export function setupWebSocketServer(server: any) {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket: any, head: any) => {
    const pathname = new URL(
      request.url || "",
      `http://${request.headers.host}`,
    ).pathname;

    if (pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws: any) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (ws: WebSocket, request: IncomingMessage) => {
    console.log("Client connected to MalangCode Live WebSocket");

    const requestUrl = new URL(
      request.url || "",
      `http://${request.headers.host || "localhost"}`,
    );
    const projectId = requestUrl.searchParams.get("projectId");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("No GEMINI_API_KEY found in environment variables.");
      ws.send(
        JSON.stringify({
          type: "error",
          message:
            "Error: GEMINI_API_KEY is not configured in the backend environment.",
        }),
      );
      ws.close();
      return;
    }

    let geminiSocket: WebSocket | null = null;
    let projectPath = "";
    let projectName = "";

    // ADDED: Track setup state to prevent race conditions
    let isSetupComplete = false;

    const earlyMessageQueue: string[] = [];

    const handleClientMessage = async (messageStr: string) => {
      try {
        const parsed = JSON.parse(messageStr);

        if (parsed.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
          return;
        }

        // UPDATED: Wait for setupComplete before sending audio/text to Gemini
        if (!geminiSocket || geminiSocket.readyState !== WebSocket.OPEN || !isSetupComplete) {
          earlyMessageQueue.push(messageStr);
          return;
        }

        if (parsed.type === "set_course_context") {
          const coursesList = parsed.courses || [];
          console.log(`[Proxy] Received course search context (${coursesList.length} courses)`);
          if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN && isSetupComplete) {
            const contextText = coursesList.map((c: any) => `Course ID: "${c.id}", Title: "${c.title}", Tech: [${c.techStack?.join(', ')}], Path: "${c.desktopFolder}"`).join('\n');
            const textMsg = {
              clientContent: {
                turns: [{
                  role: "user",
                  parts: [{ text: `[System Course Catalog Context]\nCurrently displayed course search results:\n${contextText}` }]
                }],
                turnComplete: true
              }
            };
            geminiSocket.send(JSON.stringify(textMsg));
          }
          return;
        }

        if (parsed.type === "switch_project" || parsed.event === "switch_project") {
          const newProjId = parsed.projectId || parsed.payload?.projectId;
          if (newProjId) {
            try {
              const proj = await Project.findById(newProjId);
              if (proj) {
                projectPath = proj.path;
                projectName = proj.name;
                console.log(`[Proxy] Switched active project context to ${projectName} (${projectPath})`);
                
                const tree = ProjectBrain.getDirectoryTree(proj.path);
                const fileList = tree.map((f: any) => f.relativePath).join(', ');

                if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN && isSetupComplete) {
                  geminiSocket.send(JSON.stringify({
                    clientContent: {
                      turns: [{
                        role: "user",
                        parts: [{ text: `[System Context Update] Active Project context is now switched to "${proj.name}" (Path: "${proj.path}").\nAvailable files in project: ${fileList || 'None'}` }]
                      }],
                      turnComplete: true
                    }
                  }));
                }

                ws.send(JSON.stringify({
                  type: "status",
                  message: `Active project switched to: ${projectName}`
                }));
              }
            } catch (e) {
              console.error("[Proxy] Error switching project context:", e);
            }
          }
          return;
        }

        if (parsed.event === 'STUDENT_CODE_CHANGE') {
          const { filePath, codeSnippet } = parsed.payload || {};
          console.log(`[Proxy] Student edit detected on ${filePath}`);
          ws.send(JSON.stringify({
            type: 'STUDENT_CODE_EDIT_DETECTED',
            payload: { message: `Student modified file ${filePath}` }
          }));

          if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN && isSetupComplete && filePath) {
            geminiSocket.send(JSON.stringify({
              clientContent: {
                turns: [{
                  role: "user",
                  parts: [{ text: `[Student Live Code Edit] File "${filePath}" was modified by student:\n\`\`\`\n${codeSnippet}\n\`\`\`` }]
                }],
                turnComplete: true
              }
            }));
          }
          return;
        }

        if (parsed.type === "text") {
          const clientContentMsg = {
            clientContent: {
              turns: [
                {
                  role: "user",
                  parts: [{ text: parsed.text }],
                },
              ],
              turnComplete: true,
            },
          };
          geminiSocket.send(JSON.stringify(clientContentMsg));
        } else if (parsed.type === "audio_chunk") {
          const audioMsg = {
            realtimeInput: {
              audio: {
                mimeType: parsed.mimeType || "audio/pcm;rate=16000",
                data: parsed.data,
              },
            },
          };
          geminiSocket.send(JSON.stringify(audioMsg));
        }
      } catch (err) {
        console.error("Error processing client message:", err);
      }
    };

    (async () => {
      if (projectId) {
        try {
          const project = await Project.findById(projectId);
          if (project) {
            projectPath = project.path;
            projectName = project.name;
            console.log(
              `[Proxy] Active Project: ${projectName} (${projectPath})`,
            );
          } else {
            console.warn(`[Proxy] Project with ID ${projectId} not found.`);
          }
        } catch (e) {
          console.error(`[Proxy] Error querying project details:`, e);
        }
      }

      try {
        const geminiUrl = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${apiKey}`;
        console.log("Connecting to Gemini Multimodal Live API...");

        geminiSocket = new WebSocket(geminiUrl);

        geminiSocket.on("open", () => {
          console.log("Connected to Gemini Live API. Sending setup payload...");
          ws.send(
            JSON.stringify({
              type: "status",
              message: "Connected to Gemini Live API",
            }),
          );

          const systemInstruction = `Active Project Context:
- Project ID: ${projectId || "None"}
- Project Name: ${projectName || "None"}
- Workspace Path: ${projectPath || "None"}

---
${getSystemPrompt()}`;

          const setupMsg = {
            setup: {
              model: "models/gemini-3.1-flash-live-preview",
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: {
                      voiceName: "Aoede",
                    },
                  },
                },
              },
              outputAudioTranscription: {},
              systemInstruction: {
                parts: [{ text: systemInstruction }],
              },
              tools: [
                {
                  functionDeclarations: [
                    {
                      name: "navigatePage",
                      description: "Navigate to a specific page on the Mcode-Agent platform hands-free.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          page: {
                            type: "STRING",
                            enum: ["dashboard", "learning-space", "workspace", "home", "memory", "settings"],
                            description: "Target page to navigate to"
                          }
                        },
                        required: ["page"]
                      }
                    },
                    {
                      name: "searchCourses",
                      description: "Search or filter coding courses in the Mcode-Agent catalog by keyword or tech stack.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          query: { type: "STRING", description: "Search query keyword" },
                          category: { type: "STRING", description: "Course category filter" }
                        }
                      }
                    },
                    {
                      name: "enrollCourse",
                      description: "Enroll student in a course, create project folder directly on Desktop path (c:\\Users\\Rahis\\Desktop\\McodeProjects), and navigate to live workspace.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          courseId: { type: "STRING", description: "Course identifier to enroll (e.g. react-19-mastery, nextjs-15-fullstack, python-ai-agents, async-typescript)" }
                        },
                        required: ["courseId"]
                      }
                    },
                    {
                      name: "listProjects",
                      description:
                        "Retrieve all active projects registered with MalangCode.",
                      parameters: { type: "OBJECT", properties: {} },
                    },
                    {
                      name: "getProjectDetails",
                      description:
                        "Get details for a specific project by its ID, such as path, name, framework, branch.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: {
                            type: "STRING",
                            description: "The unique identifier of the project",
                          },
                        },
                        required: ["projectId"],
                      },
                    },
                    {
                      name: "planFeature",
                      description:
                        "Create a feature development plan. Generates a roadmap update and creates subtasks.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: {
                            type: "STRING",
                            description: "The unique identifier of the project",
                          },
                          featureRequest: {
                            type: "STRING",
                            description: "Detailed feature request to plan",
                          },
                        },
                        required: ["projectId", "featureRequest"],
                      },
                    },
                    {
                      name: "listTasks",
                      description:
                        "Retrieve all engineering tasks (pending, in_progress, completed) for a project.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: {
                            type: "STRING",
                            description: "The unique identifier of the project",
                          },
                        },
                        required: ["projectId"],
                      },
                    },
                    {
                      name: "executeTask",
                      description:
                        "Run the OpenCode coding agent to execute a task. Performs SOLID code review afterwards.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: {
                            type: "STRING",
                            description: "The unique identifier of the project",
                          },
                          taskId: {
                            type: "STRING",
                            description:
                              "The unique identifier of the task to execute",
                          },
                        },
                        required: ["projectId", "taskId"],
                      },
                    },
                    {
                      name: "openVSCode",
                      description:
                        "Open VS Code editor for the project workspace or a specific file.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: {
                            type: "STRING",
                            description:
                              "Project ID (optional if active project exists)",
                          },
                          filePath: {
                            type: "STRING",
                            description:
                              "Optional relative or absolute path of file to open",
                          },
                        },
                      },
                    },
                    {
                      name: "updateTask",
                      description: "Update details of a task (title, description, status, assignedAgent, dependsOn). Use status 'paused' to pause, 'pending' to reset, 'completed' to complete, or 'in_progress' to execute.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          taskId: { type: "STRING", description: "The ID of the task to update" },
                          updates: {
                            type: "OBJECT",
                            properties: {
                              title: { type: "STRING" },
                              description: { type: "STRING" },
                              status: { type: "STRING", enum: ["pending", "in_progress", "completed", "failed", "paused"] },
                              assignedAgent: { type: "STRING" },
                              dependsOn: { type: "ARRAY", items: { type: "STRING" } }
                            }
                          }
                        },
                        required: ["taskId", "updates"]
                      }
                    },
                    {
                      name: "deleteTask",
                      description: "Delete an engineering task by its ID.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          taskId: { type: "STRING", description: "The ID of the task to delete" }
                        },
                        required: ["taskId"]
                      }
                    },
                    {
                      name: "executeDirectTask",
                      description: "Act as a pro developer prompt engineer and directly assign a task to the OpenCode coding agent for immediate execution, without full multi-step planning. Use this when the developer asks to directly 'do X' or 'modify Y'.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: {
                            type: "STRING",
                            description: "The unique identifier of the project"
                          },
                          instructions: {
                            type: "STRING",
                            description: "Detailed instructions for the coding agent. You must act as a pro developer prompt engineer and refine/expand the user's request into clear, precise code instructions."
                          }
                        },
                        required: ["projectId", "instructions"]
                      }
                    },
                    {
                      name: "createProject",
                      description: "Create a new workspace directory (e.g. in Desktop or specific path) and register it as a MalangCode project. It checks directory availability first.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectPath: {
                            type: "STRING",
                            description: "Path where the project folder should be created or opened (e.g., 'desktop/my-new-app', or absolute path, or just a folder name like 'new-app' which defaults to desktop)."
                          },
                          projectName: {
                            type: "STRING",
                            description: "The name of the project."
                          }
                        },
                        required: ["projectPath", "projectName"]
                      }
                    },
                    {
                      name: "readWorkspaceFile",
                      description: "Read the real text content of a file in the active workspace on disk.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          filePath: { type: "STRING", description: "Relative file path inside the project (e.g. src/App.tsx, README.md)" }
                        },
                        required: ["filePath"]
                      }
                    },
                    {
                      name: "writeWorkspaceFile",
                      description: "Write or update code content in a real file inside the active project workspace on disk.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          filePath: { type: "STRING", description: "Relative file path inside the project (e.g. src/App.tsx, README.md)" },
                          content: { type: "STRING", description: "Complete text/code content to write to the file" }
                        },
                        required: ["filePath", "content"]
                      }
                    },
                    {
                      name: "switchActiveProject",
                      description: "Switch the active project context to another enrolled course or registered project.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          projectId: { type: "STRING", description: "Project ID or Course ID/name to switch to" }
                        },
                        required: ["projectId"]
                      }
                    },
                    {
                      name: "checkCourseEnrollment",
                      description: "Check if the student is already enrolled in a course. If enrolled, open workspace directly; if not enrolled, enroll student, create folder, and open workspace.",
                      parameters: {
                        type: "OBJECT",
                        properties: {
                          courseId: { type: "STRING", description: "Course ID to check/enroll (e.g. react-19-mastery, nextjs-15-fullstack, python-ai-agents, async-typescript)" }
                        },
                        required: ["courseId"]
                      }
                    },
                  ],
                },
              ],
            },
          };
          geminiSocket?.send(JSON.stringify(setupMsg));

          // REMOVED: the while loop that flushed earlyMessageQueue here
        });

        geminiSocket.on("message", async (data: any) => {
          try {
            const rawMsg = data.toString();
            const message = JSON.parse(rawMsg);

            // ADDED: Catch setupComplete before allowing normal messages
            if (message.setupComplete) {
              console.log("[Proxy] Gemini Setup Complete. Flushing message queue...");
              isSetupComplete = true;
              while (earlyMessageQueue.length > 0) {
                const msg = earlyMessageQueue.shift();
                if (msg) handleClientMessage(msg);
              }
              return;
            }

            if (message.toolCall) {
              const { functionCalls } = message.toolCall;
              if (functionCalls && functionCalls.length > 0) {
                const functionResponses: any[] = [];

                for (const call of functionCalls) {
                  const { id, name, args } = call;
                  console.log(
                    `[Proxy] Model requested tool call: ${name} (ID: ${id}) with args:`,
                    args,
                  );

                  ws.send(
                    JSON.stringify({
                      type: "status",
                      message: `Executing: ${name}...`,
                    }),
                  );

                  let result: any = null;
                  try {
                    if (name === "navigatePage") {
                      const targetPage = args.page || "dashboard";
                      let routePath = "/dashboard";
                      if (targetPage === "learning-space" || targetPage === "courses") routePath = "/learning-space";
                      else if (targetPage === "workspace") routePath = "/workspace";
                      else if (targetPage === "home") routePath = "/";
                      else if (targetPage === "memory") routePath = "/memory";
                      else if (targetPage === "settings") routePath = "/settings";

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "navigate_page",
                        payload: { page: targetPage, path: routePath }
                      }));

                      result = { success: true, message: `Navigated to ${targetPage} (${routePath})` };
                    } else if (name === "searchCourses") {
                      const query = args.query || "";
                      const category = args.category || "All";

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "search_courses",
                        payload: { query, category }
                      }));

                      result = { success: true, message: `Searching courses for "${query}" (category: ${category})` };
                    } else if (name === "readWorkspaceFile") {
                      const relPath = args.filePath;
                      if (!projectPath) throw new Error("No active workspace project path set.");
                      const content = ProjectBrain.readFile(projectPath, relPath);
                      result = { success: true, filePath: relPath, content };
                    } else if (name === "writeWorkspaceFile") {
                      const relPath = args.filePath;
                      const newContent = args.content;
                      if (!projectPath) throw new Error("No active workspace project path set.");
                      ProjectBrain.writeFile(projectPath, relPath, newContent);
                      
                      ws.send(JSON.stringify({
                        type: "STUDENT_CODE_EDIT_DETECTED",
                        payload: { message: `AI Agent modified file: ${relPath}` }
                      }));

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "file_updated",
                        payload: { filePath: relPath }
                      }));

                      result = { success: true, message: `Successfully updated ${relPath}` };
                    } else if (name === "switchActiveProject") {
                      const targetProjIdOrName = args.projectId;
                      let targetProject = await Project.findById(targetProjIdOrName).catch(() => null);
                      if (!targetProject) {
                        targetProject = await Project.findOne({
                          $or: [
                            { name: new RegExp(targetProjIdOrName, "i") },
                            { path: new RegExp(targetProjIdOrName, "i") }
                          ]
                        });
                      }

                      if (!targetProject) {
                        throw new Error(`Project "${targetProjIdOrName}" not found.`);
                      }

                      projectPath = targetProject.path;
                      projectName = targetProject.name;

                      const tree = ProjectBrain.getDirectoryTree(targetProject.path);
                      const fileList = tree.map((f: any) => f.relativePath).join(', ');

                      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
                        geminiSocket.send(JSON.stringify({
                          clientContent: {
                            turns: [{
                              role: "user",
                              parts: [{ text: `[System Context Update] Switched to project "${targetProject.name}" (Path: "${targetProject.path}").\nAvailable files in project: ${fileList || 'None'}` }]
                            }],
                            turnComplete: true
                          }
                        }));
                      }

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "switch_workspace",
                        payload: { projectId: targetProject._id, name: targetProject.name, path: targetProject.path }
                      }));

                      result = { success: true, message: `Switched workspace project context to "${targetProject.name}"`, files: fileList };
                    } else if (name === "checkCourseEnrollment" || name === "enrollCourse") {
                      const courseId = args.courseId || "react-19-mastery";
                      const defaultDesktopRoot = 'c:\\Users\\Rahis\\Desktop\\McodeProjects';
                      const targetDir = path.join(defaultDesktopRoot, courseId);

                      ProjectBrain.ensureCourseStarterProject(targetDir, courseId, courseId);
                      MemoryBrain.ensureNovaDirectory(targetDir);

                      let project = await Project.findOne({
                        $or: [
                          { path: targetDir },
                          { name: new RegExp(courseId, "i") }
                        ]
                      });

                      let alreadyEnrolled = !!project;

                      if (!project) {
                        project = new Project({
                          name: courseId,
                          path: targetDir,
                          framework: courseId.includes('react') ? 'React' : courseId.includes('next') ? 'Next.js' : 'Python',
                          activeBranch: 'main',
                          healthStatus: 'healthy',
                          lastSync: new Date()
                        });
                        await project.save();
                      }

                      projectPath = project.path;
                      projectName = project.name;

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "enroll_course",
                        payload: { courseId, path: targetDir, projectId: project._id, alreadyEnrolled }
                      }));

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "switch_workspace",
                        payload: { projectId: project._id, name: project.name, path: project.path }
                      }));

                      result = {
                        success: true,
                        alreadyEnrolled,
                        message: alreadyEnrolled
                          ? `Course ${courseId} is already enrolled. Switching to workspace at ${targetDir}`
                          : `Enrolled in course ${courseId}. Initialized workspace at ${targetDir}`,
                        project
                      };
                    } else if (name === "listProjects") {
                      const projects = await Project.find();
                      result = { projects: projects.map((p) => p.toObject()) };
                    } else if (name === "getProjectDetails") {
                      const targetProjId = args.projectId || projectId;
                      if (!targetProjId)
                        throw new Error("No project selected.");
                      const project = await Project.findById(targetProjId);
                      result = { project: project ? project.toObject() : null };
                    } else if (name === "listTasks") {
                      const targetProjId = args.projectId || projectId;
                      if (!targetProjId)
                        throw new Error("No project selected.");
                      const tasks = await Task.find({
                        projectId: targetProjId,
                      });
                      result = { tasks: tasks.map((t) => t.toObject()) };
                    } else if (name === "planFeature") {
                      const targetProjId = args.projectId || projectId;
                      const featureRequest = args.featureRequest;
                      if (!targetProjId)
                        throw new Error("No project selected.");
                      if (!featureRequest)
                        throw new Error("Missing featureRequest.");

                      const project = await Project.findById(targetProjId);
                      if (!project)
                        throw new Error(`Project not found: ${targetProjId}`);

                      const planResult =
                        await PlanningBrain.executeFeaturePlanning(
                          targetProjId,
                          project.path,
                          featureRequest,
                        );
                      result = {
                        success: true,
                        estimate: planResult.plan.durationEstimate,
                        roadmap: planResult.plan.roadmapUpdate,
                        tasks: planResult.savedTasks.map((t) => t.toObject()),
                      };
                    } else if (name === "executeTask") {
                      const targetProjId = args.projectId || projectId;
                      const taskId = args.taskId;
                      if (!targetProjId)
                        throw new Error("No project selected.");
                      if (!taskId) throw new Error("Missing taskId.");

                      const project = await Project.findById(targetProjId);
                      if (!project)
                        throw new Error(`Project not found: ${targetProjId}`);

                      const task = await Task.findById(taskId);
                      if (!task) throw new Error(`Task not found: ${taskId}`);

                      if (task.dependsOn && task.dependsOn.length > 0) {
                        const parentTasks = await Task.find({
                          projectId: targetProjId,
                          title: { $in: task.dependsOn },
                        });
                        const incomplete = parentTasks.filter(
                          (p) => p.status !== "completed",
                        );
                        if (incomplete.length > 0) {
                          result = {
                            success: false,
                            error: `Prerequisites not completed: ${incomplete.map((i) => i.title).join(", ")}`,
                          };
                          continue;
                        }
                      }

                      const execResult = await AgentBrain.executeAgentTask(
                        targetProjId,
                        taskId,
                        project.path,
                      );
                      const reviewResult = await ReviewBrain.reviewTask(
                        execResult.report._id as string,
                        project.path,
                      );

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "workspace_refreshed",
                        payload: { 
                          projectId: project._id, 
                          summary: execResult.parsedOutput.summary, 
                          filesChanged: execResult.parsedOutput.filesChanged 
                        }
                      }));

                      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
                        geminiSocket.send(JSON.stringify({
                          clientContent: {
                            turns: [{
                              role: "user",
                              parts: [{ text: `[OpenCode Execution Completed]\nTask: ${task.title}\nStatus: ${execResult.parsedOutput.status}\nSummary: ${execResult.parsedOutput.summary}\nFiles Changed: ${execResult.parsedOutput.filesChanged.join(', ')}\nExplanation: ${execResult.parsedOutput.explanation}` }]
                            }],
                            turnComplete: true
                          }
                        }));
                      }

                      result = {
                        success: true,
                        report: execResult.report.toObject(),
                        review: reviewResult,
                        summary: execResult.parsedOutput.summary,
                        filesChanged: execResult.parsedOutput.filesChanged
                      };
                    } else if (name === "openVSCode") {
                      const targetProjId = args.projectId || projectId;
                      const defaultDesktopRoot = 'c:\\Users\\Rahis\\Desktop\\McodeProjects';
                      const targetPath = args.projectPath || args.filePath || projectPath || defaultDesktopRoot;

                      const openResult = await AgentBrain.openVSCode(targetPath);

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "vscode_opened",
                        payload: { path: targetPath }
                      }));

                      result = {
                        success: true,
                        message: `Opened physical VS Code application at ${targetPath}`,
                        details: openResult,
                      };
                    } else if (name === "updateTask") {
                      const taskId = args.taskId;
                      const updates = args.updates;
                      if (!taskId) throw new Error("Missing taskId.");
                      if (!updates) throw new Error("Missing updates.");

                      const task = await Task.findById(taskId);
                      if (!task) throw new Error(`Task not found: ${taskId}`);

                      if (updates.title !== undefined) task.title = updates.title;
                      if (updates.description !== undefined) task.description = updates.description;
                      if (updates.status !== undefined) {
                        task.status = updates.status;
                        if (updates.status === 'completed') {
                          task.completedAt = new Date();
                        }
                      }
                      if (updates.assignedAgent !== undefined) task.assignedAgent = updates.assignedAgent;
                      if (updates.dependsOn !== undefined) task.dependsOn = updates.dependsOn;

                      await task.save();

                      const project = await Project.findById(task.projectId);
                      if (project) {
                        await MemoryBrain.syncCloudToLocal(project.path, task.projectId);
                      }

                      result = {
                        success: true,
                        task: task.toObject()
                      };
                    } else if (name === "deleteTask") {
                      const taskId = args.taskId;
                      if (!taskId) throw new Error("Missing taskId.");

                      const task = await Task.findById(taskId);
                      if (!task) throw new Error(`Task not found: ${taskId}`);

                      const targetProjectId = task.projectId;
                      const project = await Project.findById(targetProjectId);

                      await Task.findByIdAndDelete(taskId);

                      if (project) {
                        await MemoryBrain.syncCloudToLocal(project.path, targetProjectId);
                      }

                      result = {
                        success: true,
                        message: `Task ${taskId} deleted successfully.`
                      };
                    } else if (name === "executeDirectTask") {
                      const targetProjId = args.projectId || projectId;
                      const instructions = args.instructions;

                      if (!targetProjId) throw new Error("No project selected.");
                      if (!instructions) throw new Error("Missing instructions.");

                      const project = await Project.findById(targetProjId);
                      if (!project) throw new Error(`Project not found: ${targetProjId}`);

                      const taskTitle = `Direct Action: ${instructions.split('\n')[0].substring(0, 50)}`;
                      const task = new Task({
                        projectId: targetProjId,
                        title: taskTitle,
                        description: instructions,
                        status: 'pending',
                        assignedAgent: 'CoderAgent'
                      });
                      await task.save();

                      await MemoryBrain.syncCloudToLocal(project.path, targetProjId);

                      const execResult = await AgentBrain.executeAgentTask(
                        targetProjId,
                        task._id.toString(),
                        project.path
                      );

                      const reviewResult = await ReviewBrain.reviewTask(
                        execResult.report._id as string,
                        project.path
                      );

                      ws.send(JSON.stringify({
                        type: "tool_call_action",
                        action: "workspace_refreshed",
                        payload: { 
                          projectId: project._id, 
                          summary: execResult.parsedOutput.summary, 
                          filesChanged: execResult.parsedOutput.filesChanged 
                        }
                      }));

                      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
                        geminiSocket.send(JSON.stringify({
                          clientContent: {
                            turns: [{
                              role: "user",
                              parts: [{ text: `[OpenCode Execution Completed]\nTask: ${taskTitle}\nStatus: ${execResult.parsedOutput.status}\nSummary: ${execResult.parsedOutput.summary}\nFiles Changed: ${execResult.parsedOutput.filesChanged.join(', ')}\nExplanation: ${execResult.parsedOutput.explanation}` }]
                            }],
                            turnComplete: true
                          }
                        }));
                      }

                      result = {
                        success: true,
                        task: execResult.task.toObject(),
                        report: execResult.report.toObject(),
                        review: reviewResult,
                        summary: execResult.parsedOutput.summary,
                        filesChanged: execResult.parsedOutput.filesChanged
                      };
                    } else if (name === "createProject") {
                      const rawPath = args.projectPath;
                      const projName = args.projectName;

                      if (!rawPath) throw new Error("Missing projectPath.");
                      if (!projName) throw new Error("Missing projectName.");

                      const resolvedPath = resolveWorkspacePath(rawPath);
                      const exists = fs.existsSync(resolvedPath);
                      let details = "";

                      if (exists) {
                        const stats = fs.statSync(resolvedPath);
                        if (!stats.isDirectory()) {
                          throw new Error(`Path exists but is not a directory: ${resolvedPath}`);
                        }
                        const files = fs.readdirSync(resolvedPath);
                        if (files.length > 0) {
                          details = `Directory already exists and contains ${files.length} items. Opening existing workspace.`;
                        } else {
                          details = `Directory already exists but is empty. Initializing project.`;
                        }
                      } else {
                        fs.mkdirSync(resolvedPath, { recursive: true });
                        details = `Created new directory at ${resolvedPath}.`;
                      }

                      MemoryBrain.ensureNovaDirectory(resolvedPath);
                      const analysis = await ProjectBrain.analyzeProject(resolvedPath);

                      let project = await Project.findOne({ path: resolvedPath });
                      if (!project) {
                        project = new Project({
                          name: projName || analysis.name,
                          path: resolvedPath,
                          framework: analysis.framework,
                          activeBranch: analysis.activeBranch,
                          packageManager: analysis.packageManager,
                          buildTools: analysis.buildTools,
                          healthStatus: analysis.healthStatus,
                          lastSync: new Date()
                        });
                      } else {
                        project.name = projName || project.name;
                        project.framework = analysis.framework;
                        project.activeBranch = analysis.activeBranch;
                        project.packageManager = analysis.packageManager;
                        project.buildTools = analysis.buildTools;
                        project.healthStatus = analysis.healthStatus;
                        project.lastSync = new Date();
                      }

                      await project.save();
                      await MemoryBrain.syncLocalToCloud(resolvedPath, project._id.toString());
                      await MemoryBrain.syncCloudToLocal(resolvedPath, project._id.toString());

                      result = {
                        success: true,
                        message: `Project successfully set up. ${details}`,
                        project: project.toObject()
                      };
                    } else {
                      throw new Error(`Unknown tool function: ${name}`);
                    }
                  } catch (err: any) {
                    console.error(`Error running tool ${name}:`, err);
                    result = {
                      error: err.message || "Unknown error occurred.",
                    };
                  }

                  functionResponses.push({
                    id,
                    name,
                    response: { result },
                  });
                }

                const toolResponseMsg = {
                  toolResponse: { functionResponses },
                };
                geminiSocket?.send(JSON.stringify(toolResponseMsg));

                ws.send(
                  JSON.stringify({
                    type: "status",
                    message: "Gateway Connected",
                  }),
                );
              }
            }

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(rawMsg);
            }
          } catch (e) {
            console.error("Error handling Gemini message:", e);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(data.toString());
            }
          }
        });

        geminiSocket.on("close", (code: number, reason: string) => {
          console.log(`Gemini Live connection closed: ${code} - ${reason}`);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "status",
                message: "Gemini connection lost",
              }),
            );
          }
        });

        geminiSocket.on("error", (err: any) => {
          console.error("Gemini Socket error:", err);
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Gemini Socket connection error",
              }),
            );
          }
        });
      } catch (error) {
        console.error("Error starting Gemini Live connection:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Error establishing connection to Gemini.",
          }),
        );
      }
    })();

    ws.on("message", (message: string) => {
      handleClientMessage(message.toString());
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      if (geminiSocket && geminiSocket.readyState === WebSocket.OPEN) {
        geminiSocket.close();
      }
    });
  });
}

function resolveWorkspacePath(inputPath: string): string {
  let resolved = inputPath.trim();
  const homeDir = os.homedir();

  // If user says "desktop" or "Desktop" or "in desktop" or similar, map it
  if (resolved.toLowerCase() === 'desktop' || resolved.toLowerCase() === 'in desktop') {
    return path.join(homeDir, 'Desktop');
  }

  // Handle case-insensitive "desktop/" prefix
  if (resolved.toLowerCase().startsWith('desktop/')) {
    resolved = path.join(homeDir, 'Desktop', resolved.substring(8));
  } else if (resolved.toLowerCase().startsWith('desktop\\')) {
    resolved = path.join(homeDir, 'Desktop', resolved.substring(8));
  } else if (resolved.startsWith('~/')) {
    resolved = path.join(homeDir, resolved.substring(2));
  } else if (resolved.startsWith('~\\')) {
    resolved = path.join(homeDir, resolved.substring(2));
  } else if (!path.isAbsolute(resolved)) {
    resolved = path.join(homeDir, 'Desktop', resolved);
  }

  return path.resolve(resolved);
}