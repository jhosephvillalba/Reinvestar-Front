import React, { useState, useEffect } from "react";
import Back from "../../../../../assets/back.svg"; 
import { useNavigate, useParams } from "react-router-dom";
import styles from "./style.module.css";
import { getProcessorById, updateProcessor, getProcessorDetails } from "../../../../../Api/procesor";
import { getCompanies } from "../../../../../Api/admin";

const DetailProcesor = () => {
  const navegate = useNavigate(); 
  const { id } = useParams();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    identification: "",
    address: "",
    company_id: "",
    url_profile_photo: "",
    password: "",
    confirmarContrasena: "",
    role: "Procesador",
    is_active: true
  });
  const [originalData, setOriginalData] = useState(null);
  const [workload, setWorkload] = useState(null);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [companyError, setCompanyError] = useState("");
  const [roleError, setRoleError] = useState("");
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies({ skip: 0, limit: 100 });
        setCompanies(data);
      } catch (e) {
        setCompanies([]);
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (id) {
      loadProcessorData();
    }
  }, [id]);

  const loadProcessorData = async () => {
    try {
      setLoading(true);
      const data = await getProcessorById(id);
      
      const processorData = {
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone || "",
        identification: data.identification || "",
        address: data.address || "",
        company_id: data.company_id ? String(data.company_id) : "",
        url_profile_photo: data.url_profile_photo || "",
        password: "",
        confirmarContrasena: "",
        role: data.roles?.[0] || "Procesador",
        is_active: data.is_active !== undefined ? data.is_active : true
      };
      
      setFormData(processorData);
      setOriginalData(processorData);
      
      // Load processor details (workload and active assignments)
      await loadProcessorDetails(id);
    } catch (error) {
      console.error('Error loading processor:', error);
      setFeedback("Error loading processor");
    } finally {
      setLoading(false);
    }
  };

  const loadProcessorDetails = async (processorId) => {
    try {
      console.log('Loading processor details:', processorId);
      const processorDetails = await getProcessorDetails(processorId);
      console.log('Processor details received:', processorDetails);
      
      if (processorDetails) {
        // Set workload data
        setWorkload({
          active_assignments_count: processorDetails.active_assignments?.length || 0,
          pending_requests: processorDetails.workload?.assigned || 0,
          in_progress_requests: processorDetails.workload?.in_progress || 0,
          completed_requests: processorDetails.workload?.completed || 0,
          total_assignments: processorDetails.workload?.total_assignments || 0
        });
        
        // Set active assignments
        setActiveAssignments(processorDetails.active_assignments || []);
        
        console.log('Workload data set:', {
          active_assignments_count: processorDetails.active_assignments?.length || 0,
          pending_requests: processorDetails.workload?.assigned || 0,
          in_progress_requests: processorDetails.workload?.in_progress || 0,
          completed_requests: processorDetails.workload?.completed || 0,
          total_assignments: processorDetails.workload?.total_assignments || 0
        });
        
        console.log('Active assignments set:', processorDetails.active_assignments || []);
      }
    } catch (error) {
      console.error('Error loading processor details:', error);
      // In case of error, set default values
      setWorkload({
        active_assignments_count: 0,
        pending_requests: 0,
        in_progress_requests: 0,
        completed_requests: 0,
        total_assignments: 0
      });
      setActiveAssignments([]);
    }
  };

  const handleback = () => {
    if (editMode) {
      if (window.confirm('Are you sure you want to exit? Unsaved changes will be lost.')) {
        navegate('/processors');
      }
    } else {
      navegate('/processors');
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleUpdate = () => {
    setEditMode(true);
    setFeedback("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setFeedback("");
    setCompanyError("");
    setRoleError("");
    
    // Validations
    if (!formData.full_name || !formData.phone || !formData.identification || !formData.address || !formData.company_id) {
      if (!formData.company_id) setCompanyError("You must select a company");
      setFeedback("All fields are required, including company");
      setLoading(false);
      return;
    }

    // Password validation if changing
    if (formData.password) {
      if (formData.password.length < 8) {
        setFeedback("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      
      if (formData.password !== formData.confirmarContrasena) {
        setFeedback("Passwords do not match");
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        identification: formData.identification,
        address: formData.address,
        company_id: Number(formData.company_id),
        url_profile_photo: formData.url_profile_photo,
        role: formData.role,
        is_active: formData.is_active
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      await updateProcessor(id, payload);
      setFeedback("Processor updated successfully!");
      setOriginalData(formData);
      setEditMode(false);
      
      // Reload data after updating
      await loadProcessorData();
      
      setTimeout(() => {
        navegate('/processors');
      }, 1500);
    } catch (error) {
      console.error('Error updating processor:', error);
      if (error.response?.data?.detail) {
        const errorDetails = error.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const passwordError = errorDetails.find(err => err.loc?.includes('password'));
          if (passwordError) {
            setFeedback(`Password error: ${passwordError.msg}`);
          } else {
            setFeedback(`Error: ${errorDetails[0]?.msg || 'Error updating processor'}`);
          }
        } else {
          setFeedback(`Error: ${errorDetails}`);
        }
      } else {
        setFeedback("Error updating processor. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          url_profile_photo: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading && !editMode) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="internal_layout">
      <div className="container-fluid mb-4 mt-5">
        <div className="d-flex align-items-center">
          <button className="btn border-none" onClick={handleback}>
            <img src={Back} alt="back" width={35} />
          </button>
          <h2 className={`${styles.title} fw-bolder my_title_color m-0`}>
            {id ? "Processor Details" : "Create Processor"}
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid p-4">
        <div className="row">
          {/* Form Column */}
          <div className="col-md-7 col-lg-6">
            <form onSubmit={handleSubmit} autoComplete="off">
              <div className="row mb-2">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={`form-control  ${styles.input}`}
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Email</label>
                  <input
                    type="email"
                    placeholder="Email"
                    className={`form-control  ${styles.input}`}
                    name="email"
                    value={formData.email}
                    disabled
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Phone</label>
                  <input
                    type="tel"
                    placeholder="Phone"
                    className={`form-control  ${styles.input}`}
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label text-muted small">Identification</label>
                  <input
                    type="text"
                    placeholder="Identification"
                    className={`form-control  ${styles.input}`}
                    name="identification"
                    value={formData.identification}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12 mb-2">
                  <label className="form-label text-muted small">Address</label>
                  <input
                    type="text"
                    placeholder="Address"
                    className={`form-control  ${styles.input}`}
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    disabled={!editMode}
                  />
                </div>
              </div>

              <div className="row mb-4">
                <div className="col-12 mb-2">
                  <label className="form-label text-muted small">Company</label>
                  <select
                    className={`form-select ${styles.input} ${companyError ? 'is-invalid' : ''}`}
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    required
                    disabled={!editMode}
                  >
                    <option value="">Select a company</option>
                    {companies && companies.map(({ id, name }) => (
                      <option value={id} key={id}>{name}</option>
                    ))}
                  </select>
                  {companyError && <div className="invalid-feedback d-block">{companyError}</div>}
                </div>
              </div>

              {/* Status Field */}
              <div className="row mb-4">
                <div className="col-12 mb-2">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      disabled={!editMode}
                    />
                    <label className="form-check-label my_title_color" htmlFor="is_active">
                      Active Processor
                    </label>
                  </div>
                  <small className="text-muted">
                    {editMode ? "Uncheck this box to deactivate the processor" : "Current processor status"}
                  </small>
                </div>
              </div>

              {roleError && (
                <div className="alert alert-danger py-2 mb-3">{roleError}</div>
              )}

              {/* Password fields - only visible in edit mode */}
              {editMode && (
                <div className="row mb-5">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Password</label>
                    <input
                      type="password"
                      placeholder="Minimum 8 characters"
                      className={`form-control  ${styles.input}`}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      minLength={8}
                    />
                    {formData.password && formData.password.length < 8 && (
                      <small className="text-warning">
                        Password must be at least 8 characters
                      </small>
                    )}
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm your password"
                      className={`form-control  ${styles.input}`}
                      name="confirmarContrasena"
                      value={formData.confirmarContrasena}
                      onChange={handleInputChange}
                    />
                    {formData.confirmarContrasena && formData.password !== formData.confirmarContrasena && (
                      <small className="text-danger">
                        Passwords do not match
                      </small>
                    )}
                  </div>
                </div>
              )}

              {feedback && (
                <div className={`alert ${feedback.includes("successfully") ? "alert-success" : "alert-danger"} py-2 mb-3`}>
                  {feedback}
                </div>
              )}

              {editMode && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn text-white fw-semibold px-3 py-2 rounded-pill "
                  style={{
                    backgroundColor: "#2c3e50",
                    border: "none",
                    fontSize: "16px",
                    minWidth: "180px",
                  }}
                >
                  {loading ? "SAVING..." : "SAVE CHANGES"}
                </button>
              )}
            </form>

            {!editMode && (
              <button
                type="button"
                className="btn btn-warning fw-semibold px-3 py-2 rounded-pill me-3 mb-3"
                style={{ minWidth: "180px" }}
                onClick={handleUpdate}
              >
                UPDATE
              </button>
            )}
          </div>

          {/* Image Upload Column */}
          <div className="col-md-5 col-lg-6 d-flex justify-content-center align-items-start">
            <div className="text-center">
              <div
                className="d-flex align-items-center justify-content-center mb-3 border border-2 border-light rounded"
                style={{
                  width: "300px",
                  height: "300px",
                  backgroundColor: "#e9ecef",
                  borderStyle: "dashed !important",
                  overflow: "hidden",
                  position: "relative"
                }}
              >
                {formData.url_profile_photo ? (
                  <img
                    src={formData.url_profile_photo}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                ) : (
                  <div className="text-center text-muted">
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21,15 16,10 5,21"></polyline>
                    </svg>
                  </div>
                )}
              </div>
              <div className="small text-muted mb-3">300 x 300</div>
              <input
                type="file"
                id="imageUpload"
                className="d-none"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={!editMode}
              />
              {editMode && (
                <label
                  htmlFor="imageUpload"
                  className="btn text-white fw-semibold px-4 py-2 rounded-pill "
                  style={{
                    backgroundColor: "#2c3e50",
                    border: "none",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  UPLOAD IMAGE
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Statistics and Metrics Section */}
        <div className="row mt-5">
          <div className="col-12">
            <h3 className="fw-bold mb-4" style={{color: "#000"}}>Workload</h3>
            <div className="alert alert-success mb-4">
              <i className="bi bi-check-circle me-2"></i>
              <strong>Real-time data:</strong> Workload information is automatically updated from the backend.
            </div>
            
            <div className="row g-3 mb-4">
              <div className="col-md-2">
                <div className="p-3 border rounded" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="small my_title_color">Total Assignments</div>
                  <div className="h3 mb-0 my_title_color">{workload?.total_assignments || 0}</div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded" style={{ backgroundColor: '#e3f2fd' }}>
                  <div className="small my_title_color">Assigned</div>
                  <div className="h3 mb-0 my_title_color">{workload?.pending_requests || 0}</div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded" style={{ backgroundColor: '#fff3e0' }}>
                  <div className="small my_title_color">In Progress</div>
                  <div className="h3 mb-0 my_title_color">{workload?.in_progress_requests || 0}</div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded" style={{ backgroundColor: '#e8f5e8' }}>
                  <div className="small my_title_color">Completed</div>
                  <div className="h3 mb-0 my_title_color">{workload?.completed_requests || 0}</div>
                </div>
              </div>
              <div className="col-md-2">
                <div className="p-3 border rounded" style={{ backgroundColor: '#fce4ec' }}>
                  <div className="small my_title_color">Active</div>
                  <div className="h3 mb-0 my_title_color">{workload?.active_assignments_count || 0}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Active Assignments Section */}
        <div className="row mt-4">
          <div className="col-12">
            <h3 className="fw-bold mb-4" style={{color: "#000"}}>Active Assignments</h3>
            {activeAssignments && activeAssignments.length > 0 ? (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th className="my_title_color">ID</th>
                      <th className="my_title_color">Type</th>
                      <th className="my_title_color">Client</th>
                      <th className="my_title_color">Address</th>
                      <th className="my_title_color">Status</th>
                      <th className="my_title_color">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAssignments.map(assignment => (
                      <tr key={assignment.id}>
                        <td className="my_title_color">{assignment.id}</td>
                        <td>
                          <span className="badge bg-info">
                            {assignment.request_type?.toUpperCase()}
                          </span>
                        </td>
                        <td className="my_title_color">
                          {assignment.request_details?.client_name || 'N/A'}
                        </td>
                        <td className="my_title_color">
                          {assignment.request_details?.property_address || 'N/A'}
                        </td>
                        <td>
                          <span className={`badge ${
                            assignment.request_details?.status === 'PRICING' ? 'bg-warning' :
                            assignment.request_details?.status === 'IN_REVIEW' ? 'bg-info' :
                            assignment.request_details?.status === 'ACCEPTED' ? 'bg-success' :
                            assignment.request_details?.status === 'PENDING' ? 'bg-secondary' :
                            'bg-secondary'
                          }`}>
                            {assignment.request_details?.status || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <small className="my_title_color">
                            {new Date(assignment.assigned_at).toLocaleDateString()}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="alert alert-info mb-0">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>No active assignments</strong>
                  <br />
                  <small className="text-muted">
                    This processor has no active assignments at this time.
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailProcesor;
