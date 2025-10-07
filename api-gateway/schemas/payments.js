const { z } = require('zod');

const paymentSchema = z.object({
  payment_id: z.string().min(1, "Payment ID is required"),
  reference_type: z.enum(['LAND_TITLE', 'DOCUMENT', 'SERVICE'], {
    errorMap: () => ({ message: "Reference type must be LAND_TITLE, DOCUMENT, or SERVICE" })
  }),
  reference_id: z.string().min(1, "Reference ID is required"),
  amount: z.number().positive("Amount must be positive"),
  payer_name: z.string().min(1, "Payer name is required"),
  payment_method: z.enum(['CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'BANK_TRANSFER', 'GCASH', 'PAYMAYA'], {
    errorMap: () => ({ message: "Invalid payment method" })
  }).default('CASH')
});

module.exports = {
  paymentSchema
};