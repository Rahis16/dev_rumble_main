import { WebSocket, WebSocketServer } from 'ws';
import { PlanningBrain } from './PlanningBrain.js';
import { AgentBrain } from './AgentBrain.js';
import { Task } from '../models/Schemas.js';

interface WSMessage {
  event: 'PLAN_FEATURE' | 'EXECUTE_TASK' | 'AUTO_RUN_ALL' | 'STUDENT_CODE_CHANGE';
  payload: {
    projectId?: string;
    projectPath?: string;
    featureRequest?: string;
    taskId?: string;
    filePath?: string;
    codeSnippet?: string;
    changeLine?: number;
  };
}

export class AgentOrchestrator {
  private wss: WebSocketServer;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    this.initListeners();
  }

  private initListeners() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('[Orchestrator] Client connected to agent pipeline.');

      ws.on('message', async (data: string) => {
        try {
          const parsed: WSMessage = JSON.parse(data);
          await this.handleEvent(ws, parsed);
        } catch (err: any) {
          this.broadcast(ws, 'ERROR', { message: err.message });
        }
      });
    });
  }

  private async handleEvent(ws: WebSocket, message: WSMessage) {
    const { event, payload } = message;

    switch (event) {
      case 'STUDENT_CODE_CHANGE': {
        console.log(`[Orchestrator] Detected live student code change in ${payload.filePath}`);
        this.broadcast(ws, 'STUDENT_CODE_EDIT_DETECTED', {
          filePath: payload.filePath,
          snippet: payload.codeSnippet,
          message: `Mcode-Agent detected student edit in ${payload.filePath}. Tutor analyzing live...`
        });
        break;
      }

      case 'PLAN_FEATURE': {
        this.broadcast(ws, 'PLANNING_STARTED', { feature: payload.featureRequest });

        const result = await PlanningBrain.executeFeaturePlanning(
          payload.projectId || 'default',
          payload.projectPath || '.',
          payload.featureRequest || 'New Feature'
        );

        this.broadcast(ws, 'PLANNING_COMPLETED', {
          plan: result.plan,
          tasks: result.savedTasks
        });
        break;
      }

      case 'EXECUTE_TASK': {
        if (!payload.taskId) throw new Error('Missing taskId for EXECUTE_TASK');

        this.broadcast(ws, 'TASK_STARTED', { taskId: payload.taskId });

        const execution = await AgentBrain.executeAgentTask(
          payload.projectId || 'default',
          payload.taskId,
          payload.projectPath || '.'
        );

        this.broadcast(ws, 'TASK_COMPLETED', {
          taskId: payload.taskId,
          status: execution.task.status,
          report: execution.report
        });
        break;
      }

      case 'AUTO_RUN_ALL': {
        // Sequential auto-runner for dependency tasks
        const pendingTasks = await Task.find({ 
          projectId: payload.projectId, 
          status: 'pending' 
        });

        for (const task of pendingTasks) {
          this.broadcast(ws, 'TASK_STARTED', { taskId: task._id, title: task.title });

          const execution = await AgentBrain.executeAgentTask(
            payload.projectId || 'default',
            task._id.toString(),
            payload.projectPath || '.'
          );

          this.broadcast(ws, 'TASK_COMPLETED', {
            taskId: task._id,
            status: execution.task.status,
            report: execution.report
          });

          // Break sequence on failure
          if (execution.task.status !== 'completed') {
            this.broadcast(ws, 'PIPELINE_HALTED', { failedTaskId: task._id });
            break;
          }
        }
        break;
      }
    }
  }

  private broadcast(ws: WebSocket, type: string, payload: any) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload, timestamp: new Date() }));
    }
  }
}