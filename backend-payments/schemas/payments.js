const { z } = require('zod');

const paymentSchema = z.object({
  land_title_id: z.string().min(1, "Land title ID is required"),
  amount: z.number().positive("Amount must be positive"),
  payment_method: z.string().min(1, "Payment method is required"),
  description: z.string().optional(),
  payer_name: z.string().min(1, "Payer name is required").optional()
});

const paymentEditSchema = z.object({
  land_title_id: z.coerce.number().int().positive("Land title ID must be a positive integer").optional(),
  amount: z.coerce.number().positive("Amount must be positive").optional(),
  payment_method: z.string().min(1, "Payment method is required").optional(),
  payer_name: z.string().min(1, "Payer name is required").optional()
});

module.exports = {
  paymentSchema,
  paymentEditSchema
};