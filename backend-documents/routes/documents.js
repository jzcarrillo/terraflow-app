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

// DOWNLOAD document file
router.get('/download/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const query = `
      SELECT file_name, file_path, mime_type, file_size
      FROM ${TABLES.DOCUMENTS} 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [documentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    const fs = require('fs');
    
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
    res.setHeader('Content-Length', document.file_size);
    
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ Download failed:', error.message);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// VIEW document file (inline)
router.get('/view/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    
    const query = `
      SELECT file_name, file_path, mime_type, file_size
      FROM ${TABLES.DOCUMENTS} 
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [documentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const document = result.rows[0];
    const fs = require('fs');
    
    if (!fs.existsSync(document.file_path)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }
    
    res.setHeader('Content-Type', document.mime_type);
    res.setHeader('Content-Disposition', `inline; filename="${document.file_name}"`);
    res.setHeader('Content-Length', document.file_size);
    
    const fileStream = fs.createReadStream(document.file_path);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('❌ View failed:', error.message);
    res.status(500).json({ error: 'Failed to view document' });
  }
});

module.exports = router;