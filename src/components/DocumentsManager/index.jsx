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
  const [selectedObservationType, setSelectedObservationType] = useState("Pendiente de revisión");
  const [loadingObservations, setLoadingObservations] = useState(false);
  const [savingObservation, setSavingObservation] = useState(false);

  // Estados para visualización de documentos
  const [showViewModal, setShowViewModal] = useState(false);
  const [documentToView, setDocumentToView] = useState(null);
  const [documentViewUrl, setDocumentViewUrl] = useState("");
  const [loadingView, setLoadingView] = useState(false);
  
  // Estado para descarga
  const [downloading, setDownloading] = useState(false);

  // Opciones de tipo de observación
  const observationTypes = [
    "Pendiente de revisión",
    "En revisión",
    "Aprobado",
    "Aprobado con observaciones",
    "Rechazado",
    "Vencido",
    "Reemplazado",
    "Requerido"
  ];

  // Cargar tipos de documento
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

  // Cargar documentos cargados
  useEffect(() => {
    if (!requestId || !requestType || !isEnabled) {
      setDocuments([]);
      return;
    }
    loadDocuments();
  }, [requestId, requestType, isEnabled]);

  const loadDocuments = async () => {
    setLoading(true);
    setFeedback("");
    try {
      const docs = await getDocumentsByRequest(requestType, requestId);
      setDocuments(Array.isArray(docs) ? docs : []);
    } catch (error) {
      console.error('Error cargando documentos:', error);
      setFeedback("Error al cargar documentos");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar documento
  const handleDownloadDocument = async (document) => {
    setDownloading(true);
    setFeedback("");
    try {
      const blob = await downloadDocument(document.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = document.name || 'documento';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      setFeedback("Documento descargado exitosamente");
    } catch (error) {
      console.error('Error descargando documento:', error);
      setFeedback("Error al descargar el documento. Verifica que el archivo esté disponible.");
    } finally {
      setDownloading(false);
    }
  };

  // Función para visualizar documento
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
        throw new Error('Formato de archivo no compatible con visualización directa');
      }
      
      console.log('URL de visualización:', url);
      setDocumentViewUrl(url);
      
      return () => {
        if (url) {
          window.URL.revokeObjectURL(url);
        }
      };
    } catch (error) {
      console.error('Error obteniendo documento para visualización:', error);
      setFeedback(
        error.message === 'Formato de archivo no compatible con visualización directa'
          ? "Este tipo de archivo no se puede visualizar directamente. Por favor, use la opción de descarga."
          : "Error al cargar el documento para visualización."
      );
    } finally {
      setLoadingView(false);
    }
  };

  // Cargar observaciones de un documento
  const loadObservations = async (documentId) => {
    setLoadingObservations(true);
    try {
      const obs = await getDocumentObservationsByDocument(documentId);
      setObservations(Array.isArray(obs) ? obs : []);
    } catch (error) {
      console.error('Error cargando observaciones:', error);
      setObservations([]);
    } finally {
      setLoadingObservations(false);
    }
  };

  // Seleccionar documento para ver/agregar observaciones
  const handleSelectDocument = async (document) => {
    setSelectedDocument(document);
    await loadObservations(document.id);
  };

  // Abrir modal solo para ver observaciones
  const handleOpenObservations = async (document) => {
    setSelectedDocument(document);
    setShowObservationsModal(true);
    await loadObservations(document.id);
  };

  // Agregar nueva observación
  const handleAddObservation = async () => {
    if (!selectedDocument || !newObservation.trim()) return;
    
    setSavingObservation(true);
    try {
      await createDocumentObservation({
        document_id: selectedDocument.id,
        comments: newObservation.trim(),
        status: selectedObservationType
      });
      
      setNewObservation("");
      await loadObservations(selectedDocument.id);
      setFeedback("Observación agregada exitosamente");
    } catch (error) {
      console.error('Error agregando observación:', error);
      setFeedback("Error al agregar observación");
    } finally {
      setSavingObservation(false);
    }
  };

  // Eliminar observación
  const handleDeleteObservation = async (observationId) => {
    try {
      await deleteDocumentObservation(observationId);
      await loadObservations(selectedDocument.id);
      setFeedback("Observación eliminada");
    } catch (error) {
      console.error('Error eliminando observación:', error);
      setFeedback("Error al eliminar observación");
    }
  };

  // Manejar selección de archivo
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  // Subir documento desde el modal
  const handleUploadFromModal = async () => {
    if (!selectedDocumentType || !selectedFile) {
      setFeedback("Selecciona tipo y archivo para subir un documento");
      return;
    }

    if (!requestId || !requestType) {
      setFeedback("Error: No se ha especificado el ID o tipo de solicitud");
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
        throw new Error("Tipo de solicitud no válido");
      }
      
      console.log("Enviando documento con FormData:", {
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
      setFeedback("Documento cargado exitosamente");
      loadDocuments();
    } catch (error) {
      console.error("Error al cargar el documento:", error);
      setFeedback(`Error al cargar el documento: ${error.message || "Error desconocido"}`);
    } finally {
      setUploading(false);
    }
  };

  // Eliminar documento
  const handleDelete = async (docId) => {
    setLoading(true);
    setFeedback("");
    try {
      await deleteDocument(docId);
      setFeedback("Documento eliminado");
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      
      if (selectedDocument && selectedDocument.id === docId) {
        setSelectedDocument(null);
        setObservations([]);
      }
    } catch {
      setFeedback("Error al eliminar el documento");
    }
    setLoading(false);
  };

  // Cerrar modales
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
    setSelectedObservationType("Pendiente de revisión");
  };
  
  if (!isEnabled) {
    return (
      <div className="container-fluid py-4">
        <div className="alert alert-warning text-center">
          <i className="fas fa-exclamation-triangle me-2"></i>
          Por favor, guarde la información de la solicitud en la pestaña "Formulario" para poder cargar documentos.
        </div>
      </div>
    );
  }

  return (
      <div className="container-fluid py-4">
        {/* ... El resto del JSX del componente ... */}
        {/* (Este JSX es idéntico al que estaba en los archivos originales) */}
        <div className="row">
          {/* Columna izquierda - Lista de documentos */}
          <div className="col-7">
            <div className="d-flex flex-column gap-3">
            {/* Botón para cargar documento */}
            <div className="d-flex justify-content-start mb-3">
              <button
                type="button"
                className="btn btn-primary px-4 py-2"
                onClick={() => setShowModal(true)}
                disabled={loading}
                style={{ borderRadius: '25px' }}
              >
                <i className="fas fa-upload me-2"></i>
                Cargar Documento
              </button>
            </div>

            {/* Lista de documentos cargados */}
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando documentos...</p>
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
                              <span>{doc.type_document?.name || "Sin tipo"}</span>
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
                          {loadingView ? "Cargando..." : "Ver"}
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
                          Comentarios
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(doc.id);
                          }}
                          disabled={loading}
                          style={{ borderRadius: '15px' }}
                        >
                          <i className="fas fa-trash me-1"></i>
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted">No hay documentos cargados</p>
                <small className="text-muted d-block">
                  Solicitud #{requestId} - {requestType?.toUpperCase()}
                </small>
              </div>
            )}
            
            {feedback && (
              <div className="alert alert-info mt-3">{feedback}</div>
            )}
            </div>
          </div>

        {/* Columna derecha - Comentarios */}
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
                <h4 className={styles.comment_title}>Comentarios</h4>
                <p className="text-muted text-center mb-3">
                  Documento: <strong>{selectedDocument.name}</strong>
                </p>
                
                {/* Formulario para nueva observación */}
                <div className="w-100">
                  <div className="mb-3">
                    <label className="form-label small text-muted">Tipo de observación:</label>
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
                    placeholder="Agregar nuevo comentario..."
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
                    {savingObservation ? "AGREGANDO..." : "AGREGAR COMENTARIO"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h4 className={styles.comment_title}>Comentarios de Documentos</h4>
                <p className="text-muted text-center">Selecciona un documento de la lista para agregar comentarios.</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal para cargar documento */}
      {showModal && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Cargar Documento</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModal}
                  disabled={uploading}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Tipo de documento</label>
                  <select
                    className="form-select"
                    value={selectedDocumentType}
                    onChange={(e) => setSelectedDocumentType(e.target.value)}
                    disabled={uploading || typeDocuments.length === 0}
                required
                  >
                    <option value="">
                      {typeDocuments.length === 0 ? "No hay tipos de documento disponibles" : "Seleccione tipo"}
                    </option>
                    {typeDocuments.map((td) => (
                      <option value={td.id} key={td.id}>{td.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Archivo</label>
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
                      Archivo seleccionado: {selectedFile.name}
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
                  Cancelar
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
                      CARGANDO...
                    </>
                  ) : (
                    "CARGAR DOCUMENTO"
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}

      {/* Modal para ver observaciones existentes */}
      {showObservationsModal && selectedDocument && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-comments me-2"></i>
                  Comentarios - {selectedDocument.name}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeObservationsModal}
                />
              </div>
              <div className="modal-body">
                {/* Lista de observaciones */}
                <div>
                  <h6 className="mb-3">Observaciones existentes:</h6>
                  {loadingObservations ? (
                    <div className="text-center py-3">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2 small">Cargando observaciones...</p>
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
                      <p className="text-muted">No hay comentarios para este documento</p>
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
                  Cerrar
                </button>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1049 }}></div>
        </div>
      )}

      {/* Modal para visualizar documento */}
      {showViewModal && documentToView && (
        <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-xl modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="fas fa-eye me-2"></i>
                  Visualizar Documento - {documentToView.name}
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
                        <span className="visually-hidden">Cargando...</span>
                      </div>
                      <p className="mt-2">Cargando documento...</p>
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
                    title={`Visualización de ${documentToView.name}`}
                    onError={() => {
                      setFeedback("Error al cargar el documento. El formato puede no ser compatible con la visualización.");
                    }}
                  />
                ) : (
                  <div className="d-flex justify-content-center align-items-center" style={{ height: '100%' }}>
                    <div className="text-center">
                      <i className="fas fa-exclamation-triangle text-warning mb-2" style={{ fontSize: '2rem' }}></i>
                      <p className="text-muted">No se pudo cargar el documento para visualización.</p>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleViewDocument(documentToView)}
                      >
                        <i className="fas fa-redo me-1"></i>
                        Reintentar
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
                  Cerrar
                </button>
                {documentToView && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => handleDownloadDocument(documentToView)}
                    disabled={downloading}
                  >
                    <i className="fas fa-download me-1"></i>
                    {downloading ? "Descargando..." : "Descargar"}
                  </button>
                )}
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
