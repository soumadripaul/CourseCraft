import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const DEFAULT_THUMB = 'https://placehold.co/56x56?text=C';

function getInitials(user) {
  if (user.first_name && user.last_name)
    return (user.first_name[0] + user.last_name[0]).toUpperCase();
  if (user.first_name) return user.first_name[0].toUpperCase();
  return user.username.slice(0, 2).toUpperCase();
}

function StatCard({ value, label, color }) {
  return (
    <div className="stat-card" style={{ '--stat-color': color }}>
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  // Edit state
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Student data
  const [enrollments, setEnrollments] = useState([]);
  const [progressList, setProgressList] = useState([]);
  // Instructor data
  const [courseCount, setCourseCount] = useState(null);

  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setForm({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setDataLoading(true);
      try {
        if (user.role === 'student') {
          const [enrRes, progRes] = await Promise.all([
            api.get('/enrollments/'),
            api.get('/progress/'),
          ]);
          setEnrollments(enrRes.data.results ?? enrRes.data);
          setProgressList(progRes.data);
        } else if (user.role === 'instructor') {
          const { data } = await api.get('/courses/mine/');
          setCourseCount((data.results ?? data).length);
        }
      } catch { /* ignore */ }
      finally { setDataLoading(false); }
    };
    load();
  }, [user]);

  if (!user) {
    navigate('/login');
    return null;
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username;
  const initials = getInitials(user);
  const joinedDate = user.date_joined
    ? new Date(user.date_joined).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null;

  // Stats
  const totalEnrolled = enrollments.length;
  const completedCourses = progressList.filter((p) => p.progress_percentage >= 100).length;
  const totalLessonsDone = progressList.reduce((s, p) => s + (p.completed_lessons || 0), 0);
  const inProgress = progressList.filter((p) => p.progress_percentage > 0 && p.progress_percentage < 100).length;

  // Progress list sorted by most complete first
  const progressMap = {};
  progressList.forEach((p) => { progressMap[p.course_id] = p; });
  const enrolledWithProgress = enrollments.map(({ course, enrolled_at }) => ({
    course,
    enrolled_at,
    prog: progressMap[course.id] || null,
  })).sort((a, b) => (b.prog?.progress_percentage || 0) - (a.prog?.progress_percentage || 0));

  const handleEditToggle = () => {
    setSaveSuccess(false);
    setSaveError('');
    setEditing((v) => !v);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await updateUser(form);
      setSaveSuccess(true);
      setEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.detail || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      {/* ── Profile header ────────────────────────── */}
      <div className="profile-card">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-info">
          <h1 className="profile-name">{displayName}</h1>
          <div className="profile-meta">
            <span className="profile-username">@{user.username}</span>
            <span className={`role-badge role-${user.role}`}>{user.role}</span>
            {joinedDate && <span className="profile-joined">Joined {joinedDate}</span>}
          </div>
          {saveSuccess && (
            <div className="profile-success-banner">Profile updated successfully.</div>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={handleEditToggle}>
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {/* ── Inline edit form ──────────────────────── */}
      {editing && (
        <div className="profile-edit-section">
          <form onSubmit={handleSave} className="profile-edit-form">
            {saveError && <div className="error-banner">{saveError}</div>}
            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="First name"
                />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Last name"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
              />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={handleEditToggle}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Stats (student only) ──────────────────── */}
      {user.role === 'student' && !dataLoading && (
        <div className="stat-grid">
          <StatCard value={totalEnrolled} label="Enrolled" color="var(--primary)" />
          <StatCard value={completedCourses} label="Completed" color="var(--success)" />
          <StatCard value={totalLessonsDone} label="Lessons Done" color="#8b5cf6" />
          <StatCard value={inProgress} label="In Progress" color="var(--accent)" />
        </div>
      )}

      {/* ── Stats (instructor) ───────────────────── */}
      {user.role === 'instructor' && !dataLoading && (
        <div className="stat-grid">
          <StatCard value={courseCount ?? '—'} label="Courses Created" color="var(--primary)" />
        </div>
      )}

      {/* ── Progress list (student only) ─────────── */}
      {user.role === 'student' && (
        <div className="profile-section">
          <div className="profile-section-header">
            <h2>Course Progress</h2>
            <Link to="/my-enrollments" className="btn btn-sm btn-outline">View All</Link>
          </div>
          {dataLoading ? (
            <div className="loading" style={{ padding: '2rem' }}>Loading...</div>
          ) : enrolledWithProgress.length === 0 ? (
            <div className="empty-state" style={{ padding: '2rem' }}>
              No courses yet. <Link to="/">Browse courses</Link>
            </div>
          ) : (
            <div className="progress-course-list">
              {enrolledWithProgress.map(({ course, enrolled_at, prog }) => {
                const pct = prog?.progress_percentage || 0;
                const done = prog?.completed_lessons || 0;
                const total = prog?.total_lessons || 0;
                const isComplete = pct >= 100;

                return (
                  <Link
                    to={`/courses/${course.id}`}
                    key={course.id}
                    className="progress-course-item"
                  >
                    <img
                      src={course.thumbnail || DEFAULT_THUMB}
                      alt={course.title}
                      className="progress-course-thumb"
                      onError={(e) => { e.target.src = DEFAULT_THUMB; }}
                    />
                    <div className="progress-course-info">
                      <div className="progress-course-title">
                        {course.title}
                        {isComplete && <span className="complete-check">✓ Complete</span>}
                      </div>
                      <div className="progress-course-meta">
                        {done}/{total || '?'} lessons · Enrolled {new Date(enrolled_at).toLocaleDateString()}
                      </div>
                      <div className="progress-bar-track" style={{ marginTop: '0.4rem' }}>
                        <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="progress-course-pct" data-complete={isComplete}>
                      {pct}%
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
