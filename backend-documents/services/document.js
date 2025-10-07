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
      uploaded_by,
      status = 'ACTIVE'
    } = data;

    const result = await pool.query(`
      INSERT INTO ${TABLES.DOCUMENTS} (
        land_title_id, transaction_id, document_type, file_name,
        file_path, file_size, mime_type, uploaded_by, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      land_title_id, transaction_id, document_type, file_name,
      file_path, file_size, mime_type, uploaded_by, status
    ]);

    return result.rows[0];
  }

  async getDocumentsByLandTitleId(landTitleId) {
    const result = await pool.query(`
      SELECT * FROM ${TABLES.DOCUMENTS}
      WHERE land_title_id = $1 AND status = 'ACTIVE'
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

  async updateDocumentStatusByLandTitle(landTitleId, status) {
    const result = await pool.query(`
      UPDATE ${TABLES.DOCUMENTS}
      SET status = $1, updated_at = NOW()
      WHERE land_title_id = $2
      RETURNING *
    `, [status, landTitleId]);

    return result;
  }
}

const documentService = new DocumentService();
module.exports = documentService;