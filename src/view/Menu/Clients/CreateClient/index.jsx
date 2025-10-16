import React, { useEffect, useState } from "react";
import styles from "./style.module.css";
import Back from "../../../../assets/back.svg";
import { useNavigate, useParams } from "react-router-dom";
import { getCompanies } from "../../../../Api/admin";
import { createClient, updateClient, getClientById } from "../../../../Api/client";

const initialState = {
  nombre: "",
  empresa: "",
  correo: "",
  telefono: "",
  direccion: "",
  compraRefinanciacion: false,
  hipoteca: false,
  morosidad: false,
  impuestos: false,
  hoa: false,
  llc: false,
};

const CreateOrEditClient = () => {
  const navegate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [companies, setCompanies] = useState([]);

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
      setEditMode(true);
      setLoading(true);
      getClientById(id).then((data) => {
        setForm(data);
        setLoading(false);
      }).catch(() => {
        setLoading(false);
        setFeedback("Error loading client");
      });
    }
  }, [id]);

  const handleback = () => {
    navegate("/clients");
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");
    
    // Basic validation of required fields
    if (!form.nombre || !form.correo || !form.empresa || !form.direccion) {
      setFeedback("Name, email, company and address are required");
      setLoading(false);
      return;
    }

    // Minimum length validation
    if (form.nombre.length < 3) {
      setFeedback("Name must be at least 3 characters");
      setLoading(false);
      return;
    }

    if (form.direccion.length < 10) {
      setFeedback("Address must be at least 10 characters");
      setLoading(false);
      return;
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.correo)) {
      setFeedback("Email format is not valid");
      setLoading(false);
      return;
    }

    // Phone validation (if provided)
    if (form.telefono && form.telefono.length < 7) {
      setFeedback("Phone number must be at least 7 digits");
      setLoading(false);
      return;
    }

    // Mapping fields to API expected format
    const payload = {
      full_name: form.nombre.trim(),
      email: form.correo.trim().toLowerCase(),
      phone: form.telefono.trim(),
      company_id: Number(form.empresa),
      address: form.direccion.trim(),
      purchase_or_refinancing: form.compraRefinanciacion,
      has_a_mortgage: form.hipoteca,
      has_delinquencies: form.morosidad,
      pays_taxes: form.impuestos,
      current_hoa: form.hoa,
      subject_under_llc: form.llc
    };

    // Debug: show payload in console
    console.log("Payload to send:", payload);

    try {
      if (editMode) {
        // Update client
        const response = await updateClient(id, payload);
        console.log("Update response:", response);
        setFeedback("Client updated successfully!");
        setTimeout(() => {
          navegate("/clients");
        }, 1500);
      } else {
        // Create client
        const response = await createClient(payload);
        console.log("Creation response:", response);
        setFeedback("Client created successfully!");
        setForm(initialState);
        setTimeout(() => {
          navegate("/clients");
        }, 1500);
      }
    } catch (error) {
      console.error("Complete error:", error);
      console.error("Server response:", error.response?.data);
      
      if (error.response?.data?.detail) {
        setFeedback(`Error: ${error.response.data.detail}`);
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data?.detail || [];
        const errorMessages = validationErrors.map(err => `${err.loc?.join('.')}: ${err.msg}`).join(', ');
        setFeedback(`Validation error: ${errorMessages}`);
      } else if (error.response?.status === 400) {
        setFeedback("Error in submitted data. Check the information.");
      } else if (error.response?.status === 401) {
        setFeedback("Unauthorized. Verify your session.");
      } else if (error.response?.status === 500) {
        setFeedback("Server error. Try again later.");
      } else {
        setFeedback("Error saving client. Please try again.");
      }
    }
    setLoading(false);
  };

  return (
    <div className={`${styles.container} p-5 internal_layout`}>
      <div className="d-flex align-items-center mb-5">
        <button className="btn border-none" onClick={handleback}>
          <img src={Back} alt="back" width={35} />
        </button>
        <h2 className={`${styles.title} fw-bolder my_title_color`}>
          {editMode ? "Update Client" : "Register Client"}
        </h2>
      </div>
             {loading ? (
         <div>Loading data...</div>
       ) : (
         <div className="container-fluid p-4">
           <div className="row">
             <div className="col-12 col-lg-8 col-xl-6">
               <form className={styles.form} onSubmit={handleSubmit}>
                 <div className="row g-3">
                   <div className="col-12 col-md-6">
                     <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Client Name</label>
                     <input
                       type="text"
                       className={`form-control ${styles.input}`}
                       name="nombre"
                       value={form.nombre}
                       onChange={handleChange}
                       required
                     />
                   </div>
                   <div className="col-12 col-md-6">
                     <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Company</label>
                     <select
                       name="empresa"
                       id="options_companies"
                       className={`form-select ${styles.input}`}
                       value={form.empresa}
                       onChange={handleChange}
                       required
                     >
                       <option value="">Select a company</option>
                       {companies && companies.map(({ id, name }) => (
                         <option value={id} key={id}>{name}</option>
                       ))}
                     </select>
                   </div>
                   <div className="col-12 col-md-6">
                     <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Email Address</label>
                     <input
                       type="email"
                       className={`form-control ${styles.input}`}
                       name="correo"
                       value={form.correo}
                       onChange={handleChange}
                       required
                     />
                   </div>
                   <div className="col-12 col-md-6">
                     <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Phone Number</label>
                     <input
                       type="tel"
                       className={`form-control ${styles.input}`}
                       name="telefono"
                       value={form.telefono}
                       onChange={handleChange}
                     />
                   </div>
                   <div className="col-12">
                     <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Property Address</label>
                     <input
                       type="text"
                       className={`form-control ${styles.input}`}
                       name="direccion"
                       value={form.direccion}
                       onChange={handleChange}
                       required
                     />
                   </div>
                 </div>
                 
                 {/* <label className={styles.checkboxContainer}>
                   <input
                     type="checkbox"
                     name="compraRefinanciacion"
                     checked={form.compraRefinanciacion}
                     onChange={handleChange}
                   />
                   <span>¿Compra o refinanciación?</span>
                 </label> */}
                 
                 {/* <div className={`${styles.checkboxGroup} mb-4`}>
                   <label className={styles.checkboxContainer}>
                     <input
                       type="checkbox"
                       name="hipoteca"
                       checked={form.hipoteca}
                       onChange={handleChange}
                     />
                     <span>¿Tiene hipoteca?</span>
                   </label>
                   <label className={styles.checkboxContainer}>
                     <input
                       type="checkbox"
                       name="morosidad"
                       checked={form.morosidad}
                       onChange={handleChange}
                     />
                     <span>¿Tiene morosidad?</span>
                   </label>
                   <label className={styles.checkboxContainer}>
                     <input
                       type="checkbox"
                       name="impuestos"
                       checked={form.impuestos}
                       onChange={handleChange}
                     />
                     <span>¿Paga impuestos?</span>
                   </label>
                   <label className={styles.checkboxContainer}>
                     <input
                       type="checkbox"
                       name="hoa"
                       checked={form.hoa}
                       onChange={handleChange}
                     />
                     <span>¿HOA vigente?</span>
                   </label>
                   <label className={styles.checkboxContainer}>
                     <input
                       type="checkbox"
                       name="llc"
                       checked={form.llc}
                       onChange={handleChange}
                     />
                     <span>¿Sujeto bajo LLC?</span>
                   </label>
                 </div> */}
                 
                 {feedback && (
                   <div style={{ 
                     color: feedback.includes("Error") ? 'red' : 'green', 
                     marginBottom: 10,
                     padding: '10px',
                     borderRadius: '5px',
                     backgroundColor: feedback.includes("Error") ? '#ffe6e6' : '#e6ffe6'
                   }}>
                     {feedback}
                   </div>
                 )}
                 
                 <button 
                   type="submit" 
                   disabled={loading}
                   className="btn text-white fw-semibold px-3 py-2 rounded-pill"
                   style={{
                     backgroundColor: "#2c3e50",
                     border: "none",
                     fontSize: "16px",
                     minWidth: "180px",
                   }}
                 >
                   {loading ? "Saving..." : (editMode ? "UPDATE" : "CREATE")}
                 </button>
               </form>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 };

export default CreateOrEditClient;
