import React, { useState, useEffect } from 'react';
import styles from './style.module.css';
import { 
  getDocumentObservations,
  createDocumentObservation,
  deleteDocumentObservation
} from '../../Api/documents';

const DocumentObservations = ({ documentId, requestId, requestType }) => {
  const [observations, setObservations] = useState([]);
  const [newObservation, setNewObservation] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && documentId) {
      fetchObservations();
    }
  }, [isOpen, documentId]);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const data = await getDocumentObservations(documentId);
      setObservations(data);
      setError(null);
    } catch (err) {
      setError('Error loading observations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddObservation = async () => {
    if (!newObservation.trim()) return;

    try {
      setLoading(true);
      const observation = await createDocumentObservation({
        status: "PENDIENTE_REVISION",
        comment: newObservation,
        document_id: documentId,
        user_id: user.id // Assuming we have access to user object
      });
      setObservations([...observations, observation]);
      setNewObservation('');
      setError(null);
    } catch (err) {
      setError('Error adding observation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObservation = async (observationId) => {
    try {
      setLoading(true);
      await deleteDocumentObservation(observationId);
      setObservations(observations.filter(obs => obs.id !== observationId));
      setError(null);
    } catch (err) {
      setError('Error deleting observation');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <button 
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
      >
        {observations.length > 0 ? `Observations (${observations.length})` : 'Observation'}
      </button>

      {isOpen && (
        <div className={styles.observationsPanel}>
          <div className={styles.observationsList}>
            {loading && observations.length === 0 ? (
              <p>Loading observations...</p>
            ) : observations.length === 0 ? (
              <p>No observations</p>
            ) : (
              observations.map(obs => (
                <div key={obs.id} className={styles.observationItem}>
                      <p>{obs.comment}</p>
                      <small>
                        Status: {obs.status.replace('_', ' ')} | 
                        Created: {new Date(obs.created_at).toLocaleString()}
                      </small>
                  {obs.status === 'active' && (
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDeleteObservation(obs.id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <div className={styles.newObservation}>
            <textarea
              className={styles.observationInput}
              value={newObservation}
              onChange={(e) => setNewObservation(e.target.value)}
              placeholder="Write a new observation..."
              disabled={loading}
            />
            <button
              className={styles.addButton}
              onClick={handleAddObservation}
              disabled={!newObservation.trim() || loading}
            >
              Add Observation
            </button>
            {error && <p className={styles.error}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentObservations;
