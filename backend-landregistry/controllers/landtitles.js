const landTitleService = require('../services/landtitles');
const { checkTitleExists } = require('../utils/validation');
const { handleError } = require('../utils/errorHandler');

const getAllLandTitles = async (req, res) => {
  try {
    const landTitles = await landTitleService.getAllLandTitles();
    
    res.json({
      success: true,
      count: landTitles.length,
      data: landTitles
    });
  } catch (error) {
    handleError(error, res, 'Get all land titles');
  }
};

const validateLandTitleExists = async (req, res) => {
  try {
    const { land_title_id } = req.query;
    
    if (!land_title_id) {
      return res.status(400).json({ error: 'Land title ID is required' });
    }
    
    const exists = await checkTitleExists(land_title_id);
    res.json({ exists });
  } catch (error) {
    handleError(error, res, 'Validate land title exists');
  }
};

const validateTitleNumber = async (req, res) => {
  try {
    const { titleNumber } = req.params;
    console.log(`🔍 === VALIDATE TITLE NUMBER: ${titleNumber} `);
    
    const exists = await checkTitleExists(titleNumber);
    console.log(`✅ Title validation result: ${exists ? 'EXISTS' : 'AVAILABLE'}`);
    
    res.json({
      exists: exists,
      title_number: titleNumber,
      message: exists ? 'Title number already exists' : 'Title number available'
    });
  } catch (error) {
    console.error(`❌ Title validation failed for ${titleNumber}:`, error.message);
    handleError(error, res, 'Title validation');
  }
};

const getLandTitleById = async (req, res) => {
  try {
    const { id } = req.params;
    const landTitle = await landTitleService.getLandTitleById(id);
    
    if (!landTitle) {
      return res.status(404).json({ error: 'Land title not found' });
    }
    res.json({
      success: true,
      data: landTitle
    });
  } catch (error) {
    handleError(error, res, 'Get land title');
  }
};

module.exports = {
  getAllLandTitles,
  validateLandTitleExists,
  validateTitleNumber,
  getLandTitleById
};