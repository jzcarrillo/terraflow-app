const { z } = require('zod');

const landTitleSchema = z.object({
  owner_name: z.string().min(1, "Owner name is required"),
  contact_no: z.string().regex(/^[0-9]{11}$/, "Contact number must be exactly 11 digits"),
  title_number: z.string().min(1, "Title number is required"),
  address: z.string().min(1, "Address is required"),
  property_location: z.string().min(1, "Property location is required"),
  lot_number: z.number().int().positive("Lot number must be positive"),
  survey_number: z.string().min(1, "Survey number is required"),
  area_size: z.number().positive("Area size must be positive"),
  classification: z.enum(['Residential', 'Commercial', 'Industrial', 'Agricultural'], {
    errorMap: () => ({ message: "Classification must be Residential, Commercial, Industrial, or Agricultural" })
  }),
  registration_date: z.string().datetime("Registration date must be a valid ISO datetime"),
  registrar_office: z.string().min(1, "Registrar office is required"),
  previous_title_number: z.string().min(1, "Previous title number is required"),
  encumbrances: z.string().min(1, "Encumbrances field is required")
});

module.exports = {
  landTitleSchema
};