
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/shared/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { PartnerRegistration, PaginatedResponse, FilterOptions } from "@/shared/types";
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
  debounce,
} from "@/shared/lib/utils";

export default function Registrations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    page: 1,
    per_page: 20,
    status: "",
    industry: "",
  });
  const [selectedRegistration, setSelectedRegistration] = useState<PartnerRegistration | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<PartnerRegistration>>({
    queryKey: ["registrations", filters, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries({ ...filters, search: searchTerm }).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return AuthService.apiRequest(`/registrations?${params.toString()}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: number; status: string; notes?: string }) =>
      AuthService.apiRequest(`/registrations/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, notes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registrations"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Thành công",
        description: "Trạng thái đã được cập nhật",
      });
      setSelectedRegistration(null);
      setRejectNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const exportMutation = useMutation({
    mutationFn: (): Promise<string> => AuthService.apiRequest("/registrations/export"),
    onSuccess: (data: string) => {
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `registrations_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Thành công",
        description: "Dữ liệu đã được xuất thành công",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Lỗi",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const debouncedSearch = debounce((value: string) => {
    setFilters({ ...filters, page: 1 });
  }, 500);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handleStatusUpdate = (status: string, notes?: string) => {
    if (selectedRegistration) {
      updateStatusMutation.mutate({
        id: selectedRegistration.id,
        status,
        notes,
      });
    }
  };

  const handleReject = () => {
    if (!rejectNotes.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập lý do từ chối",
        variant: "destructive",
      });
      return;
    }
    handleStatusUpdate("rejected", rejectNotes);
  };

  // Calculate stats from current data
  const totalRegistrations = data?.total || 0;
  const pendingCount = data?.items.filter(r => r.status === "pending").length || 0;
  const approvedCount = data?.items.filter(r => r.status === "approved").length || 0;
  const rejectedCount = data?.items.filter(r => r.status === "rejected").length || 0;
  const underReviewCount = data?.items.filter(r => r.status === "under_review").length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý đăng ký đối tác</h1>
            <p className="text-gray-600 mt-2">
              Xem xét và phê duyệt các đăng ký trở thành đối tác của ZaloPay
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportMutation.isPending ? "Đang xuất..." : "Xuất CSV"}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng đăng ký</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalRegistrations}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pendingCount}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang xem xét</p>
                <p className="text-2xl font-bold text-blue-600">
                  {underReviewCount}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Eye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">
                  {approvedCount}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">
                  {rejectedCount}
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm tên doanh nghiệp, email, người đại diện..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value, page: 1 })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="pending">Chờ duyệt</SelectItem>
                  <SelectItem value="under_review">Đang xem xét</SelectItem>
                  <SelectItem value="approved">Đã duyệt</SelectItem>
                  <SelectItem value="rejected">Từ chối</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.industry}
                onValueChange={(value) =>
                  setFilters({ ...filters, industry: value, page: 1 })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Ngành nghề" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="restaurant">Nhà hàng</SelectItem>
                  <SelectItem value="retail">Bán lẻ</SelectItem>
                  <SelectItem value="services">Dịch vụ</SelectItem>
                  <SelectItem value="entertainment">Giải trí</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="canteen">Căng tin</SelectItem>
                  <SelectItem value="parking">Bãi đỗ xe</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-lg font-medium text-gray-700">Đang tải dữ liệu...</p>
              <p className="text-sm text-gray-500">Vui lòng chờ trong giây lát</p>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">Không có dữ liệu</p>
              <p className="text-sm text-gray-500">Chưa có đăng ký nào phù hợp với bộ lọc</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Doanh nghiệp</TableHead>
                  <TableHead>Người đại diện</TableHead>
                  <TableHead>Liên hệ</TableHead>
                  <TableHead>Ngành nghề</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày đăng ký</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((registration) => (
                  <TableRow key={registration.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <Building className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {registration.business_name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {registration.business_type === "individual" ? "Cá nhân" : "Doanh nghiệp"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {registration.representative_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {registration.representative_position || "Người đại diện"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700">{registration.business_phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-700">{registration.business_email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getStatusLabel(registration.industry)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStatusColor(registration.status)}
                      >
                        {getStatusLabel(registration.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{formatDate(registration.registered_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRegistration(registration)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        {registration.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate("approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Duyệt
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setSelectedRegistration(registration)}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Từ chối
                            </Button>
                          </>
                        )}
                        {registration.status === "under_review" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleStatusUpdate("approved")}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Duyệt
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page! - 1 })}
              disabled={filters.page === 1}
            >
              Trước
            </Button>
            <span className="text-sm text-gray-600 px-4">
              Trang {filters.page} / {data.pages} (Tổng: {data.total} bản ghi)
            </span>
            <Button
              variant="outline"
              onClick={() => setFilters({ ...filters, page: filters.page! + 1 })}
              disabled={filters.page === data.pages}
            >
              Sau
            </Button>
          </div>
        </div>
      )}

      {/* Registration Detail Modal */}
      {selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiết đăng ký đối tác
                </h2>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRegistration(null);
                    setRejectNotes("");
                  }}
                >
                  Đóng
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Business Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Thông tin doanh nghiệp
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Tên doanh nghiệp</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.business_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Loại hình</label>
                      <Badge variant="outline" className="mt-1">
                        {selectedRegistration.business_type === "individual" ? "Cá nhân/Hộ kinh doanh" : "Doanh nghiệp"}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngành nghề</label>
                      <p className="text-sm text-gray-900 mt-1">{getStatusLabel(selectedRegistration.industry)}</p>
                    </div>
                    {selectedRegistration.tax_code && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mã số thuế</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedRegistration.tax_code}</p>
                      </div>
                    )}
                    {selectedRegistration.business_license && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Số giấy phép kinh doanh</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedRegistration.business_license}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Địa chỉ</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.business_address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Điện thoại</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.business_phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.business_email}</p>
                    </div>
                    {selectedRegistration.website && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Website</label>
                        <a 
                          href={selectedRegistration.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline mt-1 block"
                        >
                          {selectedRegistration.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Representative Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Người đại diện
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.representative_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.representative_phone}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.representative_email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">CMND/CCCD</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.representative_id_number}</p>
                    </div>
                    {selectedRegistration.representative_position && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Chức vụ</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedRegistration.representative_position}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Bank Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Thông tin ngân hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngân hàng</label>
                      <p className="text-sm font-semibold text-gray-900 mt-1">{selectedRegistration.bank_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Số tài khoản</label>
                      <p className="text-sm text-gray-900 mt-1 font-mono">{selectedRegistration.bank_account_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chủ tài khoản</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedRegistration.bank_account_name}</p>
                    </div>
                    {selectedRegistration.bank_branch && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Chi nhánh</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedRegistration.bank_branch}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Status Info */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-lg">Trạng thái và xem xét</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trạng thái hiện tại</label>
                        <Badge className={getStatusColor(selectedRegistration.status)}>
                          {getStatusLabel(selectedRegistration.status)}
                        </Badge>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ngày đăng ký</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRegistration.registered_at)}</p>
                      </div>
                      {selectedRegistration.reviewed_at && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Ngày xem xét</label>
                          <p className="text-sm text-gray-900">{formatDate(selectedRegistration.reviewed_at)}</p>
                        </div>
                      )}
                      {selectedRegistration.reviewer && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Người xem xét</label>
                          <p className="text-sm text-gray-900">{selectedRegistration.reviewer}</p>
                        </div>
                      )}
                    </div>
                    {selectedRegistration.notes && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-500">Ghi chú</label>
                        <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg">
                          {selectedRegistration.notes}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Files */}
                {selectedRegistration.uploaded_files && selectedRegistration.uploaded_files.length > 0 && (
                  <Card className="lg:col-span-3">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Tài liệu đính kèm ({selectedRegistration.uploaded_files.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {selectedRegistration.uploaded_files.map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                  {file.original_filename}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {(file.file_size / 1024 / 1024).toFixed(2)} MB • {formatDate(file.uploaded_at)}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(`/api/files/${file.id}/download`, '_blank');
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex justify-end gap-4">
                {selectedRegistration.status === "pending" && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate("under_review")}
                      disabled={updateStatusMutation.isPending}
                      variant="outline"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Đang xem xét
                    </Button>
                    <Button
                      onClick={() => handleStatusUpdate("approved")}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Phê duyệt đăng ký
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập lý do từ chối..."
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                    </div>
                  </>
                )}
                {selectedRegistration.status === "under_review" && (
                  <>
                    <Button
                      onClick={() => handleStatusUpdate("approved")}
                      disabled={updateStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Phê duyệt đăng ký
                    </Button>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nhập lý do từ chối..."
                        value={rejectNotes}
                        onChange={(e) => setRejectNotes(e.target.value)}
                        className="w-64"
                      />
                      <Button
                        onClick={handleReject}
                        disabled={updateStatusMutation.isPending}
                        variant="destructive"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Từ chối
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
