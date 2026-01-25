import { useState, useEffect } from 'react';
import Login from './Login';
import InquiryForm from './InquiryForm';
import AdminDashboard from './AdminDashboard';

export default function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.header}>
          <h2 style={styles.title}>Welcome, {user.username}!</h2>
          <p style={styles.info}>
            Role: <strong>{user.role}</strong>
          </p>
          <button onClick={handleLogout} style={styles.button}>
            Logout
          </button>
        </div>
        
        {user.role === 'admin' ? (
          <AdminDashboard user={user} />
        ) : (
          <InquiryForm user={user} />
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 20px',
    backgroundColor: '#f5f5f5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    backgroundColor: 'white',
    padding: '32px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '300',
    color: '#0a6ed1'
  },
  info: {
    margin: '0 0 24px 0',
    fontSize: '14px',
    color: '#666'
  },
  button: {
    padding: '10px 24px',
    fontSize: '14px',
    color: '#0a6ed1',
    backgroundColor: 'white',
    border: '1px solid #0a6ed1',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};
