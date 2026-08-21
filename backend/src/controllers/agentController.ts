import { Request, Response } from 'express';
import { AgentReport, Task, Project } from '../models/Schemas.js';
import { AgentBrain } from '../services/AgentBrain.js';
import { ReviewBrain } from '../services/ReviewBrain.js';

export class AgentController {
  
  public static async executeTask(req: Request, res: Response) {
    const { projectId, taskId } = req.body;

    if (!projectId || !taskId) {
      return res.status(400).json({ error: 'projectId and taskId are required.' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      const projectPath = project.path;

      // 1. Run Agent Execution (Simulated code generation and report creation)
      const execution = await AgentBrain.executeAgentTask(projectId, taskId, projectPath);

      // 2. Run Review Brain on the agent report
      const reviewResult = await ReviewBrain.reviewTask(execution.report._id as string, projectPath);

      res.json({
        message: 'Agent task executed and reviewed successfully.',
        report: execution.report,
        review: reviewResult
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async listReports(req: Request, res: Response) {
    const { projectId, taskId } = req.query;
    try {
      const filter: any = {};
      if (projectId) filter.projectId = projectId as string;
      if (taskId) filter.taskId = taskId as string;

      const reports = await AgentReport.find(filter).sort({ timestamp: -1 });
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
