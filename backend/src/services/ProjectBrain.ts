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

export interface FileNode {
  name: string;
  relativePath: string;
  isDir: boolean;
  size?: number;
  children?: FileNode[];
}

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
  /**
   * Scans a project directory and builds a recursive tree structure of real files.
   */
  public static getDirectoryTree(dirPath: string, rootDir = dirPath, depth = 0, maxDepth = 4): FileNode[] {
    if (!fs.existsSync(dirPath) || depth > maxDepth) return [];
    
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const result: FileNode[] = [];
      const ignored = ['node_modules', '.git', '.next', 'dist', 'build', '.nova', 'coverage', '.cache'];

      for (const entry of entries) {
        if (ignored.includes(entry.name) || entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);
        const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          const children = ProjectBrain.getDirectoryTree(fullPath, rootDir, depth + 1, maxDepth);
          result.push({
            name: entry.name,
            relativePath: relPath,
            isDir: true,
            children
          });
        } else {
          const stats = fs.statSync(fullPath);
          result.push({
            name: entry.name,
            relativePath: relPath,
            isDir: false,
            size: stats.size
          });
        }
      }

      return result.sort((a, b) => (b.isDir ? 1 : 0) - (a.isDir ? 1 : 0) || a.name.localeCompare(b.name));
    } catch (err) {
      console.error(`Error building directory tree for ${dirPath}:`, err);
      return [];
    }
  }

  /**
   * Reads real text content from a file inside the project directory.
   */
  public static readFile(projectPath: string, relativePath: string): string {
    const fullPath = path.resolve(projectPath, relativePath);
    if (!fullPath.startsWith(path.resolve(projectPath))) {
      throw new Error('Security Error: Requested path is outside project root');
    }
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File does not exist: ${relativePath}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
  }

  /**
   * Writes text content to a real file inside the project directory.
   */
  public static writeFile(projectPath: string, relativePath: string, content: string): void {
    const fullPath = path.resolve(projectPath, relativePath);
    if (!fullPath.startsWith(path.resolve(projectPath))) {
      throw new Error('Security Error: Target path is outside project root');
    }
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  /**
   * Ensures rich starter files exist on disk for course projects.
   */
  public static ensureCourseStarterProject(projectPath: string, courseId: string, courseTitle: string): void {
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    const readmePath = path.join(projectPath, 'README.md');
    if (!fs.existsSync(readmePath)) {
      fs.writeFileSync(
        readmePath,
        `# ${courseTitle}\n\nLive Learning Workspace synchronized with MalangCode AI Tutor.\nCourse ID: ${courseId}\n`
      );
    }

    if (courseId === 'react-19-mastery' || courseId.includes('react')) {
      const srcDir = path.join(projectPath, 'src');
      if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

      const appPath = path.join(srcDir, 'App.tsx');
      if (!fs.existsSync(appPath)) {
        fs.writeFileSync(
          appPath,
`// ${courseTitle} - Live Learning Workspace
import React, { useActionState } from 'react';

async function updateServerAction(previousState: number, formData: FormData) {
  'use server';
  // MalangCode: Live Server Action execution demo
  return previousState + 1;
}

export default function App() {
  const [score, formAction, isPending] = useActionState(updateServerAction, 0);

  return (
    <div className="p-8 bg-slate-950 text-white rounded-xl">
      <h1 className="text-2xl font-bold text-gradient-purple-pink">
        React 19 Interactive Score Tracker
      </h1>
      <p className="text-sm text-slate-400 mt-2">
        Score: <span className="font-mono text-purple-400 font-bold">{score}</span>
      </p>

      <form action={formAction} className="mt-4">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg text-xs font-bold text-white hover:opacity-90 transition-all disabled:opacity-50"
        >
          {isPending ? 'Syncing Server State...' : 'Increment Score'}
        </button>
      </form>
    </div>
  );
}`
        );
      }

      const serverActionPath = path.join(srcDir, 'ServerAction.ts');
      if (!fs.existsSync(serverActionPath)) {
        fs.writeFileSync(
          serverActionPath,
`// React 19 Server Action Handler
export async function handleScoreReset() {
  'use server';
  console.log('[Server Action] Resetting React 19 state');
  return 0;
}`
        );
      }

      const pkgPath = path.join(projectPath, 'package.json');
      if (!fs.existsSync(pkgPath)) {
        fs.writeFileSync(
          pkgPath,
          JSON.stringify(
            {
              name: courseId,
              version: '1.0.0',
              dependencies: { react: '^19.0.0', 'react-dom': '^19.0.0', next: '^15.0.0' },
              devDependencies: { typescript: '^5.0.0', tailwindcss: '^3.4.0' }
            },
            null,
            2
          )
        );
      }
    } else if (courseId === 'nextjs-15-fullstack' || courseId.includes('next')) {
      const appDir = path.join(projectPath, 'src', 'app');
      if (!fs.existsSync(appDir)) fs.mkdirSync(appDir, { recursive: true });

      const pagePath = path.join(appDir, 'page.tsx');
      if (!fs.existsSync(pagePath)) {
        fs.writeFileSync(
          pagePath,
`// Next.js 15 App Router & API Architecture
import React from 'react';

export default function Page() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Next.js 15 App Router & API Architecture</h1>
      <p className="mt-2 text-slate-400">Server Components & MongoDB Live Sync Active.</p>
    </main>
  );
}`
        );
      }

      const apiDir = path.join(appDir, 'api', 'courses');
      if (!fs.existsSync(apiDir)) fs.mkdirSync(apiDir, { recursive: true });
      const routePath = path.join(apiDir, 'route.ts');
      if (!fs.existsSync(routePath)) {
        fs.writeFileSync(
          routePath,
`import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Next.js 15 API Route Active', timestamp: new Date().toISOString() });
}`
        );
      }
    } else if (courseId === 'python-ai-agents' || courseId.includes('python')) {
      const mainPy = path.join(projectPath, 'main.py');
      if (!fs.existsSync(mainPy)) {
        fs.writeFileSync(
          mainPy,
`# Python AI Agents & Autonomous Workflows
import asyncio

async function run_agent():
    print("[Python Agent] MalangCode AI Agent Orchestrator initialized.")
    print("[Python Agent] Tool execution: active.")

if __name__ == "__main__":
    asyncio.run(run_agent())
`
        );
      }

      const reqPath = path.join(projectPath, 'requirements.txt');
      if (!fs.existsSync(reqPath)) {
        fs.writeFileSync(reqPath, 'google-generativeai>=0.8.0\npydantic>=2.0.0\nwebsockets>=12.0\n');
      }
    } else {
      const srcDir = path.join(projectPath, 'src');
      if (!fs.existsSync(srcDir)) fs.mkdirSync(srcDir, { recursive: true });

      const indexTs = path.join(srcDir, 'index.ts');
      if (!fs.existsSync(indexTs)) {
        fs.writeFileSync(
          indexTs,
`// Async TypeScript & Real-Time System Design
import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.on('event', (data) => console.log('[Event Bus]', data));
bus.emit('event', 'System ready');
`
        );
      }
    }
  }

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
