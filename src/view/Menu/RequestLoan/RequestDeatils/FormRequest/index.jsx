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

const FormRequest = () => {
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

  // Buscar clientes por email (search) en vivo
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

  // Al seleccionar un cliente de la lista
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
    setFeedback("Cliente encontrado y cargado");
  };

  // Manejar cambios en el resto del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Registrar cliente si no existe
  const handleCreateClient = async () => {
    setFeedback("");
    setLoading(true);
    if (!form.nombre || !form.correo || !form.direccion) {
      setFeedback("Nombre, correo y dirección son obligatorios");
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
        // Asegura que los booleanos también se reflejen
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

  // Registrar cliente si no existe
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFeedback("");
    setLoading(true);
    if (!form.nombre || !form.correo || !form.direccion) {
      setFeedback("Nombre, correo y dirección son obligatorios");
      setLoading(false);
      return;
    }
    if (clienteEncontrado) {
      setFeedback("Cliente ya existe. Puedes continuar con la solicitud.");
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
                placeholder="Correo electrónico"
                className={styles.input}
                name="correo"
                id="correo"
                value={form.correo}
                onChange={handleCorreoChange}
                required
                autoComplete="off"
              />
              {/* Sugerencias de email */}
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
                  {suggestions.map(cliente => (
                    <li
                      key={cliente.id}
                      style={{ padding: 8, cursor: "pointer" }}
                      onClick={() => handleSuggestionClick(cliente)}
                    >
                      { cliente.email }
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="col-4">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="correo">Nombre del cliente</label>
              <input
                type="text"
                placeholder="Nombre del cliente"
                className={styles.input}
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                required
                disabled={clienteEncontrado}
              />
            </div>
          </div>
          {/* --------------EMPRESAS--------------- */}
          <div className="col-4">
            <div className="w-100 d-flex flex-column">
              <label htmlFor="options_companies">Empresa</label>
              <select
                name="empresa"
                id="options_companies"
                className={styles.input}
                value={form.empresa}
                onChange={handleChange}
                required
                disabled={clienteEncontrado}
              >
                <option value="">Seleccione una empresa</option>
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
              <label htmlFor="telefono">Número de teléfono</label>
              <input
                type="tel"
                placeholder="Número de teléfono"
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
              <label htmlFor="direccion">Dirección de la propiedad</label>
              <input
                type="text"
                placeholder="Dirección de la propiedad"
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

        {/* Botón para crear cliente si no existe */}
        {!clienteEncontrado && !loading && form.correo && form.nombre && form.direccion && (
          <div className="row">
            <div className="col-12 d-flex justify-content-end">
              <button
                type="button"
                className={styles.button}
                style={{ maxWidth: 250 }}
                onClick={handleCreateClient}
              >
                Crear cliente
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
            <label htmlFor="pruduct_type">Tipo de producto</label>
            <select
              name="tipoProducto"
              id="product_type"
              className={styles.input}
              value={form.tipoProducto}
              onChange={handleChange}
            >
              <option value="">seleccione un producto</option>
              <option value="fixflip">FixFlip</option>
              <option value="dscr">Dscr</option>
              <option value="construction">Contruction</option>
            </select>
          </div>
        </div>
        <div className="col-6">
          <div className="w-100 d-flex flex-column">
            <label htmlFor="fecha_registro">Fecha de registor</label>
            <input type="date" id="fecha_registro" className={styles.input} />
          </div>
        </div>
      </div>
      <hr className="mt-2 mb-2"/>
      
      {/* Formulario de producto solo si hay cliente y tipo de producto */}
      {form.tipoProducto && (
        <div className={`jopo mt-4`}>
          {form.tipoProducto === "fixflip" && <FixflipForm client_id={clientId} />}
          {form.tipoProducto === "construction" && <ConstructionForm client_id={clientId} />}
          {form.tipoProducto === "dscr" && <DscrForm client_id={clientId} />}
        </div>
      )}
    </div>
  );
};

export default FormRequest; 
