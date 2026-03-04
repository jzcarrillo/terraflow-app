const { z } = require('zod');

const paymentSchema = z.object({
  land_title_id: z.union([z.string(), z.null()]).optional(),
  reference_type: z.string().min(1, "Reference type is required"),
  amount: z.number().positive("Amount must be positive"),
  payment_method: z.string().min(1, "Payment method is required"),
  description: z.string().optional(),
  payer_name: z.string().min(1, "Payer name is required").optional(),
  transfer_id: z.string().nullish(),
  mortgage_id: z.string().nullish()
}).refine(
  (data) => {
    if (data.reference_type === 'Transfer Title') {
      return data.transfer_id != null && data.transfer_id.length > 0;
    }
    if (data.reference_type === 'mortgage') {
      return data.mortgage_id != null && data.mortgage_id.length > 0;
    }
    return true;
  },
  {
    message: "Transfer ID is required for Transfer Title payments, Mortgage ID is required for mortgage payments",
    path: ["transfer_id"]
  }
);

const paymentEditSchema = z.object({
  land_title_id: z.union([z.string(), z.null()]).optional(),
  reference_type: z.string().min(1, "Reference type is required").optional(),
  amount: z.coerce.number().positive("Amount must be positive").optional(),
  payment_method: z.string().min(1, "Payment method is required").optional(),
  payer_name: z.string().min(1, "Payer name is required").optional(),
  transfer_id: z.string().nullish(),
  mortgage_id: z.string().nullish()
}).refine(
  (data) => {
    if (data.reference_type === 'Transfer Title') {
      return data.transfer_id != null && data.transfer_id.length > 0;
    }
    if (data.reference_type === 'mortgage') {
      return data.mortgage_id != null && data.mortgage_id.length > 0;
    }
    return true;
  },
  {
    message: "Transfer ID is required for Transfer Title payments, Mortgage ID is required for mortgage payments",
    path: ["transfer_id"]
  }
);

module.exports = {
  paymentSchema,
  paymentEditSchema
};