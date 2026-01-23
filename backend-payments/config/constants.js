module.exports = {
  TABLES: {
    PAYMENTS: 'payments'
  },
  QUEUES: {
    PAYMENTS: 'queue_payments',
    LAND_REGISTRY: 'queue_landregistry',
    TRANSFERS: 'queue_transfers'
  },
  STATUS: {
    PENDING: 'PENDING',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    FAILED: 'FAILED'
  },
  PAYMENT_METHODS: {
    CREDIT_CARD: 'CREDIT_CARD',
    DEBIT_CARD: 'DEBIT_CARD',
    BANK_TRANSFER: 'BANK_TRANSFER',
    GCASH: 'GCASH',
    PAYMAYA: 'PAYMAYA'
  }
};