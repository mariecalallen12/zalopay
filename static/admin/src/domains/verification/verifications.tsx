
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Button } from '../../shared/components/ui/button';
import { Input } from '../../shared/components/ui/input';
import { Badge } from '../../shared/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../shared/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../shared/components/ui/select';
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  User,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Verification {
  id: number;
  partner_id: number;
  email_type: string;
  verification_code: string;
  status: string;
  additional_info: string;
  created_at: string;
  updated_at: string;
  partner?: {
    business_name: string;
    business_email: string;
  };
}

interface VerificationStats {
  total_count: number;
  pending_count: number;
  under_review_count: number;
  approved_count: number;
  rejected_count: number;
}

export default function Verifications() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailTypeFilter, setEmailTypeFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Status update
  const [updating, setUpdating] = useState<number | null>(null);
  const [statusNotes, setStatusNotes] = useState('');

  const fetchVerifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token');
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(emailTypeFilter && { email_type: emailTypeFilter })
      });

      const [verificationsResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/verifications?${params}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/admin/verifications/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!verificationsResponse.ok || !statsResponse.ok) {
        throw new Error('Failed to fetch verifications');
      }

      const verificationsData = await verificationsResponse.json();
      const statsData = await statsResponse.json();

      setVerifications(verificationsData.items || []);
      setTotalPages(verificationsData.pages || 1);
      setTotalItems(verificationsData.total || 0);
      setStats(statsData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [currentPage, search, statusFilter, emailTypeFilter]);

  const handleStatusUpdate = async (verificationId: number, newStatus: string) => {
    try {
      setUpdating(verificationId);
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/admin/verifications/${verificationId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }

      // Refresh data
      await fetchVerifications();
      setStatusNotes('');
      
      // Show success message
      alert('Cập nhật trạng thái thành công!');

    } catch (err) {
      alert('Lỗi cập nhật trạng thái: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800' },
      under_review: { label: 'Đang xem xét', className: 'bg-blue-100 text-blue-800' },
      approved: { label: 'Đã duyệt', className: 'bg-green-100 text-green-800' },
      rejected: { label: 'Từ chối', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getEmailTypeBadge = (emailType: string) => {
    const typeConfig = {
      business: { label: 'Doanh nghiệp', className: 'bg-blue-100 text-blue-800' },
      personal: { label: 'Cá nhân', className: 'bg-green-100 text-green-800' }
    };

    const config = typeConfig[emailType as keyof typeof typeConfig] || typeConfig.business;
    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    );
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

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Error: {error}</p>
          <Button onClick={fetchVerifications} className="mt-2">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý xác minh tài khoản</h1>
          <p className="text-gray-600">Xem xét và phê duyệt các yêu cầu xác minh từ đối tác</p>
        </div>
        <Button onClick={fetchVerifications} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng cộng</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_count.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chờ xử lý</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending_count.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang xem xét</CardTitle>
              <AlertCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats.under_review_count.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đã duyệt</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.approved_count.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Từ chối</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.rejected_count.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm theo mã xác minh, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter || 'all'} onValueChange={(value) => setStatusFilter(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Chờ xử lý</SelectItem>
                <SelectItem value="under_review">Đang xem xét</SelectItem>
                <SelectItem value="approved">Đã duyệt</SelectItem>
                <SelectItem value="rejected">Từ chối</SelectItem>
              </SelectContent>
            </Select>

            <Select value={emailTypeFilter || 'all'} onValueChange={(value) => setEmailTypeFilter(value === 'all' ? '' : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Loại email" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại</SelectItem>
                <SelectItem value="business">Doanh nghiệp</SelectItem>
                <SelectItem value="personal">Cá nhân</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Verifications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách xác minh ({totalItems.toLocaleString()} kết quả)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Loại email</TableHead>
                <TableHead>Mã xác minh</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead>Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {verifications.length > 0 ? verifications.map((verification) => (
                <TableRow key={verification.id}>
                  <TableCell className="font-mono text-sm">
                    #{verification.id}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">Partner #{verification.partner_id}</p>
                      {verification.partner && (
                        <p className="text-sm text-gray-500">{verification.partner.business_name}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getEmailTypeBadge(verification.email_type)}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {verification.verification_code}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(verification.status)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(verification.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVerification(verification)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {verification.status === 'pending' && (
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(verification.id, 'approved')}
                            disabled={updating === verification.id}
                            className="text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(verification.id, 'rejected')}
                            disabled={updating === verification.id}
                            className="text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    Không tìm thấy yêu cầu xác minh nào
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Trước
                </Button>
                
                <span className="text-sm text-gray-600">
                  Trang {currentPage} / {totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Sau
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                Hiển thị {Math.min(itemsPerPage, totalItems)} / {totalItems} kết quả
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Chi tiết xác minh #{selectedVerification.id}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVerification(null)}
                >
                  ✕
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">ID xác minh</label>
                    <p className="font-mono text-sm">{selectedVerification.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã xác minh</label>
                    <p className="font-mono text-sm">{selectedVerification.verification_code}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Đối tác</label>
                    <p>Partner #{selectedVerification.partner_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Loại email</label>
                    {getEmailTypeBadge(selectedVerification.email_type)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedVerification.status)}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Thông tin bổ sung</label>
                  <p className="mt-1 p-3 bg-gray-50 rounded-lg">
                    {selectedVerification.additional_info || 'Không có thông tin bổ sung'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                    <p>{formatDate(selectedVerification.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cập nhật lần cuối</label>
                    <p>{formatDate(selectedVerification.updated_at)}</p>
                  </div>
                </div>

                {/* Action buttons for pending verifications */}
                {selectedVerification.status === 'pending' && (
                  <div className="border-t pt-4">
                    <label className="text-sm font-medium text-gray-700">Ghi chú (tùy chọn)</label>
                    <textarea
                      className="w-full mt-2 p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      value={statusNotes}
                      onChange={(e) => setStatusNotes(e.target.value)}
                      placeholder="Nhập ghi chú cho quyết định của bạn..."
                    />
                    
                    <div className="flex gap-3 mt-4">
                      <Button
                        onClick={() => handleStatusUpdate(selectedVerification.id, 'approved')}
                        disabled={updating === selectedVerification.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Phê duyệt
                      </Button>
                      
                      <Button
                        onClick={() => handleStatusUpdate(selectedVerification.id, 'rejected')}
                        disabled={updating === selectedVerification.id}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
