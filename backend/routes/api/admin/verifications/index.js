const express = require('express');
const router = express.Router();
const logger = require('../../../../utils/logger');

let verifications = [
  {
    id: 101,
    partner_id: 1,
    email_type: 'business',
    verification_code: 'VRF-2025-001',
    status: 'pending',
    additional_info: 'Yêu cầu xác minh email doanh nghiệp',
    created_at: '2025-10-06T07:20:00.000Z',
    updated_at: '2025-10-06T07:20:00.000Z',
    partner: {
      business_name: 'Công ty TNHH ZP Solutions',
      business_email: 'contact@zpsolutions.vn'
    }
  },
  {
    id: 102,
    partner_id: 2,
    email_type: 'personal',
    verification_code: 'VRF-2025-002',
    status: 'under_review',
    additional_info: 'Đang xác minh tài liệu bổ sung',
    created_at: '2025-10-07T09:45:00.000Z',
    updated_at: '2025-10-08T03:15:00.000Z',
    partner: {
      business_name: 'Hộ kinh doanh Trà Sữa 68',
      business_email: 'owner@trasua68.vn'
    }
  },
  {
    id: 103,
    partner_id: 3,
    email_type: 'business',
    verification_code: 'VRF-2025-003',
    status: 'approved',
    additional_info: 'Đã xác minh thành công',
    created_at: '2025-10-05T04:30:00.000Z',
    updated_at: '2025-10-05T11:42:00.000Z',
    partner: {
      business_name: 'Doanh nghiệp TMDV Sao Mai',
      business_email: 'support@saomai.vn'
    }
  },
  {
    id: 104,
    partner_id: 4,
    email_type: 'business',
    verification_code: 'VRF-2025-004',
    status: 'rejected',
    additional_info: 'Email không thuộc miền doanh nghiệp đã đăng ký',
    created_at: '2025-10-04T02:15:00.000Z',
    updated_at: '2025-10-04T09:00:00.000Z',
    partner: {
      business_name: 'Công ty Cổ phần Công nghệ Bắc Nam',
      business_email: 'hello@bacnamtech.vn'
    }
  }
];

function filterVerifications(data, query) {
  return data.filter((verification) => {
    if (query.status && verification.status !== query.status) {
      return false;
    }
    if (query.email_type && verification.email_type !== query.email_type) {
      return false;
    }
    if (query.search) {
      const keyword = query.search.toLowerCase();
      const matched = [
        verification.verification_code,
        verification.partner?.business_name,
        verification.partner?.business_email,
        verification.additional_info
      ].some((value) => value && value.toLowerCase().includes(keyword));
      if (!matched) {
        return false;
      }
    }
    return true;
  });
}

function buildVerificationStats(data) {
  return {
    total_count: data.length,
    pending_count: data.filter((item) => item.status === 'pending').length,
    under_review_count: data.filter((item) => item.status === 'under_review').length,
    approved_count: data.filter((item) => item.status === 'approved').length,
    rejected_count: data.filter((item) => item.status === 'rejected').length
  };
}

router.get('/', (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filtered = filterVerifications(verifications, req.query);
    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      items: paginated,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit) || 1
    });
  } catch (error) {
    logger.error('Error fetching verifications:', error);
    res.status(500).json({
      error: 'Failed to fetch verifications',
      message: error.message
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const filtered = filterVerifications(verifications, req.query);
    res.status(200).json(buildVerificationStats(filtered));
  } catch (error) {
    logger.error('Error fetching verification stats:', error);
    res.status(500).json({
      error: 'Failed to fetch verification stats',
      message: error.message
    });
  }
});

router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const verification = verifications.find((item) => item.id === id);

  if (!verification) {
    return res.status(404).json({ error: 'Verification not found' });
  }

  res.status(200).json({
    success: true,
    data: verification
  });
});

router.put('/:id/status', (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, notes } = req.body || {};

    if (!['pending', 'under_review', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const index = verifications.findIndex((item) => item.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Verification not found' });
    }

    verifications[index] = {
      ...verifications[index],
      status,
      additional_info: notes || verifications[index].additional_info,
      updated_at: new Date().toISOString()
    };

    res.status(200).json({
      success: true,
      data: verifications[index]
    });
  } catch (error) {
    logger.error('Error updating verification status:', error);
    res.status(500).json({
      error: 'Failed to update verification status',
      message: error.message
    });
  }
});

module.exports = router;
