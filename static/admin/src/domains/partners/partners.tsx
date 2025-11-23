import { useState, ChangeEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Activity,
} from "lucide-react";
import {
  formatDate,
  getStatusColor,
  getStatusLabel,
  debounce,
} from "@/shared/lib/utils";
import { PaginatedResponse } from "@/shared/types";

interface Partner {
  id: string;
  businessName: string;
  representativeName: string;
  email: string;
  phone: string;
  businessType: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  registrationDate: string;
  lastActivity: string;
  totalRevenue: number;
  totalTransactions: number;
  bankAccount: {
    bankName: string;
    accountNumber: string;
  };
  address: string;
}

interface FilterOptions {
  status?: string;
  businessType?: string;
  industry?: string;
  search?: string;
}

interface PartnerStats {
  totalPartners?: number;
  newThisMonth?: number;
  activePartners?: number;
  activePercentage?: number;
  totalRevenue?: number;
  revenueGrowth?: number;
  totalTransactions?: number;
  avgTransactionsPerPartner?: number;
}

const Partners: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [businessTypeFilter, setBusinessTypeFilter] = useState<string>("all");
  const [industryFilter, setIndustryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch partners
  const { data: partnersResponse, isLoading, refetch } = useQuery<PaginatedResponse<Partner>>({
    queryKey: ["partners", currentPage, pageSize, statusFilter, businessTypeFilter, industryFilter, searchTerm],
    queryFn: async () => {
      const filters: FilterOptions = {};
      if (statusFilter !== "all") filters.status = statusFilter;
      if (businessTypeFilter !== "all") filters.businessType = businessTypeFilter;
      if (industryFilter !== "all") filters.industry = industryFilter;
      if (searchTerm) filters.search = searchTerm;

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...Object.fromEntries(
          Object.entries(filters).map(([key, value]) => [key, value?.toString() || ""])
        ),
      });

      return AuthService.apiRequest<PaginatedResponse<Partner>>(`/admin/partners?${params}`);
    },
    staleTime: 30000,
  });

  // Fetch partner stats
  const { data: stats } = useQuery<PartnerStats>({
    queryKey: ["partner-stats"],
    queryFn: async () => {
      return AuthService.apiRequest<PartnerStats>("/admin/partners/stats");
    },
    staleTime: 60000,
  });

  // Debounced search
  const debouncedSearch = debounce((value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  }, 500);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case "status":
        setStatusFilter(value);
        break;
      case "businessType":
        setBusinessTypeFilter(value);
        break;
      case "industry":
        setIndustryFilter(value);
        break;
    }
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const exportPartners = async () => {
    try {
      const response = await AuthService.apiRequest<string>("/admin/partners/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filters: {
            status: statusFilter !== "all" ? statusFilter : undefined,
            businessType: businessTypeFilter !== "all" ? businessTypeFilter : undefined,
            industry: industryFilter !== "all" ? industryFilter : undefined,
            search: searchTerm || undefined,
          },
        }),
      });

      // Create download link
      const blob = new Blob([response], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `partners-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Xuất dữ liệu thành công",
        description: "File CSV đã được tải xuống.",
      });
    } catch (error) {
      toast({
        title: "Lỗi xuất dữ liệu",
        description: "Không thể xuất dữ liệu. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const getPartnerStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPartnerStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Không hoạt động";
      case "suspended":
        return "Tạm ngừng";
      default:
        return "Không xác định";
    }
  };

  const getBusinessTypeLabel = (type: string) => {
    switch (type) {
      case "individual":
        return "Cá nhân";
      case "household":
        return "Hộ kinh doanh";
      case "company":
        return "Công ty";
      case "enterprise":
        return "Doanh nghiệp";
      default:
        return type;
    }
  };

  const getIndustryLabel = (industry: string) => {
    switch (industry) {
      case "food":
        return "Ăn uống";
      case "retail":
        return "Bán lẻ";
      case "service":
        return "Dịch vụ";
      case "technology":
        return "Công nghệ";
      case "other":
        return "Khác";
      default:
        return industry;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý đối tác</h1>
          <p className="text-muted-foreground">
            Quản lý và giám sát các đối tác đã đăng ký
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng đối tác</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPartners || 0}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +{stats.newThisMonth || 0} tháng này
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activePartners || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePercentage || 0}% của tổng số
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₫{(stats.totalRevenue || 0).toLocaleString('vi-VN')}
              </div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 mr-1" />
                +{stats.revenueGrowth || 0}% so với tháng trước
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(stats.totalTransactions || 0).toLocaleString('vi-VN')}</div>
              <p className="text-xs text-muted-foreground">
                Trung bình {(stats.avgTransactionsPerPartner || 0).toFixed(0)}/đối tác
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc và tìm kiếm
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email..."
                className="pl-9"
                onChange={handleSearchChange}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: string) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Không hoạt động</SelectItem>
                <SelectItem value="suspended">Tạm ngừng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={businessTypeFilter} onValueChange={(value: string) => handleFilterChange("businessType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Loại hình" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả loại hình</SelectItem>
                <SelectItem value="individual">Cá nhân</SelectItem>
                <SelectItem value="household">Hộ kinh doanh</SelectItem>
                <SelectItem value="company">Công ty</SelectItem>
                <SelectItem value="enterprise">Doanh nghiệp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={(value: string) => handleFilterChange("industry", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Ngành nghề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả ngành nghề</SelectItem>
                <SelectItem value="food">Ăn uống</SelectItem>
                <SelectItem value="retail">Bán lẻ</SelectItem>
                <SelectItem value="service">Dịch vụ</SelectItem>
                <SelectItem value="technology">Công nghệ</SelectItem>
                <SelectItem value="other">Khác</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportPartners} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Xuất dữ liệu
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partners Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách đối tác</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Đang tải...</span>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Doanh nghiệp</TableHead>
                    <TableHead>Liên hệ</TableHead>
                    <TableHead>Loại hình</TableHead>
                    <TableHead>Ngành nghề</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Doanh thu</TableHead>
                    <TableHead>Hoạt động cuối</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partnersResponse?.items?.map((partner: Partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{partner.businessName}</div>
                          <div className="text-sm text-muted-foreground">
                            <Building className="inline h-3 w-3 mr-1" />
                            {partner.id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            {partner.representativeName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {partner.email}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {partner.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getBusinessTypeLabel(partner.businessType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getIndustryLabel(partner.industry)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPartnerStatusColor(partner.status)}>
                          {getPartnerStatusLabel(partner.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            ₫{partner.totalRevenue.toLocaleString('vi-VN')}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {partner.totalTransactions} GD
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {formatDate(partner.lastActivity)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.location.href = `/partners/${partner.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {partnersResponse && partnersResponse.total > pageSize && (
                <div className="flex items-center justify-between px-2 py-4">
                  <div className="flex-1 text-sm text-muted-foreground">
                    Hiển thị {((currentPage - 1) * pageSize) + 1} đến {Math.min(currentPage * pageSize, partnersResponse.total)} trong tổng số {partnersResponse.total} đối tác
                  </div>
                  <div className="flex items-center space-x-6 lg:space-x-8">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">Hiển thị</p>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={(value: string) => handlePageSizeChange(Number(value))}
                      >
                        <SelectTrigger className="h-8 w-[70px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent side="top">
                          {[10, 20, 30, 40, 50].map((size) => (
                            <SelectItem key={size} value={size.toString()}>
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Trang {currentPage} / {Math.ceil(partnersResponse.total / pageSize)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Trước
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === Math.ceil(partnersResponse.total / pageSize)}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Partners;
