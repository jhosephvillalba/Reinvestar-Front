import React, { useState, useEffect } from "react";
import styles from "./style.module.css";
import VerifyIcon from "../../../../../assets/verify-icon.png";
import { getRequestTracking, createTracking } from "../../../../../Api/processTracking";

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

    return (
        <div className="row">
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
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className={styles.step_desc}>
                    {item.description}
                                </div>
               
                  {item.completed && (
                    <div className="mt-1">
                      <small className="badge bg-success">Completed</small>
                    </div>
                  )}
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