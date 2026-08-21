import { Request, Response } from 'express';
import { Project, Decision } from '../models/Schemas.js';
import { MemoryBrain } from '../services/MemoryBrain.js';
import { isDbConnected } from '../config/db.js';

export class MemoryController {

  public static async getMemoryStatus(req: Request, res: Response) {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId query parameter is required.' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      MemoryBrain.ensureNovaDirectory(project.path);

      // Read local files metadata
      const localFiles = ['project.json', 'roadmap.md', 'tasks.json', 'decisions.json', 'context.json', 'session.json'];
      const fileStatus = localFiles.map(file => {
        const data = MemoryBrain.loadLocalNova(project.path, file);
        return {
          filename: file,
          size: typeof data === 'string' ? data.length : JSON.stringify(data).length,
          lastModified: new Date() // Simplified metadata
        };
      });

      res.json({
        dbConnected: isDbConnected(),
        localDirectory: project.path,
        files: fileStatus
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async syncPush(req: Request, res: Response) {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required.' });

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      await MemoryBrain.syncLocalToCloud(project.path, projectId);
      res.json({ message: 'Memory successfully synced from Local files -> MongoDB cloud.' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async syncPull(req: Request, res: Response) {
    const { projectId } = req.body;
    if (!projectId) return res.status(400).json({ error: 'projectId is required.' });

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      await MemoryBrain.syncCloudToLocal(project.path, projectId);
      res.json({ message: 'Memory successfully synced from MongoDB cloud -> Local files.' });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async getFileContent(req: Request, res: Response) {
    const { projectId, filename } = req.query;
    if (!projectId || !filename) {
      return res.status(400).json({ error: 'projectId and filename are required.' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const content = MemoryBrain.loadLocalNova(project.path, filename as string);
      res.json({ filename, content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async updateFileContent(req: Request, res: Response) {
    const { projectId, filename, content } = req.body;
    if (!projectId || !filename || content === undefined) {
      return res.status(400).json({ error: 'projectId, filename, and content are required.' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      MemoryBrain.saveLocalNova(project.path, filename, content);
      
      // Auto-trigger sync to DB after change
      await MemoryBrain.syncLocalToCloud(project.path, projectId);

      res.json({ message: `Successfully updated local ${filename} and synced to Cloud.` });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async listDecisions(req: Request, res: Response) {
    const { projectId } = req.query;
    try {
      const filter = projectId ? { projectId: projectId as string } : {};
      const decisions = await Decision.find(filter);
      res.json(decisions);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async createDecision(req: Request, res: Response) {
    const { projectId, title, content, rationale, impact } = req.body;
    if (!projectId || !title || !content) {
      return res.status(400).json({ error: 'projectId, title, and content are required.' });
    }

    try {
      const decision = new Decision({
        projectId,
        title,
        content,
        rationale: rationale || '',
        impact: impact || ''
      });
      await decision.save();

      // Sync local files
      const project = await Project.findById(projectId);
      if (project) {
        await MemoryBrain.syncCloudToLocal(project.path, projectId);
      }

      res.status(201).json(decision);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
