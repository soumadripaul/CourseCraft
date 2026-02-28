import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🎓 CourseCraft</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Courses</Link>
        {user ? (
          <>
            {user.role === 'instructor' && (
              <Link to="/instructor/courses">My Courses</Link>
            )}
            {user.role === 'student' && (
              <Link to="/my-enrollments">My Enrollments</Link>
            )}
            <Link to="/profile" className="navbar-user">
              👤 {user.first_name || user.username} <em>({user.role})</em>
            </Link>
            <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn btn-primary">Register</Link>
          </>
        )}
        <button
          className="theme-toggle"
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
    </nav>
  );
}
