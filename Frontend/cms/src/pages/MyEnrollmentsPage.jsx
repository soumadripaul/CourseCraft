import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';

const DEFAULT_THUMB = 'https://placehold.co/400x220?text=Course';

function downloadCertificate(courseName, studentName) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210;

  // Background
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, W, H, 'F');

  // Outer border
  doc.setDrawColor(108, 99, 255);
  doc.setLineWidth(3);
  doc.rect(10, 10, W - 20, H - 20);

  // Inner border
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.8);
  doc.rect(15, 15, W - 30, H - 30);

  // Decorative corners
  const corner = 6;
  doc.setFillColor(108, 99, 255);
  [[10,10],[W-10,10],[10,H-10],[W-10,H-10]].forEach(([x, y]) => {
    doc.circle(x, y, corner / 2, 'F');
  });

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.setTextColor(108, 99, 255);
  doc.text('Certificate of Completion', W / 2, 55, { align: 'center' });

  // Divider line
  doc.setDrawColor(167, 139, 250);
  doc.setLineWidth(0.5);
  doc.line(60, 62, W - 60, 62);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('This is to certify that', W / 2, 78, { align: 'center' });

  // Student name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(30, 41, 59);
  doc.text(studentName, W / 2, 97, { align: 'center' });

  // Underline name
  const nameWidth = doc.getTextWidth(studentName);
  doc.setDrawColor(108, 99, 255);
  doc.setLineWidth(0.7);
  doc.line(W / 2 - nameWidth / 2, 100, W / 2 + nameWidth / 2, 100);

  // Has completed
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(100, 116, 139);
  doc.text('has successfully completed the course', W / 2, 116, { align: 'center' });

  // Course name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(30, 41, 59);
  doc.text(courseName, W / 2, 132, { align: 'center' });

  // Second divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(60, 145, W - 60, 145);

  // Date and issuer row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 70, 162);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(108, 99, 255);
  doc.text('CourseCraft', W / 2, 162, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Issued by CourseCraft Learning Platform', W - 70, 162, { align: 'right' });

  doc.save(`certificate-${courseName.replace(/\s+/g, '-').toLowerCase()}.pdf`);
}

export default function MyEnrollmentsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [progressMap, setProgressMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [enrRes, progRes] = await Promise.all([
          api.get('/enrollments/'),
          api.get('/progress/'),
        ]);
        const enrList = enrRes.data.results ?? enrRes.data;
        setEnrollments(enrList);
        const map = {};
        (progRes.data).forEach((p) => { map[p.course_id] = p; });
        setProgressMap(map);
      } catch {
        setError('Failed to load enrollments. Please refresh the page.');
      }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  if (loading) return <div className="loading">Loading enrollments...</div>;
  if (error) return <div className="empty-state">{error}</div>;

  const studentName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(' ') || user.username
    : 'Student';

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Enrollments</h1>
      </div>
      {enrollments.length === 0 ? (
        <div className="empty-state">
          You haven&apos;t enrolled in any course yet.{' '}
          <Link to="/">Browse courses</Link>
        </div>
      ) : (
        <div className="course-grid">
          {enrollments.map(({ course, enrolled_at }) => {
            const prog = progressMap[course.id];
            const isComplete = prog?.progress_percentage >= 100;

            return (
              <div key={course.id} className="course-card" style={{ cursor: 'pointer' }}>
                <img
                  src={course.thumbnail || DEFAULT_THUMB}
                  alt={course.title}
                  className="course-thumbnail"
                  onClick={() => navigate(`/courses/${course.id}`)}
                  onError={(e) => { e.target.src = DEFAULT_THUMB; }}
                />
                <div
                  className="course-card-body"
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-meta" style={{ marginBottom: '0.5rem' }}>
                    📅 Enrolled: {new Date(enrolled_at).toLocaleDateString()}
                  </p>
                  {prog ? (
                    <div className="progress-mini">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${prog.progress_percentage}%` }} />
                      </div>
                      <span>
                        {prog.progress_percentage}% complete ({prog.completed_lessons}/{prog.total_lessons} lessons)
                      </span>
                    </div>
                  ) : (
                    <div className="progress-mini">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: '0%' }} />
                      </div>
                      <span>Not started</span>
                    </div>
                  )}
                </div>
                {isComplete && (
                  <div style={{ padding: '0 1rem 0.85rem' }}>
                    <button
                      className="certificate-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadCertificate(course.title, studentName);
                      }}
                    >
                      🏆 Download Certificate
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
