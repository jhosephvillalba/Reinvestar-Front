import React, { useState } from "react";
import styles from "./style.module.css";
import FixflipForm from "./Fixflip";
import ConstructionForm from "./Construction";
import DscrForm from "./Dscr";
import { getClients, createClient } from "../../../../../Api/client";

const initialClient = {
  name: "",
  email: "",
  phone: "",
  address: "",
  productType: "",
  registrationDate: "",
};

const FormRequest = () => {
  const [form, setForm] = useState(initialClient);
  const [clientId, setClientId] = useState("");
  const [clientFound, setClientFound] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search clients by email (search) in real time
  const handleEmailChange = async (e) => {
    const value = e.target.value;
    setForm(prev => ({ ...prev, email: value }));
    setClientFound(false);
    setClientId("");
    setFeedback("");
    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    try {
      const res = await getClients({ search: value });
      if (res && res.length > 0) {
        setSuggestions(res);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // When selecting a client from the list
  const handleSuggestionClick = (client) => {
    setForm(prev => ({
      ...prev,
      email: client.email || client.correo || "",
      name: client.full_name || client.nombre || "",
      phone: client.phone || client.telefono || "",
      address: client.address || client.direccion || "",
    }));
    setClientId(client.id);
    setClientFound(true);
    setSuggestions([]);
    setShowSuggestions(false);
    setFeedback("Client found and loaded");
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
    if (!form.name || !form.email || !form.address) {
      setFeedback("Name, email and address are required");
      setLoading(false);
      return;
    }
    try {
      const newClient = await createClient({
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        purchase_or_refinancing: !!form.purchase_or_refinancing,
        has_a_mortgage: !!form.has_a_mortgage,
        has_delinquencies: !!form.has_delinquencies,
        pays_taxes: !!form.pays_taxes,
        current_hoa: !!form.current_hoa,
        subject_under_llc: !!form.subject_under_llc,
      });
      setClientId(newClient.id);
      setClientFound(true);
      setForm(prev => ({
        ...prev,
        name: newClient.full_name,
        email: newClient.email,
        phone: newClient.phone,
        address: newClient.address,
        // Ensure booleans are also reflected
        purchase_or_refinancing: !!newClient.purchase_or_refinancing,
        has_a_mortgage: !!newClient.has_a_mortgage,
        has_delinquencies: !!newClient.has_delinquencies,
        pays_taxes: !!newClient.pays_taxes,
        current_hoa: !!newClient.current_hoa,
        subject_under_llc: !!newClient.subject_under_llc,
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
    if (!form.name || !form.email || !form.address) {
      setFeedback("Name, email and address are required");
      setLoading(false);
      return;
    }
    if (clientFound) {
      setFeedback("Client already exists. You can continue with the request.");
      setLoading(false);
      return;
    }
    try {
      const newClient = await createClient({
        full_name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
      });
      setClientId(newClient.id);
      setClientFound(true);
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
          <div className="col-6">
            <div className="w-100 d-flex flex-column position-relative">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                placeholder="Email address"
                className={styles.input}
                name="email"
                id="email"
                value={form.email}
                onChange={handleEmailChange}
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
                  listStyle: "none"
                }}>
                  {suggestions.map(client => (
                    <li
                      key={client.id}
                      style={{ padding: 8, cursor: "pointer" }}
                      onClick={() => handleSuggestionClick(client)}
                    >
                      { client.email }
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="col-6">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="name">Client Name</label>
              <input
                type="text"
                placeholder="Client name"
                className={styles.input}
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                disabled={clientFound}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-6">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                placeholder="Phone number"
                className={styles.input}
                name="phone"
                value={form.phone}
                onChange={handleChange}
                disabled={clientFound}
              />
            </div>
          </div>
          <div className="col-6">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="address">Property Address</label>
              <input
                type="text"
                placeholder="Property address"
                className={styles.input}
                name="address"
                value={form.address}
                onChange={handleChange}
                required
                disabled={clientFound}
              />
            </div>
          </div>
        </div>

        {/* Button to create client if it doesn't exist */}
        {!clientFound && !loading && form.email && form.name && form.address && (
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
            <label htmlFor="product_type">Product Type</label>
            <select
              name="productType"
              id="product_type"
              className={styles.input}
              value={form.productType}
              onChange={handleChange}
            >
              <option value="">Select a product</option>
              <option value="fixflip">Fix&Flip</option>
              <option value="dscr">Dscr</option>
              <option value="construction">Construction</option>
            </select>
          </div>
        </div>
        <div className="col-6">
          <div className="w-100 d-flex flex-column">
            <label htmlFor="registration_date">Registration Date</label>
            <input type="date" id="registration_date" className={styles.input} />
          </div>
        </div>
      </div>
      <hr className="mt-2 mb-2"/>
      
      {/* Product form only if there's a client and product type */}
      {form.productType && (
        <div className={`jopo mt-4`}>
          {form.productType === "fixflip" && <FixflipForm client_id={clientId} />}
          {form.productType === "construction" && <ConstructionForm client_id={clientId} />}
          {form.productType === "dscr" && <DscrForm client_id={clientId} />}
        </div>
      )}
    </div>
  );
};

export default FormRequest; 
