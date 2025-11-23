// GET /api/merchant/banks - Return Vietnamese banks list
const express = require('express');
const router = express.Router();

// Vietnamese banks list
const VIETNAMESE_BANKS = [
  { code: 'VCB', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam (Vietcombank)', shortName: 'Vietcombank' },
  { code: 'BID', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam (BIDV)', shortName: 'BIDV' },
  { code: 'TCB', name: 'Ngân hàng TMCP Kỹ thương Việt Nam (Techcombank)', shortName: 'Techcombank' },
  { code: 'CTG', name: 'Ngân hàng TMCP Công thương Việt Nam (VietinBank)', shortName: 'VietinBank' },
  { code: 'ACB', name: 'Ngân hàng TMCP Á Châu (ACB)', shortName: 'ACB' },
  { code: 'VPB', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng (VPBank)', shortName: 'VPBank' },
  { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong (TPBank)', shortName: 'TPBank' },
  { code: 'MSB', name: 'Ngân hàng TMCP Hàng Hải (MSB)', shortName: 'MSB' },
  { code: 'HDB', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh (HDBank)', shortName: 'HDBank' },
  { code: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam (VIB)', shortName: 'VIB' },
  { code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội (SHB)', shortName: 'SHB' },
  { code: 'STB', name: 'Ngân hàng TMCP Sài Gòn Thương Tín (Sacombank)', shortName: 'Sacombank' },
  { code: 'EIB', name: 'Ngân hàng TMCP Xuất Nhập khẩu Việt Nam (Eximbank)', shortName: 'Eximbank' },
  { code: 'OCB', name: 'Ngân hàng TMCP Phương Đông (OCB)', shortName: 'OCB' },
  { code: 'MBB', name: 'Ngân hàng TMCP Quân đội (MB Bank)', shortName: 'MB Bank' },
  { code: 'VAB', name: 'Ngân hàng TMCP Việt Á (VietABank)', shortName: 'VietABank' },
  { code: 'NAB', name: 'Ngân hàng TMCP Nam Á (NamABank)', shortName: 'NamABank' },
  { code: 'BAB', name: 'Ngân hàng TMCP Bắc Á (BacABank)', shortName: 'BacABank' },
  { code: 'PGB', name: 'Ngân hàng TMCP Xăng dầu Petrolimex (PGBank)', shortName: 'PGBank' },
  { code: 'GPB', name: 'Ngân hàng TMCP Dầu Khí Toàn Cầu (GPBank)', shortName: 'GPBank' },
  { code: 'VCCB', name: 'Ngân hàng TMCP Bản Việt (VietCapitalBank)', shortName: 'VietCapitalBank' },
  { code: 'SCB', name: 'Ngân hàng TMCP Sài Gòn (SCB)', shortName: 'SCB' },
  { code: 'DAB', name: 'Ngân hàng TMCP Đông Á (DongABank)', shortName: 'DongABank' },
  { code: 'SEAB', name: 'Ngân hàng TMCP Đông Nam Á (SeABank)', shortName: 'SeABank' },
  { code: 'ABB', name: 'Ngân hàng TMCP An Bình (ABBank)', shortName: 'ABBank' },
  { code: 'VAF', name: 'Ngân hàng Liên doanh Việt - Nga (VRB)', shortName: 'VRB' },
  { code: 'PUB', name: 'Ngân hàng TMCP Đại Chúng Việt Nam (PublicBank)', shortName: 'PublicBank' },
  { code: 'NCB', name: 'Ngân hàng TMCP Quốc Dân (NCB)', shortName: 'NCB' },
  { code: 'KLB', name: 'Ngân hàng TMCP Kiên Long (KienLongBank)', shortName: 'KienLongBank' },
  { code: 'LPB', name: 'Ngân hàng TMCP Lào - Việt (LVB)', shortName: 'LVB' },
  { code: 'VDB', name: 'Ngân hàng Phát triển Việt Nam (VDB)', shortName: 'VDB' },
  { code: 'AGB', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam (Agribank)', shortName: 'Agribank' },
  { code: 'BVB', name: 'Ngân hàng TMCP Bảo Việt (BaoVietBank)', shortName: 'BaoVietBank' }
];

router.get('/', async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      banks: VIETNAMESE_BANKS,
      total: VIETNAMESE_BANKS.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch banks list',
      message: error.message
    });
  }
});

module.exports = router;

