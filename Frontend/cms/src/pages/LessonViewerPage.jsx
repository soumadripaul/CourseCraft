import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function getEmbedUrl(url) {
  if (!url) return null;
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return url;
}

export default function LessonViewerPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [courseLessons, setCourseLessons] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [lessonProgressMap, setLessonProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [courseProgress, setCourseProgress] = useState(null);

  const fetchProgress = useCallback(async (courseId) => {
    try {
      const { data } = await api.get(`/courses/${courseId}/progress/`);
      setCourseProgress(data);
    } catch { /* not enrolled or no progress yet */ }
  }, []);

  const fetchLessonProgress = useCallback(async (courseId) => {
    try {
      const { data } = await api.get(`/courses/${courseId}/lesson-progress/`);
      const map = {};
      data.forEach(({ lesson_id, completed: done }) => { map[lesson_id] = done; });
      setLessonProgressMap(map);
      return map;
    } catch {
      return {};
    }
  }, []);

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    setVideoLoaded(false);
    try {
      const { data } = await api.get(`/lessons/${id}/`);
      setLesson(data);
      const { data: siblings } = await api.get(`/courses/${data.course}/lessons/`);
      setCourseLessons(siblings.results ?? siblings);
      if (user?.role === 'student') {
        fetchProgress(data.course);
        const map = await fetchLessonProgress(data.course);
        setCompleted(map[parseInt(id)] === true);
      }
    } catch { /* handle */ }
    finally { setLoading(false); }
  }, [id, user?.role, fetchProgress, fetchLessonProgress]);

  useEffect(() => {
    fetchLesson();
  }, [fetchLesson]);

  const handleMarkComplete = async () => {
    setMarking(true);
    try {
      await api.post(`/lessons/${id}/complete/`);
      setCompleted(true);
      setLessonProgressMap((prev) => ({ ...prev, [parseInt(id)]: true }));
      if (lesson?.course) fetchProgress(lesson.course);
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to mark as complete.');
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <div className="loading">Loading lesson...</div>;
  if (!lesson) return <div className="empty-state">Lesson not found.</div>;

  const embedUrl = getEmbedUrl(lesson.video_url);
  const currentIdx = courseLessons.findIndex((l) => l.id === parseInt(id));
  const prevLesson = currentIdx > 0 ? courseLessons[currentIdx - 1] : null;
  const nextLesson = currentIdx < courseLessons.length - 1 ? courseLessons[currentIdx + 1] : null;

  return (
    <div className="page-container">
      <div className="lesson-viewer">
        <div className="lesson-main">
          <h1>{lesson.title}</h1>
          <p className="lesson-meta">⏱ {lesson.duration} minutes</p>

          {embedUrl ? (
            <div className="video-wrapper">
              {!videoLoaded && (
                <div className="video-placeholder">
                  <div className="video-spinner" />
                  <span>Loading video...</span>
                </div>
              )}
              <iframe
                src={embedUrl}
                frameBorder="0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                title={lesson.title}
                onLoad={() => setVideoLoaded(true)}
                style={{ opacity: videoLoaded ? 1 : 0, transition: 'opacity 0.3s' }}
              />
            </div>
          ) : (
            <div className="no-video">No video available for this lesson.</div>
          )}

          <div className="lesson-controls">
            <div className="lesson-nav">
              {prevLesson && (
                <Link to={`/lessons/${prevLesson.id}`} className="btn btn-outline">← Previous</Link>
              )}
              {nextLesson && (
                <Link to={`/lessons/${nextLesson.id}`} className="btn btn-primary">Next →</Link>
              )}
            </div>
            {user?.role === 'student' && (
              <button
                className={`btn ${completed ? 'btn-success' : 'btn-secondary'}`}
                onClick={handleMarkComplete}
                disabled={completed || marking}
              >
                {completed ? '✅ Completed!' : marking ? 'Marking...' : '✓ Mark as Complete'}
              </button>
            )}
          </div>
        </div>

        <aside className="lesson-sidebar">
          {courseProgress && (
            <div className="sidebar-progress">
              <div className="sidebar-progress-label">
                <span>Course Progress</span>
                <span>{courseProgress.progress_percentage}%</span>
              </div>
              <div className="progress-bar-track">
                <div
                  className="progress-bar-fill"
                  style={{ width: `${courseProgress.progress_percentage}%` }}
                />
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                {courseProgress.completed_lessons} / {courseProgress.total_lessons} lessons done
              </div>
            </div>
          )}
          <h3>Course Lessons</h3>
          <ul className="sidebar-lesson-list">
            {courseLessons.map((l, idx) => {
              const isCurrent = l.id === parseInt(id);
              const isDone = lessonProgressMap[l.id] === true;
              return (
                <li key={l.id} className={`sidebar-lesson-item${isCurrent ? ' active' : ''}`}>
                  <Link to={`/lessons/${l.id}`}>
                    <span className="lesson-num">{idx + 1}</span>
                    <span style={{ flex: 1 }}>{l.title}</span>
                    {isDone && (
                      <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✓</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </div>
  );
}
