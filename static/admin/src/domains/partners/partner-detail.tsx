import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { AuthService } from "@/shared/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useToast } from "@/shared/hooks/use-toast";
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  DollarSign,
  Activity,
  FileText,
  RefreshCw,
  Ban,
  CheckCircle,
} from "lucide-react";
import { formatDate } from "@/shared/lib/utils";

interface PartnerDetail extends Partner {
  registrationDate: string;
  verificationStatus: string;
  documents: Document[];
  bankAccount: BankAccount;
  businessLicense: BusinessLicense;
  recentTransactions: Transaction[];
  stats: PartnerStats;
}

interface Partner {
  id: string;
  businessName: string;
  representativeName: string;
  email: string;
  phone: string;
  businessType: string;
  industry: string;
  status: 'active' | 'inactive' | 'suspended';
  address: string;
}

interface Document {
  id: string;
  type: string;
  name: string;
  url: string;
  uploadedAt: string;
  status: string;
}

interface BankAccount {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  verified: boolean;
}

interface BusinessLicense {
  number: string;
  issuedDate: string;
  expiryDate: string;
  issuedBy: string;
}

interface Transaction {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  description: string;
}

interface PartnerStats {
  totalRevenue: number;
  totalTransactions: number;
  avgTransactionValue: number;
  last30DaysRevenue: number;
  last30DaysTransactions: number;
}

const PartnerDetail: React.FC = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [unavailable, setUnavailable] = useState(false);

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      return AuthService.apiRequest<PartnerDetail>(`/admin/partners/${id}`);
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (isError) {
      setUnavailable(true);
    }
  }, [isError]);

  const partner = data as PartnerDetail | undefined;

  const suspendPartner = async () => {
    if (unavailable) return;
    if (!confirm("Bạn có chắc chắn muốn tạm ngừng đối tác này?")) return;

    try {
      await AuthService.apiRequest(`/admin/partners/${id}/suspend`, {
        method: "POST",
      });

      toast({
        title: "Thành công",
        description: "Đã tạm ngừng đối tác.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạm ngừng đối tác.",
        variant: "destructive",
      });
    }
  };

  const activatePartner = async () => {
    if (unavailable) return;
    try {
      await AuthService.apiRequest(`/admin/partners/${id}/activate`, {
        method: "POST",
      });

      toast({
        title: "Thành công",
        description: "Đã kích hoạt đối tác.",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Không thể kích hoạt đối tác.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      case "verified":
        return "bg-blue-100 text-blue-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "inactive":
        return "Không hoạt động";
      case "suspended":
        return "Tạm ngừng";
      case "verified":
        return "Đã xác minh";
      case "pending":
        return "Đang chờ";
      default:
        return status;
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải...</span>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-8">
        <p>Không tìm thấy thông tin đối tác.</p>
        <Button onClick={() => navigate("/partners")} className="mt-4">
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {unavailable && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 font-medium">Tính năng chưa khả dụng</p>
          <p className="text-yellow-700 text-sm mt-1">Backend chưa cung cấp endpoints /admin/partners/* cho chi tiết hoặc thao tác. Các nút hành động đã được vô hiệu hoá.</p>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/partners")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{partner.businessName}</h1>
            <p className="text-muted-foreground">ID: {partner.id}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {partner.status === "active" ? (
            <Button variant="destructive" size="sm" onClick={suspendPartner} disabled={unavailable}>
              <Ban className="h-4 w-4 mr-2" />
              Tạm ngừng
            </Button>
          ) : (
            <Button variant="default" size="sm" onClick={activatePartner} disabled={unavailable}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Kích hoạt
            </Button>
          )}
        </div>
      </div>

      {/* Status and Quick Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className={getStatusColor(partner.status)}>
              {getStatusLabel(partner.status)}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₫{partner.stats.totalRevenue.toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng giao dịch</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{partner.stats.totalTransactions.toLocaleString('vi-VN')}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Giá trị TB</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₫{partner.stats.avgTransactionValue.toLocaleString('vi-VN')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Partner Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin doanh nghiệp</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Tên doanh nghiệp</label>
                <p className="font-medium">{partner.businessName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Người đại diện</label>
                <p className="font-medium">{partner.representativeName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Loại hình</label>
                <p>{getBusinessTypeLabel(partner.businessType)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ngành nghề</label>
                <p>{getIndustryLabel(partner.industry)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Địa chỉ</label>
              <p className="flex items-start">
                <MapPin className="h-4 w-4 mr-2 mt-0.5 text-muted-foreground" />
                {partner.address}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngày đăng ký</label>
              <p className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                {formatDate(partner.registrationDate)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin liên hệ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="flex items-center">
                <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                {partner.email}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Số điện thoại</label>
              <p className="flex items-center">
                <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                {partner.phone}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Trạng thái xác minh</label>
              <div className="mt-1">
                <Badge className={getStatusColor(partner.verificationStatus)}>
                  {getStatusLabel(partner.verificationStatus)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bank Account */}
        <Card>
          <CardHeader>
            <CardTitle>Tài khoản ngân hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Ngân hàng</label>
              <p className="font-medium">{partner.bankAccount.bankName}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Số tài khoản</label>
              <p className="font-mono">{partner.bankAccount.accountNumber}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Chủ tài khoản</label>
              <p>{partner.bankAccount.accountHolder}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Chi nhánh</label>
              <p>{partner.bankAccount.branch}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Trạng thái</label>
              <div className="mt-1">
                <Badge className={getStatusColor(partner.bankAccount.verified ? "verified" : "pending")}>
                  {partner.bankAccount.verified ? "Đã xác minh" : "Chờ xác minh"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business License */}
        <Card>
          <CardHeader>
            <CardTitle>Giấy phép kinh doanh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Số giấy phép</label>
              <p className="font-mono">{partner.businessLicense.number}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ngày cấp</label>
                <p>{formatDate(partner.businessLicense.issuedDate)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Ngày hết hạn</label>
                <p>{formatDate(partner.businessLicense.expiryDate)}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Nơi cấp</label>
              <p>{partner.businessLicense.issuedBy}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Documents */}
      <Card>
        <CardHeader>
          <CardTitle>Tài liệu đã tải lên</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên tài liệu</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Ngày tải lên</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partner.documents.map((doc) => (
                <TableRow key={doc.id}>
                  <TableCell>{doc.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doc.type}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(doc.uploadedAt)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(doc.status)}>
                      {getStatusLabel(doc.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" asChild>
                      <a href={doc.url} target="_blank" rel="noopener noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        Xem
                      </a>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Giao dịch gần đây</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partner.recentTransactions.slice(0, 10).map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell className="font-mono text-sm">{transaction.id}</TableCell>
                  <TableCell className="font-medium">
                    ₫{transaction.amount.toLocaleString('vi-VN')}
                  </TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(transaction.status)}>
                      {getStatusLabel(transaction.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PartnerDetail;
