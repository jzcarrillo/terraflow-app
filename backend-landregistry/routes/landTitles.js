const express = require('express');
const landTitleService = require('../services/landtitles');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// GET ALL LAND TITLES
router.get('/', authenticateToken, async (req, res) => {
  try {
    console.log('🔍 Fetching all land titles from database');
    const landTitles = await landTitleService.getAllLandTitles();
    
    console.log(`✅ Retrieved ${landTitles.length} land titles`);
    res.json({
      success: true,
      count: landTitles.length,
      data: landTitles
    });
    
  } catch (error) {
    console.error('❌ Get all land titles failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve land titles' });
  }
});

// VALIDATE TITLE NUMBER
router.get('/validate/:titleNumber', async (req, res) => {
  try {
    const { titleNumber } = req.params;
    console.log(`🔍 Checking title number: ${titleNumber}`);
    
    const exists = await landTitleService.checkTitleExists(titleNumber);
    console.log(`✅ Backend: Title ${titleNumber} exists: ${exists}`);
    
    res.json({
      exists: exists,
      title_number: titleNumber,
      message: exists ? 'Title number already exists' : 'Title number available'
    });
    
  } catch (error) {
    console.error('Title validation error:', error.message);
    res.status(500).json({ error: 'Database validation failed' });
  }
});

// GET LAND TITLE BY ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`🔍 Fetching land title ID: ${id}`);
    
    const landTitle = await landTitleService.getLandTitleById(id);
    
    if (!landTitle) {
      console.log(`❌ Land title not found: ${id}`);
      return res.status(404).json({ error: 'Land title not found' });
    }
    
    console.log(`✅ Retrieved land title: ${landTitle.title_number}`);
    res.json({
      success: true,
      data: landTitle
    });
    
  } catch (error) {
    console.error('❌ Get land title failed:', error.message);
    res.status(500).json({ error: 'Failed to retrieve land title' });
  }
});

module.exports = router;