import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

export interface Course {
  id: string;
  title: string;
  category: 'Frontend' | 'Fullstack' | 'AI & Agents' | 'Python' | 'TypeScript';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: number;
  description: string;
  icon: string;
  gradient: string;
  techStack: string[];
  desktopFolder: string;
}

const COURSES: Course[] = [
  {
    id: 'react-19-mastery',
    title: 'React 19 & Server Components Live Mastery',
    category: 'Frontend',
    level: 'Intermediate',
    duration: '12 Hours',
    lessons: 24,
    description: 'Master React 19 useActionState, Server Actions, use() hook, optimistic UI, and concurrent rendering through interactive VS Code demos.',
    icon: 'Atom',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
    techStack: ['React 19', 'Next.js 15', 'TypeScript', 'TailwindCSS'],
    desktopFolder: 'react-19-mastery'
  },
  {
    id: 'nextjs-15-fullstack',
    title: 'Next.js 15 App Router & API Architecture',
    category: 'Fullstack',
    level: 'Advanced',
    duration: '16 Hours',
    lessons: 32,
    description: 'Build production-ready web apps with dynamic routing, middleware, Server Actions, and MongoDB synchronization with live Mcode-Agent assistance.',
    icon: 'Layers',
    gradient: 'from-purple-600 via-violet-600 to-pink-500',
    techStack: ['Next.js 15', 'Node.js', 'MongoDB', 'Prisma'],
    desktopFolder: 'nextjs-15-fullstack'
  },
  {
    id: 'python-ai-agents',
    title: 'Python AI Agents & Autonomous Workflows',
    category: 'AI & Agents',
    level: 'Intermediate',
    duration: '14 Hours',
    lessons: 28,
    description: 'Create multi-agent AI systems, LangChain/Pydantic AI orchestrators, tool-calling agents, and real-time WebSocket streaming.',
    icon: 'Bot',
    gradient: 'from-pink-500 via-purple-500 to-indigo-600',
    techStack: ['Python 3.12', 'Gemini API', 'Pydantic', 'WebSockets'],
    desktopFolder: 'python-ai-agents'
  },
  {
    id: 'async-typescript',
    title: 'Async TypeScript & Real-Time System Design',
    category: 'TypeScript',
    level: 'Beginner',
    duration: '10 Hours',
    lessons: 20,
    description: 'Master asynchronous TypeScript, EventEmitters, WebSocket proxies, generic type systems, and reactive state management.',
    icon: 'Code2',
    gradient: 'from-cyan-500 via-blue-600 to-violet-600',
    techStack: ['TypeScript', 'Express', 'WS', 'Node.js'],
    desktopFolder: 'async-typescript'
  }
];

import { Project } from '../models/Schemas.js';
import { ProjectBrain } from '../services/ProjectBrain.js';
import { MemoryBrain } from '../services/MemoryBrain.js';

// GET /api/courses
router.get('/', (req: Request, res: Response) => {
  const { category, search } = req.query;
  let filtered = COURSES;

  if (category && category !== 'All') {
    filtered = filtered.filter(c => c.category === category);
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter(c => 
      c.title.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) ||
      c.techStack.some(t => t.toLowerCase().includes(q))
    );
  }

  res.json({ success: true, count: filtered.length, courses: filtered });
});

// GET /api/courses/check-enrollment
router.get('/check-enrollment', async (req: Request, res: Response) => {
  const { courseId } = req.query;
  if (!courseId) {
    return res.status(400).json({ success: false, error: 'courseId parameter is required' });
  }

  const course = COURSES.find(c => c.id === courseId);
  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const defaultDesktopRoot = 'c:\\Users\\Rahis\\Desktop\\McodeProjects';
  const targetDir = path.join(defaultDesktopRoot, course.desktopFolder);

  try {
    const existing = await Project.findOne({ 
      $or: [
        { path: targetDir },
        { name: course.title },
        { name: course.id }
      ]
    });

    res.json({
      success: true,
      enrolled: !!existing,
      project: existing || null,
      course
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/courses/enroll
router.post('/enroll', async (req: Request, res: Response) => {
  const { courseId, rootPath } = req.body;
  const course = COURSES.find(c => c.id === courseId);

  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const defaultDesktopRoot = 'c:\\Users\\Rahis\\Desktop\\McodeProjects';
  const targetDir = path.join(rootPath || defaultDesktopRoot, course.desktopFolder);

  try {
    // 1. Ensure starter files exist on disk
    ProjectBrain.ensureCourseStarterProject(targetDir, course.id, course.title);
    MemoryBrain.ensureNovaDirectory(targetDir);

    // 2. Register or update Project in MongoDB
    let project = await Project.findOne({ 
      $or: [
        { path: targetDir },
        { name: course.title },
        { name: course.id }
      ]
    });

    let alreadyEnrolled = false;
    if (!project) {
      project = new Project({
        name: course.title,
        path: targetDir,
        framework: course.category === 'Frontend' ? 'React' : course.category === 'Fullstack' ? 'Next.js' : 'Python',
        activeBranch: 'main',
        packageManager: 'npm',
        healthStatus: 'healthy',
        lastSync: new Date()
      });
      await project.save();
    } else {
      alreadyEnrolled = true;
      project.lastSync = new Date();
      await project.save();
    }

    res.json({
      success: true,
      alreadyEnrolled,
      message: alreadyEnrolled 
        ? `Course ${course.title} is already enrolled. Workspace ready.` 
        : `Course ${course.title} successfully enrolled. Workspace initialized at ${targetDir}`,
      project,
      course
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
