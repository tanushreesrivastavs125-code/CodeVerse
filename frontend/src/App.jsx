import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { Navbar } from './components/Navbar.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { CodeFlow } from './components/common/CodeFlow.jsx';

import { HomeView } from './views/HomeView.jsx';

// Code-split route boundaries to keep initial bundle light and defer heavy Blockly/game engines
const LoginView = lazy(() => import('./views/LoginView.jsx').then((m) => ({ default: m.LoginView })));
const SignupView = lazy(() => import('./views/SignupView.jsx').then((m) => ({ default: m.SignupView })));
const PlayView = lazy(() => import('./views/PlayView.jsx').then((m) => ({ default: m.PlayView })));
const PlaygroundView = lazy(() => import('./views/PlaygroundView.jsx').then((m) => ({ default: m.PlaygroundView })));
const DashboardView = lazy(() => import('./views/DashboardView.jsx').then((m) => ({ default: m.DashboardView })));
const LeaderboardView = lazy(() => import('./views/LeaderboardView.jsx').then((m) => ({ default: m.LeaderboardView })));
const ProfileView = lazy(() => import('./views/ProfileView.jsx').then((m) => ({ default: m.ProfileView })));
const MentorView = lazy(() => import('./views/MentorView.jsx').then((m) => ({ default: m.MentorView })));
const GuildView = lazy(() => import('./views/GuildView.jsx').then((m) => ({ default: m.GuildView })));
const NotFoundView = lazy(() => import('./views/NotFoundView.jsx').then((m) => ({ default: m.NotFoundView })));

function RouteLoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1.5rem',
        color: 'var(--accent-cyan)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.85rem',
        letterSpacing: '0.08em',
        gap: '0.75rem'
      }}
    >
      <div style={{ fontSize: '1.75rem', animation: 'spin 2s linear infinite' }}>⚡</div>
      <span>SYNCHRONIZING MODULE TELEMETRY...</span>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            position: 'relative'
          }}>
            <CodeFlow />
            <Navbar />

            <main style={{ flex: 1 }}>
            <Suspense fallback={<RouteLoadingFallback />}>
              <Routes>
                <Route path="/" element={<HomeView />} />
                <Route path="/login" element={<LoginView />} />
                <Route path="/signup" element={<SignupView />} />
                <Route path="/play" element={<PlayView />} />
                <Route path="/leaderboard" element={<LeaderboardView />} />

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
                <Route
                  path="/mentor"
                  element={(
                    <ProtectedRoute>
                      <MentorView />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/guild"
                  element={(
                    <ProtectedRoute>
                      <GuildView />
                    </ProtectedRoute>
                  )}
                />
                <Route
                  path="/guilds"
                  element={(
                    <ProtectedRoute>
                      <GuildView />
                    </ProtectedRoute>
                  )}
                />

                {/* 404 Fallback */}
                <Route path="*" element={<NotFoundView />} />
              </Routes>
            </Suspense>
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
              <span>CodeVerse Platform • Autonomous Drone Navigation & Campaign Engine</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>6 Districts • 24 Sectors • Deterministic Grid Simulation</span>
            </div>
          </footer>
        </div>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
