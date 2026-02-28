import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DEFAULT_THUMB = 'https://placehold.co/800x400?text=Course';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState('');

  const fetchCourse = useCallback(async () => {
    try {
      const { data } = await api.get(`/courses/${id}/`);
      setCourse(data);
    } catch {
      setError('Course not found.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchEnrollmentStatus = useCallback(async () => {
    try {
      const { data } = await api.get('/enrollments/');
      const enrollments = data.results ?? data;
      setEnrolled(enrollments.some((e) => e.course?.id === parseInt(id)));
    } catch { /* not authenticated */ }
  }, [id]);

  const fetchProgress = useCallback(async () => {
    try {
      const { data } = await api.get(`/courses/${id}/progress/`);
      setProgress(data);
    } catch { /* not enrolled yet */ }
  }, [id]);

  useEffect(() => {
    fetchCourse();
    if (user?.role === 'student') {
      fetchEnrollmentStatus();
      fetchProgress();
    }
  }, [fetchCourse, fetchEnrollmentStatus, fetchProgress, user?.role]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll/`);
      setEnrolled(true);
      await fetchProgress();
    } catch (err) {
      setError(err.response?.data?.detail || 'Enrollment failed.');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="loading">Loading course...</div>;
  if (error && !course) return <div className="empty-state">{error}</div>;

  const isInstructorOwner = user?.role === 'instructor' && course?.instructor?.id === user?.id;

  return (
    <div className="page-container">
      <div className="course-detail-hero">
        <img
          src={course.thumbnail || DEFAULT_THUMB}
          alt={course.title}
          className="course-detail-image"
          onError={(e) => { e.target.src = DEFAULT_THUMB; }}
        />
        <div className="course-detail-info">
          <h1>{course.title}</h1>
          <p>{course.description}</p>
          <div className="course-meta">
            <span>👤 Instructor: <strong>{course.instructor?.username}</strong></span>
            <span>📅 {new Date(course.created_at).toLocaleDateString()}</span>
            <span>📚 {course.lessons?.length || 0} lessons</span>
          </div>

          {progress && (
            <div className="progress-section">
              <div className="progress-bar-label">
                Progress: {progress.completed_lessons}/{progress.total_lessons} lessons ({progress.progress_percentage}%)
              </div>
              <div className="progress-bar-track">
                <div className="progress-bar-fill" style={{ width: `${progress.progress_percentage}%` }} />
              </div>
            </div>
          )}

          {error && <div className="error-banner">{error}</div>}

          {!user && (
            <Link to="/login" className="btn btn-primary">Login to Enroll</Link>
          )}
          {user?.role === 'student' && !enrolled && (
            <button className="btn btn-primary" onClick={handleEnroll} disabled={enrolling}>
              {enrolling ? 'Enrolling...' : '🎓 Enroll Now'}
            </button>
          )}
          {user?.role === 'student' && enrolled && (
            <span className="enrolled-badge">✅ Enrolled</span>
          )}
          {isInstructorOwner && (
            <Link to="/instructor/courses" className="btn btn-outline">✏️ Manage Course</Link>
          )}
        </div>
      </div>

      <div className="lessons-section">
        <h2>Lessons</h2>
        {course.lessons?.length === 0 ? (
          <p className="empty-state">No lessons yet.</p>
        ) : (
          <div className="lessons-list">
            {course.lessons?.map((lesson, idx) => (
              <div key={lesson.id} className="lesson-item">
                <span className="lesson-number">{idx + 1}</span>
                <div className="lesson-info">
                  <span className="lesson-title">{lesson.title}</span>
                  <span className="lesson-duration">⏱ {lesson.duration} min</span>
                </div>
                {(enrolled || isInstructorOwner) && (
                  <Link to={`/lessons/${lesson.id}`} className="btn btn-sm btn-primary">
                    ▶ Watch
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
