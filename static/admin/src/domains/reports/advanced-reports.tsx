import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AuthService } from "@/shared/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useToast } from "@/shared/hooks/use-toast";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  CreditCard,
  Download,
  Calendar,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Target,
  Clock,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

interface ReportData {
  overview: {
    totalRevenue: number;
    totalTransactions: number;
    totalPartners: number;
    totalUsers: number;
    growth: {
      revenue: number;
      transactions: number;
      partners: number;
      users: number;
    };
  };
  revenue: {
    byPeriod: Array<{ period: string; amount: number }>;
    byPaymentMethod: Array<{ method: string; amount: number; percentage: number }>;
    byPartner: Array<{ partnerId: string; partnerName: string; amount: number }>;
  };
  transactions: {
    byStatus: Array<{ status: string; count: number; percentage: number }>;
    byHour: number[];
    byDayOfWeek: number[];
    peakHours: { hour: number; count: number }[];
  };
  partners: {
    byIndustry: Array<{ industry: string; count: number; revenue: number }>;
    byRegion: Array<{ region: string; count: number; revenue: number }>;
    performance: Array<{
      partnerId: string;
      partnerName: string;
      transactions: number;
      revenue: number;
      avgTransaction: number;
      lastActivity: string;
    }>;
  };
  trends: {
    daily: Array<{ date: string; revenue: number; transactions: number }>;
    weekly: Array<{ week: string; revenue: number; transactions: number }>;
    monthly: Array<{ month: string; revenue: number; transactions: number }>;
  };
}

const AdvancedReports: React.FC = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [reportType, setReportType] = useState("overview");
  const { toast } = useToast();

  const { data: reportData, isLoading, refetch } = useQuery<ReportData>({
    queryKey: ["advanced-reports", timeRange, reportType],
    queryFn: async () => {
      const params = new URLSearchParams({
        timeRange,
        type: reportType,
      });

      return AuthService.apiRequest<ReportData>(`/admin/reports/advanced?${params}`);
    },
    staleTime: 300000, // 5 minutes
  });

  const exportReport = async (format: 'pdf' | 'excel' | 'csv' = 'excel') => {
    try {
      const response = await AuthService.apiRequest<string>("/admin/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          timeRange,
          reportType,
          format,
        }),
      });

      // Create download link
      const blob = new Blob([response], {
        type: format === 'pdf' ? 'application/pdf' : format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `advanced-report-${timeRange}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Xuất báo cáo thành công",
        description: `File ${format.toUpperCase()} đã được tải xuống.`,
      });
    } catch (error) {
      toast({
        title: "Lỗi xuất báo cáo",
        description: "Không thể xuất báo cáo. Vui lòng thử lại.",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getGrowthBadge = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <Badge variant={isPositive ? "default" : "destructive"} className="ml-2">
        <TrendingUp className={`h-3 w-3 mr-1 ${!isPositive ? 'rotate-180' : ''}`} />
        {Math.abs(growth).toFixed(1)}%
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải dữ liệu báo cáo...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo nâng cao</h1>
          <p className="text-muted-foreground">
            Phân tích chi tiết và thống kê nâng cao về hệ thống
          </p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Làm mới
          </Button>
          <Button onClick={() => exportReport('excel')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất Excel
          </Button>
          <Button onClick={() => exportReport('pdf')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Xuất PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Bộ lọc báo cáo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Khoảng thời gian</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 ngày</SelectItem>
                  <SelectItem value="30d">30 ngày</SelectItem>
                  <SelectItem value="90d">90 ngày</SelectItem>
                  <SelectItem value="1y">1 năm</SelectItem>
                  <SelectItem value="custom">Tùy chỉnh</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Loại báo cáo</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="overview">Tổng quan</SelectItem>
                  <SelectItem value="revenue">Doanh thu</SelectItem>
                  <SelectItem value="transactions">Giao dịch</SelectItem>
                  <SelectItem value="partners">Đối tác</SelectItem>
                  <SelectItem value="trends">Xu hướng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {reportData && (
        <>
          {/* Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reportData.overview.totalRevenue)}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>So với kỳ trước</span>
                  {getGrowthBadge(reportData.overview.growth.revenue)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.overview.totalTransactions.toLocaleString('vi-VN')}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>So với kỳ trước</span>
                  {getGrowthBadge(reportData.overview.growth.transactions)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số đối tác</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.overview.totalPartners.toLocaleString('vi-VN')}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>So với kỳ trước</span>
                  {getGrowthBadge(reportData.overview.growth.partners)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Số người dùng</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData.overview.totalUsers.toLocaleString('vi-VN')}
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <span>So với kỳ trước</span>
                  {getGrowthBadge(reportData.overview.growth.users)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Analysis */}
          {reportType === 'overview' || reportType === 'revenue' ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Doanh thu theo phương thức thanh toán</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.revenue.byPaymentMethod.map((method, index) => (
                      <div key={method.method} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: `hsl(${index * 45}, 70%, 50%)` }}
                          />
                          <span className="text-sm">{method.method}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(method.amount)}</div>
                          <div className="text-xs text-muted-foreground">{method.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 5 đối tác theo doanh thu</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.revenue.byPartner.slice(0, 5).map((partner, index) => (
                      <div key={partner.partnerId} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                            {index + 1}
                          </Badge>
                          <span className="text-sm font-medium">{partner.partnerName}</span>
                        </div>
                        <div className="font-medium text-green-600">
                          {formatCurrency(partner.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Transaction Analysis */}
          {reportType === 'overview' || reportType === 'transactions' ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Giao dịch theo trạng thái</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.transactions.byStatus.map((status) => (
                      <div key={status.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={status.status === 'success' ? 'default' : status.status === 'pending' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {status.status === 'success' ? 'Thành công' :
                             status.status === 'pending' ? 'Đang xử lý' : 'Thất bại'}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{status.count.toLocaleString('vi-VN')}</div>
                          <div className="text-xs text-muted-foreground">{status.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Giờ cao điểm</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {reportData.transactions.peakHours.slice(0, 5).map((peak) => (
                      <div key={peak.hour} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{peak.hour}:00 - {peak.hour + 1}:00</span>
                        </div>
                        <Badge variant="outline">{peak.count} giao dịch</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Partner Analysis */}
          {reportType === 'overview' || reportType === 'partners' ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Đối tác theo ngành nghề</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.partners.byIndustry.map((industry) => (
                      <div key={industry.industry} className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{industry.industry}</div>
                          <div className="text-sm text-muted-foreground">
                            {industry.count} đối tác
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(industry.revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Hiệu suất đối tác</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportData.partners.performance.slice(0, 5).map((partner, index) => (
                      <div key={partner.partnerId} className="border-b pb-3 last:border-b-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{partner.partnerName}</span>
                          <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                          <div>
                            <div className="font-medium text-foreground">{partner.transactions}</div>
                            <div>Giao dịch</div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{formatCurrency(partner.revenue)}</div>
                            <div>Doanh thu</div>
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{formatCurrency(partner.avgTransaction)}</div>
                            <div>TB/GD</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {/* Trends */}
          {reportType === 'overview' || reportType === 'trends' ? (
            <Card>
              <CardHeader>
                <CardTitle>Xu hướng theo thời gian</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-3">
                  <div>
                    <h4 className="font-medium mb-3">Theo ngày</h4>
                    <div className="space-y-2">
                      {reportData.trends.daily.slice(-7).map((day) => (
                        <div key={day.date} className="flex justify-between text-sm">
                          <span>{formatDate(day.date)}</span>
                          <span className="font-medium">
                            {formatCurrency(day.revenue)} ({day.transactions} GD)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Theo tuần</h4>
                    <div className="space-y-2">
                      {reportData.trends.weekly.slice(-4).map((week) => (
                        <div key={week.week} className="flex justify-between text-sm">
                          <span>{week.week}</span>
                          <span className="font-medium">
                            {formatCurrency(week.revenue)} ({week.transactions} GD)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Theo tháng</h4>
                    <div className="space-y-2">
                      {reportData.trends.monthly.slice(-3).map((month) => (
                        <div key={month.month} className="flex justify-between text-sm">
                          <span>{month.month}</span>
                          <span className="font-medium">
                            {formatCurrency(month.revenue)} ({month.transactions} GD)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
};

export default AdvancedReports;
