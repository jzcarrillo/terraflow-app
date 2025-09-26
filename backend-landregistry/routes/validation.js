const express = require('express');
const landTitleService = require('../services/landTitleService');
const router = express.Router();

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

module.exports = router;