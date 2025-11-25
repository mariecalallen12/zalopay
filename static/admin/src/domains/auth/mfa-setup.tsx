import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Badge } from '../../shared/components/ui/badge';
import { MFAInput } from '../../shared/components/auth/mfa-input';
import { AuthService } from '../../shared/lib/auth';
import { useToast } from '../../shared/hooks/use-toast';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Download,
  RefreshCw,
  QrCode
} from 'lucide-react';
import { copyToClipboard } from '../../shared/lib/utils';

interface MFASetupData {
  secret: string;
  qr_code_url: string;
  backup_codes: string[];
}

export default function MFASetup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkMFAStatus();
  }, []);

  const checkMFAStatus = async () => {
    try {
      const response = await AuthService.apiRequest('/admin/auth/mfa/status') as { enabled: boolean };
      setMfaEnabled(response.enabled);
    } catch (err) {
      console.error('Failed to check MFA status:', err);
    }
  };

  const handleSetupMFA = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.apiRequest('/admin/auth/mfa/setup', {
        method: 'POST',
      }) as MFASetupData;

      setSetupData(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thiết lập MFA');
      toast({
        title: 'Lỗi',
        description: 'Không thể thiết lập MFA. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMFA = async () => {
    if (verificationCode.length !== 6) {
      setError('Mã xác thực phải có 6 chữ số');
      return;
    }

    setVerifying(true);
    setError(null);

    try {
      const response = await AuthService.apiRequest('/admin/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({
          code: verificationCode,
          secret: setupData?.secret,
        }),
      }) as { success: boolean };

      if (response.success) {
        setMfaEnabled(true);
        setSetupData(null);
        setVerificationCode('');
        toast({
          title: 'Thành công',
          description: 'MFA đã được kích hoạt thành công.',
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mã xác thực không hợp lệ');
      toast({
        title: 'Lỗi',
        description: 'Mã xác thực không hợp lệ. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleDisableMFA = async () => {
    if (!confirm('Bạn có chắc chắn muốn tắt MFA? Điều này sẽ làm giảm bảo mật tài khoản.')) {
      return;
    }

    setLoading(true);

    try {
      await AuthService.apiRequest('/admin/auth/mfa/disable', {
        method: 'POST',
      });

      setMfaEnabled(false);
      toast({
        title: 'Thành công',
        description: 'MFA đã được tắt.',
      });
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tắt MFA. Vui lòng thử lại.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopySecret = async () => {
    if (setupData?.secret) {
      await copyToClipboard(setupData.secret);
      toast({
        title: 'Đã sao chép',
        description: 'Mã bí mật đã được sao chép vào clipboard.',
      });
    }
  };

  const handleCopyBackupCode = async (code: string) => {
    await copyToClipboard(code);
    toast({
      title: 'Đã sao chép',
      description: 'Mã dự phòng đã được sao chép.',
    });
  };

  const handleDownloadBackupCodes = () => {
    if (!setupData?.backup_codes) return;

    const content = `Mã dự phòng MFA - ZaloPay Admin\n\n` +
      `Ngày tạo: ${new Date().toLocaleString('vi-VN')}\n\n` +
      `Lưu ý: Mỗi mã chỉ sử dụng được một lần.\n\n` +
      setupData.backup_codes.map((code, index) => `${index + 1}. ${code}`).join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mfa-backup-codes-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: 'Đã tải xuống',
      description: 'Mã dự phòng đã được tải xuống.',
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xác thực hai yếu tố (MFA)</h1>
        <p className="text-gray-600 mt-2">
          Bảo vệ tài khoản của bạn với lớp bảo mật bổ sung
        </p>
      </div>

      {/* MFA Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Trạng thái MFA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {mfaEnabled ? 'MFA đã được kích hoạt' : 'MFA chưa được kích hoạt'}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {mfaEnabled
                  ? 'Tài khoản của bạn đang được bảo vệ bằng xác thực hai yếu tố'
                  : 'Kích hoạt MFA để tăng cường bảo mật cho tài khoản'}
              </p>
            </div>
            <Badge
              variant={mfaEnabled ? 'default' : 'secondary'}
              className={mfaEnabled ? 'bg-green-100 text-green-800' : ''}
            >
              {mfaEnabled ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Đã kích hoạt
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-1" />
                  Chưa kích hoạt
                </>
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* MFA Setup */}
      {!mfaEnabled && !setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Thiết lập MFA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">Hướng dẫn thiết lập:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Tải ứng dụng xác thực (Google Authenticator, Microsoft Authenticator, hoặc Authy)</li>
                <li>Quét mã QR hoặc nhập mã bí mật</li>
                <li>Nhập mã xác thực 6 chữ số để xác nhận</li>
                <li>Lưu mã dự phòng ở nơi an toàn</li>
              </ol>
            </div>

            <Button
              onClick={handleSetupMFA}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang thiết lập...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Bắt đầu thiết lập MFA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Setup Process */}
      {setupData && !mfaEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Hoàn tất thiết lập MFA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* QR Code */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quét mã QR:</label>
              <div className="flex justify-center p-4 bg-white border border-gray-200 rounded-lg">
                {setupData.qr_code_url ? (
                  <img
                    src={setupData.qr_code_url}
                    alt="MFA QR Code"
                    className="w-48 h-48"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-gray-400">
                    <QrCode className="h-16 w-16" />
                  </div>
                )}
              </div>
            </div>

            {/* Secret Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Hoặc nhập mã bí mật thủ công:</label>
              <div className="flex gap-2">
                <Input
                  value={setupData.secret}
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopySecret}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Verification */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Nhập mã xác thực 6 chữ số để xác nhận:
              </label>
              <MFAInput
                value={verificationCode}
                onChange={setVerificationCode}
                disabled={verifying}
                error={error || undefined}
                onComplete={handleVerifyMFA}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              onClick={handleVerifyMFA}
              disabled={verifying || verificationCode.length !== 6}
              className="w-full"
            >
              {verifying ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang xác thực...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Xác nhận và kích hoạt MFA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Backup Codes */}
      {setupData?.backup_codes && setupData.backup_codes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mã dự phòng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Lưu ý quan trọng:</strong> Lưu các mã này ở nơi an toàn. Mỗi mã chỉ sử dụng được một lần.
                Nếu bạn mất quyền truy cập vào ứng dụng xác thực, bạn có thể sử dụng các mã này để đăng nhập.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {setupData.backup_codes.map((code, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="font-mono text-sm">{code}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopyBackupCode(code)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={handleDownloadBackupCodes}
              className="w-full"
            >
              <Download className="h-4 w-4 mr-2" />
              Tải xuống mã dự phòng
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Disable MFA */}
      {mfaEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Quản lý MFA</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={handleDisableMFA}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Tắt MFA
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
