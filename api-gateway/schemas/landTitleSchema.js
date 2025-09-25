const Joi = require('joi');

const landTitleSchema = Joi.object({
  owner_name: Joi.string().required().messages({
    'string.empty': 'Owner name is required',
    'any.required': 'Owner name is required'
  }),
  contact_no: Joi.string().optional().pattern(/^[0-9+\-\s()]+$/).messages({
    'string.pattern.base': 'Contact number must contain only numbers, spaces, and valid phone characters'
  }),
  title_number: Joi.string().required().messages({
    'string.empty': 'Title number is required',
    'any.required': 'Title number is required'
  }),
  address: Joi.string().required().messages({
    'string.empty': 'Address is required',
    'any.required': 'Address is required'
  }),
  property_location: Joi.string().optional(),
  lot_number: Joi.number().integer().positive().optional().messages({
    'number.base': 'Lot number must be a number',
    'number.integer': 'Lot number must be an integer',
    'number.positive': 'Lot number must be positive'
  }),
  survey_number: Joi.string().optional(),
  area_size: Joi.number().positive().optional().messages({
    'number.base': 'Area size must be a number',
    'number.positive': 'Area size must be positive'
  }),
  classification: Joi.string().valid('Residential', 'Commercial', 'Industrial', 'Agricultural').optional().messages({
    'any.only': 'Classification must be one of: Residential, Commercial, Industrial, Agricultural'
  }),
  registration_date: Joi.date().optional().messages({
    'date.base': 'Registration date must be a valid date'
  }),
  registrar_office: Joi.string().optional(),
  previous_title_number: Joi.string().optional(),
  encumbrances: Joi.string().optional()
});

module.exports = {
  landTitleSchema
};