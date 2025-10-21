import React, { useState } from "react";
import Back from "../../../../../assets/back.svg"; 
import { useNavigate } from "react-router-dom";
import styles from "./style.module.css";
import { createProcessor } from "../../../../../Api/procesor";

const CreateProcesor = () => {
  const navegate = useNavigate(); 
  const [formData, setFormData] = useState({
    nombreCompleto: "",
    email: "",
    celular: "",
    identificacion: "",
    direccion: "",
    contrasena: "",
    confirmarContrasena: "",
  });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleback = () => {
    navegate('/processors')
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");
    
    // Basic validation
    if (!formData.nombreCompleto || !formData.email || !formData.celular || !formData.identificacion || !formData.direccion || !formData.contrasena) {
      setFeedback("All fields are required");
      setLoading(false);
      return;
    }
    
    // Password validation
    if (formData.contrasena.length < 8) {
      setFeedback("Password must be at least 8 characters");
      setLoading(false);
      return;
    }
    
    if (formData.contrasena !== formData.confirmarContrasena) {
      setFeedback("Passwords do not match");
      setLoading(false);
      return;
    }
    
    // Mapping fields to API expected format
    const payload = {
      full_name: formData.nombreCompleto,
      email: formData.email,
      phone: formData.celular,
      identification: formData.identificacion,
      address: formData.direccion,
      password: formData.contrasena,
      role: "Procesador"
    };
    
    try {
      await createProcessor(payload);
      setFeedback("Processor created successfully!");
      setTimeout(() => {
        navegate('/processors');
      }, 1500);
    } catch (error) {
      console.error('Error creating processor:', error);
      if (error.response?.data?.detail) {
        // Handle specific backend errors
        const errorDetails = error.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const passwordError = errorDetails.find(err => err.loc?.includes('password'));
          if (passwordError) {
            setFeedback(`Password error: ${passwordError.msg}`);
          } else {
            setFeedback(`Error: ${errorDetails[0]?.msg || 'Error creating processor'}`);
          }
        } else {
          setFeedback(`Error: ${errorDetails}`);
        }
      } else {
        setFeedback("Error creating processor. Please try again.");
      }
    }
    setLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log("Image selected:", file.name);
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
              Create Processor
            </h2>
          </div>
        </div>

      {/* Main Content */}
      <div className="container-fluid p-4">
        <div className="row">
          {/* Form Column */}
          <div className="col-md-7 col-lg-6">
            <form>
              <div className="row mb-2">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Full Name</label>
                  <input
                    type="text"
                    placeholder="Full Name"
                    className={`form-control  ${styles.input}`}
                    name="nombreCompleto"
                    value={formData.nombreCompleto}
                    onChange={handleInputChange}
                    disabled={loading}
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
                    onChange={handleInputChange}
                    disabled={loading}
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
                    name="celular"
                    value={formData.celular}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                <div className="col-md-6 mb-2">
                  <label className="form-label text-muted small">Identification</label>
                  <input
                    type="text"
                    placeholder="Identification"
                    className={`form-control  ${styles.input}`}
                    name="identificacion"
                    value={formData.identificacion}
                    onChange={handleInputChange}
                    disabled={loading}
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
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="row mb-5">
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Password *</label>
                  <input
                    type="password"
                    placeholder="Minimum 8 characters"
                    className={`form-control  ${styles.input}`}
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleInputChange}
                    disabled={loading}
                    minLength={8}
                  />
                  {formData.contrasena && formData.contrasena.length < 8 && (
                    <small className="text-warning">
                      Password must be at least 8 characters
                    </small>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label text-muted small">Confirm Password *</label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    className={`form-control  ${styles.input}`}
                    name="confirmarContrasena"
                    value={formData.confirmarContrasena}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                  {formData.confirmarContrasena && formData.contrasena !== formData.confirmarContrasena && (
                    <small className="text-danger">
                      Passwords do not match
                    </small>
                  )}
                </div>
              </div>

              {feedback && (
                <div className={`alert ${feedback.includes('successfully') ? 'alert-success' : 'alert-danger'} py-2 mb-3`}>{feedback}</div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                className="btn text-white fw-semibold px-3 py-2 rounded-pill "
                style={{
                  backgroundColor: "#2c3e50",
                  border: "none",
                  fontSize: "16px",
                  minWidth: "180px",
                }}
                disabled={loading}
              >
                {loading ? "CREATING..." : "CREATE"}
              </button>
            </form>
          </div>

          {/* Image Upload Column */}
          <div className="col-md-5 col-lg-6 d-flex justify-content-center align-items-start">
            {/* <div className="text-center">
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
                SUBIR IMAGEN
              </label>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateProcesor;
