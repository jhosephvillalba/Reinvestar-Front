import React, { useState } from 'react';
import styles from './style.module.css';
import { changeRequestStatus, StatusEnum, StatusLabels, StatusColors } from '../../../../../Api/requestStatus';

const StatusManagement = ({ requestId, requestType, currentStatus, onDataNeedsRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const statusOptions = Object.entries(StatusEnum).map(([key, value]) => ({
    value,
    label: StatusLabels[value],
    color: StatusColors[value]
  }));

  const handleSaveStatus = async () => {
    if (!window.confirm(`Are you sure you want to change the status to ${statusOptions.find(s => s.value === selectedStatus)?.label}?`)) {
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");

    try {
      // Call the new status change service
      await changeRequestStatus({
        request_type: requestType,
        request_id: requestId,
        new_status: selectedStatus
      });
      
      // Call parent's refresh function
      if (onDataNeedsRefresh) {
        onDataNeedsRefresh();
      }
      
      setFeedback("Status updated successfully");
      
      // Clear error if it existed
      setError("");
      
    } catch (error) {
      console.error('Error updating status:', error);
      setError(error.message || "Error updating status");
      setFeedback("");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    return statusOptions.find(s => s.value === status)?.color || 'bg-secondary';
  };

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <h4 className="my_title_color fw-bold mb-4">Status Management</h4>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title mb-4">Current Status</h5>
              <div className="d-flex align-items-center mb-4">
                <span className={`badge ${getStatusColor(currentStatus)} fs-6 me-3`}>
                  {statusOptions.find(s => s.value === currentStatus)?.label || 'Unknown'}
                </span>
              </div>

              <h5 className="card-title mb-4">Change Status</h5>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label htmlFor="statusSelect" className="form-label fw-bold">
                      Select New Status
                    </label>
                    <select
                      id="statusSelect"
                      className="form-select"
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      disabled={loading}
                    >
                      {statusOptions.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <button
                    className="btn btn-primary"
                    onClick={handleSaveStatus}
                    disabled={loading || selectedStatus === currentStatus}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Save Status
                      </>
                    )}
                  </button>
                </div>
              </div>

              {loading && (
                <div className="alert alert-info mt-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  Updating status...
                </div>
              )}

              {error && (
                <div className="alert alert-danger mt-3">
                  <i className="fas fa-exclamation-circle me-2"></i>
                  {error}
                </div>
              )}

              {feedback && (
                <div className="alert alert-success mt-3">
                  <i className="fas fa-check-circle me-2"></i>
                  {feedback}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <div className="alert alert-info">
            <h5 className="alert-heading">
              <i className="fas fa-info-circle me-2"></i>
              Status Information
            </h5>
            <ul className="mb-0">
              <li><strong>Pending:</strong> The request is awaiting initial review.</li>
              <li><strong>Under Review:</strong> The request is being evaluated by the team.</li>
              <li><strong>Pricing:</strong> The rate and conditions are being determined.</li>
              <li><strong>Approved:</strong> Client receives letter of intent and approves with their signature.</li>
              <li><strong>Rejected:</strong> The request does not meet the requirements.</li>
              <li><strong>Cancelled:</strong> The client has cancelled the request.</li>
              <li><strong>Closed:</strong> The process has been completed.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatusManagement;