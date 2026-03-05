const { executeQuery } = require('../utils/database');
const { TABLES } = require('../config/constants');

class DocumentService {

  async createDocument(data) {
    const {
      land_title_id, mortgage_id, reference_type, transaction_id, document_type, file_name,
      file_path, file_size, mime_type, uploaded_by
    } = data;

    const result = await executeQuery(`
      INSERT INTO ${TABLES.DOCUMENTS} (
        land_title_id, mortgage_id, reference_type, transaction_id, document_type, file_name,
        file_path, file_size, mime_type, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [land_title_id, mortgage_id, reference_type, transaction_id, document_type, file_name, file_path, file_size, mime_type, uploaded_by]);

    return result.rows[0];
  }

  async getDocumentsByField(field, value) {
    const result = await executeQuery(`
      SELECT * FROM ${TABLES.DOCUMENTS} WHERE ${field} = $1 ORDER BY created_at DESC
    `, [value]);
    return result.rows;
  }

  async getDocumentsByLandTitleId(landTitleId) {
    return this.getDocumentsByField('land_title_id', landTitleId);
  }

  async getDocumentsByMortgageId(mortgageId) {
    return this.getDocumentsByField('mortgage_id', mortgageId);
  }

  async getDocumentById(documentId) {
    const result = await executeQuery(`
      SELECT * FROM ${TABLES.DOCUMENTS} WHERE id = $1
    `, [documentId]);

    return result.rows[0] || null;
  }

  async updateDocumentStatusByLandTitle(landTitleId, status) {
    const result = await executeQuery(`
      UPDATE ${TABLES.DOCUMENTS} SET status = $1 WHERE land_title_id = $2
    `, [status, landTitleId]);

    return result;
  }

  async deleteDocumentsByTransactionId(transactionId) {
    const result = await executeQuery(`
      DELETE FROM ${TABLES.DOCUMENTS}
      WHERE transaction_id = $1
      RETURNING *
    `, [transactionId]);

    return result.rows;
  }

}

const documentService = new DocumentService();
module.exports = documentService;