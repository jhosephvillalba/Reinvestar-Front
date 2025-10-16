import React, { useState, useEffect } from "react";
import styles from "./style.module.css";
import FixflipForm from "./Fixflip";
import ConstructionForm from "./Construction";
import DscrForm from "./Dscr";
import { getClients, createClient } from "../../../../../Api/client";
import { getCompanies } from "../../../../../Api/admin";

const initialClient = {
  nombre: "",
  correo: "",
  telefono: "",
  direccion: "",
  empresa: "",
  tipoProducto: "",
  fechaRegistro: "",
};

const FormRequest = ({ goToDocumentsTab }) => {
  const [form, setForm] = useState(initialClient);
  const [clientId, setClientId] = useState("");
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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

  // Search clients by email (search) live
  const handleCorreoChange = async (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, correo: value }));
    setClienteEncontrado(false);
    setClientId("");
    setFeedback("");
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await getClients({ search: value });
      
      // Handle new data structure with total and items
      let clientes = [];
      if (Array.isArray(res)) {
        // If API returns an array directly
        clientes = res;
      } else if (res && Array.isArray(res.items)) {
        // If API returns { total: N, items: [...] }
        clientes = res.items;
      } else if (res && Array.isArray(res.results)) {
        // If API returns { total: N, results: [...] }
        clientes = res.results;
      }
      
      if (clientes.length > 0) {
        setSuggestions(clientes);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error searching clients:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // When selecting a client from the list
  const handleSuggestionClick = (cliente) => {
    setForm(prev => ({
      ...prev,
      correo: cliente.email || cliente.correo || "",
      nombre: cliente.full_name || cliente.nombre || "",
      telefono: cliente.phone || cliente.telefono || "",
      direccion: cliente.address || cliente.direccion || "",
      empresa: cliente.company_id ? String(cliente.company_id) : "",
    }));
    setClientId(cliente.id);
    setClienteEncontrado(true);
    setSuggestions([]);
    setShowSuggestions(false);
    setFeedback(`Client found: ${cliente.full_name || cliente.nombre}`);
  };

  // Handle changes in the rest of the form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Register client if it doesn't exist
  const handleCreateClient = async () => {
    setFeedback("");
    setLoading(true);
    if (!form.nombre || !form.correo || !form.direccion) {
      setFeedback("Name, email and address are required");
      setLoading(false);
      return;
    }
    try {
      const nuevo = await createClient({
        full_name: form.nombre,
        email: form.correo,
        phone: form.telefono,
        address: form.direccion,
        company_id: form.empresa ? Number(form.empresa) : undefined,
        purchase_or_refinancing: !!form.purchase_or_refinancing,
        has_a_mortgage: !!form.has_a_mortgage,
        has_delinquencies: !!form.has_delinquencies,
        pays_taxes: !!form.pays_taxes,
        current_hoa: !!form.current_hoa,
        subject_under_llc: !!form.subject_under_llc,
      });
      setClientId(nuevo.id);
      setClienteEncontrado(true);
      setForm(prev => ({
        ...prev,
        nombre: nuevo.full_name,
        correo: nuevo.email,
        telefono: nuevo.phone,
        direccion: nuevo.address,
        empresa: nuevo.company_id ? String(nuevo.company_id) : "",
        // Ensure booleans are also reflected
        purchase_or_refinancing: !!nuevo.purchase_or_refinancing,
        has_a_mortgage: !!nuevo.has_a_mortgage,
        has_delinquencies: !!nuevo.has_delinquencies,
        pays_taxes: !!nuevo.pays_taxes,
        current_hoa: !!nuevo.current_hoa,
        subject_under_llc: !!nuevo.subject_under_llc,
      }));
      setFeedback("Client registered and selected successfully");
    } catch (err) {
      setFeedback("Error registering client");
    }
    setLoading(false);
  };

  // Register client if it doesn't exist
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");
    setLoading(true);
    if (!form.nombre || !form.correo || !form.direccion) {
      setFeedback("Name, email and address are required");
      setLoading(false);
      return;
    }
    if (clienteEncontrado) {
      setFeedback("Client already exists. You can continue with the request.");
      setLoading(false);
      return;
    }
    try {
      const nuevo = await createClient({
        full_name: form.nombre,
        email: form.correo,
        phone: form.telefono,
        address: form.direccion,
        company_id: form.empresa ? Number(form.empresa) : undefined,
      });
      setClientId(nuevo.id);
      setClienteEncontrado(true);
      setFeedback("Client registered successfully");
    } catch (err) {
      setFeedback("Error registering client");
    }
    setLoading(false);
  };

  return (
    <div className="container-fluid ">
      <form className={`${styles.form} mb-2 mt-2`} onSubmit={handleSubmit} autoComplete="off">
        <div className="row">
          <div className="col-4">
            <div className="w-100 d-flex flex-column position-relative">
              <label htmlFor="correo">Email</label>
          <input
                type="email"
                placeholder="Email address"
            className={styles.input}
                name="correo"
                id="correo"
                value={form.correo}
                onChange={handleCorreoChange}
            required
                autoComplete="off"
          />
              {/* Email suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <ul style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  background: "#fff",
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  maxHeight: 180,
                  overflowY: "auto",
                  margin: 0,
                  padding: 0,
                  listStyle: "none",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                }}>
                  {suggestions.map(cliente => (
                    <li
                      key={cliente.id}
                      style={{ 
                        padding: "12px 16px", 
                        cursor: "pointer",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: "14px"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f9fafb";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = "#fff";
                      }}
                      onClick={() => handleSuggestionClick(cliente)}
                    >
                      <div style={{ fontWeight: "500", color: "#374151" }}>
                        {cliente.email}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>
                        {cliente.full_name || cliente.nombre} • {cliente.phone || cliente.telefono || "No phone"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
        </div>
      </div>
          <div className="col-4">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="correo">Client Name</label>
          <input
            type="text"
                placeholder="Client name"
            className={styles.input}
            name="nombre"
            value={form.nombre}
            onChange={handleChange}
            required
                disabled={clienteEncontrado}
          />
        </div>
          </div>
          {/* --------------COMPANIES--------------- */}
          <div className="col-4">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="options_companies">Company</label>
              <select
                name="empresa"
                id="options_companies"
            className={styles.input}
                value={form.empresa}
            onChange={handleChange}
            required
                disabled={clienteEncontrado}
              >
                <option value="">Select a company</option>
                {companies && companies.map(({ id, name }) => (
                  <option value={id} key={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="telefono">Phone Number</label>
          <input
            type="tel"
                placeholder="Phone number"
            className={styles.input}
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
                disabled={clienteEncontrado}
          />
        </div>
      </div>
          <div className="col-6">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="direccion">Property Address</label>
          <input
            type="text"
                placeholder="Property address"
            className={styles.input}
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            required
                disabled={clienteEncontrado}
          />
        </div>
          </div>
        </div>

        {/* Button to create client if it doesn't exist */}
        {!clienteEncontrado && !loading && form.correo && form.nombre && form.direccion && (
          <div className="row">
            <div className="col-12 d-flex justify-content-end">
              <button
                type="button"
                className={styles.button}
                style={{ maxWidth: 250 }}
                onClick={handleCreateClient}
              >
                Create Client
              </button>
            </div>
          </div>
        )}

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
      </form>

      <hr className="mt-2 mb-2"/>
      
      <div className={`row`}>
        <div className="col-6">
          <div className="w-100 d-flex flex-column">
            <label htmlFor="pruduct_type">Product Type</label>
            <select
              name="tipoProducto"
              id="product_type"
              className={styles.input}
              value={form.tipoProducto}
              onChange={handleChange}
            >
              <option value="">Select a product</option>
              <option value="fixflip">FixFlip</option>
              <option value="dscr">Dscr</option>
              <option value="construction">Contruction</option>
            </select>
          </div>
        </div>
        {/* <div className="col-6">
          <div className="w-100 d-flex flex-column">
            <label htmlFor="fecha_registro">Registration date</label>
            <input type="date" id="fecha_registro" className={styles.input} />
          </div>
        </div> */}
      </div>
      <hr className="mt-2 mb-2"/>
      {/* Product form only if there is a client and product type */}
      {form.tipoProducto && (
        <div className="mt-4">
          {form.tipoProducto === "fixflip" && <FixflipForm client_id={clientId} goToDocumentsTab={goToDocumentsTab} />}
          {form.tipoProducto === "construction" && <ConstructionForm client_id={clientId} goToDocumentsTab={goToDocumentsTab} />}
          {form.tipoProducto === "dscr" && <DscrForm client_id={clientId} goToDocumentsTab={goToDocumentsTab} />}
        </div>
      )}
      </div>
  );
};

export default FormRequest; 
