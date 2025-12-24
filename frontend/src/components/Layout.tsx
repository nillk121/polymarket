import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="layout">
      <main className="layout-content">{children}</main>
      <nav className="layout-nav">
        <button
          className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          📊 Рынки
        </button>
        <button
          className={`nav-button ${
            location.pathname === '/profile' ? 'active' : ''
          }`}
          onClick={() => navigate('/profile')}
        >
          👤 Профиль
        </button>
        {user?.isAdmin && (
          <button
            className={`nav-button ${
              location.pathname === '/admin' ? 'active' : ''
            }`}
            onClick={() => navigate('/admin')}
          >
            ⚙️ Админ
          </button>
        )}
      </nav>
    </div>
  );
}

