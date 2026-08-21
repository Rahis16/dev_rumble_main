import { Request, Response } from 'express';
import { isDbConnected } from '../config/db.js';
import { EngineeringBrain } from '../services/EngineeringBrain.js';
import { Project } from '../models/Schemas.js';

export class SettingsController {

  public static getSettings(req: Request, res: Response) {
    res.json({
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      mongoDbUri: process.env.MONGODB_URI ? 'Configured (Secret)' : 'Default (mongodb://localhost:27017/malangcode)',
      dbConnected: isDbConnected(),
      environment: process.env.NODE_ENV || 'development'
    });
  }

  public static getHealth(req: Request, res: Response) {
    res.json({
      status: 'OK',
      timestamp: new Date(),
      services: {
        api: 'running',
        database: isDbConnected() ? 'connected' : 'disconnected',
        webSocketProxy: 'listening'
      }
    });
  }

  public static async evaluateProjectQuality(req: Request, res: Response) {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'projectId is required.' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const qualityMetrics = EngineeringBrain.evaluateCodeQuality(project.path);
      res.json(qualityMetrics);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
