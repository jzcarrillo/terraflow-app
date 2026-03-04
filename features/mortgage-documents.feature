Feature: Mortgage Document Upload
  As a bank user
  I want to upload documents with mortgages
  So that I can maintain supporting documentation

  Background:
    Given I am logged in as a bank user
    And the document service is running

  Scenario: Upload documents during mortgage creation
    When I create a mortgage with attachments:
      | filename        | type            | size    |
      | deed.pdf        | application/pdf | 1048576 |
      | contract.pdf    | application/pdf | 524288  |
    Then the mortgage should be created successfully
    And a document upload event should be published to RabbitMQ
    And the event should contain:
      | event_type    | DOCUMENT_UPLOAD |
      | mortgage_id   | 1               |
      | attachment_count | 2            |

  Scenario: Documents are optional during mortgage creation
    When I create a mortgage without attachments
    Then the mortgage should be created successfully
    And no document upload event should be published

  Scenario: Document service receives mortgage documents
    Given a mortgage is created with attachments
    When the document service processes the event
    Then the documents should be stored in the documents database
    And each document should be linked to the mortgage_id
    And the document status should be "UPLOADED"

  Scenario: Multiple document types supported
    When I upload documents with types:
      | filename           | type                    |
      | deed.pdf           | application/pdf         |
      | appraisal.xlsx     | application/vnd.ms-excel|
      | photo.jpg          | image/jpeg              |
    Then all documents should be accepted
    And all documents should be queued for upload

  Scenario: Document upload failure does not block mortgage creation
    Given the document service is unavailable
    When I create a mortgage with attachments
    Then the mortgage should still be created successfully
    And an error should be logged for document upload
    But the mortgage record should exist

  Scenario: Document metadata includes transaction_id
    When I create a mortgage with attachments
    Then each document should include:
      | transaction_id | txn-12345  |
      | mortgage_id    | 1          |
      | user_id        | 100        |
      | uploaded_at    | timestamp  |

  Scenario: Retrieve documents for a mortgage
    Given mortgage id 1 has 3 uploaded documents
    When I request documents for mortgage id 1
    Then I should receive 3 documents
    And each document should have:
      | mortgage_id | 1 |
      | status      | UPLOADED |

  Scenario: Document size validation
    When I attempt to upload a document larger than 10MB
    Then the upload should fail
    And I should see error "Document size exceeds maximum limit"

  Scenario: Document type validation
    When I attempt to upload a document with type "application/exe"
    Then the upload should fail
    And I should see error "Invalid document type"

  Scenario: RabbitMQ message format for document upload
    When a mortgage is created with attachments
    Then the RabbitMQ message should have format:
      """
      {
        "event_type": "DOCUMENT_UPLOAD",
        "transaction_id": "txn-12345",
        "mortgage_id": 1,
        "attachments": [
          {
            "filename": "deed.pdf",
            "type": "application/pdf",
            "size": 1048576
          }
        ],
        "user_id": 100
      }
      """

  Scenario: Document upload queue name
    When a document upload event is published
    Then it should be sent to queue "queue_documents"
    And the message should be persistent

  Scenario: Document service handles mortgage_id reference
    Given the document service receives a mortgage document event
    When the document is stored
    Then the document record should include:
      | reference_type | mortgage |
      | reference_id   | 1        |
      | mortgage_id    | 1        |

  Scenario: Documents persist after mortgage cancellation
    Given mortgage id 1 has uploaded documents
    When mortgage id 1 is cancelled
    Then the documents should still exist
    And the documents should still be linked to mortgage id 1

  Scenario: Documents are included in mortgage response
    Given mortgage id 1 has 2 uploaded documents
    When I retrieve mortgage id 1
    Then the response should include document_count: 2
    And the response should include document URLs
