import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const CATEGORIES = [
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'personal_dev', label: 'Personal Development' },
  { value: 'other', label: 'Other' },
];

const EMPTY_COURSE = { title: '', description: '', thumbnail: null, category: 'other' };
const EMPTY_LESSON = { title: '', video_url: '', duration: '', order: '' };

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Course modal
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [editCourseId, setEditCourseId] = useState(null);
  const [courseErrors, setCourseErrors] = useState({});
  const [savingCourse, setSavingCourse] = useState(false);

  // Lesson modal
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [editLessonId, setEditLessonId] = useState(null);
  const [activeCourseId, setActiveCourseId] = useState(null);
  const [lessons, setLessons] = useState({});
  const [expandedCourse, setExpandedCourse] = useState(null);
  const [savingLesson, setSavingLesson] = useState(false);
  const [lessonErrors, setLessonErrors] = useState({});

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/courses/mine/');
      setCourses(data.results ?? data);
    } catch { setCourses([]); }
    finally { setLoading(false); }
  };

  const fetchLessons = async (courseId) => {
    try {
      const { data } = await api.get(`/courses/${courseId}/lessons/`);
      setLessons((prev) => ({ ...prev, [courseId]: data.results ?? data }));
    } catch { /* ignore */ }
  };

  const toggleExpand = (courseId) => {
    if (expandedCourse === courseId) {
      setExpandedCourse(null);
    } else {
      setExpandedCourse(courseId);
      fetchLessons(courseId);
    }
  };

  // ── Course CRUD ──────────────────────────────────────────────────────────────

  const openCreateCourse = () => {
    setCourseForm(EMPTY_COURSE);
    setEditCourseId(null);
    setCourseErrors({});
    setShowCourseModal(true);
  };

  const openEditCourse = (course) => {
    setCourseForm({
      title: course.title,
      description: course.description,
      thumbnail: null,
      category: course.category || 'other',
    });
    setEditCourseId(course.id);
    setCourseErrors({});
    setShowCourseModal(true);
  };

  const handleCourseSave = async (e) => {
    e.preventDefault();
    if (!courseForm.title) { setCourseErrors({ title: 'Title is required' }); return; }
    setSavingCourse(true);
    try {
      const formData = new FormData();
      formData.append('title', courseForm.title);
      formData.append('description', courseForm.description);
      formData.append('category', courseForm.category);
      if (courseForm.thumbnail) formData.append('thumbnail', courseForm.thumbnail);

      if (editCourseId) {
        await api.patch(`/courses/${editCourseId}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/courses/', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setShowCourseModal(false);
      fetchCourses();
    } catch (err) {
      setCourseErrors(err.response?.data || { general: 'Save failed.' });
    } finally {
      setSavingCourse(false);
    }
  };

  const deleteCourse = async (courseId) => {
    if (!confirm('Delete this course and all its lessons?')) return;
    try {
      await api.delete(`/courses/${courseId}/`);
      fetchCourses();
    } catch { alert('Delete failed.'); }
  };

  // ── Lesson CRUD ──────────────────────────────────────────────────────────────

  const openCreateLesson = (courseId) => {
    setLessonForm(EMPTY_LESSON);
    setEditLessonId(null);
    setActiveCourseId(courseId);
    setLessonErrors({});
    setShowLessonModal(true);
  };

  const openEditLesson = (lesson, courseId) => {
    setLessonForm({ title: lesson.title, video_url: lesson.video_url, duration: lesson.duration, order: lesson.order });
    setEditLessonId(lesson.id);
    setActiveCourseId(courseId);
    setLessonErrors({});
    setShowLessonModal(true);
  };

  const handleLessonSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!lessonForm.title.trim()) errs.title = 'Title is required.';
    if (!lessonForm.duration || Number(lessonForm.duration) < 1) errs.duration = 'Duration must be at least 1 minute.';
    if (lessonForm.order === '' || Number(lessonForm.order) < 0) errs.order = 'Order must be 0 or greater.';
    if (Object.keys(errs).length) { setLessonErrors(errs); return; }
    setSavingLesson(true);
    try {
      const payload = {
        ...lessonForm,
        duration: parseInt(lessonForm.duration, 10),
        order: parseInt(lessonForm.order, 10),
        course: activeCourseId,
      };
      if (editLessonId) {
        await api.patch(`/lessons/${editLessonId}/`, payload);
      } else {
        await api.post(`/courses/${activeCourseId}/lessons/`, payload);
      }
      setShowLessonModal(false);
      fetchLessons(activeCourseId);
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        setLessonErrors(data);
      } else {
        setLessonErrors({ general: 'Save failed. Please try again.' });
      }
    } finally {
      setSavingLesson(false);
    }
  };

  const deleteLesson = async (lessonId, courseId) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/lessons/${lessonId}/`);
      fetchLessons(courseId);
    } catch { alert('Delete failed.'); }
  };

  const categoryLabel = (val) => CATEGORIES.find((c) => c.value === val)?.label || val;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Courses</h1>
        <button className="btn btn-primary" onClick={openCreateCourse}>+ New Course</button>
      </div>

      {loading ? (
        <div className="loading">Loading...</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">You haven&apos;t created any courses yet.</div>
      ) : (
        <div className="manage-course-list">
          {courses.map((course) => (
            <div key={course.id} className="manage-course-item">
              <div className="manage-course-header">
                <div className="manage-course-title">
                  <strong>{course.title}</strong>
                  <span className="lesson-count-badge">{course.lesson_count} lessons</span>
                  {course.category && (
                    <span className="category-badge">{categoryLabel(course.category)}</span>
                  )}
                </div>
                <div className="manage-course-actions">
                  <Link to={`/courses/${course.id}`} className="btn btn-sm btn-outline">👁 View</Link>
                  <button className="btn btn-sm btn-outline" onClick={() => openEditCourse(course)}>✏️ Edit</button>
                  <button className="btn btn-sm btn-danger" onClick={() => deleteCourse(course.id)}>🗑 Delete</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => toggleExpand(course.id)}>
                    {expandedCourse === course.id ? '▲ Lessons' : '▼ Lessons'}
                  </button>
                </div>
              </div>

              {expandedCourse === course.id && (
                <div className="manage-lessons">
                  <div className="manage-lessons-header">
                    <h4>Lessons</h4>
                    <button className="btn btn-sm btn-primary" onClick={() => openCreateLesson(course.id)}>+ Add Lesson</button>
                  </div>
                  {(lessons[course.id] || []).length === 0 ? (
                    <p className="empty-state-small">No lessons yet.</p>
                  ) : (
                    <ul className="lesson-manage-list">
                      {(lessons[course.id] || []).map((lesson) => (
                        <li key={lesson.id} className="lesson-manage-item">
                          <span>#{lesson.order} <strong>{lesson.title}</strong> — {lesson.duration} min</span>
                          <div>
                            <button className="btn btn-sm btn-outline" onClick={() => openEditLesson(lesson, course.id)}>✏️</button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteLesson(lesson.id, course.id)}>🗑</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Course Modal */}
      {showCourseModal && (
        <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editCourseId ? 'Edit Course' : 'Create Course'}</h3>
            <form onSubmit={handleCourseSave} className="auth-form">
              {courseErrors.general && <div className="error-banner">{courseErrors.general}</div>}
              <div className="form-group">
                <label>Title *</label>
                <input value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
                {courseErrors.title && <span className="field-error">{courseErrors.title}</span>}
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea rows={4} value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={courseForm.category}
                    onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                  >
                    {CATEGORIES.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Thumbnail Image</label>
                  <input type="file" accept="image/*" onChange={(e) => setCourseForm({ ...courseForm, thumbnail: e.target.files[0] })} />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCourseModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingCourse}>
                  {savingCourse ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lesson Modal */}
      {showLessonModal && (
        <div className="modal-overlay" onClick={() => setShowLessonModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editLessonId ? 'Edit Lesson' : 'Add Lesson'}</h3>
            <form onSubmit={handleLessonSave} className="auth-form">
              {lessonErrors.general && <div className="error-banner">{lessonErrors.general}</div>}
              <div className="form-group">
                <label>Title *</label>
                <input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
                {lessonErrors.title && <span className="field-error">{lessonErrors.title}</span>}
              </div>
              <div className="form-group">
                <label>Video URL (YouTube/Vimeo)</label>
                <input value={lessonForm.video_url} onChange={(e) => setLessonForm({ ...lessonForm, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
                {lessonErrors.video_url && <span className="field-error">{lessonErrors.video_url}</span>}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Duration (min)</label>
                  <input type="number" min="1" value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })} />
                  {lessonErrors.duration && <span className="field-error">{lessonErrors.duration}</span>}
                </div>
                <div className="form-group">
                  <label>Order</label>
                  <input type="number" min="0" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: e.target.value })} />
                  {lessonErrors.order && <span className="field-error">{lessonErrors.order}</span>}
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowLessonModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={savingLesson}>
                  {savingLesson ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
