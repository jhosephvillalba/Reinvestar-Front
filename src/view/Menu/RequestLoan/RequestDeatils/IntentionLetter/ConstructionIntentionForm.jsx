import React, { useState, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';
import { getIntentLettersByRequest } from '../../../../../Api/intentLetters';
import { getUserIdFromToken } from '../../../../../utils/auth';

const ConstructionIntentionForm = ({
  requestId,
  initialData = {},
  onFormChange,
  onSubmit,
  loading = false,
  editable = true,
  onUnsavedChangesChange
}) => {
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalFormData, setOriginalFormData] = useState(null);
  const [form, setForm] = useState({
    // Borrower Information
    borrower_name: "",
    legal_status: "",
    issued_date: "",
    property_address: "",
    estimated_fico_score: "",

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

    //LOAN DETAILS
    loan_type: "",
    property_type: "",
    closing_date: "",
    interest_rate_structure: "",
    loan_term: "",
    prepayment_penalty: 0,
    max_ltv: 0,
    max_ltc: 0,

    //PURCHASE, REFINANCE, CASH-OUT
    as_is_value: 0,
    original_acquisition_price: 0,

    //FIX & FLIP, GROUND UP CONSTRUCTION
    land_acquisition_cost: 0,
    construction_rehab_budget: 0,
    total_cost: 0,
    estimated_after_completion_value: 0,

    //LOAN CLOSING COST
    origination_fee: 0,
    underwriting_fee: 0,
    processing_fee: 0,
    servicing_fee: 0,
    legal_fee: 0,
    appraisal_fee: 0,
    budget_review_fee: 0,

    //OTHER EXPENSES (Estimated)
    broker_fee: 0,
    broker_fee_percentage: 0,
    transaction_management_fee: 0,

    //LOAN SUMMARY
    total_loan_amount: 0,
    loan_amount: 0,
    annual_interest_rate: 0,
    requested_leverage: 0,
    monthly_interest_payment: 0,

    // IF LOAN IS GROUND UP CONSTRUCTION
    construction_holdback: 0,
    initial_funding: 0,
    day1_monthly_interest_payment: 0,
    interest_reserves: 0,

    //PURCHASE, REFINANCE, CASH OUT
    loan_to_as_is_value: 0,

    // GROUND UP CONSTRUCTION
    loan_to_as_is_value_ltv: 0,
    loan_to_cost_ltc: 0,
    loan_to_arv: 0,
    rehab_category: "",

    // CONDITIONS AND ADDITIONAL INFORMATION 
    min_credit_score: 0,
    refundable_commitment_deposit: 0,

    // MINIMUM BORROWER'S LIQUIDITY REQUIRED (Estimated)
    estimated_closing_costs: 0,
    construction_budget_10_percent: 0,
    six_months_payment_reserves: 0,
    construction_budget_delta: 0,
    down_payment: 0,
    total_liquidity: 0,

    // Campos del Sistema
    client_id: 0,
    user_id: 0,
    client_submitted: false,
    client_form_completed: false,
    client_submitted_at: "",
    borrower_signed: false,
    guarantor_signed: false,
    is_signed: false,
    is_approved: false
  });

  useEffect(() => {
    const load = async () => {
      // Siempre poblamos con initialData que viene de la solicitud principal
      if (initialData && Object.keys(initialData).length > 0) {
        console.log('[Construction] Loading initialData:', initialData);
        const mapped = { ...initialData };
        if (mapped.service_fee != null) mapped.servicing_fee = mapped.service_fee;
        if (mapped.total_closing_cost_estimated != null) mapped.estimated_closing_costs = mapped.total_closing_cost_estimated;
        if (mapped.interest_rate != null) mapped.annual_interest_rate = mapped.interest_rate;

        setForm(prev => {
          const newForm = {
            ...prev,
            ...mapped,
            estimated_fico_score: mapped.estimated_fico_score ?? mapped.fico_score ?? prev.estimated_fico_score,
            // Preservar los valores que el usuario pueda haber ingresado
            requested_leverage: prev.requested_leverage || mapped.requested_leverage || 0,
            monthly_interest_payment: prev.monthly_interest_payment || mapped.monthly_interest_payment || 0,

            // Address Information - Ensure they load correctly
            street_address: mapped.street_address || "",
            city: mapped.city || "",
            state: mapped.state || "",
            zip: mapped.zip || "",
            lived_less_than_2_years: Boolean(mapped.lived_less_than_2_years),
            previous_street_address: mapped.previous_street_address || "",
            previous_city: mapped.previous_city || "",
            previous_state: mapped.previous_state || "",
            previous_zip: mapped.previous_zip || "",
          };

          // Set original data after loading from initialData
          setTimeout(() => {
            setOriginalFormData({ ...newForm });
            console.debug('[Construction] Original data set from initialData:', {
              originalFormDataKeys: Object.keys(newForm).length,
              sampleFields: {
                borrower_name: newForm.borrower_name,
                loan_amount: newForm.loan_amount,
                land_acquisition_cost: newForm.land_acquisition_cost
              }
            });
          }, 200);

          return newForm;
        });
      }

      // Si hay un requestId, intentamos cargar la carta de intención existente
      if (requestId) {
        setLoadingData(true);
        setError("");
        try {
          const letters = await getIntentLettersByRequest('construction', Number(requestId));
          const data = letters?.[0];

          if (data) {
            // Si existe una carta, sobreescribimos el formulario con sus datos
            const mapped = { ...data };
            if (mapped.service_fee != null) mapped.servicing_fee = mapped.service_fee;
            if (mapped.total_closing_cost_estimated != null) mapped.estimated_closing_costs = mapped.total_closing_cost_estimated;
            if (mapped.interest_rate != null) mapped.annual_interest_rate = mapped.interest_rate;
            if (mapped.loan_to_value != null) mapped.loan_to_as_is_value = mapped.loan_to_value;
            if (mapped.ltv != null) mapped.loan_to_as_is_value = mapped.ltv;

            setForm(prev => {
              const newForm = {
                ...prev,
                ...mapped, // Aplicamos todos los datos de la carta
                client_id: mapped.client_id ?? prev.client_id,
                user_id: prev.user_id || mapped.user_id || (getUserIdFromToken ? Number(getUserIdFromToken()) : prev.user_id),
                estimated_fico_score: mapped.estimated_fico_score ?? mapped.fico_score ?? prev.estimated_fico_score,
                closing_date: mapped.closing_date || mapped.estimated_closing_date || prev.closing_date,
                // Preservar los valores que el usuario pueda haber ingresado
                requested_leverage: prev.requested_leverage || mapped.requested_leverage || 0,
                monthly_interest_payment: prev.monthly_interest_payment || mapped.monthly_interest_payment || 0,

                // Address Information - Ensure they load correctly
                street_address: mapped.street_address || "",
                city: mapped.city || "",
                state: mapped.state || "",
                zip: mapped.zip || "",
                lived_less_than_2_years: Boolean(mapped.lived_less_than_2_years),
                previous_street_address: mapped.previous_street_address || "",
                previous_city: mapped.previous_city || "",
                previous_state: mapped.previous_state || "",
                previous_zip: mapped.previous_zip || "",
              };

              // Set original data after loading data from API
              setTimeout(() => {
                setOriginalFormData({ ...newForm });
                console.debug('[Construction] Original data set from API:', {
                  originalFormDataKeys: Object.keys(newForm).length,
                  sampleFields: {
                    borrower_name: newForm.borrower_name,
                    loan_amount: newForm.loan_amount,
                    land_acquisition_cost: newForm.land_acquisition_cost
                  }
                });
              }, 200);

              return newForm;
            });
            setShowCreateForm(false); // Letter exists, don't show create button
          } else {
            setShowCreateForm(true); // No letter, show create button
          }
        } catch (err) {
          setError("Error loading letter of intent data");
          setShowCreateForm(true); // Allow creation even if loading fails
        } finally {
          setLoadingData(false);
        }
      }
    };
    load();
  }, [initialData, requestId]);

  useEffect(() => {
    if (onFormChange) {
      onFormChange(form);
    }
  }, [form, onFormChange]);

  // Set original data when initial data is loaded
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0 && !originalFormData) {
      // Use timeout to ensure form is fully updated
      const timer = setTimeout(() => {
        setOriginalFormData({ ...form });
        console.debug('[Construction] Original data set from initialData (fallback):', {
          originalFormDataKeys: Object.keys(form).length,
          sampleFields: {
            borrower_name: form.borrower_name,
            loan_amount: form.loan_amount,
            land_acquisition_cost: form.land_acquisition_cost
          }
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [initialData, originalFormData]);

  // Set original data when form is fully loaded
  useEffect(() => {
    if (form && Object.keys(form).length > 0 && !originalFormData && (initialData || requestId)) {
      const timer = setTimeout(() => {
        setOriginalFormData({ ...form });
        console.debug('[Construction] Original data set from form (final fallback):', {
          originalFormDataKeys: Object.keys(form).length,
          sampleFields: {
            borrower_name: form.borrower_name,
            loan_amount: form.loan_amount,
            land_acquisition_cost: form.land_acquisition_cost
          }
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [form, originalFormData, initialData, requestId]);

  // Detect unsaved changes
  useEffect(() => {
    if (originalFormData && Object.keys(originalFormData).length > 0) {
      // Function to normalize values before comparing
      const normalizeValue = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value;
        if (typeof value === 'boolean') return value;
        return String(value).trim();
      };

      // Campos de address que SÍ deben considerarse para validación de cambios
      const addressFields = [
        'street_address',
        'city',
        'state',
        'zip',
        'lived_less_than_2_years',
        'previous_street_address',
        'previous_city',
        'previous_state',
        'previous_zip'
      ];

      // Comparar campos relevantes uno por uno
      const changedFields = [];
      const hasChanges = Object.keys(form).some(key => {
        const currentValue = normalizeValue(form[key]);
        const originalValue = normalizeValue(originalFormData[key]);
        const isChanged = currentValue !== originalValue;

        if (isChanged) {
          changedFields.push({
            field: key,
            current: currentValue,
            original: originalValue,
            isAddressField: addressFields.includes(key)
          });
        }

        return isChanged;
      });

      console.debug('[Construction] Detección de cambios:', {
        hasChanges,
        changedFields: changedFields.slice(0, 5), // Mostrar solo los primeros 5 campos cambiados
        totalChangedFields: changedFields.length,
        addressFieldsChanged: changedFields.filter(f => f.isAddressField).length,
        formKeys: Object.keys(form).length,
        originalKeys: Object.keys(originalFormData).length,
        addressFields: addressFields
      });

      setHasUnsavedChanges(hasChanges);

      // Notificar al componente padre sobre el cambio de estado
      if (onUnsavedChangesChange) {
        onUnsavedChangesChange(hasChanges);
      }
    }
  }, [form, originalFormData, onUnsavedChangesChange]);

  // Prevent exit with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = (e) => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?');
        if (!confirmLeave) {
          window.history.pushState(null, '', window.location.href);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [hasUnsavedChanges]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked :
        name === 'prepayment_penalty' ? Number(value) : value
    }));
  };

  const toISOOrNull = (v) => {
    if (!v || v === "" || v === "null" || v === "undefined") return null;
    try {
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return null;
      return d.toISOString();
    } catch (_) { return null; }
  };

  const buildDataToSend = () => {
    const payload = {
      client_id: Number(form.client_id || 0),
      user_id: Number(form.user_id || getUserIdFromToken?.() || 0),
      borrower_name: form.borrower_name || "",
      legal_status: form.legal_status || "",
      property_address: form.property_address || "",
      estimated_fico_score: Number(form.estimated_fico_score || 0),

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
      interest_rate_structure: form.interest_rate_structure || "",
      loan_term: (() => {
        const value = form.loan_term;
        if (value === null || value === undefined || value === "") return 0;
        const numValue = Number(value);
        return Number.isNaN(numValue) ? 0 : Math.round(numValue);
      })(),
      prepayment_penalty: Number(form.prepayment_penalty || 0),
      max_ltv: Number(form.max_ltv || 0),
      max_ltc: Number(form.max_ltc || 0),
      as_is_value: Number(form.as_is_value || 0),
      original_acquisition_price: Number(form.original_acquisition_price || 0),
      land_acquisition_cost: Number(form.land_acquisition_cost || 0),
      construction_rehab_budget: Number(form.construction_rehab_budget || 0),
      total_cost: Number(form.total_cost || 0),
      estimated_after_completion_value: Number(form.estimated_after_completion_value || 0),
      origination_fee: Number(form.origination_fee || 0),
      underwriting_fee: Number(form.underwriting_fee || 0),
      processing_fee: Number(form.processing_fee || 0),
      servicing_fee: Number(form.servicing_fee || 0),
      legal_fee: Number(form.legal_fee || 0),
      appraisal_fee: Number(form.appraisal_fee || 0),
      budget_review_fee: Number(form.budget_review_fee || 0),
      broker_fee: Number(form.broker_fee || 0),
      broker_fee_percentage: Number(form.broker_fee_percentage || 0),
      transaction_management_fee: Number(form.transaction_management_fee || 0),
      total_loan_amount: Number(form.total_loan_amount || 0),
      loan_amount: Number(form.loan_amount || 0),
      annual_interest_rate: Number(form.annual_interest_rate || 0),
      requested_leverage: Number(form.requested_leverage || 0),
      monthly_interest_payment: Number(form.monthly_interest_payment || 0),
      construction_holdback: Number(form.construction_holdback || 0),
      initial_funding: Number(form.initial_funding || 0),
      day1_monthly_interest_payment: Number(form.day1_monthly_interest_payment || 0),
      interest_reserves: Number(form.interest_reserves || 0),
      loan_to_as_is_value: Number(form.loan_to_as_is_value || 0),
      loan_to_as_is_value_ltv: Number(form.loan_to_as_is_value_ltv || 0),
      loan_to_cost_ltc: Number(form.loan_to_cost_ltc || 0),
      loan_to_arv: Number(form.loan_to_arv || 0),
      rehab_category: form.rehab_category || "",
      min_credit_score: Number(form.min_credit_score || 0),
      refundable_commitment_deposit: Number(form.refundable_commitment_deposit || 0),
      estimated_closing_costs: Number(form.estimated_closing_costs || 0),
      construction_budget_10_percent: Number(form.construction_budget_10_percent || 0),
      six_months_payment_reserves: Number(form.six_months_payment_reserves || 0),
      construction_budget_delta: Number(form.construction_budget_delta || 0),
      down_payment: Number(form.down_payment || 0),
      total_liquidity: Number(form.total_liquidity || 0),
      client_submitted: Boolean(form.client_submitted),
      client_form_completed: Boolean(form.client_form_completed),
      borrower_signed: Boolean(form.borrower_signed),
      guarantor_signed: Boolean(form.guarantor_signed),
      is_signed: Boolean(form.is_signed),
      is_approved: Boolean(form.is_approved)
    };

    const issuedDate = toISOOrNull(form.issued_date);
    if (issuedDate) payload.issued_date = issuedDate;

    const closingDate = toISOOrNull(form.closing_date);
    if (closingDate) payload.closing_date = closingDate;

    const clientSubmittedAt = toISOOrNull(form.client_submitted_at);
    if (clientSubmittedAt) payload.client_submitted_at = clientSubmittedAt;

    console.log('[Construction] Final payload:', payload);
    return payload;
  };

  const handleDiscardChanges = () => {
    if (window.confirm('Are you sure you want to discard all changes?')) {
      setForm(prev => ({ ...prev, ...originalFormData }));
      setHasUnsavedChanges(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (onSubmit) {
      const payload = buildDataToSend();
      try {
        const response = await onSubmit(payload);
        console.debug('[Construction] Saved successfully:', response);

        // If submission was successful, update original data
        const updatedFormData = { ...form };
        setOriginalFormData(updatedFormData);
        setHasUnsavedChanges(false);

        console.debug('[Construction] State updated after saving:', {
          hasUnsavedChanges: false,
          originalFormDataUpdated: true
        });
      } catch (error) {
        console.error('Error saving:', error);
        // Don't reset state if there was an error
      }
    }
  };

  const handleCreateIntentLetter = async () => {
    if (onSubmit) {
      const payload = buildDataToSend();
      try {
        const response = await onSubmit(payload);
        console.debug('[Construction] Letter created successfully:', response);

        // If creation was successful, set original data
        const updatedFormData = { ...form };
        setOriginalFormData(updatedFormData);
        setHasUnsavedChanges(false);

        console.debug('[Construction] State updated after creating:', {
          hasUnsavedChanges: false,
          originalFormDataUpdated: true
        });
      } catch (error) {
        console.error('Error creating letter:', error);
        // Don't reset state if there was an error
      }
    }
  };

  return (
    <div className="container-fluid">
      {loadingData ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Loading data...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger" role="alert">{error}</div>
      ) : showCreateForm && !Object.keys(initialData || {}).length ? (
        <div className="text-center py-5">
          <h4 className="mb-4">There is no letter of intent for this request</h4>
          <button type="button" className="btn btn-primary btn-lg" onClick={handleCreateIntentLetter} disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                Creating letter of intent...
              </>
            ) : (
              <>
                <i className="fas fa-file-alt me-2"></i>
                Create Letter of Intent
              </>
            )}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Unsaved changes alert */}
          {hasUnsavedChanges && (
            <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3" role="alert">
              <div className="d-flex align-items-center">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <span>You have unsaved changes</span>
              </div>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={handleDiscardChanges}
              >
                <i className="fas fa-undo me-1"></i>
                Discard Changes
              </button>
            </div>
          )}

          {/* 0. BORROWER INFORMATION */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">0. BORROWER INFORMATION</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Borrower Name</label>
                  <input name="borrower_name" className="form-control" value={form.borrower_name || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Legal Status</label>
                  <input name="legal_status" className="form-control" value={form.legal_status || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Issued Date</label>
                  <input type="date" name="issued_date" className="form-control" value={form.issued_date ? String(form.issued_date).split('T')[0] : ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Property Address</label>
                  <input name="property_address" className="form-control" value={form.property_address || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Estimated FICO Score</label>
                  <NumericFormat name="estimated_fico_score" className="form-control" value={form.estimated_fico_score || ''} onValueChange={({ value }) => setForm(prev => ({ ...prev, estimated_fico_score: Number(value || 0) }))} disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* ADDRESS INFORMATION */}
          <div className="row mb-4">
            <div className="col-12">
              <h5 className="fw-bold text-primary mb-3">
                <i className="fas fa-map-marker-alt me-2"></i>
                ADDRESS
              </h5>
            </div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fw-bold">Street Address*</label>
                  <input
                    type="text"
                    name="street_address"
                    className="form-control"
                    value={form.street_address}
                    onChange={handleChange}
                    disabled={!editable}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">City*</label>
                  <input
                    type="text"
                    name="city"
                    className="form-control"
                    value={form.city}
                    onChange={handleChange}
                    disabled={!editable}
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-bold">State*</label>
                  <select
                    name="state"
                    className="form-control"
                    value={form.state}
                    onChange={handleChange}
                    disabled={!editable}
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
                  <label className="form-label fw-bold">Zip*</label>
                  <input
                    type="text"
                    name="zip"
                    className="form-control"
                    value={form.zip}
                    onChange={handleChange}
                    disabled={!editable}
                    required
                  />
                </div>
                <div className="col-md-12">
                  <div className="form-check">
                    <div className="col-12">
                      <h5 className="fw-bold text-primary mb-3">
                        <i className="fas fa-history me-2"></i>
                        PREVIOUS ADDRESS
                      </h5>
                    </div>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="lived_less_than_2_years"
                      checked={form.lived_less_than_2_years}
                      onChange={handleChange}
                      disabled={!editable}
                      id="lived_less_than_2_years"
                    />
                    <label className="form-check-label fw-bold" htmlFor="lived_less_than_2_years">
                      I have lived at my current address for less than 2 years
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Address Fields - Only show when checkbox is checked */}
          {form.lived_less_than_2_years && (
            <div className="row mb-4">

              <div className="col-12">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label fw-bold">Previous Street Address*</label>
                    <input
                      type="text"
                      name="previous_street_address"
                      className="form-control"
                      value={form.previous_street_address}
                      onChange={handleChange}
                      disabled={!editable}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Previous City*</label>
                    <input
                      type="text"
                      name="previous_city"
                      className="form-control"
                      value={form.previous_city}
                      onChange={handleChange}
                      disabled={!editable}
                      required
                    />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fw-bold">Previous State*</label>
                    <select
                      name="previous_state"
                      className="form-control"
                      value={form.previous_state}
                      onChange={handleChange}
                      disabled={!editable}
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
                    <label className="form-label fw-bold">Previous Zip*</label>
                    <input
                      type="text"
                      name="previous_zip"
                      className="form-control"
                      value={form.previous_zip}
                      onChange={handleChange}
                      disabled={!editable}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 1. LOAN DETAILS */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">1. LOAN DETAILS</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">LOAN TYPE</label>
                  <input name="loan_type" className="form-control" value={form.loan_type || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">PROPERTY TYPE</label>
                  <input name="property_type" className="form-control" value={form.property_type || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">ESTIMATED CLOSING DATE</label>
                  <input type="date" name="closing_date" className="form-control" value={form.closing_date ? String(form.closing_date).split('T')[0] : ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">INTEREST RATE STRUCTURE</label>
                  <input name="interest_rate_structure" className="form-control" value={form.interest_rate_structure || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">LOAN TERM</label>
                  <input name="loan_term" className="form-control" value={form.loan_term || ''} onChange={handleChange} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">PREPAYMENT PENALTY</label>
                  <select name="prepayment_penalty" className="form-control" value={form.prepayment_penalty || 0} onChange={handleChange} disabled={!editable}>
                    <option value={0}>NOT APPLICABLE</option>
                    <option value={1}>1 YR</option>
                    <option value={2}>2 YR</option>
                    <option value={3}>3 YR</option>
                    <option value={4}>4 YR</option>
                    <option value={5}>5 YR</option>
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">MAXIMUM LTV (Loan to Value)</label>
                  <NumericFormat name="max_ltv" className="form-control" value={form.max_ltv || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, max_ltv: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">MAXIMUM LTC (Loan to Cost)</label>
                  <NumericFormat name="max_ltc" className="form-control" value={form.max_ltc || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, max_ltc: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 2. PURCHASE, REFINANCE, CASH-OUT */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">2. PURCHASE, REFINANCE, CASH-OUT</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">As-is Value</label>
                  <NumericFormat name="as_is_value" className="form-control" value={form.as_is_value || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, as_is_value: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Original Acquisition Price</label>
                  <NumericFormat name="original_acquisition_price" className="form-control" value={form.original_acquisition_price || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, original_acquisition_price: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 3. FIX & FLIP, GROUND UP CONSTRUCTION */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">3. GROUND UP CONSTRUCTION</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Land or Acquisition Cost</label>
                  <NumericFormat name="land_acquisition_cost" className="form-control" value={form.land_acquisition_cost || ""} onValueChange={({ value }) => setForm(prev => ({ ...prev, land_acquisition_cost: value ? Number(value) : null }))} thousandSeparator="," prefix="$" allowNegative={false} decimalScale={0} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Financed Construction Budget</label>
                  <NumericFormat name="construction_rehab_budget" className="form-control" value={form.construction_rehab_budget || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, construction_rehab_budget: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Total Cost</label>
                  <NumericFormat name="total_cost" className="form-control" value={form.total_cost || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, total_cost: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Estimated After Completion Value</label>
                  <NumericFormat name="estimated_after_completion_value" className="form-control" value={form.estimated_after_completion_value || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, estimated_after_completion_value: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 4. LOAN SUMMARY */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">4. LOAN SUMMARY</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">TOTAL LOAN AMOUNT (subject to appraisal value)</label>
                  <NumericFormat name="total_loan_amount" className="form-control" value={form.total_loan_amount || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, total_loan_amount: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">LOAN AMOUNT</label>
                  <NumericFormat name="loan_amount" className="form-control" value={form.loan_amount || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, loan_amount: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">ANNUAL INTEREST RATE (*)</label>
                  <NumericFormat name="annual_interest_rate" className="form-control" value={form.annual_interest_rate || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, annual_interest_rate: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">REQUESTED LEVERAGE</label>
                  <NumericFormat name="requested_leverage" className="form-control" value={form.requested_leverage || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, requested_leverage: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">APPROX. MONTHLY INTEREST PAYMENT</label>
                  <NumericFormat name="monthly_interest_payment" className="form-control" value={form.monthly_interest_payment || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, monthly_interest_payment: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 5. LOAN CLOSING COST */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">5. LOAN CLOSING COST</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Origination Fee</label>
                  <NumericFormat name="origination_fee" className="form-control" value={form.origination_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, origination_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Underwriting Fee</label>
                  <NumericFormat name="underwriting_fee" className="form-control" value={form.underwriting_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, underwriting_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Processing Fee</label>
                  <NumericFormat name="processing_fee" className="form-control" value={form.processing_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, processing_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Servicing Fee</label>
                  <NumericFormat name="servicing_fee" className="form-control" value={form.servicing_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, servicing_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Legal Fee</label>
                  <NumericFormat name="legal_fee" className="form-control" value={form.legal_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, legal_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Appraisal Fee (TBD)</label>
                  <NumericFormat name="appraisal_fee" className="form-control" value={form.appraisal_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, appraisal_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Budget Review & Feasibility Report Fee</label>
                  <NumericFormat name="budget_review_fee" className="form-control" value={form.budget_review_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, budget_review_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 6. OTHER EXPENSES (Estimated) */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">6. OTHER EXPENSES (Estimated)</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Broker Fee (0.00%)</label>
                  <NumericFormat name="broker_fee" className="form-control" value={form.broker_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, broker_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Broker Fee Percentage</label>
                  <NumericFormat name="broker_fee_percentage" className="form-control" value={form.broker_fee_percentage || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, broker_fee_percentage: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Transaction Management Fee</label>
                  <NumericFormat name="transaction_management_fee" className="form-control" value={form.transaction_management_fee || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, transaction_management_fee: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>



          {/* 7. IF LOAN IS GROUND UP CONSTRUCTION */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">7. GROUND UP CONSTRUCTION DETAILS</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">CONSTRUCTION HOLDBACK</label>
                  <NumericFormat name="construction_holdback" className="form-control" value={form.construction_holdback || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, construction_holdback: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">INITIAL FUNDING</label>
                  <NumericFormat name="initial_funding" className="form-control" value={form.initial_funding || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, initial_funding: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">DAY 1 APPROX. MONTHLY INTEREST PAYMENT</label>
                  <NumericFormat name="day1_monthly_interest_payment" className="form-control" value={form.day1_monthly_interest_payment || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, day1_monthly_interest_payment: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Interest Reserves</label>
                  <NumericFormat name="interest_reserves" className="form-control" value={form.interest_reserves || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, interest_reserves: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-12">
                  <small className="text-muted">*** Monthly payment on rehab begins when drawn</small>
                </div>
              </div>
            </div>
          </div>

          {/* 8. PURCHASE, REFINANCE, CASH OUT */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">8. PURCHASE, REFINANCE, CASH OUT</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Loan to As-Is Value (LTV)</label>
                  <NumericFormat name="loan_to_as_is_value_ltv" className="form-control" value={form.loan_to_as_is_value_ltv || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, loan_to_as_is_value_ltv: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 9. GROUND UP CONSTRUCTION (Metrics) */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">9. GROUND UP CONSTRUCTION (Metrics)</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Loan to As-Is Value (LTAIV)</label>
                  <NumericFormat name="loan_to_as_is_value" className="form-control" value={form.loan_to_as_is_value || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, loan_to_as_is_value: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Loan to Cost (LTC)</label>
                  <NumericFormat name="loan_to_cost_ltc" className="form-control" value={form.loan_to_cost_ltc || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, loan_to_cost_ltc: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Loan to ARV (Maximum 75%)</label>
                  <NumericFormat name="loan_to_arv" className="form-control" value={form.loan_to_arv || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, loan_to_arv: Number(value || 0) }))} decimalScale={2} suffix="%" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Rehab Category</label>
                  <input name="rehab_category" className="form-control" value={form.rehab_category || ''} onChange={handleChange} disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 10. CONDITIONS AND ADDITIONAL INFORMATION */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">10. CONDITIONS AND ADDITIONAL INFORMATION</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Minimum Credit Score required</label>
                  <NumericFormat name="min_credit_score" className="form-control" value={form.min_credit_score || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, min_credit_score: Number(value || 0) }))} disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">REFUNDABLE COMMITMENT DEPOSIT</label>
                  <NumericFormat name="refundable_commitment_deposit" className="form-control" value={form.refundable_commitment_deposit || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, refundable_commitment_deposit: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* 11. MINIMUM BORROWER'S LIQUIDITY REQUIRED (Estimated) */}
          <div className="row mb-4">
            <div className="col-12"><h5 className="fw-bold text-primary mb-3">11. MINIMUM BORROWER'S LIQUIDITY REQUIRED (Estimated)</h5></div>
            <div className="col-12">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-bold">Estimated closing costs</label>
                  <NumericFormat name="estimated_closing_costs" className="form-control" value={form.estimated_closing_costs || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, estimated_closing_costs: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">10% of Construction Budget</label>
                  <NumericFormat name="construction_budget_10_percent" className="form-control" value={form.construction_budget_10_percent || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, construction_budget_10_percent: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">6 months payment reserves</label>
                  <NumericFormat name="six_months_payment_reserves" className="form-control" value={form.six_months_payment_reserves || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, six_months_payment_reserves: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Construction budget delta</label>
                  <NumericFormat name="construction_budget_delta" className="form-control" value={form.construction_budget_delta || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, construction_budget_delta: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Down Payment Total</label>
                  <NumericFormat name="down_payment" className="form-control" value={form.down_payment || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, down_payment: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-bold">Total Liquidity</label>
                  <NumericFormat name="total_liquidity" className="form-control" value={form.total_liquidity || 0} onValueChange={({ value }) => setForm(prev => ({ ...prev, total_liquidity: Number(value || 0) }))} thousandSeparator="," prefix="$" disabled={!editable} />
                </div>
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="row">
            <div className="col-12 text-center">
              <button
                type="submit"
                className={`btn btn-lg px-5 ${hasUnsavedChanges ? 'btn-warning' : 'btn-primary'}`}
                disabled={loading}
                style={{ borderRadius: '25px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className={`fas me-2 ${hasUnsavedChanges ? 'fa-exclamation-triangle' : 'fa-save'}`}></i>
                    {hasUnsavedChanges
                      ? 'Save Changes'
                      : 'Save Construction Letter of Intent'
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};

export default ConstructionIntentionForm;


