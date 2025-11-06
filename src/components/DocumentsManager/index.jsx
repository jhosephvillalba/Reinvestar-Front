import React, { useEffect, useState } from "react";
import { formatFileSize } from "../../utils/fileUtils";
import Check from "../../assets/lets-icons_check-fill.svg";
import VerifyIcon from "../../assets/verify-icon.png";
import styles from "./style.module.css";
import { 
  createDocument, 
  deleteDocument, 
  getDocumentsByRequest,
  createDocumentObservation,
  getDocumentObservationsByDocument,
  deleteDocumentObservation,
  downloadDocument,
} from "../../Api/documents";
import { getTypesDocument } from "../../Api/typesDocument";
import { getDscrById } from "../../Api/dscr";
import { getFixflipById } from "../../Api/fixflip";
import { getConstructionById } from "../../Api/construction";

const DocumentsManager = ({ requestId, requestType, isEnabled = true }) => {
  const [typeDocuments, setTypeDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Estados para observaciones
  const [showObservationsModal, setShowObservationsModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [observations, setObservations] = useState([]);
  const [newObservation, setNewObservation] = useState("");
  const [selectedObservationType, setSelectedObservationType] = useState("REVIEW");
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);

  // Estados para visualización de documentos
  const [showViewModal, setShowViewModal] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);
  const [documentViewUrl, setDocumentViewUrl] = useState("");
  const [loadingView, setLoadingView] = useState(false);
  
  // Estado para descarga
  const [downloading, setDownloading] = useState(false);
  
  // Estado para el estado de la solicitud y modal de confirmación
  const [requestStatus, setRequestStatus] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCannotDeleteModal, setShowCannotDeleteModal] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Observation type options
  const observationTypes = [
    "APPROVED",
    "REVIEW",
    "REJECTED"
  ];

  // Load document types
  useEffect(() => {
    if (!isEnabled) return;
    getTypesDocument()
      .then(response => {
        if (response && Array.isArray(response.items)) {
          setTypeDocuments(response.items);
        } else if (Array.isArray(response)) {
          setTypeDocuments(response);
        } else {
          setTypeDocuments([]);
        }
      })
      .catch(() => setTypeDocuments([]));
  }, [isEnabled]);

  // Load request status
  const loadRequestStatus = async () => {
    if (!requestId || !requestType) {
      setRequestStatus(null);
      return;
    }
    
    try {
      let requestData = null;
      if (requestType === "dscr") {
        requestData = await getDscrById(requestId);
      } else if (requestType === "fixflip") {
        requestData = await getFixflipById(requestId);
      } else if (requestType === "construction") {
        requestData = await getConstructionById(requestId);
      }
      
      if (requestData && requestData.status) {
        setRequestStatus(requestData.status);
      }
    } catch (error) {
      console.error('Error loading request status:', error);
      setRequestStatus(null);
    }
  };

  // Load uploaded documents
  useEffect(() => {
    if (!isEnabled) {
      setDocuments([]);
      return;
    }
    
    // If we have requestId and requestType, load from API
    if (requestId && requestType) {
      loadDocuments();
      loadRequestStatus();
    } else {
      // If no requestId yet, start with empty documents array
      setDocuments([]);
      setRequestStatus(null);
    }
  }, [requestId, requestType, isEnabled]);

  const loadDocuments = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const docs = await getDocumentsByRequest(requestType, requestId);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Error loading documents:', error);
      setFeedback("Error loading documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to download document
  const handleDownloadDocument = async (document) => {
    setDownloading(true);
    setFeedback("");
    try {
      const blob = await downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setFeedback("Document downloaded successfully");
    } catch (error) {
      console.error('Error downloading document:', error);
      setFeedback("Error downloading document. Verify that the file is available.");
    } finally {
      setDownloading(false);
    }
  };

  // Function to view document
  const handleViewDocument = async (document) => {
    setLoadingView(true);
    setDocumentToView(document);
    setShowViewModal(true);
    setDocumentViewUrl("");
    try {
      //const blob = await downloadDocument(document.id);
      const url = document.file_path;
      const fileExtension = document.name.split('.').pop().toLowerCase();
      const isPdf = fileExtension === 'pdf';
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension);
      
      if (!isPdf && !isImage) {
        throw new Error('File format not compatible with direct viewing');
      }
      
      console.log('View URL:', url);
      setDocumentViewUrl(url);
      
      return () => {
        if (url) {
          window.URL.revokeObjectURL(url);
        }
      };
    } catch (error) {
      console.error('Error getting document for viewing:', error);
      setFeedback(
        error.message === 'File format not compatible with direct viewing'
          ? "This file type cannot be viewed directly. Please use the download option."
          : "Error loading document for viewing."
      );
    } finally {
      setLoadingView(false);
    }
  };

  // Load document observations
  const loadObservations = async (documentId) => {
    setLoadingObservations(true);
    try {
      // Check if document is temporary (local only)
      const document = documents.find(doc => doc.id === documentId);
      if (document && document.is_temp) {
        setObservations([]);
        return;
      }
      
      const obs = await getDocumentObservationsByDocument(documentId);
      setObservations(Array.isArray(obs) ? obs : []);
    } catch (error) {
      console.error('Error loading observations:', error);
      setObservations([]);
    } finally {
      setLoadingObservations(false);
    }
  };

  // Select document to view/add observations
  const handleSelectDocument = async (document) => {
    setSelectedDocument(document);
    await loadObservations(document.id);
  };

  // Open modal only to view observations
  const handleOpenObservations = async (document) => {
    setSelectedDocument(document);
    setShowObservationsModal(true);
    await loadObservations(document.id);
  };

  // Add new observation
  const handleAddObservation = async () => {
    if (!selectedDocument || !newObservation.trim()) return;
    
    // Check if document is temporary (local only)
    if (selectedDocument.is_temp) {
      setFeedback("Cannot add observations to local documents. Save the request first to upload documents to the server.");
      return;
    }
    
    setSavingObservation(true);
    try {
      await createDocumentObservation({
        document_id: selectedDocument.id,
        comments: newObservation.trim(),
        status: selectedObservationType
      });
      
      setNewObservation("");
      await loadObservations(selectedDocument.id);
      setFeedback("Observation added successfully");
    } catch (error) {
      console.error('Error adding observation:', error);
      setFeedback("Error adding observation");
    } finally {
      setSavingObservation(false);
    }
  };

  // Delete observation
  const handleDeleteObservation = async (observationId) => {
    try {
      await deleteDocumentObservation(observationId);
      await loadObservations(selectedDocument.id);
      setFeedback("Observation deleted");
    } catch (error) {
      console.error('Error deleting observation:', error);
      setFeedback("Error deleting observation");
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Upload document from modal
  const handleUploadFromModal = async () => {
    if (!selectedDocumentType || !selectedFile) {
      setFeedback("Select type and file to upload a document");
      return;
    }

    // If no requestId yet, add to local documents array
    if (!requestId || !requestType) {
      const newDocument = {
        id: `temp_${Date.now()}`, // Temporary ID
        name: selectedFile.name,
        type_document: { name: selectedDocumentType },
        file_size: selectedFile.size,
        file_type: selectedFile.type,
        created_at: new Date().toISOString(),
        is_temp: true // Flag to identify temporary documents
      };
      
      setDocuments(prev => [...prev, newDocument]);
      setFeedback("Document added locally. It will be uploaded when the request is saved.");
      closeModal();
      return;
    }

    setUploading(true);
    setFeedback("");
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("type_document_id", selectedDocumentType);
      formData.append("name", selectedFile.name);
      
      // Agregar el ID de solicitud específico según el tipo
      if (requestType === "dscr") {
        formData.append("dscr_request_id", requestId);
      } else if (requestType === "fixflip") {
        formData.append("fixflip_request_id", requestId);
      } else if (requestType === "construction") {
        formData.append("construction_request_id", requestId);
      } else {
        throw new Error("Invalid request type");
      }
      
      console.log("Sending document with FormData:", {
        file: selectedFile.name,
        type_document_id: selectedDocumentType,
        name: selectedFile.name,
        requestType: requestType,
        requestId: requestId
      });
      
      await createDocument(formData);
      
      setSelectedDocumentType("");
      setSelectedFile(null);
      setShowModal(false);
      setFeedback("Document uploaded successfully");
      loadDocuments();
    } catch (error) {
      console.error("Error uploading document:", error);
      setFeedback(`Error uploading document: ${error.message || "Unknown error"}`);
    } finally {
      setUploading(false);
    }
  };

  // Check if status allows deletion
  const canDelete = () => {
    if (!requestStatus) return true; // If status is not loaded, allow deletion (fallback)
    const allowedStatuses = ["PENDING", "IN_REVIEW", "PRICING"];
    return allowedStatuses.includes(requestStatus);
  };

  // Handle delete button click - show modal if needed
  const handleDeleteClick = (docId) => {
    const doc = documents.find(d => d.id === docId);
    if (!doc) return;
    
    if (canDelete()) {
      // Show confirmation modal if status allows deletion
      setDocumentToDelete(doc);
      setShowDeleteModal(true);
    } else {
      // Show modal indicating deletion is not allowed
      setDocumentToDelete(doc);
      setShowCannotDeleteModal(true);
    }
  };

  // Delete document
  const handleDelete = async (docId) => {
    setLoading(true);
    setFeedback("");
    try {
      await deleteDocument(docId);
      setFeedback("Document deleted");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      
      if (selectedDocument && selectedDocument.id === docId) {
        setSelectedDocument(null);
        setObservations([]);
      }
      
      // Close modals if open
      setShowDeleteModal(false);
      setShowCannotDeleteModal(false);
      setDocumentToDelete(null);
    } catch {
      setFeedback("Error deleting document");
    }
    setLoading(false);
  };

  // Close modals
  const closeModal = () => {
    setShowModal(false);
    setSelectedDocumentType("");
    setSelectedFile(null);
    setFeedback("");
  };

  const closeObservationsModal = () => {
    setShowObservationsModal(false);
    setSelectedDocument(null);
    setObservations([]);
    setSelectedObservationType("REVIEW");
  };
  
  // Show warning message at the top if not enabled, but still show the interface
  const warningMessage = !isEnabled ? (
    <div className="alert alert-warning text-center mb-4">
      <i className="fas fa-exclamation-triangle me-2"></i>
      Please save the request information in the "Form" tab to upload documents.
    </div>
  ) : null;

  return (
      <div className="container-fluid py-4">
        {warningMessage}
        <div className="row">
          {/* Left column - Documents list */}
          <div className="col-7">
            <div className="d-flex flex-column gap-3">
            {/* Button to upload document */}
            <div className="d-flex justify-content-start mb-3">
              <button
                type="button"
                className="btn btn-primary px-4 py-2"
                onClick={() => setShowModal(true)}
                disabled={loading || !isEnabled}
                style={{ borderRadius: '25px' }}
              >
                <i className="fas fa-upload me-2"></i>
                Upload Document
              </button>
            </div>

            {/* List of uploaded documents */}
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading documents...</p>
              </div>
            ) : documents.length > 0 ? (
              <div className={styles.documentsList}>
                {documents.map((doc) => (
                  <div 
                    key={doc.id} 
                    className={`${styles.documentCard} ${selectedDocument?.id === doc.id ? styles.selectedDocument : ''}`}
                    onClick={() => handleSelectDocument(doc)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center justify-content-between w-100">
                      <div className="d-flex align-items-center flex-grow-1">
                        <img src={Check} alt="ok" width={20} className="me-3" />
                          <div className="flex-grow-1">
                            <div className="fw-bold">{doc.name}</div>
                            <div className="text-muted small d-flex gap-2">
                              <span>{doc.type_document?.name || "No type"}</span>
                              {doc.file_size && (
                                <>
                                  <span>•</span>
                                  <span>
                                    {formatFileSize(doc.file_size)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-outline-primary btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDocument(doc);
                          }}
                          disabled={loadingView}
                          style={{ borderRadius: '15px' }}
                        >
                          <i className="fas fa-eye me-1"></i>
                          {loadingView ? "Loading..." : "View"}
                        </button>
                        <button
                          className="btn btn-outline-info btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenObservations(doc);
                          }}
                          style={{ borderRadius: '15px' }}
                        >
                          <i className="fas fa-comments me-1"></i>
                          Comments
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(doc.id);
                          }}
                          disabled={loading}
                          style={{ borderRadius: '15px' }}
                        >
                          <i className="fas fa-trash me-1"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">No documents uploaded</p>
                <small className="text-muted d-block">
                  Request #{requestId} - {requestType?.toUpperCase()}
                </small>
              </div>
            )}
            
            {feedback && (
              <div className="alert alert-info mt-3">{feedback}</div>
            )}
            </div>
          </div>

        {/* Right column - Comments */}
          <div className="col-5">
          <div className={styles.comment_box_container}>
              <div
                className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
              style={{ width: "80px", height: "80px", marginBottom: "1rem" }}
              >
                <img src={VerifyIcon} alt="verify-icon" />
              </div>
            
            {selectedDocument ? (
              <>
                <h4 className={styles.comment_title}>Comments</h4>
                <p className="text-muted text-center mb-3">
                  Document: <strong>{selectedDocument.name}</strong>
                </p>
                
                {/* Form for new observation */}
                <div className="w-100">
                  <div className="mb-3">
                    <label className="form-label small text-muted">Observation type:</label>
              <select
                      className="form-select form-select-sm"
                      value={selectedObservationType}
                      onChange={(e) => setSelectedObservationType(e.target.value)}
                      disabled={savingObservation}
                    >
                      {observationTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
              </select>
                  </div>
              <textarea
                className={styles.comment_textarea}
                    placeholder="Add new comment..."
                    value={newObservation}
                    onChange={(e) => setNewObservation(e.target.value)}
                    rows={3}
                    disabled={savingObservation}
                  />
                  <button
                    className={styles.comment_button}
                    onClick={handleAddObservation}
                    disabled={!newObservation.trim() || savingObservation}
                  >
                    {savingObservation ? "ADDING..." : "ADD COMMENT"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className={styles.comment_title}>Document Comments</h4>
                <p className="text-muted text-center">Select a document from the list to add comments.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal to upload document */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Upload Document</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={uploading}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Document type</label>
                  <select
                    className="form-select"
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    disabled={uploading || typeDocuments.length === 0}
                required
                  >
                    <option value="">
                      {typeDocuments.length === 0 ? "No document types available" : "Select type"}
                    </option>
                    {typeDocuments.map((td) => (
                      <option value={td.id} key={td.id}>{td.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">File</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="application/pdf,image/*"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    required
                  />
                  {selectedFile && (
                    <small className="text-muted d-block mt-1">
                      Selected file: {selectedFile.name}
                    </small>
                  )}
                </div>
                {feedback && (
                  <div className={`alert ${feedback.includes("Error") ? "alert-danger" : "alert-success"} py-2`}>
                    {feedback}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeModal}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleUploadFromModal}
                  disabled={uploading || !selectedDocumentType || !selectedFile}
                >
                  {uploading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      UPLOADING...
                    </>
                  ) : (
                    "UPLOAD DOCUMENT"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}

      {/* Modal to view existing observations */}
      {showObservationsModal && selectedDocument && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-comments me-2"></i>
                  Comments - {selectedDocument.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeObservationsModal}
                />
              </div>
              <div className="modal-body">
                {/* Observations list */}
                <div>
                  <h6 className="mb-3">Existing observations:</h6>
                  {loadingObservations ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2 small">Loading observations...</p>
                    </div>
                  ) : observations.length > 0 ? (
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {observations.map((obs) => (
                        <div key={obs.id} className="p-3 bg-light rounded border">
                          <div className="d-flex justify-content-between align-items-start">
                            <div className="flex-grow-1">
                              <div className="mb-2">
                                <span className="badge bg-primary me-2">{obs.status}</span>
                              </div>
                              <p className="mb-1">{obs.comments}</p>
                              <small className="text-muted">
                                <i className="fas fa-clock me-1"></i>
                                {new Date(obs.created_at).toLocaleString()}
                              </small>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger ms-2"
                              onClick={() => handleDeleteObservation(obs.id)}
                              style={{ fontSize: '10px', padding: '4px 8px' }}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3">
                      <i className="fas fa-comment-slash text-muted mb-2" style={{ fontSize: '2rem' }}></i>
                      <p className="text-muted">No comments for this document</p>
                  </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeObservationsModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}

      {/* Modal to view document */}
      {showViewModal && documentToView && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye me-2"></i>
                  View Document - {documentToView.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    if (documentViewUrl) {
                      window.URL.revokeObjectURL(documentViewUrl);
                    }
                    setShowViewModal(false);
                    setDocumentToView(null);
                    setDocumentViewUrl("");
                  }}
                />
              </div>
              <div className="modal-body" style={{ height: '70vh', padding: '0' }}>
                {loadingView ? (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                    <div className="text-center">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-2">Loading document...</p>
                    </div>
                </div>
                ) : documentViewUrl ? (
                  <iframe
                    src={documentViewUrl}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '0 0 0.375rem 0.375rem'
                    }}
                    title={`View ${documentToView.name}`}
                    onError={() => {
                      setFeedback("Error loading document. The format may not be compatible with viewing.");
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                    <div className="text-center">
                      <i className="fas fa-exclamation-triangle text-warning mb-2" style={{ fontSize: '2rem' }}></i>
                      <p className="text-muted">Could not load document for viewing.</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewDocument(documentToView)}
                      >
                        <i className="fas fa-redo me-1"></i>
                        Retry
                      </button>
                    </div>
                  </div>
                )}
                </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    if (documentViewUrl) {
                      window.URL.revokeObjectURL(documentViewUrl);
                    }
                    setShowViewModal(false);
                    setDocumentToView(null);
                    setDocumentViewUrl("");
                  }}
                >
                  Close
                </button>
                {documentToView && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleDownloadDocument(documentToView)}
                    disabled={downloading}
                  >
                    <i className="fas fa-download me-1"></i>
                    {downloading ? "Downloading..." : "Download"}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}

      {/* Modal de confirmación para eliminar documento */}
      {showDeleteModal && documentToDelete && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle text-warning me-2"></i>
                  Confirm Delete Document
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDocumentToDelete(null);
                  }}
                  disabled={loading}
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the document <strong>"{documentToDelete.name}"</strong>?</p>
                <p className="text-muted small mb-0">
                  This action cannot be undone. The document will be permanently deleted.
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDocumentToDelete(null);
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(documentToDelete.id)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-trash me-2"></i>
                      Delete Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}

      {/* Modal indicando que no se puede eliminar */}
      {showCannotDeleteModal && documentToDelete && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header bg-warning">
                <h5 className="modal-title">
                  <i className="fas fa-exclamation-triangle text-white me-2"></i>
                  Cannot Delete Document
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowCannotDeleteModal(false);
                    setDocumentToDelete(null);
                  }}
                />
              </div>
              <div className="modal-body">
                <p className="mb-3">
                  The document <strong>"{documentToDelete.name}"</strong> cannot be deleted.
                </p>
                <p className="text-muted small mb-0">
                  Documents can only be deleted when the request status is <strong>Pending</strong>, <strong>Under Review</strong>, or <strong>Pricing</strong>.
                </p>
                {requestStatus && (
                  <div className="alert alert-info mt-3 mb-0">
                    <small>
                      <strong>Current request status:</strong> {requestStatus}
                    </small>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCannotDeleteModal(false);
                    setDocumentToDelete(null);
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}
      </div>
  );
};

export default DocumentsManager;
