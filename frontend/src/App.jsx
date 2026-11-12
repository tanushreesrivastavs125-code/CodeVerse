import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';

import { HomeView } from './views/HomeView.jsx';
import { LoginView } from './views/LoginView.jsx';
import { SignupView } from './views/SignupView.jsx';
import { PlayView } from './views/PlayView.jsx';
import { PlaygroundView } from './views/PlaygroundView.jsx';
import { DashboardView } from './views/DashboardView.jsx';
import { ProfileView } from './views/ProfileView.jsx';
import { NotFoundView } from './views/NotFoundView.jsx';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          <Navbar />

          <main style={{ flex: 1 }}>
            <Routes>
              <Route path="/" element={<HomeView />} />
              <Route path="/login" element={<LoginView />} />
              <Route path="/signup" element={<SignupView />} />
              <Route path="/play" element={<PlayView />} />

              {/* Protected Routes */}
              <Route
                path="/playground"
                element={(
                  <ProtectedRoute>
                    <PlaygroundView />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/dashboard"
                element={(
                  <ProtectedRoute>
                    <DashboardView />
                  </ProtectedRoute>
                )}
              />
              <Route
                path="/profile"
                element={(
                  <ProtectedRoute>
                    <ProfileView />
                  </ProtectedRoute>
                )}
              />

              {/* 404 Fallback */}
              <Route path="*" element={<NotFoundView />} />
            </Routes>
          </main>

          <footer style={{
            borderTop: '1px solid var(--border-subtle)',
            padding: '1.5rem',
            textAlign: 'center',
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
              <span>CodeVerse Platform • Stage 3 Campaign Operations & Browser Shell</span>
              <span>Autonomous Drone Flight Programming Simulation</span>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
