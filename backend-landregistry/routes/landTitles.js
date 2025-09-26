const express = require('express');
const landTitleService = require('../services/landTitleService');
const router = express.Router();

// GET ALL LAND TITLES
router.get('/', async (req, res) => {
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

// GET LAND TITLE BY ID
router.get('/:id', async (req, res) => {
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