import { Request, Response } from 'express';
import { Project } from '../models/Schemas.js';
import { ProjectBrain } from '../services/ProjectBrain.js';
import { MemoryBrain } from '../services/MemoryBrain.js';
import fs from 'fs';
import { exec } from 'child_process';

export class ProjectController {
  
  // Physically open VS Code application on student's desktop
  public static async openVSCode(req: Request, res: Response) {
    const { path: projectPath } = req.body;
    const targetPath = projectPath || 'c:\\Users\\Rahis\\Desktop\\McodeProjects';

    try {
      if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
      }

      exec(`code "${targetPath}"`, (error) => {
        if (error) {
          console.error('Error opening VS Code:', error);
        }
      });

      res.json({ success: true, message: `Opened VS Code at ${targetPath}`, path: targetPath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // List all registered projects
  public static async listProjects(req: Request, res: Response) {
    try {
      const projects = await Project.find().sort({ lastSync: -1 });
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Open an existing project OR create a brand new workspace directory
  public static async createProject(req: Request, res: Response) {
    const { path: projectPath, name, mode = 'open' } = req.body;

    if (!projectPath) {
      return res.status(400).json({ error: 'Project directory path is required.' });
    }

    try {
      // 1. Handle New Directory Creation vs. Opening Existing
      if (!fs.existsSync(projectPath)) {
        if (mode === 'create') {
          // Auto-create workspace folder on disk for brand new projects
          fs.mkdirSync(projectPath, { recursive: true });
        } else {
          return res.status(400).json({ 
            error: `The directory path does not exist on disk: ${projectPath}. Use mode: 'create' to initialize a new directory.` 
          });
        }
      }

      // 2. Initialize .nova/ structure and .nova/opencode.json config FIRST
      MemoryBrain.ensureNovaDirectory(projectPath);

      // 3. Analyze folder structure, framework, git branch, and package manager
      const analysis = await ProjectBrain.analyzeProject(projectPath);

      // 4. Save or Update in MongoDB
      let project = await Project.findOne({ path: projectPath });

      if (!project) {
        project = new Project({
          name: name || analysis.name,
          path: projectPath,
          framework: analysis.framework,
          activeBranch: analysis.activeBranch,
          packageManager: analysis.packageManager,
          buildTools: analysis.buildTools,
          healthStatus: analysis.healthStatus,
          lastSync: new Date()
        });
      } else {
        project.name = name || project.name;
        project.framework = analysis.framework;
        project.activeBranch = analysis.activeBranch;
        project.packageManager = analysis.packageManager;
        project.buildTools = analysis.buildTools;
        project.healthStatus = analysis.healthStatus;
        project.lastSync = new Date();
      }

      await project.save();

      // 5. Dual-Sync: Sync local .nova JSON files into MongoDB, then mirror state back
      await MemoryBrain.syncLocalToCloud(projectPath, project._id.toString());
      await MemoryBrain.syncCloudToLocal(projectPath, project._id.toString());

      res.status(201).json({
        message: mode === 'create' ? 'New workspace initialized successfully.' : 'Existing workspace opened successfully.',
        project,
        analysis
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Retrieve single project by Mongo ID
  public static async getProject(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });
      res.json(project);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Re-analyze existing workspace on disk and sync memory
  public static async analyze(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      if (!fs.existsSync(project.path)) {
        return res.status(400).json({ error: `Project directory no longer exists on disk at ${project.path}` });
      }

      // Ensure .nova/ directory and opencode.json exist
      MemoryBrain.ensureNovaDirectory(project.path);

      // Re-run static analysis
      const analysis = await ProjectBrain.analyzeProject(project.path);

      project.framework = analysis.framework;
      project.activeBranch = analysis.activeBranch;
      project.packageManager = analysis.packageManager;
      project.buildTools = analysis.buildTools;
      project.healthStatus = analysis.healthStatus;
      project.lastSync = new Date();
      await project.save();

      // Perform full bidirectional memory sync
      await MemoryBrain.syncLocalToCloud(project.path, project._id.toString());
      await MemoryBrain.syncCloudToLocal(project.path, project._id.toString());

      res.json({ message: 'Project successfully re-analyzed and synced with MongoDB & .nova.', project });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Get real project directory tree
  public static async getTree(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      if (!fs.existsSync(project.path)) {
        return res.status(404).json({ error: `Project directory path not found on disk: ${project.path}` });
      }

      const tree = ProjectBrain.getDirectoryTree(project.path);
      res.json({ success: true, projectPath: project.path, tree });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Read single file content from disk
  public static async readFile(req: Request, res: Response) {
    const { id } = req.params;
    const filePath = req.query.filePath as string;

    if (!filePath) {
      return res.status(400).json({ error: 'filePath query parameter is required.' });
    }

    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      const content = ProjectBrain.readFile(project.path, filePath);
      res.json({ success: true, filePath, content });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  // Write single file content to disk
  public static async writeFile(req: Request, res: Response) {
    const { id } = req.params;
    const { filePath, content } = req.body;

    if (!filePath || content === undefined) {
      return res.status(400).json({ error: 'filePath and content are required in request body.' });
    }

    try {
      const project = await Project.findById(id);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      ProjectBrain.writeFile(project.path, filePath, content);
      project.lastSync = new Date();
      await project.save();

      res.json({ success: true, message: `Successfully updated ${filePath}`, filePath });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}