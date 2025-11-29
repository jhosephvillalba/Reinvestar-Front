import React, { useState, useEffect } from "react";
import Back from "../../../../../assets/back.svg"; 
import { useNavigate, useParams } from "react-router-dom";
import styles from "./style.module.css";
import { getSellerById, updateSeller } from "../../../../../Api/seller";
import { getCompanies } from "../../../../../Api/admin";

const DetailSeller = () => {
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
    role: "Vendedor",
    is_active: true
  });
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
      setLoading(true);
      getSellerById(id)
        .then((data) => {
          setFormData({
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone || "",
            identification: data.identification || "",
            address: data.address || "",
            company_id: data.company_id ? String(data.company_id) : "",
            url_profile_photo: data.url_profile_photo || "",
            password: "",
            confirmarContrasena: "",
            role: data.roles?.[0] || "Vendedor",
            is_active: data.is_active !== undefined ? data.is_active : true
          });
        })
        .catch((error) => {
          console.error('Error loading seller:', error);
          setFeedback("Error loading seller");
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleback = () => {
    navegate('/sellers')
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
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
    
    // Basic validation
    if (!formData.full_name || !formData.phone || !formData.identification || !formData.address || !formData.company_id) {
      if (!formData.company_id) setCompanyError("You must select a company");
      setFeedback("All fields are required, including company");
      setLoading(false);
      return;
    }

    // Password validation if changing (only if something is entered)
    if (formData.password && formData.password.trim() !== "") {
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

    // Payload with exact field names
    const payload = {
      full_name: formData.full_name,
      email: formData.email,
      phone: formData.phone,
      identification: formData.identification,
      address: formData.address,
      company_id: Number(formData.company_id),
      url_profile_photo: formData.url_profile_photo,
      role: formData.role,
      is_active: formData.is_active,
      password: formData.password || "" // Always send password (empty string if not filled)
    };
    
    if (!payload.role) {
      setRoleError("Role field is required");
      setLoading(false);
      return;
    }
    
    try {
      await updateSeller(id, payload);
      setFeedback("Seller updated successfully!");
      setEditMode(false);
      setTimeout(() => {
        navegate('/sellers');
      }, 1500);
    } catch (error) {
      console.error('Error updating seller:', error);
      if (error.response?.data?.detail) {
        // Handle specific backend errors
        const errorDetails = error.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const passwordError = errorDetails.find(err => err.loc?.includes('password'));
          if (passwordError) {
            setFeedback(`Password error: ${passwordError.msg}`);
          } else {
            setFeedback(`Error: ${errorDetails[0]?.msg || 'Error updating seller'}`);
          }
        } else {
          setFeedback(`Error: ${errorDetails}`);
        }
      } else {
        setFeedback("Error updating seller. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Here you could upload the image and get the URL
      // For now, just save the name as an example
      setFormData((prev) => ({ ...prev, url_profile_photo: file.name }));
      alert(`Image "${file.name}" selected`);
    }
  };

  return (
    <div className="internal_layout">
       <div className="container-fluid mb-4 mt-5">
          <div className="d-flex align-items-center">
            <button className="btn border-none" onClick={handleback}>
              <img src={Back} alt="back" width={35} />
            </button>
            <h2 className={`${styles.title} fw-bolder my_title_color m-0`}>
              {id ? "Business Advisor Details" : "Create Business Advisor"}
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
                      Active Seller
                    </label>
                  </div>
                  <small className="text-muted">
                    {editMode ? "Uncheck this box to deactivate the seller" : "Current seller status"}
                  </small>
                </div>
              </div>

              {roleError && (
                <div className="alert alert-danger py-2 mb-3">{roleError}</div>
              )}

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
                    disabled={!editMode}
                    minLength={8}
                  />
                  {formData.password && formData.password.trim() !== "" && formData.password.length < 8 && (
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
                    disabled={!editMode}
                  />
                  {formData.confirmarContrasena && formData.password.trim() !== "" && formData.password !== formData.confirmarContrasena && (
                    <small className="text-danger">
                      Passwords do not match
                    </small>
                  )}
                </div>
              </div>

              {feedback && (
                <div className={`alert ${feedback.includes("successfully") ? "alert-success" : "alert-danger"} py-2 mb-3`}>{feedback}</div>
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
                }}
              >
                <div className="text-center text-muted">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                  >
                    <rect
                      x="3"
                      y="3"
                      width="18"
                      height="18"
                      rx="2"
                      ry="2"
                    ></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21,15 16,10 5,21"></polyline>
                  </svg>
                </div>
              </div>
              <div className="small text-muted mb-3">300 x 300</div>
              <input
                type="file"
                id="imageUpload"
                className="d-none"
                accept="image/*"
                onChange={handleImageUpload}
              />
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailSeller;
