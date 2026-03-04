const { z } = require('zod');

const mortgageSchema = z.object({
  land_title_id: z.number().int().positive("Land title ID is required"),
  bank_name: z.string().min(1, "Bank name is required"),
  amount: z.number().positive("Mortgage amount must be positive"),
  owner_name: z.string().min(1, "Owner name is required"),
  details: z.string().optional(),
  attachments: z.string().nullable().optional()
});

module.exports = {
  mortgageSchema
};
