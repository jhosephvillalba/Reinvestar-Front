import React, { useState, useEffect } from "react";
import styles from "./style.module.css";
import VerifyIcon from "../../../../../assets/verify-icon.png";
import { getRequestTracking, createTracking } from "../../../../../Api/processTracking";
import { formatFileSize } from "../../../../../utils/fileUtils";
import { getTypesDocument } from "../../../../../Api/typesDocument";

// Available process types
const PROCESS_STAGES = {
  revision_inicial: "Initial Review",
  documentacion: "Documentation",
  aprobacion: "Approval",
  financiamiento: "Financing",
  completado: "Completed",
  rechazado: "Rejected"
};

const PipelineRequest = ({ requestId, requestType }) => {
  const [trackingList, setTrackingList] = useState([]);
  const [loading, setLoading] = useState(false);
    const [tipo, setTipo] = useState("");
    const [comentario, setComentario] = useState("");
  const [notas, setNotas] = useState("");
  const [completado, setCompletado] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [expandedItems, setExpandedItems] = useState(new Set());
  const [documentTypes, setDocumentTypes] = useState([]);
  const [documentTypesMap, setDocumentTypesMap] = useState({});

  // Load tracking history
  const loadTracking = async () => {
    if (!requestId || !requestType) {
      console.error('PipelineRequest: Missing parameters', { requestId, requestType });
      return;
    }

    setLoading(true);
    try {
      console.log('Calling getRequestTracking with:', requestType, requestId);
      const response = await getRequestTracking(requestType, requestId);
      console.log('getRequestTracking response:', response);

      if (response && Array.isArray(response)) {
        setTrackingList(response);
      } else if (response && Array.isArray(response.items)) {
        setTrackingList(response.items);
      } else if (response && Array.isArray(response.results)) {
        setTrackingList(response.results);
      } else {
        console.error('Unrecognized response format:', response);
        setTrackingList([]);
      }
    } catch (error) {
      console.error('Error loading tracking:', error);
      setFeedback("Error loading history");
      setTrackingList([]);
    } finally {
      setLoading(false);
    }
  };

  // Load document types
  useEffect(() => {
    const loadDocumentTypes = async () => {
      try {
        const response = await getTypesDocument();
        let types = [];
        if (response && Array.isArray(response.items)) {
          types = response.items;
        } else if (Array.isArray(response)) {
          types = response;
        }
        setDocumentTypes(types);
        
        // Create a map of ID to name (support both string and number keys)
        const typesMap = {};
        types.forEach(type => {
          if (type.id && type.name) {
            // Store with both string and number keys to handle both formats
            typesMap[type.id] = type.name;
            typesMap[String(type.id)] = type.name;
            typesMap[Number(type.id)] = type.name;
          }
        });
        setDocumentTypesMap(typesMap);
      } catch (error) {
        console.error('Error loading document types:', error);
        setDocumentTypes([]);
        setDocumentTypesMap({});
      }
    };
    
    loadDocumentTypes();
  }, []);

  useEffect(() => {
    console.log('PipelineRequest mounted with:', { requestId, requestType });
    loadTracking();
  }, [requestId, requestType]);

  const handleSubmit = async (e) => {
        e.preventDefault();
    if (!tipo || !comentario) {
      setFeedback("Type and comment are required");
      return;
    }

    setLoading(true);
    try {
      // Create base object
      const trackingData = {
        request_type: requestType,
        stage: tipo,
        description: comentario,
        notes: notas || "",
        completed: completado
      };

      // Add only corresponding ID according to type
      switch (requestType) {
        case "dscr":
          trackingData.dscr_request_id = parseInt(requestId);
          break;
        case "fixflip":
          trackingData.fixflip_request_id = parseInt(requestId);
          break;
        case "construction":
          trackingData.construction_request_id = parseInt(requestId);
          break;
        default:
          throw new Error("Invalid request type");
      }

      console.log('Sending tracking:', trackingData);
      const response = await createTracking(trackingData);
      console.log('createTracking response:', response);

      // Clear form
      setTipo("");
      setComentario("");
      setNotas("");
      setCompletado(false);
      setFeedback("Observation registered successfully");
      
      // Reload list
      loadTracking();
    } catch (error) {
      console.error('Error creating tracking:', error);
      setFeedback(error.message || "Error registering observation");
    } finally {
      setLoading(false);
    }
    };

  // Toggle accordion
  const toggleAccordion = (itemId) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Parse notes to extract structured information
  const parseNotes = (notes, description) => {
    if (!notes) return null;
    
    const parsed = {
      actionDate: null,
      documentName: null,
      documentType: null,
      documentSize: null,
      documentId: null,
      s3Url: null,
      fileName: null,
      clientName: null,
      requestCreatedDate: null,
      rawNotes: notes
    };

    // Extract action date (Acción realizada el ...)
    const actionDateMatch = notes.match(/Acción realizada el ([^:\n]+)/);
    if (actionDateMatch) {
      parsed.actionDate = actionDateMatch[1].trim();
    }

    // Extract request created date (Solicitud creada el ...)
    const requestDateMatch = notes.match(/Solicitud creada el ([^\n]+)/);
    if (requestDateMatch) {
      parsed.requestCreatedDate = requestDateMatch[1].trim();
    }

    // Extract client name (para el cliente ...)
    const clientMatch = notes.match(/para el cliente ([^\n]+)/);
    if (clientMatch) {
      parsed.clientName = clientMatch[1].trim();
    }

    // Extract document information
    const nameMatch = notes.match(/- nombre: ([^\n]+)/);
    if (nameMatch) {
      parsed.documentName = nameMatch[1].trim();
    }

    const fileNameMatch = notes.match(/- nombre_archivo: ([^\n]+)/);
    if (fileNameMatch) {
      parsed.fileName = fileNameMatch[1].trim();
    }

    const typeMatch = notes.match(/- tipo: ([^\n]+)/);
    if (typeMatch) {
      parsed.documentType = typeMatch[1].trim();
    }

    const sizeMatch = notes.match(/- tamaño: ([^\n]+)/);
    if (sizeMatch) {
      parsed.documentSize = parseInt(sizeMatch[1].trim());
    }

    const docIdMatch = notes.match(/- documento_id: ([^\n]+)/);
    if (docIdMatch) {
      parsed.documentId = docIdMatch[1].trim();
    }

    // Extract S3 URL (s3_url or any URL pattern)
    const urlMatch = notes.match(/- s3_url: ([^\n]+)/);
    if (urlMatch) {
      parsed.s3Url = urlMatch[1].trim();
    } else {
      // Try to find any URL in the notes
      const urlRegex = /(https?:\/\/[^\s\n]+)/;
      const urlMatch2 = notes.match(urlRegex);
      if (urlMatch2) {
        parsed.s3Url = urlMatch2[1].trim();
      }
    }

    return parsed;
  };


  // Format date - handles ISO format and custom date strings
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Try to parse as ISO date first
      let date = new Date(dateString);
      
      // If parsing failed, try to parse custom format (YYYY-MM-DD HH:mm:ss)
      if (isNaN(date.getTime())) {
        // Try to parse format like "2025-11-06 14:50:52"
        const customFormat = dateString.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
        if (customFormat) {
          const [, year, month, day, hour, minute] = customFormat;
          date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        } else {
          return dateString; // Return as-is if can't parse
        }
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  // Render notes content based on description type
  const renderNotesContent = (item) => {
    if (!item.notes || !item.notes.trim()) {
      return null;
    }

    const parsed = parseNotes(item.notes, item.description);
    const isExpanded = expandedItems.has(item.id);

    const isDocumentAction = item.description?.includes('Documento');
    const isRequestCreated = item.description?.includes('Solicitud creada');

    // Check if there's any structured information to show
    const hasStructuredInfo = parsed && (
      parsed.documentName || parsed.fileName || 
      parsed.actionDate || parsed.requestCreatedDate || parsed.clientName
    );

    return (
      <div className="accordion" id={`accordion-${item.id}`} style={{ marginTop: '0.5rem' }}>
        <div className="accordion-item border-0">
          <h2 className="accordion-header" id={`heading-${item.id}`}>
            <button
              className={`accordion-button ${!isExpanded ? 'collapsed' : ''}`}
              type="button"
              onClick={() => toggleAccordion(item.id)}
              aria-expanded={isExpanded}
              aria-controls={`collapse-${item.id}`}
              style={{
                backgroundColor: '#f8f9fa',
                border: 'none',
                boxShadow: 'none',
                padding: '0.5rem 1rem',
                fontSize: '0.9rem',
                color: '#495057'
              }}
            >
              <i className={`fas fa-chevron-${isExpanded ? 'down' : 'right'} me-2`}></i>
              {isExpanded ? 'Hide Details' : 'Show Details'}
            </button>
          </h2>
          <div
            id={`collapse-${item.id}`}
            className={`accordion-collapse collapse ${isExpanded ? 'show' : ''}`}
            aria-labelledby={`heading-${item.id}`}
          >
            <div className="accordion-body p-3" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6' }}>
              {/* Document Information */}
              {isDocumentAction && parsed && (
                <div className="mb-3">
                  <h6 className="mb-2 text-primary">
                    <i className="fas fa-file me-2"></i>
                    Document Information
                  </h6>
                  {parsed.documentName && (
                    <div className="mb-2">
                      <strong>Document Name:</strong> <span className="text-dark">{parsed.documentName}</span>
                    </div>
                  )}
                  {parsed.fileName && (
                    <div className="mb-2">
                      <strong>File Name:</strong> <span className="text-dark">{parsed.fileName}</span>
                    </div>
                  )}
                  {parsed.documentType && (
                    <div className="mb-2">
                      <strong>Document Type:</strong>{' '}
                      <span className="text-dark">
                        {documentTypesMap[parsed.documentType] || 
                         documentTypesMap[parseInt(parsed.documentType)] ||
                         documentTypesMap[String(parsed.documentType)] ||
                         `Type ID: ${parsed.documentType}`}
                      </span>
                    </div>
                  )}
                  {parsed.documentSize && (
                    <div className="mb-2">
                      <strong>File Size:</strong> <span className="text-dark">{formatFileSize(parsed.documentSize)}</span>
                    </div>
                  )}
                </div>
              )}
              
              {/* Request Created Information */}
              {isRequestCreated && parsed && (
                <div className="mb-3">
                  <h6 className="mb-2 text-success">
                    <i className="fas fa-calendar-check me-2"></i>
                    Request Information
                  </h6>
                  {parsed.clientName && (
                    <div className="mb-2">
                      <strong>Client:</strong> <span className="text-dark">{parsed.clientName}</span>
                    </div>
                  )}
                  {parsed.requestCreatedDate && (
                    <div className="mb-2">
                      <strong>Created Date:</strong> <span className="text-dark">{formatDate(parsed.requestCreatedDate)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Date (for other actions) */}
              {parsed && parsed.actionDate && !isRequestCreated && (
                <div className="mb-2">
                  <strong>Action Date:</strong> <span className="text-dark">{formatDate(parsed.actionDate)}</span>
                </div>
              )}

              {/* Full Notes - Always show if notes exist */}
              {item.notes && item.notes.trim() && (
                <div className={hasStructuredInfo ? "mt-3 pt-3 border-top" : ""}>
                  <strong>
                    <i className="fas fa-sticky-note me-2"></i>
                    {hasStructuredInfo ? 'Full Notes:' : 'Notes:'}
                  </strong>
                  <pre
                    className="bg-white p-2 rounded mt-2 mb-0"
                    style={{
                      fontSize: '0.85rem',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      maxHeight: '200px',
                      overflowY: 'auto',
                      fontFamily: 'inherit'
                    }}
                  >
                    {item.notes}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

    return (
        <div className="row mt-4">
            <div className="col-7">
                <div className={styles.pipeline_container}>
                    <div className={styles.steps_list}>
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading history...</p>
              </div>
            ) : trackingList.length === 0 ? (
              <div className="text-center py-4">
                <p>No activities registered</p>
                <small className="text-muted d-block">
                  Request #{requestId} - {requestType?.toUpperCase()}
                </small>
              </div>
            ) : (
              trackingList.map((item, index) => (
                <div key={item.id || index} className={styles.step_item}>
                  <div className={styles.step_header}>
                    <span className={styles.step_type}>
                      {PROCESS_STAGES[item.stage] || item.stage || 'Status not defined'}
                    </span>
                    <span className={styles.step_date}>
                      <i className="fas fa-calendar-alt me-1"></i>
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                  <div className={styles.step_desc}>
                    <strong>{item.description}</strong>
                  </div>
                  
                  {item.completed && (
                    <div className="mt-2 mb-2">
                      <small className="badge bg-success">
                        <i className="fas fa-check-circle me-1"></i>
                        Completed
                      </small>
                    </div>
                  )}

                  {/* Accordion with detailed information */}
                  {item.notes && item.notes.trim() && renderNotesContent(item)}
                </div>
              ))
            )}
                    </div>
                </div>
            </div>
            <div className="col-5">
                <form className={styles.comment_box_container} onSubmit={handleSubmit}>
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
            style={{ width: "80px", height: "80px", marginBottom: "1rem" }}
                    >
                      <img src={VerifyIcon} alt="verify-icon" />
                    </div>
                    <h4 className={styles.comment_title}>Create Comment</h4>
                    <select
                        className={styles.comment_select}
                        value={tipo}
            onChange={(e) => setTipo(e.target.value)}
                        required
                    >
            <option value="">Select process status</option>
            {Object.entries(PROCESS_STAGES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
                    </select>
                    <textarea
                        className={styles.comment_textarea}
            placeholder="Process description..."
            rows={3}
                        value={comentario}
            onChange={(e) => setComentario(e.target.value)}
                        required
                    />
          <textarea
            className={styles.comment_textarea}
            placeholder="Additional notes (optional)..."
            rows={2}
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
                    <div className={styles.comment_checkbox_row}>
                        <label className={styles.comment_checkbox_label}>
              MARK AS COMPLETED
                            <input
                                type="checkbox"
                                className={styles.comment_checkbox}
                checked={completado}
                onChange={(e) => setCompletado(e.target.checked)}
                            />
                        </label>
                    </div>
          <button 
            className={styles.comment_button} 
            type="submit" 
            disabled={loading || !requestId || !requestType}
          >
            {loading ? "SENDING..." : "SEND"}
          </button>
          {feedback && (
            <div className={`mt-2 text-center ${feedback.includes("Error") ? "text-danger" : "text-success"}`}>
              {feedback}
            </div>
          )}
                </form>
            </div>
        </div>
    );
};

export default PipelineRequest; 