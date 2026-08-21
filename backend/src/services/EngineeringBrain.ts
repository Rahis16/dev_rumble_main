import fs from 'fs';
import path from 'path';

export interface QualityMetrics {
  score: number; // 0 to 100
  solidCompliance: string;
  securityRating: 'A' | 'B' | 'C' | 'D' | 'F';
  suggestions: string[];
}

export class EngineeringBrain {
  public static evaluateCodeQuality(projectPath: string): QualityMetrics {
    const suggestions: string[] = [];
    let score = 95;
    let solidViolations = 0;
    let securityRisks = 0;

    // Scan project files for typical architectural issues
    const scanDirectory = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        if (item === 'node_modules' || item === '.git' || item === '.nova' || item === 'dist') continue;
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          scanDirectory(fullPath);
        } else if (stat.isFile() && /\.(js|ts|tsx|jsx)$/.test(item)) {
          const content = fs.readFileSync(fullPath, 'utf8');

          // Check for SOLID / Architecture guidelines
          if (content.length > 5000) {
            suggestions.push(`File too large (${item}): Consider splitting it up to follow the Single Responsibility Principle (SRP).`);
            score -= 5;
            solidViolations++;
          }
          if (content.includes('localStorage.') && !dir.includes('frontend')) {
            suggestions.push(`Use of localStorage in files outside front-end views (${item}). May violate separation of concerns.`);
            score -= 2;
          }
          
          // Check for security guidelines
          if (content.includes('apiKey =') || content.includes('password =') || content.includes('secret =')) {
            if (!content.includes('process.env')) {
              suggestions.push(`Potential hardcoded credential or API key in ${item}. Always use environment variables.`);
              score -= 10;
              securityRisks++;
            }
          }
          if (content.includes('eval(')) {
            suggestions.push(`Usage of unsafe eval() statement in ${item}. High security risk.`);
            score -= 15;
            securityRisks++;
          }
        }
      }
    };

    try {
      scanDirectory(projectPath);
    } catch (e) {
      console.error('Error scanning files for code quality evaluation', e);
    }

    // Default suggestions if project is clean
    if (suggestions.length === 0) {
      suggestions.push('No immediate SOLID or security violations detected. Codebase structure is clean.');
    }

    let securityRating: QualityMetrics['securityRating'] = 'A';
    if (securityRisks > 2) securityRating = 'F';
    else if (securityRisks > 0) securityRating = 'C';

    const solidCompliance = solidViolations === 0 
      ? 'High. Single Responsibility Principle followed.' 
      : 'Medium. Some large files violate Single Responsibility Principle.';

    return {
      score: Math.max(score, 0),
      solidCompliance,
      securityRating,
      suggestions
    };
  }
}
