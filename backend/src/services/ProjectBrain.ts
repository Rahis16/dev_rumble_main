import fs from 'fs';
import path from 'path';

export interface ProjectAnalysis {
  name: string;
  framework: string;
  packageManager: string;
  buildTools: string;
  activeBranch: string;
  dependencies: Record<string, string>;
  folderStructure: string[];
  healthStatus: string;
}

export class ProjectBrain {
  public static async analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      name: path.basename(projectPath),
      framework: 'Unknown',
      packageManager: 'npm',
      buildTools: 'Unknown',
      activeBranch: 'main',
      dependencies: {},
      folderStructure: [],
      healthStatus: 'healthy'
    };

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    // 1. Analyze Folder Structure
    try {
      const items = fs.readdirSync(projectPath);
      analysis.folderStructure = items.filter(item => {
        return !item.startsWith('.') && item !== 'node_modules' && item !== 'dist' && item !== 'build';
      });

      // Detect package manager locks
      if (items.includes('package-lock.json')) analysis.packageManager = 'npm';
      else if (items.includes('yarn.lock')) analysis.packageManager = 'yarn';
      else if (items.includes('pnpm-lock.yaml')) analysis.packageManager = 'pnpm';
      else if (items.includes('bun.lockb')) analysis.packageManager = 'bun';
    } catch (e) {
      console.error('Error listing project directory structure', e);
    }

    // 2. Read package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        analysis.name = pkg.name || analysis.name;
        
        const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
        analysis.dependencies = allDeps;

        // Detect Frameworks
        if (allDeps['next']) analysis.framework = 'Next.js';
        else if (allDeps['nuxt']) analysis.framework = 'Nuxt.js';
        else if (allDeps['@nestjs/core']) analysis.framework = 'Nest.js';
        else if (allDeps['react'] && allDeps['vite']) analysis.framework = 'React (Vite)';
        else if (allDeps['react']) analysis.framework = 'React';
        else if (allDeps['vue']) analysis.framework = 'Vue';
        else if (allDeps['express']) analysis.framework = 'Express.js';
        else if (allDeps['@angular/core']) analysis.framework = 'Angular';

        // Detect Build Tools
        if (allDeps['vite']) analysis.buildTools = 'Vite';
        else if (allDeps['webpack']) analysis.buildTools = 'Webpack';
        else if (allDeps['turbopack']) analysis.buildTools = 'Turbopack';
        else if (allDeps['tsup']) analysis.buildTools = 'tsup';
        else if (allDeps['next']) analysis.buildTools = 'Next Build';
      } catch (e) {
        console.error('Error reading package.json', e);
      }
    }

    // 3. Detect Git branch
    const gitHeadPath = path.join(projectPath, '.git', 'HEAD');
    if (fs.existsSync(gitHeadPath)) {
      try {
        const headContent = fs.readFileSync(gitHeadPath, 'utf8').trim();
        if (headContent.startsWith('ref:')) {
          analysis.activeBranch = headContent.replace('ref: refs/heads/', '');
        } else {
          analysis.activeBranch = headContent.substring(0, 7); // detached HEAD commit sha
        }
      } catch (e) {
        console.error('Error reading Git branch info', e);
      }
    }

    // Detect health (mock/simple rules: if node_modules missing, status is degraded; if config error, failing)
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath) && fs.existsSync(packageJsonPath)) {
      analysis.healthStatus = 'degraded'; // Needs npm install
    }

    return analysis;
  }
}
