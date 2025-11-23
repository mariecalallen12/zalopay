const express = require('express');
const router = express.Router();
const logger = require('../../../../utils/logger');

const SAMPLE_TRANSACTIONS = [
  {
    id: 'txn-1001',
    partner_id: 'partner-001',
    transaction_type: 'payment',
    amount: 1250000,
    currency: 'VND',
    status: 'completed',
    reference_id: 'INV-001-2025',
    description: 'Thanh toán dịch vụ ZaloPay tháng 10',
    created_at: '2025-10-05T08:32:10.000Z',
    updated_at: '2025-10-05T08:32:10.000Z'
  },
  {
    id: 'txn-1002',
    partner_id: 'partner-002',
    transaction_type: 'refund',
    amount: -350000,
    currency: 'VND',
    status: 'completed',
    reference_id: 'RF-002-2025',
    description: 'Hoàn tiền giao dịch thất bại',
    created_at: '2025-10-07T09:20:45.000Z',
    updated_at: '2025-10-07T09:45:10.000Z'
  },
  {
    id: 'txn-1003',
    partner_id: 'partner-003',
    transaction_type: 'withdrawal',
    amount: -2400000,
    currency: 'VND',
    status: 'pending',
    reference_id: 'WD-003-2025',
    description: 'Rút tiền về tài khoản ngân hàng đối tác',
    created_at: '2025-10-09T03:12:00.000Z',
    updated_at: '2025-10-09T03:12:00.000Z'
  },
  {
    id: 'txn-1004',
    partner_id: 'partner-004',
    transaction_type: 'payment',
    amount: 890000,
    currency: 'VND',
    status: 'completed',
    reference_id: 'INV-004-2025',
    description: 'Thanh toán dịch vụ định kỳ',
    created_at: '2025-10-10T14:05:00.000Z',
    updated_at: '2025-10-10T14:05:00.000Z'
  },
  {
    id: 'txn-1005',
    partner_id: 'partner-001',
    transaction_type: 'payment',
    amount: 1520000,
    currency: 'VND',
    status: 'failed',
    reference_id: 'INV-005-2025',
    description: 'Giao dịch không thành công do OTP sai',
    created_at: '2025-10-11T10:42:00.000Z',
    updated_at: '2025-10-11T10:45:30.000Z'
  }
];

function filterTransactions(transactions, query) {
  return transactions.filter((txn) => {
    if (query.status && txn.status !== query.status) {
      return false;
    }
    if (query.type && txn.transaction_type !== query.type) {
      return false;
    }
    if (query.partner_id && txn.partner_id !== query.partner_id) {
      return false;
    }
    if (query.search) {
      const keyword = query.search.toLowerCase();
      const matched = [
        txn.reference_id,
        txn.description,
        txn.partner_id
      ].some((value) => value && value.toLowerCase().includes(keyword));
      if (!matched) {
        return false;
      }
    }
    if (query.date_from || query.date_to) {
      const date = new Date(txn.created_at).getTime();
      if (query.date_from) {
        const from = new Date(query.date_from).getTime();
        if (date < from) {
          return false;
        }
      }
      if (query.date_to) {
        const to = new Date(query.date_to + 'T23:59:59Z').getTime();
        if (date > to) {
          return false;
        }
      }
    }
    return true;
  });
}

function buildStats(transactions) {
  const totalAmount = transactions.reduce((sum, txn) => sum + txn.amount, 0);
  const pending = transactions.filter((txn) => txn.status === 'pending').length;
  const completed = transactions.filter((txn) => txn.status === 'completed').length;
  return {
    total_count: transactions.length,
    total_amount: totalAmount,
    pending_count: pending,
    completed_count: completed
  };
}

router.get('/', (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const skip = (page - 1) * limit;

    const filtered = filterTransactions(SAMPLE_TRANSACTIONS, req.query);
    const paginated = filtered.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      items: paginated,
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit) || 1
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({
      error: 'Failed to fetch transactions',
      message: error.message
    });
  }
});

router.get('/stats', (req, res) => {
  try {
    const filtered = filterTransactions(SAMPLE_TRANSACTIONS, req.query);
    res.status(200).json({
      success: true,
      data: buildStats(filtered)
    });
  } catch (error) {
    logger.error('Error fetching transaction stats:', error);
    res.status(500).json({
      error: 'Failed to fetch transaction stats',
      message: error.message
    });
  }
});

router.get('/export', (req, res) => {
  try {
    const filtered = filterTransactions(SAMPLE_TRANSACTIONS, req.query);
    const header = 'transaction_id,partner_id,type,status,amount,currency,reference_id,description,created_at\n';
    const rows = filtered.map((txn) => [
      txn.id,
      txn.partner_id,
      txn.transaction_type,
      txn.status,
      txn.amount,
      txn.currency,
      txn.reference_id,
      JSON.stringify(txn.description),
      txn.created_at
    ].join(','));

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
    res.status(200).send(header + rows.join('\n'));
  } catch (error) {
    logger.error('Error exporting transactions:', error);
    res.status(500).json({
      error: 'Failed to export transactions',
      message: error.message
    });
  }
});

router.get('/:id', (req, res) => {
  const txn = SAMPLE_TRANSACTIONS.find((t) => t.id === req.params.id);
  if (!txn) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  res.status(200).json({
    success: true,
    data: txn
  });
});

module.exports = router;
