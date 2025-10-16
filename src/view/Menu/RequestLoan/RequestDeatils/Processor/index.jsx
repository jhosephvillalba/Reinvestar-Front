import React, { useState, useEffect } from "react";
import styles from "../FormRequest/style.module.css";
import { 
  getProcessors, 
  getProcessorsByRequest,
  assignProcessor, 
  deactivateProcessorAssignment,
  getProcessorWorkload
} from "../../../../../Api/procesor";

const ProcessorForm = ({ requestId, requestType, onDataNeedsRefresh }) => {
  const [processors, setProcessors] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [workloadData, setWorkloadData] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);

  useEffect(() => {
    console.log('useEffect executed with:', { requestId, requestType });
    
    // Clear state before loading new data
    setAssignments([]);
    setProcessors([]);
    setSelectedProcessor("");
    setFeedback("");
    setWorkloadData(null);
    setShowAssignForm(false);
    
    // Only load data if we have valid requestId and requestType
    if (requestId && requestType) {
      console.log('Loading data for request:', { requestId, requestType });
      
      // Load data immediately
      const loadData = async () => {
        try {
          await Promise.all([loadProcessors(), loadAssignments()]);
        } catch (error) {
          console.error('Error loading data:', error);
          setAssignments([]);
          setProcessors([]);
        }
      };
      
      loadData();
    } else {
      console.log('Missing parameters to load data:', { requestId, requestType });
    }
  }, [requestId, requestType]);

  const loadProcessors = async () => {
    try {
      const data = await getProcessors({ skip: 0, limit: 100 });
      
      // Handle processor data structure
      let processors = [];
      if (Array.isArray(data)) {
        processors = data;
      } else if (data && Array.isArray(data.items)) {
        processors = data.items;
      } else if (data && Array.isArray(data.results)) {
        processors = data.results;
      }
      
      setProcessors(processors);
    } catch (error) {
      console.error('Error loading processors:', error);
      setProcessors([]);
    }
  };

  const loadAssignments = async () => {
    try {
      if (!requestId || !requestType) {
        console.log('Missing parameters to load assignments:', { requestId, requestType });
        setAssignments([]);
        return;
      }

      const params = {};
      
      // Add corresponding request ID according to type
      switch (requestType) {
        case "dscr":
          params.dscr_request_id = parseInt(requestId);
          break;
        case "fixflip":
          params.fixflip_request_id = parseInt(requestId);
          break;
        case "construction":
          params.construction_request_id = parseInt(requestId);
          break;
        default:
          console.error('Invalid request type:', requestType);
          setAssignments([]);
          return;
      }
      
      console.log('Loading assignments for:', { requestId, requestType, params });
      const data = await getProcessorsByRequest(params);
      console.log('Assignment data received:', data);
      
      // Ensure data is an array
      let assignmentsData = [];
      if (Array.isArray(data)) {
        assignmentsData = data;
      } else if (data && Array.isArray(data.items)) {
        assignmentsData = data.items;
      } else if (data && Array.isArray(data.results)) {
        assignmentsData = data.results;
      } else {
        assignmentsData = [];
      }

      // Filter assignments to ensure only those corresponding to this request
      // and that are active are shown
      assignmentsData = assignmentsData.filter(assignment => {
        // Verify assignment has necessary data
        if (!assignment) {
          return false;
        }

        // Verify request ID matches according to type
        let matchesRequest = false;
        switch (requestType) {
          case "dscr":
            matchesRequest = parseInt(assignment.dscr_request_id) === parseInt(requestId);
            break;
          case "fixflip":
            matchesRequest = parseInt(assignment.fixflip_request_id) === parseInt(requestId);
            break;
          case "construction":
            matchesRequest = parseInt(assignment.construction_request_id) === parseInt(requestId);
            break;
        }

        // Only show assignments that match the current request and are active
        return matchesRequest && assignment.is_active;
      });

      // Remove duplicates based on processor_id, keeping only the most recent assignment
      const uniqueAssignments = [];
      const seenProcessorIds = new Set();
      
      // Sort by assignment date (most recent first)
      assignmentsData.sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
      
      assignmentsData.forEach(assignment => {
        const processorId = assignment.processor_id || assignment.processor?.id;
        if (processorId && !seenProcessorIds.has(processorId)) {
          seenProcessorIds.add(processorId);
          uniqueAssignments.push(assignment);
        }
      });
      
      console.log('Filtered and deduplicated assignments:', uniqueAssignments);
      setAssignments(uniqueAssignments);
    } catch (error) {
      console.error('Error loading assignments:', error);
      setAssignments([]);
    }
  };


  const handleAssignProcessor = async () => {
    if (!selectedProcessor) {
      setFeedback("You must select a processor");
      return;
    }

    setLoading(true);
    setFeedback("");
    try {
      const assignmentData = {
        processor_id: Number(selectedProcessor),
        active: true
      };

      switch (requestType) {
        case "dscr":
          assignmentData.dscr_request_id = parseInt(requestId);
          break;
        case "fixflip":
          assignmentData.fixflip_request_id = parseInt(requestId);
          break;
        case "construction":
          assignmentData.construction_request_id = parseInt(requestId);
          break;
        default:
          throw new Error("Invalid request type");
      }

      await assignProcessor(assignmentData);
      setFeedback("Processor assigned successfully");
      setSelectedProcessor("");
      setShowAssignForm(false);
      loadAssignments();
      
      // Call parent's refresh function
      if (onDataNeedsRefresh) {
        onDataNeedsRefresh();
      }
      
      // Load selected processor workload information
      try {
        const workload = await getProcessorWorkload();
        const processorData = workload?.items?.find(item => item.processor.id === Number(selectedProcessor));
        if (processorData) {
          setWorkloadData({
            processor_id: processorData.processor.id,
            ...processorData.workload,
            active_assignments: processorData.active_assignments
          });
        }
      } catch (workloadError) {
        console.error('Error loading workload:', workloadError);
        // Don't show error to user since assignment was successful
      }
    } catch (error) {
      console.error('Error assigning processor:', error);
      setFeedback(error.response?.data?.detail || "Error assigning processor");
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateAssignment = async (assignment) => {
    if (!window.confirm("Are you sure you want to unassign this processor?")) {
      return;
    }

    setLoading(true);
    try {
      // Use processor_id from assignment or from nested processor object
      const processorId = assignment.processor_id || assignment.processor?.id;
      
      if (!processorId) {
        throw new Error('Could not get processor ID');
      }
      
      // Only send necessary parameters without duplication
      const params = {
        processor_id: Number(processorId),
        request_type: requestType,
        request_id: parseInt(requestId)
      };

      await deactivateProcessorAssignment(params);
      setFeedback("Processor unassigned successfully");
      loadAssignments();
      setWorkloadData(null);

      // Call parent's refresh function
      if (onDataNeedsRefresh) {
        onDataNeedsRefresh();
      }
    } catch (error) {
      console.error('Error unassigning processor:', error);
      setFeedback(error.response?.data?.detail || error.message || "Error unassigning processor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <h4 className="my_title_color fw-bold mb-4">Request Processors</h4>
        </div>
      </div>

      {/* Assigned processors table */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Processor</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Assignment Date</th>
                  <th>Status</th>
                
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? (
                  assignments.map(assignment => (
                    <tr key={assignment.id}>
                      <td>{assignment.processor?.full_name || assignment.processor_name || 'N/A'}</td>
                      <td>{assignment.processor?.email || assignment.processor_email || 'N/A'}</td>
                      <td>{assignment.processor?.phone || assignment.processor_phone || '-'}</td>
                      <td>{new Date(assignment.assigned_at).toLocaleDateString()}</td>
                      <td>
                        <span className={`badge ${assignment.status === "ASSIGNED" ? 'bg-success' : 'bg-secondary'}`}>
                          {assignment.status}
                        </span>
                        {assignment.is_active && (
                          <span className="badge bg-primary ms-1">Active</span>
                        )}
                      </td>
                   
                      <td className="text-end">
                        {assignment.status === "ASSIGNED" && assignment.is_active && (
                          <>
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm px-3 me-2"
                              onClick={() => setShowAssignForm(true)}
                              disabled={loading}
                              style={{ borderRadius: '20px' }}
                            >
                              <i className="fas fa-exchange-alt me-1"></i>
                              Change
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm px-3"
                              onClick={() => handleDeactivateAssignment(assignment)}
                              disabled={loading}
                              style={{ borderRadius: '20px' }}
                            >
                              <i className="fas fa-user-minus me-1"></i>
                              Unassign
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <p className="text-muted mb-2">No processors assigned to this request</p>
                      <button
                        type="button"
                        className={`btn ${styles.button} px-4`}
                        onClick={() => setShowAssignForm(true)}
                        disabled={loading}
                        style={{ borderRadius: '30px' }}
                      >
                        <i className="fas fa-user-plus me-2"></i>
                        Assign Processor
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assignment button when there are no active processors */}
      {!assignments.some(a => a.status === "ASSIGNED" && a.is_active) && assignments.length > 0 && (
        <div className="row mb-4">
          <div className="col-12 text-center">
            <div className="alert alert-warning">
              <p className="mb-2">No active processors assigned to this request</p>
              <button
                type="button"
                className={`btn ${styles.button} px-4`}
                onClick={() => setShowAssignForm(true)}
                disabled={loading}
                style={{ borderRadius: '30px' }}
              >
                <i className="fas fa-user-plus me-2"></i>
                Assign Processor
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Assignment form */}
      {showAssignForm && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h5 className="card-title mb-0">
                    {assignments.some(a => a.status === "ASSIGNED" && a.is_active) ? "Change Processor" : "Assign Processor"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSelectedProcessor("");
                      setShowAssignForm(false);
                    }}
                    disabled={loading}
                  />
                </div>
                <div className="row">
                  <div className="col-12">
                    <div className="d-flex flex-column">
                      <label className="form-label text-muted small mb-2">Select Processor</label>
                      <select
                        className={styles.input}
                        value={selectedProcessor}
                        onChange={(e) => setSelectedProcessor(e.target.value)}
                      >
                        <option value="">Select a processor</option>
                        {processors.map((processor) => (
                          <option key={processor.id} value={processor.id}>
                            {processor.full_name} - {processor.email}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="row mt-4">
                  <div className="col-12 d-flex justify-content-end gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={() => {
                        setSelectedProcessor("");
                        setShowAssignForm(false);
                      }}
                      disabled={loading}
                      style={{ minWidth: '120px', borderRadius: '30px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`btn ${styles.button} px-4`}
                      onClick={handleAssignProcessor}
                      disabled={loading || !selectedProcessor}
                      style={{ minWidth: '120px' }}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Assigning...
                        </>
                      ) : (
                        "Assign"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Feedback messages */}
      {feedback && (
        <div className={`alert ${feedback.includes("successfully") ? "alert-success" : "alert-danger"} mt-3`}>
          {feedback}
        </div>
      )}
    </div>
  );
};

export default ProcessorForm; 