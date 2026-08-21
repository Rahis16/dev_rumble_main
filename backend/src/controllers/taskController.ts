import { Request, Response } from 'express';
import { Task, Project } from '../models/Schemas.js';
import { PlanningBrain } from '../services/PlanningBrain.js';
import { MemoryBrain } from '../services/MemoryBrain.js';

export class TaskController {
  
  public static async listTasks(req: Request, res: Response) {
    const { projectId } = req.query;
    try {
      const filter = projectId ? { projectId: projectId as string } : {};
      const tasks = await Task.find(filter);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async createTask(req: Request, res: Response) {
    const { projectId, title, description, dependsOn, assignedAgent } = req.body;
    
    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required.' });
    }

    try {
      const task = new Task({
        projectId,
        title,
        description,
        dependsOn: dependsOn || [],
        assignedAgent: assignedAgent || 'None'
      });
      await task.save();

      // Sync back to local file
      const project = await Project.findById(projectId);
      if (project) {
        await MemoryBrain.syncCloudToLocal(project.path, projectId);
      }

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async planFeature(req: Request, res: Response) {
    const { projectId, featureRequest } = req.body;

    if (!projectId || !featureRequest) {
      return res.status(400).json({ error: 'projectId and featureRequest are required.' });
    }

    try {
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ error: 'Project not found.' });

      // 1. Generate plan using PlanningBrain
      const plan = PlanningBrain.planFeature(featureRequest, project.framework);

      // 2. Write roadmap markdown content to local memory .nova/roadmap.md
      const localRoadmap = MemoryBrain.loadLocalNova(project.path, 'roadmap.md');
      const updatedRoadmap = localRoadmap + '\n' + plan.roadmapUpdate;
      MemoryBrain.saveLocalNova(project.path, 'roadmap.md', updatedRoadmap);

      // 3. Create Tasks in MongoDB
      const createdTasks = [];
      for (const t of plan.suggestedTasks) {
        const newTask = new Task({
          projectId,
          title: t.title,
          description: t.description,
          dependsOn: t.dependsOn,
          assignedAgent: t.assignedAgent
        });
        await newTask.save();
        createdTasks.push(newTask);
      }

      // 4. Update the local tasks.json file
      await MemoryBrain.syncCloudToLocal(project.path, projectId);

      res.json({
        message: 'Feature successfully roadmapped and subtasks created.',
        estimate: plan.durationEstimate,
        tasks: createdTasks,
        roadmap: updatedRoadmap
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async updateTaskStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required.' });
    }

    try {
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ error: 'Task not found.' });

      task.status = status;
      if (status === 'completed') {
        task.completedAt = new Date();
      }
      await task.save();

      // Sync back to local file
      const project = await Project.findById(task.projectId);
      if (project) {
        await MemoryBrain.syncCloudToLocal(project.path, task.projectId);
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async updateTask(req: Request, res: Response) {
    const { id } = req.params;
    const { title, description, status, assignedAgent, dependsOn } = req.body;

    try {
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ error: 'Task not found.' });

      if (title !== undefined) task.title = title;
      if (description !== undefined) task.description = description;
      if (status !== undefined) {
        task.status = status;
        if (status === 'completed') {
          task.completedAt = new Date();
        }
      }
      if (assignedAgent !== undefined) task.assignedAgent = assignedAgent;
      if (dependsOn !== undefined) task.dependsOn = dependsOn;

      await task.save();

      // Sync back to local file
      const project = await Project.findById(task.projectId);
      if (project) {
        await MemoryBrain.syncCloudToLocal(project.path, task.projectId);
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }

  public static async deleteTask(req: Request, res: Response) {
    const { id } = req.params;

    try {
      const task = await Task.findById(id);
      if (!task) return res.status(404).json({ error: 'Task not found.' });

      const projectId = task.projectId;
      await Task.findByIdAndDelete(id);

      // Sync back to local file
      const project = await Project.findById(projectId);
      if (project) {
        await MemoryBrain.syncCloudToLocal(project.path, projectId);
      }

      res.json({ message: 'Task deleted successfully.', id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
}
