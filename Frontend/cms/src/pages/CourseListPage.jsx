import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const DEFAULT_THUMB = 'https://placehold.co/400x220?text=Course';

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'programming', label: 'Programming' },
  { value: 'design', label: 'Design' },
  { value: 'business', label: 'Business' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'data_science', label: 'Data Science' },
  { value: 'personal_dev', label: 'Personal Dev' },
  { value: 'other', label: 'Other' },
];

export default function CourseListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);

  useEffect(() => {
    fetchCourses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, category]);

  const buildUrl = (extraParams = {}) => {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    if (category) params.set('category', category);
    Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    const qs = params.toString();
    return qs ? `/courses/?${qs}` : '/courses/';
  };

  const fetchCourses = async (url) => {
    setLoading(true);
    try {
      const { data } = await api.get(url || buildUrl());
      setCourses(data.results ?? data);
      setNextPage(data.next);
      setPrevPage(data.previous);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setQuery(search);
  };

  const handleClear = () => {
    setSearch('');
    setQuery('');
    setCategory('');
  };

  const handleCategoryClick = (val) => {
    setCategory(val);
    setQuery('');
    setSearch('');
  };

  const paginate = (rawUrl) => {
    const u = new URL(rawUrl);
    fetchCourses(u.pathname.replace('/api', '') + u.search);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>All Courses</h1>
        <form className="search-form" onSubmit={handleSearch}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
          />
          <button type="submit" className="btn btn-primary">Search</button>
          {(query || category) && (
            <button type="button" className="btn btn-outline" onClick={handleClear}>
              Clear
            </button>
          )}
        </form>
      </div>

      <div className="category-filters">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            className={`category-filter-btn${category === value ? ' active' : ''}`}
            onClick={() => handleCategoryClick(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="empty-state">No courses found.</div>
      ) : (
        <>
          <div className="course-grid">
            {courses.map((course) => (
              <Link to={`/courses/${course.id}`} key={course.id} className="course-card">
                <img
                  src={course.thumbnail || DEFAULT_THUMB}
                  alt={course.title}
                  className="course-thumbnail"
                  onError={(e) => { e.target.src = DEFAULT_THUMB; }}
                />
                <div className="course-card-body">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <h3 className="course-title" style={{ margin: 0 }}>{course.title}</h3>
                    {course.category && course.category !== 'other' && (
                      <span className="category-badge">
                        {CATEGORIES.find((c) => c.value === course.category)?.label || course.category}
                      </span>
                    )}
                  </div>
                  <p className="course-description">{course.description.slice(0, 100)}...</p>
                  <div className="course-meta">
                    <span>👤 {course.instructor?.username}</span>
                    <span>📚 {course.lesson_count} lessons</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="pagination">
            {prevPage && (
              <button className="btn btn-outline" onClick={() => paginate(prevPage)}>
                ← Previous
              </button>
            )}
            {nextPage && (
              <button className="btn btn-primary" onClick={() => paginate(nextPage)}>
                Next →
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
