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
  FileText,
  Search,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Filter,
  Eye,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Info,
} from "lucide-react";
import { AuditLog, PaginatedResponse, FilterOptions } from "@/shared/types";
import {
  formatDate,
  formatRelativeTime,
  debounce,
} from "@/shared/lib/utils";
import { useWebSocket } from "@/shared/hooks/use-websocket";

interface ActivityAnalytics {
  total_activities?: number;
  active_users?: number;
  today_activities?: number;
  top_action?: string;
}

export default function ActivityLogs() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions & {
    action?: string;
    resource_type?: string;
    user_id?: number;
    date_from?: string;
    date_to?: string;
  }>({
    page: 1,
    per_page: 50,
  });
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Real-time updates via WebSocket
  useWebSocket({
    type: 'activity',
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'activity:new') {
        queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
        toast({
          title: "New Activity",
          description: message.data.actionType || "New activity logged",
        });
      }
    },
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ["activity-logs", filters, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries({ ...filters, search: searchTerm }).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return AuthService.apiRequest<PaginatedResponse<AuditLog>>(`/api/admin/activity-logs?${params.toString()}`);
    },
  });

  const { data: analytics } = useQuery<ActivityAnalytics | null>({
    queryKey: ["activity-analytics", filters.date_from, filters.date_to],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.date_from) params.append('date_from', filters.date_from);
      if (filters.date_to) params.append('date_to', filters.date_to);
      return AuthService.apiRequest<ActivityAnalytics>(`/api/admin/activity-logs/analytics?${params.toString()}`);
    },
    staleTime: 60_000,
  });

  const exportMutation = useMutation<string, Error>({
    mutationFn: () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return AuthService.apiRequest<string>(`/api/admin/activity-logs/export?${params.toString()}`);
    },
    onSuccess: (csvContent) => {
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `activity_logs_${new Date().toISOString().split("T")[0]}.csv`;
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

  const getActionIcon = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    } else if (action.includes('delete') || action.includes('remove')) {
      return <XCircle className="h-4 w-4 text-red-600" />;
    } else if (action.includes('update') || action.includes('edit')) {
      return <Info className="h-4 w-4 text-blue-600" />;
    } else if (action.includes('login') || action.includes('auth')) {
      return <User className="h-4 w-4 text-purple-600" />;
    }
    return <Activity className="h-4 w-4 text-gray-600" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create') || action.includes('add')) {
      return 'bg-green-100 text-green-800';
    } else if (action.includes('delete') || action.includes('remove')) {
      return 'bg-red-100 text-red-800';
    } else if (action.includes('update') || action.includes('edit')) {
      return 'bg-blue-100 text-blue-800';
    } else if (action.includes('login') || action.includes('auth')) {
      return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
            <p className="text-gray-600 mt-2">
              Xem lịch sử hoạt động của hệ thống
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

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tổng hoạt động</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.total_activities || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Người dùng hoạt động</p>
                  <p className="text-2xl font-bold text-green-600">
                    {analytics.active_users || 0}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg">
                  <User className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Hoạt động hôm nay</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {analytics.today_activities || 0}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Action</p>
                  <p className="text-lg font-bold text-gray-900">
                    {analytics.top_action || '-'}
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <FileText className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.action || ""}
              onValueChange={(value) =>
                setFilters({ ...filters, action: value || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.resource_type || ""}
              onValueChange={(value) =>
                setFilters({ ...filters, resource_type: value || undefined, page: 1 })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Resource Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tất cả</SelectItem>
                <SelectItem value="victim">Victim</SelectItem>
                <SelectItem value="campaign">Campaign</SelectItem>
                <SelectItem value="oauth_token">OAuth Token</SelectItem>
                <SelectItem value="gmail_extraction">Gmail Extraction</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Input
                type="date"
                value={filters.date_from || ""}
                onChange={(e) => setFilters({ ...filters, date_from: e.target.value || undefined, page: 1 })}
                placeholder="Từ ngày"
                className="flex-1"
              />
              <Input
                type="date"
                value={filters.date_to || ""}
                onChange={(e) => setFilters({ ...filters, date_to: e.target.value || undefined, page: 1 })}
                placeholder="Đến ngày"
                className="flex-1"
              />
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
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">Không có dữ liệu</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Người dùng</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Chi tiết</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((log) => (
                  <TableRow key={log.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{formatRelativeTime(log.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {log.user?.username || `User #${log.user_id}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <Badge className={getActionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">{log.resource_type}</span>
                        {log.resource_id && (
                          <span className="text-xs text-gray-400">#{log.resource_id}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {log.details || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-mono text-gray-600">
                        {log.ip_address || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Xem
                      </Button>
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

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Chi tiết Activity Log</h2>
              <Button
                variant="outline"
                onClick={() => setSelectedLog(null)}
              >
                Đóng
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Thời gian</label>
                <p className="text-sm text-gray-900 mt-1">{formatDate(selectedLog.created_at)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Người dùng</label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedLog.user?.username || `User #${selectedLog.user_id}`}
                  {selectedLog.user?.email && (
                    <span className="text-gray-600"> ({selectedLog.user.email})</span>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Action</label>
                <div className="flex items-center gap-2 mt-1">
                  {getActionIcon(selectedLog.action)}
                  <Badge className={getActionColor(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Resource Type</label>
                <p className="text-sm text-gray-900 mt-1">{selectedLog.resource_type}</p>
              </div>
              {selectedLog.resource_id && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Resource ID</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedLog.resource_id}</p>
                </div>
              )}
              {selectedLog.details && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Chi tiết</label>
                  <pre className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg overflow-auto">
                    {typeof selectedLog.details === 'string' 
                      ? selectedLog.details 
                      : JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.ip_address && (
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-sm font-mono text-gray-900 mt-1">{selectedLog.ip_address}</p>
                </div>
              )}
              {selectedLog.user_agent && (
                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-sm text-gray-900 mt-1 break-all">{selectedLog.user_agent}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

