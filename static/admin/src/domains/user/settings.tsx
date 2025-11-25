import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Badge } from '../../shared/components/ui/badge';
import { 
  User, 
  Shield, 
  Bell, 
  Key, 
  Activity,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { AuthService } from '../../shared/lib/auth';

interface UserProfile {
  id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

export default function Settings() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setEmail(currentUser.email || '');
      }
    } catch (err) {
      setError('Không thể tải thông tin người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await AuthService.apiRequest("/admin/auth/update-profile", {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      }) as Response;

      if (!response.ok) {
        throw new Error('Cập nhật thông tin thất bại');
      }

      setSuccessMessage('Cập nhật thông tin thành công');
      await fetchUserProfile();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi cập nhật thông tin';
      setError(message);
      if (typeof message === 'string' && (message.includes('HTTP 404') || message.includes('HTTP 405') || message.includes('HTTP 501'))) {
        setUnavailable(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await AuthService.apiRequest("/admin/auth/change-password", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      }) as Response;

      if (!response.ok) {
        throw new Error('Đổi mật khẩu thất bại');
      }

      setSuccessMessage('Đổi mật khẩu thành công');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi đổi mật khẩu';
      setError(message);
      if (typeof message === 'string' && (message.includes('HTTP 404') || message.includes('HTTP 405') || message.includes('HTTP 501'))) {
        setUnavailable(true);
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {unavailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">Một số chức năng chưa khả dụng</p>
          <p className="text-yellow-700 text-sm mt-1">Backend hiện chưa cung cấp endpoints /admin/auth/update-profile hoặc /admin/auth/change-password. Các nút lưu đã được vô hiệu hoá.</p>
        </div>
      )}
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt tài khoản</h1>
        <p className="text-gray-600">Quản lý thông tin tài khoản và cài đặt bảo mật</p>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-600">{successMessage}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Thông tin tài khoản
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đăng nhập
                </label>
                <Input
                  value={user?.username || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tên đăng nhập không thể thay đổi
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@zalopay.vn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quyền hạn
                </label>
                <Badge variant={user?.is_superuser ? "default" : "secondary"}>
                  {user?.is_superuser ? "Super Admin" : "Admin"}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ngày tạo tài khoản
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {user?.created_at ? formatDate(user.created_at) : "Chưa có thông tin"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đăng nhập lần cuối
                </label>
                <p className="text-sm font-medium text-gray-900">
                  {user?.last_login ? formatDate(user.last_login) : "Chưa có thông tin"}
                </p>
              </div>

              <Button type="submit" disabled={saving || unavailable} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Đổi mật khẩu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu hiện tại
                </label>
                <div className="relative">
                  <Input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu hiện tại"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mật khẩu mới
                </label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Xác nhận mật khẩu mới
                </label>
                <Input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  required
                  minLength={6}
                />
              </div>

              <div className="text-xs text-gray-500">
                <p>• Mật khẩu phải có ít nhất 6 ký tự</p>
                <p>• Nên sử dụng kết hợp chữ cái, số và ký tự đặc biệt</p>
              </div>

              <Button type="submit" disabled={saving || unavailable} className="w-full">
                <Key className="h-4 w-4 mr-2" />
                {saving ? 'Đang cập nhật...' : 'Đổi mật khẩu'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Additional Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Cài đặt thông báo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Thông báo email
                </p>
                <p className="text-xs text-gray-500">
                  Nhận thông báo qua email khi có hoạt động mới
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEmailNotifications(!emailNotifications)}
                className={emailNotifications ? 'bg-green-50 text-green-700' : ''}
              >
                {emailNotifications ? 'Bật' : 'Tắt'}
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Thông báo trình duyệt
                </p>
                <p className="text-xs text-gray-500">
                  Hiển thị thông báo trên trình duyệt
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBrowserNotifications(!browserNotifications)}
                className={browserNotifications ? 'bg-green-50 text-green-700' : ''}
              >
                {browserNotifications ? 'Bật' : 'Tắt'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Bảo mật
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Xác thực hai yếu tố
                </p>
                <p className="text-xs text-gray-500">
                  Bảo vệ tài khoản với lớp bảo mật bổ sung
                </p>
              </div>
              <Badge variant="outline">Sắp có</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Phiên đăng nhập
                </p>
                <p className="text-xs text-gray-500">
                  Quản lý các phiên đăng nhập hoạt động
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                <Activity className="h-4 w-4 mr-1" />
                Xem
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Mã hóa dữ liệu
                </p>
                <p className="text-xs text-gray-500">
                  Dữ liệu được mã hóa khi lưu trữ
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Đã bật
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
