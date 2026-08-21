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

// POST /api/courses/enroll
router.post('/enroll', (req: Request, res: Response) => {
  const { courseId, rootPath } = req.body;
  const course = COURSES.find(c => c.id === courseId);

  if (!course) {
    return res.status(404).json({ success: false, error: 'Course not found' });
  }

  const defaultDesktopRoot = 'c:\\Users\\Rahis\\Desktop\\McodeProjects';
  const targetDir = path.join(rootPath || defaultDesktopRoot, course.desktopFolder);

  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(
        path.join(targetDir, 'README.md'),
        `# ${course.title}\n\nWorkspace synchronized with Mcode-Agent.\nLearning path: ${course.category} (${course.level}).\n`
      );
      fs.writeFileSync(
        path.join(targetDir, 'App.tsx'),
        `// ${course.title} - Live Learning Workspace\nimport React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8 text-white bg-slate-950">\n      <h1 className="text-2xl font-bold">${course.title}</h1>\n      <p>Mcode-Agent live tutor connected. Edit this code to start learning!</p>\n    </div>\n  );\n}\n`
      );
    }

    res.json({
      success: true,
      message: `Course ${course.title} enrolled and desktop workspace synchronized at ${targetDir}`,
      desktopFolder: targetDir,
      course
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
