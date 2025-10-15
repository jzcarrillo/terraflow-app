const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { TABLES } = require('../config/constants');

// GET documents by land title ID
router.get('/land-title/:landTitleId', async (req, res) => {
  try {
    const { landTitleId } = req.params;
    
    const query = `
      SELECT 
        id,
        document_type,
        file_name as original_name,
        file_size as size,
        mime_type,
        status,
        created_at
      FROM ${TABLES.DOCUMENTS} 
      WHERE land_title_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [landTitleId]);
    
    console.log(`📄 Found ${result.rows.length} documents for land title ${landTitleId}`);
    res.json(result.rows);
    
  } catch (error) {
    console.error('❌ Get documents failed:', error.message);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

module.exports = router;