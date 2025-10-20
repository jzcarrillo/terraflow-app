const { pool } = require('../config/db');
const { TABLES } = require('../config/constants');

class DocumentService {
  async createDocument(data) {
    const {
      land_title_id,
      transaction_id,
      document_type,
      file_name,
      file_path,
      file_size,
      mime_type,
      uploaded_by
    } = data;

    const result = await pool.query(`
      INSERT INTO ${TABLES.DOCUMENTS} (
        land_title_id, transaction_id, document_type, file_name,
        file_path, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      land_title_id, transaction_id, document_type, file_name,
      file_path, file_size, mime_type, uploaded_by
    ]);

    return result.rows[0];
  }

  async getDocumentsByLandTitleId(landTitleId) {
    const result = await pool.query(`
      SELECT * FROM ${TABLES.DOCUMENTS}
      WHERE land_title_id = $1
      ORDER BY created_at DESC
    `, [landTitleId]);

    return result.rows;
  }

  async deleteDocumentsByTransactionId(transactionId) {
    const result = await pool.query(`
      DELETE FROM ${TABLES.DOCUMENTS}
      WHERE transaction_id = $1
      RETURNING *
    `, [transactionId]);

    return result.rows;
  }


}

const documentService = new DocumentService();
module.exports = documentService;