import React, { useState, useEffect } from "react";
import styles from "../style.module.css";
import { NumericFormat } from "react-number-format";
import { createDscr, updateDscr } from "../../../../../../Api/dscr";
import { getRequestLinks, createRequestLink, sendRequestLink } from "../../../../../../Api/requestLink";
import { sendTemplateEmail } from "../../../../../../Api/emailTemplate";
import { getUserIdFromToken } from "../../../../../../utils/auth";

const URL_EXTERNAL_FORM = import.meta.env.VITE_URL_EXTERMAL_FORM;

const initialState = {
  // Borrower Information
  borrower_name: "",
  legal_status: "",
  issued_date: "",
  property_address: "",
  fico: "",
  subject_prop_under_llc: "",
  
  // Address Information
  street_address: "",
  city: "",
  state: "",
  zip: "",
  lived_less_than_2_years: false,
  previous_street_address: "",
  previous_city: "",
  previous_state: "",
  previous_zip: "",
  
  // Loan Summary
  appraisal_value: "",
  annual_interest_rate: "",
  rent_amount: "",
  property_taxes: "",
  property_insurance: "",
  hoa_fees: "",
  flood_insurance: "",
  pay_off_amount: "",
  
  // Campos adicionales requeridos por el payload
  loan_type: "",
  property_type: "",
  closing_date: "",
  interest_rate_structure: "",
  loan_term: 0,
  prepayment_penalty: 0,
  prepayment_penalty_type: "",
  max_ltv: 0,
  origination_fee: 0,
  discount_points: 0,
  underwriting_fee: 0,
  credit_report_fee: 0,
  processing_fee: 0,
  recording_fee: 0,
  legal_fee: 0,
  service_fee: 0,
  title_fees: 0,
  government_fees: 0,
  escrow_tax_insurance: 0,
  total_closing_cost: 0,
  closing_cost_approx: 0,
  down_payment_percent: 0,
  dscr_requirement: 0,
  loan_amount: 0,
  down_payment_liquidity: 0,
  cash_out: 0,
  mortgage_payment_piti: 0,
  principal_interest: 0,
  property_taxes_estimated: 0,
  property_insurance_estimated: 0,
  hoa_estimated: 0,
  flood_insurance_estimated: 0,
  other_liquidity: 0,
  total_liquidity: 0,
  six_months_reserves: 0,
  property_city: "",
  property_state: "",
  property_zip: "",
  residency_status: "",
  origination_fee_percentage: 0,
  dscr_ratio: 0,
  closing_cost_liquidity: 0,
  guarantor_name: "",
  entity_name: "",
  type_of_program: "",
  dscr_required: false,
  dscr_flag: false,
  type_of_transaction: "",
  primary_own_or_rent: "",
  mortgage_late_payments: "",
  property_units: 0,
  borrower_signed: false,
  guarantor_signed: false,
  radicado: "",
  status: "PENDING",
  client_submitted: false,
  client_form_completed: false,
  client_submitted_at: null,
  comments: "",
  rejection_reason: ""
};

const DscrForm = ({ client_id, goToDocumentsTab, solicitud, cliente, editable = true }) => {
  const [form, setForm] = useState(initialState);
  const [ficoError, setFicoError] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isEditMode, setIsEditMode] = useState(false);
  const [externalLink, setExternalLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  // Inicializar el formulario con los datos de la solicitud si existen
  useEffect(() => {
    if (solicitud) {
      console.log("Datos de solicitud recibidos:", solicitud);
      console.log("issued_date original:", solicitud.issued_date);
      
      // Función para formatear fecha si es necesario
      const formatDateForInput = (dateString) => {
        if (!dateString) return "";
        
        // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          return dateString;
        }
        
        // Si es una fecha válida, convertirla al formato requerido
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
        
        return "";
      };

      setForm({
        // Borrower Information
        borrower_name: solicitud.borrower_name || "",
        legal_status: solicitud.legal_status || "",
        issued_date: formatDateForInput(solicitud.issued_date),
        property_address: solicitud.property_address || "",
        fico: solicitud.fico || solicitud.estimated_fico_score || "",
        subject_prop_under_llc: solicitud.subject_prop_under_llc || "",
        
        // Address Information
        street_address: solicitud.street_address || "",
        city: solicitud.city || "",
        state: solicitud.state || "",
        zip: solicitud.zip || "",
        lived_less_than_2_years: Boolean(solicitud.lived_less_than_2_years),
        previous_street_address: solicitud.previous_street_address || "",
        previous_city: solicitud.previous_city || "",
        previous_state: solicitud.previous_state || "",
        previous_zip: solicitud.previous_zip || "",
        
        // Loan Summary
        appraisal_value: solicitud.appraisal_value || "",
        annual_interest_rate: solicitud.annual_interest_rate || "",
        rent_amount: solicitud.rent_amount || "",
        property_taxes: solicitud.property_taxes || "",
        property_insurance: solicitud.property_insurance || "",
        hoa_fees: solicitud.hoa_fees || "",
        flood_insurance: solicitud.flood_insurance || "",
        pay_off_amount: solicitud.pay_off_amount || "",
        
        // Campos adicionales
        loan_type: solicitud.loan_type || "",
        property_type: solicitud.property_type || "",
        closing_date: formatDateForInput(solicitud.closing_date),
        interest_rate_structure: solicitud.interest_rate_structure || "",
        loan_term: solicitud.loan_term || 0,
        prepayment_penalty: solicitud.prepayment_penalty || 0,
        prepayment_penalty_type: solicitud.prepayment_penalty_type || "",
        max_ltv: solicitud.max_ltv || 0,
        origination_fee: solicitud.origination_fee || 0,
        discount_points: solicitud.discount_points || 0,
        underwriting_fee: solicitud.underwriting_fee || 0,
        credit_report_fee: solicitud.credit_report_fee || 0,
        processing_fee: solicitud.processing_fee || 0,
        recording_fee: solicitud.recording_fee || 0,
        legal_fee: solicitud.legal_fee || 0,
        service_fee: solicitud.service_fee || 0,
        title_fees: solicitud.title_fees || 0,
        government_fees: solicitud.government_fees || 0,
        escrow_tax_insurance: solicitud.escrow_tax_insurance || 0,
        total_closing_cost: solicitud.total_closing_cost || 0,
        closing_cost_approx: solicitud.closing_cost_approx || 0,
        down_payment_percent: solicitud.down_payment_percent || 0,
        dscr_requirement: solicitud.dscr_requirement || 0,
        loan_amount: solicitud.loan_amount || 0,
        down_payment_liquidity: solicitud.down_payment_liquidity || 0,
        cash_out: solicitud.cash_out || 0,
        mortgage_payment_piti: solicitud.mortgage_payment_piti || 0,
        principal_interest: solicitud.principal_interest || 0,
        property_taxes_estimated: solicitud.property_taxes_estimated || 0,
        property_insurance_estimated: solicitud.property_insurance_estimated || 0,
        hoa_estimated: solicitud.hoa_estimated || 0,
        flood_insurance_estimated: solicitud.flood_insurance_estimated || 0,
        other_liquidity: solicitud.other_liquidity || 0,
        total_liquidity: solicitud.total_liquidity || 0,
        six_months_reserves: solicitud.six_months_reserves || 0,
        property_city: solicitud.property_city || "",
        property_state: solicitud.property_state || "",
        property_zip: solicitud.property_zip || "",
        residency_status: solicitud.residency_status || "",
        origination_fee_percentage: solicitud.origination_fee_percentage || 0,
        dscr_ratio: solicitud.dscr_ratio || 0,
        closing_cost_liquidity: solicitud.closing_cost_liquidity || 0,
        guarantor_name: solicitud.guarantor_name || "",
        entity_name: solicitud.entity_name || "",
        type_of_program: solicitud.type_of_program || "",
        dscr_required: Boolean(solicitud.dscr_required),
        dscr_flag: Boolean(solicitud.dscr_flag),
        type_of_transaction: solicitud.type_of_transaction || "",
        primary_own_or_rent: solicitud.primary_own_or_rent || "",
        mortgage_late_payments: solicitud.mortgage_late_payments || "",
        property_units: solicitud.property_units || 0,
        borrower_signed: Boolean(solicitud.borrower_signed),
        guarantor_signed: Boolean(solicitud.guarantor_signed),
        radicado: solicitud.radicado || "",
        status: solicitud.status || "PENDING",
        client_submitted: Boolean(solicitud.client_submitted),
        client_form_completed: Boolean(solicitud.client_form_completed),
        client_submitted_at: solicitud.client_submitted_at || null,
        comments: solicitud.comments || "",
        rejection_reason: solicitud.rejection_reason || "",
      });
      
      console.log("Formulario establecido con issued_date:", formatDateForInput(solicitud.issued_date));
      setIsEditMode(false);
    }
  }, [solicitud]);

  // Debug: Monitorear cambios en el formulario
  useEffect(() => {
    console.log("Estado actual del formulario - issued_date:", form.issued_date);
  }, [form.issued_date]);

  useEffect(() => {
    if (solicitud && solicitud.id) {
      let isMounted = true;
      
      getRequestLinks({ dscr_request_id: solicitud.id })
        .then(links => {
          if (isMounted) {
            const link = Array.isArray(links) ? links.find(l => l.link_token) : null;
            if (link && link.link_token) {
              setExternalLink(`${URL_EXTERNAL_FORM}/dscr/${link.link_token}`);
            } else {
              setExternalLink("");
            }
          }
        })
        .catch(error => {
          if (isMounted) {
            console.error('Error fetching request links:', error);
            setExternalLink("");
          }
        });
      
      return () => {
        isMounted = false;
      };
    }
  }, [solicitud?.id]);

  // Maneja cambios generales
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  // Maneja cambios de campos numéricos con máscara
  const handleNumberFormat = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "fico") {
      if (value && (Number(value) < 300 || Number(value) > 850)) {
        setFicoError("El valor de FICO debe estar entre 300 y 850");
      } else {
        setFicoError("");
      }
    }
  };

  // Mensaje de categoría FICO
  const getFicoCategory = (fico) => {
    const n = Number(fico);
    if (!fico || isNaN(n)) return "";
    if (n >= 300 && n <= 579) return "Muy pobre (Very Poor)";
    if (n >= 580 && n <= 669) return "Aceptable (Fair)";
    if (n >= 670 && n <= 739) return "Bueno (Good)";
    if (n >= 740 && n <= 799) return "Muy bueno (Very Good)";
    if (n >= 800 && n <= 850) return "Excelente (Exceptional)";
    return "";
  };

  // Guardar cambios (update)
  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");
    try {
      const user_id = getUserIdFromToken();
      if (!user_id) {
        setFeedback("Error de autenticación. Por favor, inicia sesión nuevamente.");
        return;
      }

      // Limpiar campos de fecha vacíos para evitar errores 422
      const cleanFormData = { ...form };
      
      // Remover campos de fecha vacíos
      if (!cleanFormData.issued_date || cleanFormData.issued_date === "") {
        delete cleanFormData.issued_date;
      }
      if (!cleanFormData.closing_date || cleanFormData.closing_date === "") {
        delete cleanFormData.closing_date;
      }

      const dataToSend = {
        ...cleanFormData,
        user_id: user_id,
        fico: Number(cleanFormData.fico) || 0
      };
      delete dataToSend.estimated_fico_score;

      console.log("Data to send (update):", dataToSend);
      await updateDscr(solicitud.id, dataToSend);
      setFeedback("Request updated successfully!");
      setIsEditMode(false);
    } catch (error) {
      console.error("Error in update:", error);
      setFeedback("Error updating request. Please try again.");
    }
    setLoading(false);
  };

  // Guardar nuevo (create, solo si no hay solicitud)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.fico && (Number(form.fico) < 300 || Number(form.fico) > 850)) {
      setFicoError("El valor de FICO debe estar entre 300 y 850");
      return;
    }
    setLoading(true);
    setFeedback("");
    try {
      const user_id = getUserIdFromToken();
      if (!user_id) {
        setFeedback("Error de autenticación. Por favor, inicia sesión nuevamente.");
        return;
      }

      // Limpiar campos de fecha vacíos para evitar errores 422
      const cleanFormData = { ...form };
      
      // Remover campos de fecha vacíos
      if (!cleanFormData.issued_date || cleanFormData.issued_date === "") {
        delete cleanFormData.issued_date;
      }
      if (!cleanFormData.closing_date || cleanFormData.closing_date === "") {
        delete cleanFormData.closing_date;
      }

      const dataToSend = {
        ...cleanFormData,
        client_id: Number(client_id),
        user_id: user_id,
        fico: Number(cleanFormData.fico) || 0
      };
      delete dataToSend.estimated_fico_score;

      console.log("Datos a enviar (create):", dataToSend);
      const response = await createDscr(dataToSend);
      setIsEditMode(false);
      setFeedback("DSCR created successfully!");
      if (typeof goToDocumentsTab === 'function') {
        goToDocumentsTab(response.id, 'dscr');
      }
    } catch (error) {
      console.error("Error in create:", error);
      setFeedback("Error creating DSCR. Please try again.");
    }
    setLoading(false);
  };

  const handleGenerateLink = async () => {
    if (!solicitud || !solicitud.id) return;
    setGenerating(true);
    try {
      const link = await createRequestLink({
        valid_days: 30,
        dscr_request_id: solicitud.id,
        construction_request_id: 0,
        fixflip_request_id: 0
      });
      if (link && link.link_token) {
        setExternalLink(`${URL_EXTERNAL_FORM}/dscr/${link.link_token}`);
      }
    } catch (e) {
      // feedback opcional
    }
    setGenerating(false);
  };

  // Función para enviar email usando template
  const handleSendLink = async () => {
    if (!externalLink || !cliente?.email) return;
    setSending(true);
    try {
      // Enviar email usando template
      await sendTemplateEmail({
        template_id: 0, // ID del template de solicitud
        template_type: "request_link",
        to_email: cliente.email,
        from_email: "noreply@reinvestar.com", // Email del sistema
        content_type: "text/html", // Asegurar que se envíe como HTML
        variables: {
          client_name: cliente.full_name,
          request_link: externalLink,
          request_type: "DSCR",
          request_id: solicitud.id
        }
      });
      setFeedback("Email sent successfully!");
    } catch (error) {
      console.error('Error sending email:', error);
      setFeedback("Error sending email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form className="container-fluid" onSubmit={solicitud ? handleUpdate : handleSubmit}>
        {/* Datos del cliente */}
        {cliente && (
        <>
        <div className="mb-4">
          <div className="row gy-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label my_title_color">Nombre</label>
              <input className="form-control" value={cliente.full_name || ""} disabled />
            </div>
            <div className="col-md-3">
              <label className="form-label my_title_color">Email</label>
              <input className="form-control" value={cliente.email || ""} disabled />
            </div>
            <div className="col-md-3">
              <label className="form-label my_title_color">Teléfono</label>
              <input className="form-control" value={cliente.phone || ""} disabled />
            </div>
          </div>
        </div>
        <hr/>
        </>
        )}

      {cliente && (
      <div className="d-flex align-items-center mb-4 gap-3">
        <h4 className="my_title_color fw-bold mb-0" style={{ letterSpacing: 0.5 }}>Detalle de Solicitud DSCR</h4>
        {externalLink ? (
          <>
            <span className="small text-muted" style={{ wordBreak: 'break-all' }}>{externalLink}</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm ms-2"
              onClick={() => {navigator.clipboard.writeText(externalLink); setCopied(true); setTimeout(()=>setCopied(false), 1500);}}
            >
              {copied ? "¡Copiado!" : "Copiar"}
            </button>
            <button
              type="button"
              className="btn btn-outline-success btn-sm ms-2"
              onClick={handleSendLink}
              disabled={sending || !cliente?.email}
              title={!cliente?.email ? "No hay email del cliente" : "Enviar enlace al cliente"}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </>
        ) : (
          <button
            type="button"
            className="btn btn-outline-primary btn-sm ms-2"
            onClick={handleGenerateLink}
            disabled={generating}
          >
            {generating ? "Generando..." : "Generar enlace"}
          </button>
        )}
      </div>
      )}

        {/* ==============================
            1. BORROWER INFORMATION
            ============================== */}
      <div className="row mb-4">
        <div className="col-12">
          <h6 className="my_title_color fw-bold mb-3">1. BORROWER INFORMATION</h6>
            </div>
          </div>
      
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">BORROWER'S NAME</label>
          <input 
            className={`form-control ${styles.input}`}
            name="borrower_name" 
            value={form.borrower_name} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">LEGAL STATUS</label>
          <select 
            className={`form-control ${styles.input}`}
            name="legal_status" 
            value={form.legal_status} 
            onChange={handleChange}
            disabled={!editable && !isEditMode}
          >
                <option value="">Seleccione...</option>
                <option value="CITIZEN">CITIZEN</option>
                <option value="GREEN CARD">GREEN CARD</option>
                <option value="EMD">EMD</option>
                <option value="ITIN">ITIN</option>
                <option value="FN">FN</option>
              </select>
            </div>
          </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">ISSUED DATE</label>
          <input 
            type="date" 
            className={`form-control ${styles.input}`}
            name="issued_date" 
            value={form.issued_date} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">SUBJECT PROPERTY ADDRESS</label>
          <input 
            className={`form-control ${styles.input}`}
            name="property_address" 
            value={form.property_address} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode}
          />
            </div>
          </div>

      {/* ==============================
          ADDRESS INFORMATION
          ============================== */}
      <div className="row mb-4 mt-4">
        <div className="col-12">
          <h6 className="my_title_color fw-bold mb-3">ADDRESS</h6>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-12">
          <label className="form-label my_title_color">Street Address*</label>
          <input 
            className={`form-control ${styles.input}`}
            name="street_address" 
            value={form.street_address} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode}
            required
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label my_title_color">City*</label>
          <input 
            className={`form-control ${styles.input}`}
            name="city" 
            value={form.city} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode}
            required
          />
        </div>
        <div className="col-md-4">
          <label className="form-label my_title_color">State*</label>
          <select 
            className={`form-control ${styles.input}`}
            name="state" 
            value={form.state} 
            onChange={handleChange}
            disabled={!editable && !isEditMode}
            required
          >
            <option value="">Seleccione...</option>
            <option value="AL">Alabama</option>
            <option value="AK">Alaska</option>
            <option value="AZ">Arizona</option>
            <option value="AR">Arkansas</option>
            <option value="CA">California</option>
            <option value="CO">Colorado</option>
            <option value="CT">Connecticut</option>
            <option value="DE">Delaware</option>
            <option value="FL">Florida</option>
            <option value="GA">Georgia</option>
            <option value="HI">Hawaii</option>
            <option value="ID">Idaho</option>
            <option value="IL">Illinois</option>
            <option value="IN">Indiana</option>
            <option value="IA">Iowa</option>
            <option value="KS">Kansas</option>
            <option value="KY">Kentucky</option>
            <option value="LA">Louisiana</option>
            <option value="ME">Maine</option>
            <option value="MD">Maryland</option>
            <option value="MA">Massachusetts</option>
            <option value="MI">Michigan</option>
            <option value="MN">Minnesota</option>
            <option value="MS">Mississippi</option>
            <option value="MO">Missouri</option>
            <option value="MT">Montana</option>
            <option value="NE">Nebraska</option>
            <option value="NV">Nevada</option>
            <option value="NH">New Hampshire</option>
            <option value="NJ">New Jersey</option>
            <option value="NM">New Mexico</option>
            <option value="NY">New York</option>
            <option value="NC">North Carolina</option>
            <option value="ND">North Dakota</option>
            <option value="OH">Ohio</option>
            <option value="OK">Oklahoma</option>
            <option value="OR">Oregon</option>
            <option value="PA">Pennsylvania</option>
            <option value="RI">Rhode Island</option>
            <option value="SC">South Carolina</option>
            <option value="SD">South Dakota</option>
            <option value="TN">Tennessee</option>
            <option value="TX">Texas</option>
            <option value="UT">Utah</option>
            <option value="VT">Vermont</option>
            <option value="VA">Virginia</option>
            <option value="WA">Washington</option>
            <option value="WV">West Virginia</option>
            <option value="WI">Wisconsin</option>
            <option value="WY">Wyoming</option>
          </select>
        </div>
        <div className="col-md-4">
          <label className="form-label my_title_color">Zip*</label>
          <input 
            className={`form-control ${styles.input}`}
            name="zip" 
            value={form.zip} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode}
            required
          />
        </div>
      </div>

      <div className="row g-3 mt-2">
        <div className="col-md-12">
          <div className="form-check">
            <input 
              className="form-check-input" 
              type="checkbox" 
              name="lived_less_than_2_years"
              checked={form.lived_less_than_2_years}
              onChange={handleChange}
              disabled={!editable && !isEditMode}
              id="lived_less_than_2_years"
            />
            <label className="form-check-label my_title_color mb-4" htmlFor="lived_less_than_2_years">
              I have lived at my current address for less than 2 years
            </label>
          </div>
        </div>
      </div>

      {/* Previous Address Fields - Only show when checkbox is checked */}
      {form.lived_less_than_2_years && (
        <div className="row g-3 mt-3">
          <div className="col-12">
            <h6 className="my_title_color fw-bold mb-3">PREVIOUS ADDRESS</h6>
          </div>
        </div>
      )}

      {form.lived_less_than_2_years && (
        <div className="row g-3">
          <div className="col-md-12">
            <label className="form-label my_title_color">Previous Street Address*</label>
            <input 
              className={`form-control ${styles.input}`}
              name="previous_street_address" 
              value={form.previous_street_address} 
              onChange={handleChange} 
              disabled={!editable && !isEditMode}
              required
            />
          </div>
        </div>
      )}

      {form.lived_less_than_2_years && (
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label my_title_color">Previous City*</label>
            <input 
              className={`form-control ${styles.input}`}
              name="previous_city" 
              value={form.previous_city} 
              onChange={handleChange} 
              disabled={!editable && !isEditMode}
              required
            />
          </div>
          <div className="col-md-4">
            <label className="form-label my_title_color">Previous State*</label>
            <select 
              className={`form-control ${styles.input}`}
              name="previous_state" 
              value={form.previous_state} 
              onChange={handleChange}
              disabled={!editable && !isEditMode}
              required
            >
              <option value="">Seleccione...</option>
              <option value="AL">Alabama</option>
              <option value="AK">Alaska</option>
              <option value="AZ">Arizona</option>
              <option value="AR">Arkansas</option>
              <option value="CA">California</option>
              <option value="CO">Colorado</option>
              <option value="CT">Connecticut</option>
              <option value="DE">Delaware</option>
              <option value="FL">Florida</option>
              <option value="GA">Georgia</option>
              <option value="HI">Hawaii</option>
              <option value="ID">Idaho</option>
              <option value="IL">Illinois</option>
              <option value="IN">Indiana</option>
              <option value="IA">Iowa</option>
              <option value="KS">Kansas</option>
              <option value="KY">Kentucky</option>
              <option value="LA">Louisiana</option>
              <option value="ME">Maine</option>
              <option value="MD">Maryland</option>
              <option value="MA">Massachusetts</option>
              <option value="MI">Michigan</option>
              <option value="MN">Minnesota</option>
              <option value="MS">Mississippi</option>
              <option value="MO">Missouri</option>
              <option value="MT">Montana</option>
              <option value="NE">Nebraska</option>
              <option value="NV">Nevada</option>
              <option value="NH">New Hampshire</option>
              <option value="NJ">New Jersey</option>
              <option value="NM">New Mexico</option>
              <option value="NY">New York</option>
              <option value="NC">North Carolina</option>
              <option value="ND">North Dakota</option>
            <option value="OH">Ohio</option>
            <option value="OK">Oklahoma</option>
            <option value="OR">Oregon</option>
            <option value="PA">Pennsylvania</option>
            <option value="RI">Rhode Island</option>
            <option value="SC">South Carolina</option>
            <option value="SD">South Dakota</option>
            <option value="TN">Tennessee</option>
            <option value="TX">Texas</option>
            <option value="UT">Utah</option>
            <option value="VT">Vermont</option>
            <option value="VA">Virginia</option>
            <option value="WA">Washington</option>
            <option value="WV">West Virginia</option>
            <option value="WI">Wisconsin</option>
            <option value="WY">Wyoming</option>
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label my_title_color">Previous Zip*</label>
            <input 
              className={`form-control ${styles.input}`}
              name="previous_zip" 
              value={form.previous_zip} 
              onChange={handleChange} 
              disabled={!editable && !isEditMode}
              required
            />
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">ESTIMATED FICO SCORE</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="fico" 
            value={form.fico} 
            onValueChange={({ value }) => handleNumberFormat("fico", value)} 
            allowNegative={false} 
            decimalScale={0} 
            inputMode="numeric" 
            disabled={!editable && !isEditMode}
          />
              {ficoError && (<span style={{ color: 'red', fontSize: 13 }}>{ficoError}</span>)}
          {!ficoError && getFicoCategory(form.fico) && (
            <span style={{ color: '#2c3e50', fontSize: 13, fontWeight: 500 }}>
              {getFicoCategory(form.fico)}
            </span>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">PROPERTY UNDER LLC</label>
          <input 
            className={`form-control ${styles.input}`}
            name="subject_prop_under_llc" 
            value={form.subject_prop_under_llc} 
            onChange={handleChange} 
            disabled={!editable && !isEditMode}
          />
            </div>
          </div>

        {/* ==============================
          2. LOAN SUMMARY
            ============================== */}
      <div className="row mb-4 mt-5">
        <div className="col-12">
          <h6 className="my_title_color fw-bold mb-3">2. LOAN SUMARY</h6>
        </div>
            </div>
      
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">Appraisal Value</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="appraisal_value" 
            value={form.appraisal_value} 
            onValueChange={({ value }) => handleNumberFormat("appraisal_value", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">Annual Interest Rate</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="annual_interest_rate" 
            value={form.annual_interest_rate} 
            onValueChange={({ value }) => handleNumberFormat("annual_interest_rate", value)} 
            suffix="%" 
            decimalScale={3} 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
          </div>
        </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">Rent Amount</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="rent_amount" 
            value={form.rent_amount} 
            onValueChange={({ value }) => handleNumberFormat("rent_amount", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">Property Taxes</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="property_taxes" 
            value={form.property_taxes} 
            onValueChange={({ value }) => handleNumberFormat("property_taxes", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
            </div>
          </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">Property Insurance (HOI)</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="property_insurance" 
            value={form.property_insurance} 
            onValueChange={({ value }) => handleNumberFormat("property_insurance", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">HOA</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="hoa_fees" 
            value={form.hoa_fees} 
            onValueChange={({ value }) => handleNumberFormat("hoa_fees", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
          </div>
        </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">Flood Insurance</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="flood_insurance" 
            value={form.flood_insurance} 
            onValueChange={({ value }) => handleNumberFormat("flood_insurance", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">Pay Off Amount</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="pay_off_amount" 
            value={form.pay_off_amount} 
            onValueChange={({ value }) => handleNumberFormat("pay_off_amount", value)} 
            thousandSeparator="," 
            prefix="$" 
            decimalScale={2} 
            fixedDecimalScale 
            allowNegative={false} 
            inputMode="decimal" 
            disabled={!editable && !isEditMode}
          />
          </div>
        </div>

        {feedback && (
          <div className={`alert ${feedback.includes("successfully") ? "alert-success" : "alert-danger"} py-2 mb-3`}>
            {feedback}
          </div>
        )}

        <div className="row">
        <div className="col-12 mt-4">
            {solicitud ? (
            isEditMode ? (
                <button
                  type="submit"
                className="btn btn-primary"
                  style={{ minWidth: "200px" }}
                  disabled={loading}
                >
                {loading ? "SAVING..." : "SAVE CHANGES"}
                </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{ minWidth: "200px" }}
                onClick={() => setIsEditMode(true)}
              >
                EDIT
              </button>
            )
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              style={{ minWidth: "200px" }}
              disabled={loading}
            >
              {loading ? "CREATING..." : "CREATE DSCR"}
              </button>
            )}
          </div>
        </div>
      </form>
  );
};

export default DscrForm; 