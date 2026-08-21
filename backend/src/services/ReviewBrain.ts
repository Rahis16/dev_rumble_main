import { AgentReport, Task } from '../models/Schemas.js';
import { EngineeringBrain } from './EngineeringBrain.js';

export interface ReviewSummary {
  status: 'approved' | 'rejected' | 'needs_changes';
  score: number;
  filesReviewed: string[];
  issuesDetected: string[];
  summaryMessage: string;
  voiceReport: string;
}

export class ReviewBrain {
  public static async reviewTask(reportId: string, projectPath: string): Promise<ReviewSummary> {
    const report = await AgentReport.findById(reportId);
    if (!report) {
      throw new Error(`Agent report not found for review: ${reportId}`);
    }

    const task = await Task.findById(report.taskId);
    const taskTitle = task ? task.title : 'Unknown Task';

    const issuesDetected: string[] = [];
    let score = 100;

    // 1. Run static quality evaluation via EngineeringBrain
    const qualityMetrics = EngineeringBrain.evaluateCodeQuality(projectPath);
    if (qualityMetrics.score < 80) {
      issuesDetected.push(...qualityMetrics.suggestions);
      score -= (100 - qualityMetrics.score) / 2;
    }

    // 2. Evaluate execution build/test outputs from OpenCode
    if (report.buildResult === 'failure') {
      issuesDetected.push('Execution Failure: OpenCode task failed or encountered unhandled runtime errors.');
      score -= 50;
    }

    if (report.testResult === 'failed') {
      issuesDetected.push('Tests failed: Implementation broke existing functional requirements.');
      score -= 30;
    }

    // Check file organization
    for (const file of report.filesChanged) {
      if (file.endsWith('.tsx') && !file.startsWith('frontend/')) {
        issuesDetected.push(`File path violation: Frontend component '${file}' resides outside 'frontend/' directory.`);
        score -= 10;
      }
    }

    let status: ReviewSummary['status'] = 'approved';
    if (score < 50) {
      status = 'rejected';
    } else if (score < 75) {
      status = 'needs_changes';
    }

    const summaryMessage = status === 'approved'
      ? `MalangCode Review: Task "${taskTitle}" approved with quality score ${Math.round(score)}%.`
      : `MalangCode Review: Task "${taskTitle}" requires attention (${Math.round(score)}% score). Issues: ${issuesDetected.join('; ')}`;

    // 3. Format structured voice prompt for Gemini Manager
    let voiceReport = '';
    if (status === 'approved') {
      voiceReport = `Task completed successfully. Here is what was updated for "${taskTitle}": ${report.reportText}`;
    } else {
      voiceReport = `An error occurred while executing "${taskTitle}". ${report.reportText}. ` +
                    `Detected issues: ${issuesDetected.join(', ')}. How would you like us to proceed?`;
    }

    return {
      status,
      score: Math.max(score, 0),
      filesReviewed: report.filesChanged,
      issuesDetected,
      summaryMessage,
      voiceReport
    };
  }
}