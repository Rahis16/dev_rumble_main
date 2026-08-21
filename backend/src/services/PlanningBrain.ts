import { Task, Project } from '../models/Schemas.js';
import { MemoryBrain } from './MemoryBrain.js';

export interface SuggestedTask {
  title: string;
  description: string;
  dependsOn: string[];
  assignedAgent: string;
}

export interface PlanningOutput {
  roadmapUpdate: string;
  suggestedTasks: SuggestedTask[];
  durationEstimate: string;
}

export class PlanningBrain {

  private static isFourArchitectRequested(featureRequest: string): boolean {
    const req = featureRequest.toLowerCase();
    return req.includes('four architect') || 
           req.includes('4 architect') || 
           req.includes('four phase') || 
           req.includes('4 phase') || 
           req.includes('four step') || 
           req.includes('4 step') ||
           req.includes('4-step') ||
           req.includes('four-step');
  }

  /**
   * Checks whether a feature request is a simple single-file/script request.
   */
  private static isSimpleRequest(cleanRequest: string): boolean {
    const req = cleanRequest.toLowerCase();
    
    // Quick patterns for single file creations, quick scripts, or small fixes
    const simplePatterns = [
      /^(create|make|write|add)\s+(a\s+)?([a-z0-9_-]+\.(py|js|ts|json|html|css|md|txt))/i,
      /create\s+.*file/i,
      /write a (function|script|method)/i,
      /fix (a\s+)?(bug|typo|error)/i,
      /single file/i
    ];

    return simplePatterns.some((pattern) => pattern.test(req)) || cleanRequest.length < 35;
  }

  /**
   * Generates a structured breakdown of engineering tasks based on the request complexity.
   */
  public static planFeature(featureRequest: string, projectFramework: string): PlanningOutput {
    const cleanRequest = featureRequest.trim();
    const tasks: SuggestedTask[] = [];

    // Only plan and use the four architect method if explicitly mentioned
    if (!this.isFourArchitectRequested(cleanRequest)) {
      tasks.push({
        title: `Execute request: ${cleanRequest}`,
        description: `Directly fulfill and implement: ${cleanRequest}. Create or modify required files according to best practices.`,
        dependsOn: [],
        assignedAgent: 'CoderAgent'
      });

      const roadmapUpdate = `\n### Task: ${cleanRequest}\n- [ ] Single Step: ${cleanRequest}\n`;

      return {
        roadmapUpdate,
        suggestedTasks: tasks,
        durationEstimate: '5-10 minutes (Automated Estimate)'
      };
    }

    // Full Multi-Step Enterprise Feature Breakdown
    tasks.push({
      title: `Design and Schema Definition for ${cleanRequest}`,
      description: `Define data structures, interfaces, and architecture layers required for implementing: ${cleanRequest}. Ensure compliance with project framework (${projectFramework || 'TypeScript'}).`,
      dependsOn: [],
      assignedAgent: 'ArchitectAgent'
    });

    tasks.push({
      title: `Implement Core Logic for ${cleanRequest}`,
      description: `Write business logic, API endpoints, services, and controller actions for: ${cleanRequest}.`,
      dependsOn: [`Design and Schema Definition for ${cleanRequest}`],
      assignedAgent: 'CoderAgent'
    });

    tasks.push({
      title: `Build Frontend Views for ${cleanRequest}`,
      description: `Construct client views, UI components, and wire interactive state handlers for: ${cleanRequest}.`,
      dependsOn: [`Implement Core Logic for ${cleanRequest}`],
      assignedAgent: 'FrontendAgent'
    });

    tasks.push({
      title: `Integrate and Write Tests for ${cleanRequest}`,
      description: `Run functional end-to-end and unit tests verifying the full operational flow of: ${cleanRequest}.`,
      dependsOn: [`Build Frontend Views for ${cleanRequest}`],
      assignedAgent: 'QA_Agent'
    });

    const roadmapUpdate = `\n### Feature: ${cleanRequest}\n` +
      `- [ ] Phase 1: Architecture & database schema planning\n` +
      `- [ ] Phase 2: Backend controller routes and business logic\n` +
      `- [ ] Phase 3: UI integration and state setup\n` +
      `- [ ] Phase 4: Integration testing and verification\n`;

    return {
      roadmapUpdate,
      suggestedTasks: tasks,
      durationEstimate: '2-4 hours (Automated Estimate)'
    };
  }

  /**
   * Plans a feature, writes tasks to MongoDB, updates local .nova/roadmap.md, 
   * and triggers MemoryBrain memory synchronization.
   */
  public static async executeFeaturePlanning(
    projectId: string, 
    projectPath: string, 
    featureRequest: string
  ): Promise<{ plan: PlanningOutput; savedTasks: any[] }> {
    console.log(`[PlanningBrain] Executing feature planning for Project ID: ${projectId}`);

    MemoryBrain.ensureNovaDirectory(projectPath);

    const project = await Project.findById(projectId);
    const framework = project?.framework || 'Node.js/TypeScript';

    const plan = this.planFeature(featureRequest, framework);

    const savedTasks = [];
    for (const t of plan.suggestedTasks) {
      const taskDoc = await Task.findOneAndUpdate(
        { projectId, title: t.title },
        {
          projectId,
          title: t.title,
          description: t.description,
          assignedAgent: t.assignedAgent,
          dependsOn: t.dependsOn,
          status: 'pending'
        },
        { upsert: true, new: true }
      );
      savedTasks.push(taskDoc);
    }

    try {
      const currentRoadmap = MemoryBrain.loadLocalNova(projectPath, 'roadmap.md') || '# Project Roadmap\n';
      const updatedRoadmap = currentRoadmap + plan.roadmapUpdate;
      MemoryBrain.saveLocalNova(projectPath, 'roadmap.md', updatedRoadmap);
    } catch (e) {
      console.error('[PlanningBrain] Failed to append to roadmap.md', e);
    }

    await MemoryBrain.syncCloudToLocal(projectPath, projectId);

    return {
      plan,
      savedTasks
    };
  }
}