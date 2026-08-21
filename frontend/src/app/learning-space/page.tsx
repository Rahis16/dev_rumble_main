'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardShell from '../../components/DashboardShell';
import { 
  GraduationCap, 
  Search, 
  Filter, 
  Sparkles, 
  Clock, 
  BookOpen, 
  Code2, 
  Layers, 
  Bot, 
  Atom, 
  CheckCircle2, 
  FolderSync,
  X,
  Play
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  category: 'Frontend' | 'Fullstack' | 'AI & Agents' | 'Python' | 'TypeScript';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  lessons: number;
  description: string;
  techStack: string[];
  desktopFolder: string;
}

export default function LearningSpace() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCourseModal, setActiveCourseModal] = useState<Course | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [enrollMessage, setEnrollMessage] = useState<string | null>(null);

  const categories = ['All', 'Frontend', 'Fullstack', 'AI & Agents', 'Python', 'TypeScript'];

  const fetchCourses = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courses?category=${selectedCategory}&search=${searchQuery}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
        
        // Notify voice agent of current active course search results
        if (window && (window as any).mcode_ws_socket) {
          try {
            (window as any).mcode_ws_socket.send(JSON.stringify({
              type: 'set_course_context',
              courses: data.courses
            }));
          } catch (e) {
            // ignore socket state
          }
        }
      }
    } catch (e) {
      console.log('Error loading course catalog', e);
    }
  };

  useEffect(() => {
    fetchCourses();

    const handleVoiceSearch = (e: any) => {
      if (e.detail?.query) setSearchQuery(e.detail.query);
    };

    const handleVoiceEnroll = (e: any) => {
      if (e.detail?.courseId && courses.length > 0) {
        const found = courses.find(c => c.id === e.detail.courseId) || courses[0];
        handleEnrollCourse(found);
      }
    };

    window.addEventListener('mcode_voice_search', handleVoiceSearch);
    window.addEventListener('mcode_voice_enroll', handleVoiceEnroll);

    return () => {
      window.removeEventListener('mcode_voice_search', handleVoiceSearch);
      window.removeEventListener('mcode_voice_enroll', handleVoiceEnroll);
    };
  }, [selectedCategory, searchQuery]);

  const handleEnrollCourse = async (course: Course) => {
    setIsEnrolling(true);
    setEnrollMessage(null);
    try {
      const res = await fetch('http://localhost:5000/api/courses/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          rootPath: 'c:\\Users\\Rahis\\Desktop\\McodeProjects'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.project?._id) {
          localStorage.setItem('mc_active_project_id', data.project._id);
        }
        setEnrollMessage(data.message || `Synchronized course project to ${data.project?.path}`);
        setTimeout(() => {
          setIsEnrolling(false);
          setActiveCourseModal(null);
          router.push('/workspace');
        }, 1200);
      }
    } catch (e) {
      console.error('Enrollment error', e);
      setIsEnrolling(false);
    }
  };

  return (
    <DashboardShell>
      <div className="max-w-6xl mx-auto space-y-8 py-2">
        
        {/* PAGE HEADER & SEARCH BAR */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 rounded-full text-xs font-mono text-purple-700 dark:text-purple-300 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Interactive Learning Space Catalog</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)]">
                Explore Practical <span className="text-gradient-purple-pink">Coding Courses</span>
              </h1>
              <p className="text-[var(--text-secondary)] text-xs md:text-sm mt-1">
                Choose a course to automatically synchronize root project folders directly to your desktop workspace.
              </p>
            </div>
          </div>

          {/* Search & Categories Toolbar */}
          <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 justify-between items-center border-purple-900/30">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search courses or technologies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-purple-500 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--nav-hover-bg)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* COURSES CATALOG GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              whileHover={{ y: -4 }}
              className="glass-card p-6 flex flex-col justify-between space-y-5 border-purple-900/30 relative overflow-hidden group"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 text-[10px] font-mono font-semibold text-purple-700 dark:text-purple-300">
                    {course.category}
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-[10px] font-mono text-[var(--text-muted)]">
                    {course.level}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-purple-500 transition-colors">
                  {course.title}
                </h3>

                <p className="text-xs text-[var(--text-secondary)] leading-relaxed line-clamp-3">
                  {course.description}
                </p>

                {/* Tech Stack Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {course.techStack.map((tech) => (
                    <span key={tech} className="px-2 py-0.5 rounded-md bg-[var(--inner-box-bg)] border border-[var(--inner-box-border)] text-[var(--text-muted)] text-[10px] font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Course Footer Info & Action */}
              <div className="border-t border-[var(--inner-box-border)] pt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs font-mono text-[var(--text-muted)]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-purple-400" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>{course.lessons} Lessons</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveCourseModal(course)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl text-xs font-semibold text-white shadow-md shadow-purple-500/20 hover:scale-105 transition-all flex items-center gap-1.5"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Add to Workspace</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* COURSE ENROLLMENT MODAL */}
        <AnimatePresence>
          {activeCourseModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card max-w-lg w-full p-6 md:p-8 space-y-6 border-purple-900/40 relative bg-[var(--card-bg)]"
              >
                <button
                  onClick={() => setActiveCourseModal(null)}
                  className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="space-y-2">
                  <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800/40 text-[10px] font-mono font-semibold text-purple-700 dark:text-purple-300">
                    {activeCourseModal.category} • {activeCourseModal.level}
                  </span>
                  <h2 className="text-xl font-extrabold text-[var(--text-primary)]">{activeCourseModal.title}</h2>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{activeCourseModal.description}</p>
                </div>

                {/* Workspace Sync Details */}
                <div className="p-4 bg-[var(--inner-box-bg)] rounded-xl border border-[var(--inner-box-border)] space-y-2 text-xs font-mono">
                  <div className="flex items-center justify-between text-[var(--text-muted)]">
                    <span className="flex items-center gap-2">
                      <FolderSync className="w-4 h-4 text-purple-400" />
                      <span>Desktop Workspace Path</span>
                    </span>
                    <span className="text-emerald-400 font-semibold">SYNC READY</span>
                  </div>
                  <p className="text-[var(--text-primary)] text-[11px] truncate bg-[var(--card-bg)] p-2 rounded border border-[var(--inner-box-border)]">
                    c:\Users\Rahis\Desktop\McodeProjects\{activeCourseModal.desktopFolder}
                  </p>
                </div>

                {enrollMessage && (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-xs text-emerald-300 font-mono flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{enrollMessage}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setActiveCourseModal(null)}
                    className="px-4 py-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={() => handleEnrollCourse(activeCourseModal)}
                    disabled={isEnrolling}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 rounded-xl text-xs font-bold text-white shadow-lg shadow-purple-500/25 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{isEnrolling ? 'Creating Desktop Project...' : 'Enroll & Start Live Workspace'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </DashboardShell>
  );
}
