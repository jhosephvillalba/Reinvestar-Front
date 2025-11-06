import React, { useState, useEffect } from "react";
import styles from "../style.module.css";
import { NumericFormat } from "react-number-format";
import { createFixflip } from "../../../../../../Api/fixflip";
import { createRequestLink } from "../../../../../../Api/requestLink";
import { getClientById } from "../../../../../../Api/client";
import { sendTemplateEmail } from "../../../../../../Api/emailTemplate";
import { getUserIdFromToken } from "../../../../../../utils/auth";

const URL_EXTERNAL_FORM = import.meta.env.VITE_URL_EXTERMAL_FORM;

const initialState = {
  // Basic form fields
  borrower_name: "",
  legal_status: "",
  property_address: "",
  fico_score: "",
  property_type: "",
  
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
  land_acquisition_cost: "",
  construction_rehab_budget: "",
  total_cost: "",
  estimated_after_completion_value: "",
  
  // Additional fields required by payload
  date: "",
  loan_type: "",
  closing_date: "",
	interest_rate_structure: "",
	loan_term: "",
  prepayment_penalty: 0,
  max_ltv: 0,
  max_ltc: 0,
  as_is_value: 0,
  original_acquisition_price: 0,
  origination_fee: 0,
  underwriting_fee: 0,
  processing_fee: 0,
  servicing_fee: 0,
  legal_fee: 0,
  appraisal_fee: 0,
  budget_review_fee: 0,
  broker_fee: 0,
  transaction_management_fee: 0,
  total_loan_amount: 0,
  annual_interest_rate: 0,
  requested_leverage: 0,
  monthly_interest_payment: 0,
  construction_holdback: 0,
  initial_funding: 0,
  day1_monthly_interest_payment: 0,
  interest_reserves: 0,
  loan_to_as_is_value: 0,
  loan_to_as_is_value_ltv: 0,
  loan_to_cost_ltc: 0,
  loan_to_arv: 0,
	rehab_category: "",
  min_credit_score: 0,
  refundable_commitment_deposit: 0,
  estimated_closing_costs: 0,
  construction_budget_10_percent: 0,
  six_months_payment_reserves: 0,
  construction_budget_delta: 0,
  down_payment: 0,
  total_liquidity: 0
};

const FixflipForm = ({ client_id, goToDocumentsTab }) => {
  const [form, setForm] = useState({ ...initialState });
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [client, setClient] = useState(null);
  const [externalLink, setExternalLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [requestId, setRequestId] = useState(null);

  // Load client data
  useEffect(() => {
    const loadClient = async () => {
    if (client_id) {
        try {
          const clientData = await getClientById(client_id);
          setClient(clientData);
        } catch (error) {
          console.error("Error loading client:", error);
        }
      }
    };
    loadClient();
  }, [client_id]);

  // Function to send email using template
  const handleSendEmail = async (link) => {
    if (!link || !client_id) return;
    
    setSending(true);
    try {
      // Get client data
      const clientData = await getClientById(client_id);
      
      if (clientData && clientData.email) {
        await sendTemplateEmail({
          template_id: 0,
          template_type: "request_link",
          to_email: clientData.email,
          from_email: "noreply@reinvestar.com",
          content_type: "text/html",
          variables: {
            client_name: clientData.full_name,
            request_link: link,
            request_type: "Fix & Flip",
            request_id: requestId
          }
        });
        setFeedback("Email sent successfully!");
      } else {
        setFeedback("Client email not found.");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      setFeedback("Error sending email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Update total_cost when land_acquisition_cost or construction_rehab_budget changes
  useEffect(() => {
    const landCost = Number(form.land_acquisition_cost) || 0;
    const constructionBudget = Number(form.construction_rehab_budget) || 0;
    const totalCost = landCost + constructionBudget;
    
    console.log('useEffect total_cost calculation:', { 
      landCost, 
      constructionBudget, 
      totalCost, 
      land_acquisition_cost: form.land_acquisition_cost, 
      construction_rehab_budget: form.construction_rehab_budget 
    });
    
    setForm(prev => ({
      ...prev,
      total_cost: totalCost
    }));
  }, [form.land_acquisition_cost, form.construction_rehab_budget]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleNumberFormat = (name, values) => {
    const { value } = values;
    setForm(prev => ({
      ...prev,
      [name]: name === 'loan_term' ? String(value) : value
    }));
  };

  const toISOOrNull = (dateStr) => {
    if (!dateStr) return null;
    try {
      const dt = new Date(dateStr);
      if (Number.isNaN(dt.getTime())) return null;
      return dt.toISOString();
    } catch (_) {
      return null;
    }
  };

  // Calcular Total Cost automáticamente
  const computeTotalCost = () => {
    const landCost = Number(form.land_acquisition_cost) || 0;
    const constructionBudget = Number(form.construction_rehab_budget) || 0;
    const total = landCost + constructionBudget;
    console.log('computeTotalCost:', { landCost, constructionBudget, total, form: form.land_acquisition_cost, form2: form.construction_rehab_budget });
    return total;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFeedback("");

    try {
      const userId = getUserIdFromToken();
      
      const dataToSend = {
        client_id: client_id,
        user_id: userId,
        borrower_name: form.borrower_name || "",
        legal_status: form.legal_status || "",
        date: toISOOrNull(form.date),
				property_address: form.property_address || "",
        fico_score: form.fico_score ? Number(form.fico_score) : 0,
        
        // Address Information
        street_address: form.street_address || "",
        city: form.city || "",
        state: form.state || "",
        zip: form.zip || "",
        lived_less_than_2_years: Boolean(form.lived_less_than_2_years),
        previous_street_address: form.previous_street_address || "",
        previous_city: form.previous_city || "",
        previous_state: form.previous_state || "",
        previous_zip: form.previous_zip || "",
        
        loan_type: form.loan_type || "",
        property_type: form.property_type || "",
        closing_date: toISOOrNull(form.closing_date),
				interest_rate_structure: form.interest_rate_structure || "",
				loan_term: form.loan_term || "",
        prepayment_penalty: form.prepayment_penalty ? Number(form.prepayment_penalty) : 0,
        max_ltv: form.max_ltv ? Number(form.max_ltv) : 0,
        max_ltc: form.max_ltc ? Number(form.max_ltc) : 0,
        as_is_value: form.as_is_value ? Number(form.as_is_value) : 0,
        original_acquisition_price: form.original_acquisition_price ? Number(form.original_acquisition_price) : 0,
        land_acquisition_cost: form.land_acquisition_cost ? Number(form.land_acquisition_cost) : 0,
        construction_rehab_budget: form.construction_rehab_budget ? Number(form.construction_rehab_budget) : 0,
        total_cost: form.total_cost || 0,
        estimated_after_completion_value: form.estimated_after_completion_value ? Number(form.estimated_after_completion_value) : 0,
        origination_fee: form.origination_fee ? Number(form.origination_fee) : 0,
        underwriting_fee: form.underwriting_fee ? Number(form.underwriting_fee) : 0,
        processing_fee: form.processing_fee ? Number(form.processing_fee) : 0,
        servicing_fee: form.servicing_fee ? Number(form.servicing_fee) : 0,
        legal_fee: form.legal_fee ? Number(form.legal_fee) : 0,
        appraisal_fee: form.appraisal_fee ? Number(form.appraisal_fee) : 0,
        budget_review_fee: form.budget_review_fee ? Number(form.budget_review_fee) : 0,
        broker_fee: form.broker_fee ? Number(form.broker_fee) : 0,
        transaction_management_fee: form.transaction_management_fee ? Number(form.transaction_management_fee) : 0,
        total_loan_amount: form.total_loan_amount ? Number(form.total_loan_amount) : 0,
        annual_interest_rate: form.annual_interest_rate ? Number(form.annual_interest_rate) : 0,
        requested_leverage: form.requested_leverage ? Number(form.requested_leverage) : 0,
        monthly_interest_payment: form.monthly_interest_payment ? Number(form.monthly_interest_payment) : 0,
        construction_holdback: form.construction_holdback ? Number(form.construction_holdback) : 0,
        initial_funding: form.initial_funding ? Number(form.initial_funding) : 0,
        day1_monthly_interest_payment: form.day1_monthly_interest_payment ? Number(form.day1_monthly_interest_payment) : 0,
        interest_reserves: form.interest_reserves ? Number(form.interest_reserves) : 0,
        loan_to_as_is_value: form.loan_to_as_is_value ? Number(form.loan_to_as_is_value) : 0,
        loan_to_as_is_value_ltv: form.loan_to_as_is_value_ltv ? Number(form.loan_to_as_is_value_ltv) : 0,
        loan_to_cost_ltc: form.loan_to_cost_ltc ? Number(form.loan_to_cost_ltc) : 0,
        loan_to_arv: form.loan_to_arv ? Number(form.loan_to_arv) : 0,
				rehab_category: form.rehab_category || "",
        min_credit_score: form.min_credit_score ? Number(form.min_credit_score) : 0,
        refundable_commitment_deposit: form.refundable_commitment_deposit ? Number(form.refundable_commitment_deposit) : 0,
        estimated_closing_costs: form.estimated_closing_costs ? Number(form.estimated_closing_costs) : 0,
        construction_budget_10_percent: form.construction_budget_10_percent ? Number(form.construction_budget_10_percent) : 0,
        six_months_payment_reserves: form.six_months_payment_reserves ? Number(form.six_months_payment_reserves) : 0,
        construction_budget_delta: form.construction_budget_delta ? Number(form.construction_budget_delta) : 0,
        down_payment: form.down_payment ? Number(form.down_payment) : 0,
        total_liquidity: form.total_liquidity ? Number(form.total_liquidity) : 0,
        status: "PENDING"
      };

      console.log("Data to send:", dataToSend);

      const response = await createFixflip(dataToSend);
      console.log("Server response:", response);

      if (response && response.id) {
        setRequestId(response.id);
        setFeedback("Request created successfully");

        // Create link automatically
        const linkData = {
          valid_days: 30,
          dscr_request_id: 0,
          construction_request_id: 0,
          fixflip_request_id: response.id
        };

        const linkResponse = await createRequestLink(linkData);
        console.log('createRequestLink response:', linkResponse);

        if (linkResponse?.link_token) {
          const fullLink = `${URL_EXTERNAL_FORM}/fixflip/${linkResponse.link_token}`;
          setExternalLink(fullLink);
          
          // Scroll to link section after a short delay
          setTimeout(() => {
            const linkElement = document.getElementById('external-link-section-fixflip');
            if (linkElement) {
              linkElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
        }


        // Don't automatically navigate to documents tab
        // User can manually navigate if needed
      } else {
        setFeedback("Error creating request");
      }
    } catch (error) {
      console.error("Error:", error);
      setFeedback("Error creating request: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="container-fluid" noValidate>
      <div id="external-link-section-fixflip" className="d-flex align-items-center mb-4 gap-3">
        <h4 className="my_title_color fw-bold mb-0" style={{ letterSpacing: 0.5 }}>Fix & Flip - Basic Information</h4>
        {externalLink && (
          <>
            <span className="small text-muted" style={{ wordBreak: 'break-all' }}>{externalLink}</span>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm ms-2"
              onClick={() => {navigator.clipboard.writeText(externalLink); setCopied(true); setTimeout(()=>setCopied(false), 1500);}}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              type="button"
              className="btn btn-outline-success btn-sm ms-2"
              onClick={() => handleSendEmail(externalLink)}
              disabled={sending || !client?.email}
              title={!client?.email ? "No client email available" : "Send link to client"}
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </>
        )}
      </div>

      {/* Simplified form with only specified fields */}
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">BORROWER'S NAME</label>
          <input 
            className={`form-control ${styles.input}`}
            name="borrower_name" 
            value={form.borrower_name} 
            onChange={handleChange} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">LEGAL STATUS</label>
          <select 
            className={`form-control ${styles.input}`}
            name="legal_status" 
            value={form.legal_status} 
            onChange={handleChange} 
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
          <label className="form-label my_title_color">SUBJECT PROPERTY ADDRESS</label>
          <input 
            className={`form-control ${styles.input}`}
            name="property_address" 
            value={form.property_address} 
            onChange={handleChange} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">ESTIMATED FICO SCORE</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="fico_score" 
            value={form.fico_score} 
            onValueChange={(values) => handleNumberFormat("fico_score", values)} 
						allowNegative={false} 
            decimalScale={0} 
            inputMode="numeric" 
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
          <label className="form-label my_title_color">Street Address</label>
          <input 
            className={`form-control ${styles.input}`}
            name="street_address" 
            value={form.street_address} 
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label my_title_color">City</label>
          <input 
            className={`form-control ${styles.input}`}
            name="city" 
            value={form.city} 
            onChange={handleChange}
          />
        </div>
        <div className="col-md-4">
          <label className="form-label my_title_color">State</label>
          <select 
            className={`form-control ${styles.input}`}
            name="state" 
            value={form.state} 
            onChange={handleChange}
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
          <label className="form-label my_title_color">Zip</label>
          <input 
            className={`form-control ${styles.input}`}
            name="zip" 
            value={form.zip} 
            onChange={handleChange}
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
            <label className="form-label my_title_color">Previous Street Address</label>
            <input 
                className={`form-control ${styles.input}`}
              name="previous_street_address" 
              value={form.previous_street_address} 
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      {form.lived_less_than_2_years && (
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label my_title_color">Previous City</label>
            <input 
                className={`form-control ${styles.input}`}
              name="previous_city" 
              value={form.previous_city} 
              onChange={handleChange}
            />
          </div>
          <div className="col-md-4">
            <label className="form-label my_title_color">Previous State</label>
            <select 
                className={`form-control ${styles.input}`}
              name="previous_state" 
              value={form.previous_state} 
              onChange={handleChange}
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
            <label className="form-label my_title_color">Previous Zip</label>
            <input 
                className={`form-control ${styles.input}`}
              name="previous_zip" 
              value={form.previous_zip} 
              onChange={handleChange}
            />
          </div>
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">PROPERTY TYPE</label>
          <input 
            className={`form-control ${styles.input}`}
            name="property_type" 
            value={form.property_type} 
            onChange={handleChange} 
          />
        </div>
        <div className="col-md-6">
          <label className="form-label my_title_color">LOAN TERM (YEARS)</label>
          <input
            type="text"
            className={`form-control ${styles.input}`}
            name="loan_term"
            value={form.loan_term}
            onChange={handleChange}
            placeholder="Enter loan term in years"
          />
        </div>
      </div>

      <div className="row g-3">
        {/* Land or Acquisition Cost */}
        <div className="col-md-6">
          <label className="form-label my_title_color">Estimated After Completion Value</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="estimated_after_completion_value" 
            value={form.estimated_after_completion_value} 
            onValueChange={(values) => handleNumberFormat("estimated_after_completion_value", values)} 
            thousandSeparator="," 
            prefix="$"
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            inputMode="decimal"
          />
        </div>

      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">Financed Construction / Rehab Budget</label>
          <NumericFormat 
            className={`form-control ${styles.input}`}
            name="construction_rehab_budget" 
            value={form.construction_rehab_budget} 
            onValueChange={(values) => handleNumberFormat("construction_rehab_budget", values)} 
            thousandSeparator="," 
            prefix="$"
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            inputMode="decimal"
          />
        </div>

   
        <div className="col-md-6">
          <label className="form-label my_title_color">Land or Acquisition Cost</label>
          <NumericFormat
            className={`form-control ${styles.input}`}
            name="land_acquisition_cost" 
            value={form.land_acquisition_cost} 
            onValueChange={(values) => handleNumberFormat("land_acquisition_cost", values)} 
            thousandSeparator=","
            prefix="$"
            decimalScale={2}
            fixedDecimalScale
            allowNegative={false}
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label my_title_color">Total Cost</label>
          <input
            className={`form-control ${styles.input}`}
            value={`$${computeTotalCost().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            disabled 
            style={{ backgroundColor: '#f8f9fa' }}
          />
        </div>
      </div>

      {feedback && (
        <div className={`alert ${feedback.includes("successfully") ? "alert-success" : "alert-danger"} py-2 mb-3`}>
          {feedback}
        </div>
      )}

      <div className="row">
        <div className="col-12 mt-4 mb-4">
          <button type="submit" className="btn btn-primary px-4 py-2" style={{ minWidth: "200px" }} disabled={loading}>
            {loading ? "CREATING..." : "CREATE FIX&FLIP"}
          </button>
        </div>
      </div>

    </form>
  );
};

export default FixflipForm; 