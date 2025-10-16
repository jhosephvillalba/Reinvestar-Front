import FilterIcon from "../../../assets/filter.svg";
import LoupeIcon from "../../../assets/Loupe.svg";
import Eye from "../../../assets/eye.svg";
import BookCheck from "../../../assets/book-check.svg";
import styles from "./style.module.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pagination from "../../../components/Pagination";

import * as apiFixflip from "../../../Api/fixflip";
import * as apiDscr from "../../../Api/dscr";
import * as apiConstruction from "../../../Api/construction";
import * as apiSeller from "../../../Api/seller";
import { getProcessors, assignProcessor, getProcessorsByRequest } from "../../../Api/procesor";

const RequestLoan = () => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [requestType, setRequestType] = useState("dscr");
  const [requestsData, setRequestsData] = useState(null);
  const navegate = useNavigate();
  const [showAssignPopup, setShowAssignPopup] = useState(false);
  const [processors, setProcessors] = useState([]);
  const [selectedProcessor, setSelectedProcessor] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState("");
  const [assignError, setAssignError] = useState("");
  const [assignRequest, setAssignRequest] = useState({ id: null, type: null });
  const [globalSuccess, setGlobalSuccess] = useState("");
  const [existingAssignments, setExistingAssignments] = useState([]);

  // New states for filters
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // State for current user
  const [currentUser, setCurrentUser] = useState(null);

  // Load current user at start
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  // Load sellers only if user is admin, coordinator or processor
  useEffect(() => {
    if (currentUser && (currentUser.roles?.[0] === "Admin" || currentUser.roles?.[0] === "Coordinador" || currentUser.roles?.[0] === "Procesador")) {
      loadSellers();
    }
  }, [currentUser]);

  // Load requests when filters change
  useEffect(() => {
    if (!requestType) return;
    
    const timeoutId = setTimeout(() => {
      handleRequests(requestType);
    }, 300); // 300ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [requestType, currentPage, selectedSeller, selectedStatus, searchTerm]);

  const loadSellers = async () => {
    try {
      const response = await apiSeller.getSellers();
      setSellers(response?.items || []);
    } catch (error) {
      console.error('Error loading sellers:', error);
      setSellers([]);
    }
  };

  const loadExistingAssignments = async (requestId, requestType) => {
    try {
      const params = {};
      
      // Add corresponding request ID according to type
      switch (requestType) {
        case "dscr":
          params.dscr_request_id = parseInt(requestId);
          break;
        case "fixflip":
          params.fixflip_request_id = parseInt(requestId);
          break;
        case "construction":
          params.construction_request_id = parseInt(requestId);
          break;
        default:
          console.error('Invalid request type:', requestType);
          return [];
      }
      
      const data = await getProcessorsByRequest(params);
      
      // Ensure data is an array
      let assignmentsData = [];
      if (Array.isArray(data)) {
        assignmentsData = data;
      } else if (data && Array.isArray(data.items)) {
        assignmentsData = data.items;
      } else if (data && Array.isArray(data.results)) {
        assignmentsData = data.results;
      }
      
      // Filter only active assignments
      const activeAssignments = assignmentsData.filter(assignment => 
        assignment.status === "ASSIGNED" && assignment.is_active
      );

      // Remove duplicates based on processor_id, keeping only the most recent assignment
      const uniqueAssignments = [];
      const seenProcessorIds = new Set();
      
      // Sort by assignment date (most recent first)
      activeAssignments.sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at));
      
      activeAssignments.forEach(assignment => {
        const processorId = assignment.processor_id || assignment.processor?.id;
        if (processorId && !seenProcessorIds.has(processorId)) {
          seenProcessorIds.add(processorId);
          uniqueAssignments.push(assignment);
        }
      });
      
      console.log('Existing assignments filtered and deduplicated:', uniqueAssignments);
      setExistingAssignments(uniqueAssignments);
      return uniqueAssignments;
    } catch (error) {
      console.error('Error loading existing assignments:', error);
      setExistingAssignments([]);
      return [];
    }
  };


  const handleRedired = () => {
    navegate("/requests/new-request");
  };

  const handleRequestTypeChange = (e) => {
    setRequestType(e.target.value);
    setCurrentPage(1); // Reset page when changing type
  };

  const handleRequests = async (requestType) => {
    if (!requestType) return;
    
    try {
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
        seller_id: selectedSeller || undefined,
        status: selectedStatus || undefined,
        search: searchTerm || undefined
      };

      let data;
      switch (requestType) {
        case "fixflip":
          data = await apiFixflip.getFixflips(params);
          break;
        case "dscr":
          data = await apiDscr.getDscrs(params);
          break;
        case "construction":
          data = await apiConstruction.getConstructions(params);
          break;
        default:
          data = [];
      }
      
      setRequestsData(data);
    } catch (error) {
      console.error('Error loading requests:', error);
      setRequestsData([]);
    }
  };

  const openAssignPopup = async (requestId, requestType) => {
    // Clear all states first
    setAssignRequest({ id: requestId, type: requestType });
    setShowAssignPopup(true);
    setAssignSuccess("");
    setAssignError("");
    setSelectedProcessor(null);
    setExistingAssignments([]);
    setProcessors([]); // Clear processors as well
    
    try {
      // Load processors and existing assignments in parallel
      const [processorsData, assignmentsData] = await Promise.all([
        getProcessors(),
        loadExistingAssignments(requestId, requestType)
      ]);
      
      console.log(`[DEBUG] Loading processors for request ${requestId} of type ${requestType}:`, processorsData);
      console.log(`[DEBUG] Existing assignments for request ${requestId}:`, assignmentsData);
      
      setProcessors(
        Array.isArray(processorsData)
          ? processorsData
          : processorsData.items
            ? processorsData.items
            : processorsData.results
              ? processorsData.results
              : []
      );
    } catch (error) {
      console.error('Error loading data:', error);
      setProcessors([]);
      setExistingAssignments([]);
    }
  };

  const closeModalAndCleanup = () => {
    setShowAssignPopup(false);
    setSelectedProcessor(null);
    setAssignSuccess("");
    setAssignError("");
    setExistingAssignments([]);
    setProcessors([]); // Clear processors on close
    
    // Manually remove Bootstrap backdrop if it exists
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach(b => b.parentNode && b.parentNode.removeChild(b));
    document.body.classList.remove('modal-open');
    
    // If successful, show global notification
    if (assignSuccess) {
      setGlobalSuccess(assignSuccess);
      setTimeout(() => setGlobalSuccess(""), 3000);
    }
  };

  const handleAssign = async () => {
    if (!selectedProcessor) return;
    
    // Validate if there is already a processor assigned
    if (existingAssignments.length > 0) {
      setAssignError("There is already a processor assigned to this request. You must unassign the current processor before assigning another.");
      return;
    }
    
    setAssigning(true);
    setAssignSuccess("");
    setAssignError("");
    try {
      await assignProcessor({
        processor_id: parseInt(selectedProcessor, 10),
        dscr_request_id: assignRequest.type === "dscr" ? parseInt(assignRequest.id, 10) : undefined,
        fixflip_request_id: assignRequest.type === "fixflip" ? parseInt(assignRequest.id, 10) : undefined,
        construction_request_id: assignRequest.type === "construction" ? parseInt(assignRequest.id, 10) : undefined
      });
      setAssignSuccess("Processor assigned successfully!");
      
      // Reload assignments after assigning
      await loadExistingAssignments(assignRequest.id, assignRequest.type);
      
      // Close modal after 2 seconds
      setTimeout(() => {
        closeModalAndCleanup();
      }, 2000);
    } catch (error) {
      console.error('Error assigning processor:', error);
      setAssignError("Error assigning processor. Verify that the processor is available.");
    } finally {
      setAssigning(false);
    }
  };

  // Pagination logic
  const totalItems = requestsData && requestsData.total ? requestsData.total : (Array.isArray(requestsData) ? requestsData.length : 0);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    handleRequests(requestType || "dscr");
  };

  // Status formatter
  const formatStatus = (status) => {
    if (!status) return <span className="text-muted">Not defined</span>;
    
    const statusMap = {
      'PENDING': { label: 'Pending', color: 'bg-warning text-dark' },
      'IN_REVIEW': { label: 'Under Review', color: 'bg-info text-white' },
      'PRICING': { label: 'Pricing', color: 'bg-primary text-white' },
      'ACCEPTED': { label: 'Approved', color: 'bg-success text-white' },
      'REJECTED': { label: 'Rejected', color: 'bg-danger text-white' },
      'CANCELLED': { label: 'Cancelled', color: 'bg-secondary text-white' },
      'CLOSED': { label: 'Closed', color: 'bg-dark text-white' }
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-secondary text-white' };
    
    return (
      <span className={`badge ${statusInfo.color} px-3 py-2`} style={{ fontSize: '0.85rem' }}>
        {statusInfo.label}
      </span>
    );
  };

  // Monetary value formatter
  const formatMonetaryValue = (value) => {
    if (!value || isNaN(Number(value)) || Number(value) === 0) {
      return <span className="text-muted">Pending</span>;
    }
    const amount = Number(value);
    let label, color;
    
    if (amount < 100000) {
      label = "Low";
      color = "text-success";
    } else if (amount < 500000) {
      label = "Medium";
      color = "text-primary";
    } else {
      label = "High";
      color = "text-danger";
    }
    
    return <span className={color}>{label}</span>;
  };

  // Percentage formatter
  const formatPercent = (value) => {
    if (!value || isNaN(Number(value)) || Number(value) === 0) {
      return <span className="text-muted">Pending</span>;
    }
    const percent = Number(value);
    let label, color;
    
    if (percent < 50) {
      label = "Conservative";
      color = "text-success";
    } else if (percent < 75) {
      label = "Moderate";
      color = "text-primary";
    } else {
      label = "Aggressive";
      color = "text-danger";
    }
    
    return <span className={color}>{label}</span>;
  };

  // Renders table according to request type
  const renderTable = () => {
    // Use DSCR data for all tables temporarily
    const data = requestsData;
    if (requestType === "fixflip") {
      return (
        <table className="table table-bordered table-hover">
          <thead className="sticky-top">
            <tr>
              <th style={{ color: "#000" }}>ID</th>
              <th style={{ color: "#000" }}>Filed</th>
              <th style={{ color: "#000" }}>Full Name</th>
              <th style={{ color: "#000" }}>Email</th>
              <th style={{ color: "#000" }}>Phone</th>
              <th style={{ color: "#000" }}>Loan Amount</th>
              <th style={{ color: "#000" }}>Purchase Price</th>
              <th style={{ color: "#000" }}>ARV</th>
              <th style={{ color: "#000" }}>Status</th>
              <th style={{ color: "#000" }}>Options</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.id}</strong></td>
                  <td>{request.radicado}</td>
                  <td>{request?.client?.full_name}</td>
                  <td>{request?.client?.email}</td>
                  <td>{request?.client?.phone}</td>
                  <td>{formatMonetaryValue(request.loan_amount)}</td>
                  <td>{formatMonetaryValue(request.purchase_price)}</td>
                  <td>{formatMonetaryValue(request.arv)}</td>
                  <td>{formatStatus(request.status)}</td>
                  <td>
                    <button className="btn btn-sm me-1" style={{ backgroundColor: "#000" }} onClick={() => openAssignPopup(request.id, requestType || 'dscr')}>
                      <img src={BookCheck} alt="check-data" width={10} />
                    </button>
                    <button className="btn btn-sm" style={{ backgroundColor: "#000" }} onClick={() => navegate(`/requests/${requestType || 'dscr'}/${request.id}/details`)}>
                      <img src={Eye} alt="detail-client" width={10} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10}>No fixflip requests</td>
              </tr>
            )}
          </tbody>
        </table>
      );
    } else if (requestType === "construction") {
      return (
        <table className="table table-bordered table-hover">
          <thead className="sticky-top">
            <tr>
              <th style={{ color: "#000" }}>ID</th>
              <th style={{ color: "#000" }}>Filed</th>
              <th style={{ color: "#000" }}>Full Name</th>
              <th style={{ color: "#000" }}>Email</th>
              <th style={{ color: "#000" }}>Phone</th>
              <th style={{ color: "#000" }}>Loan Amount</th>
              <th style={{ color: "#000" }}>Property Value</th>
              <th style={{ color: "#000" }}>Construction Cost</th>
              <th style={{ color: "#000" }}>Status</th>
              <th style={{ color: "#000" }}>Options</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.id}</strong></td>
                  <td>{request.radicado}</td>
                  <td>{request?.client?.full_name}</td>
                  <td>{request?.client?.email}</td>
                  <td>{request?.client?.phone}</td>
                  <td>{formatMonetaryValue(request.loan_amount)}</td>
                  <td>{formatMonetaryValue(request.property_value)}</td>
                  <td>{formatMonetaryValue(request.construction_cost)}</td>
                  <td>{formatStatus(request.status)}</td>
                  <td>
                    <button className="btn btn-sm me-1" style={{ backgroundColor: "#000" }} onClick={() => openAssignPopup(request.id, requestType || 'dscr')}>
                      <img src={BookCheck} alt="check-data" width={10} />
                    </button>
                    <button className="btn btn-sm" style={{ backgroundColor: "#000" }} onClick={() => navegate(`/requests/${requestType || 'dscr'}/${request.id}/details`)}>
                      <img src={Eye} alt="detail-client" width={10} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10}>No construction requests</td>
              </tr>
            )}
          </tbody>
        </table>
      );
    } else {
      // Default DSCR
      return (
        <table className="table table-bordered table-hover">
          <thead className="sticky-top">
            <tr>
              <th style={{ color: "#000" }}>ID</th>
              <th style={{ color: "#000" }}>Filed</th>
              <th style={{ color: "#000" }}>Full Name</th>
              <th style={{ color: "#000" }}>Email</th>
              <th style={{ color: "#000" }}>Phone</th>
              <th style={{ color: "#000" }}>Rent Amount</th>
              <th style={{ color: "#000" }}>Appraisal Value</th>
              <th style={{ color: "#000" }}>Requested LTV</th>
              <th style={{ color: "#000" }}>Status</th>
              <th style={{ color: "#000" }}>Options</th>
            </tr>
          </thead>
          <tbody>
            {data && data.length > 0 ? (
              data.map((request) => (
                <tr key={request.id}>
                  <td><strong>{request.id}</strong></td>
                  <td>{request.radicado}</td>
                  <td>{request?.client.full_name}</td>
                  <td>{request?.client.email}</td>
                  <td>{request?.client.phone}</td>
                  <td>{formatMonetaryValue(request.rent_amount)}</td>
                  <td>{formatMonetaryValue(request.appraisal_value)}</td>
                  <td>{formatPercent(request.ltv_request)}</td>
                  <td>{formatStatus(request.status)}</td>
                  <td>
                    <button className="btn btn-sm me-1" style={{ backgroundColor: "#000" }} onClick={() => openAssignPopup(request.id, requestType || 'dscr')}>
                      <img src={BookCheck} alt="check-data" width={10} />
                    </button>
                    <button className="btn btn-sm" style={{ backgroundColor: "#000" }} onClick={() => navegate(`/requests/${requestType || 'dscr'}/${request.id}/details`)}>
                      <img src={Eye} alt="detail-client" width={10} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={10}>No dscr requests</td>
              </tr>
            )}
          </tbody>
        </table>
      );
    }
  };

  // Function to verify if user can see seller filter
  const canViewSellerFilter = () => {
    return currentUser && (currentUser.roles?.[0] === "Admin" || currentUser.roles?.[0] === "Coordinador" || currentUser.roles?.[0] === "Procesador");
  };

  return (
    <div
      className={`${"d-flex flex-column"} internal_layout`}
      style={{ backgroundColor: "#fff" }}
    >
      <div className="d-flex flex-column align-items-start w-100 mb-4 px-4 mt-5">
        <p className="mb-4 fs-2 fw-bolder my_title_color">
          Loan Requests
        </p>
      </div>
      <div className="d-flex justify-content-between w-100 mb-4 px-4">
        <div className="d-flex align-items-center gap-3">
          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={handleRedired}
          >
            <i className={`bi bi-plus-lg ${styles.icon}`}></i>
            <span className={`${styles.text} my_title_color`}>
              Create Request
            </span>
          </button>
        </div>
        <div className={`${"d-flex gap-3"}`}>
          {/* <button className="btn d-flex align-items-center">
            <img src={FilterIcon} alt="filter" width={18} />
          </button> */}
          <select 
            className="form-select my_title_color" 
            onChange={handleRequestTypeChange} 
            value={requestType}
          >
            <option value="dscr">DSCR</option>
            <option value="fixflip">Fix & Flip</option>
            <option value="construction">Construction</option>
          </select>
          {canViewSellerFilter() && (
            <select 
              className="form-select my_title_color" 
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
            >
              <option value="">Sellers</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.full_name}
                </option>
              ))}
            </select>
          )}
          <select 
            className="form-select my_title_color" 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">Status</option>
            <option value="PENDING">Pending</option>
            <option value="IN_REVIEW">Under Review</option>
            <option value="PRICING">Pricing</option>
            <option value="ACCEPTED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="CLOSED">Closed</option>
          </select>

          <div className={`input-group ${styles.searchGroup}`}>
            <input 
              type="text" 
              className={`form-control ${styles.searchInput}`} 
              placeholder="Search" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="btn btn-primary" type="button">
              <img src={LoupeIcon} alt="" width={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Clients table */}
      <div className={`${"w-100 px-4 mb-3"} table_height`}>
        {renderTable()}
      </div>
      <Pagination currentPage={currentPage} totalPages={totalPages} handlePaginate={paginate} />
      
      {/* Processor assignment modal */}
      {showAssignPopup && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1">
          <div className="modal-dialog modal-dialog-centered" style={{ zIndex: 1051 }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-plus me-2"></i>
                  {existingAssignments.length > 0 ? "Assigned Processor" : "Assign Processor"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={closeModalAndCleanup}
                  disabled={assigning}
                />
              </div>
              <div className="modal-body">
                {/* Notifications */}
                {assignSuccess && (
                  <div className="alert alert-success alert-dismissible fade show" role="alert">
                    <i className="bi bi-check-circle me-2"></i>
                    {assignSuccess}
                    <button type="button" className="btn-close" onClick={() => setAssignSuccess("")}></button>
                  </div>
                )}
                {assignError && (
                  <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    <i className="bi bi-exclamation-circle me-2"></i>
                    {assignError}
                    <button type="button" className="btn-close" onClick={() => setAssignError("")}></button>
                  </div>
                )}

                {/* Processor selector */}
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Select Processor
                    {existingAssignments.length > 0 && (
                      <span className="text-muted ms-2">(Disabled - There is already a processor assigned)</span>
                    )}
                  </label>
                  <select 
                    className="form-select" 
                    value={selectedProcessor || ""} 
                    onChange={e => setSelectedProcessor(e.target.value)}
                    disabled={assigning || existingAssignments.length > 0}
                  >
                    <option value="">Select a processor</option>
                    {(Array.isArray(processors) ? processors : []).map(proc => (
                      <option key={proc.id} value={proc.id}>
                        {proc.full_name || proc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected processor information */}
                {selectedProcessor && (() => {
                  const proc = (Array.isArray(processors) ? processors : []).find(p => String(p.id) === String(selectedProcessor));
                  if (!proc) return null;
                  return (
                    <div className="mb-3 p-3 border rounded bg-light">
                      <h6 className="fw-bold text-primary mb-2">
                        <i className="bi bi-person me-2"></i>
                        Selected Processor
                      </h6>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Name:</strong> {proc.full_name || proc.name}</p>
                          <p className="mb-1"><strong>Email:</strong> {proc.email || '-'}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Phone:</strong> {proc.phone || '-'}</p>
                          <p className="mb-1">
                            <strong>Status:</strong> 
                            <span className={`badge ${proc.is_active ? 'bg-success' : 'bg-secondary'} ms-2`}>
                              {proc.is_active ? "Active" : "Inactive"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Assigned processor information */}
                {existingAssignments.length > 0 && (
                  <div className="alert alert-warning">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    <strong>Processor already assigned:</strong>
                    {existingAssignments.map((assignment, index) => (
                      <div key={index} className="mt-2">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <strong>{assignment.processor?.full_name || assignment.processor?.name}</strong>
                            <br />
                            <small className="text-muted">
                              Email: {assignment.processor?.email || 'Not available'}
                            </small>
                          </div>
                          <span className="badge bg-success">Assigned</span>
                        </div>
                      </div>
                    ))}
                    <div className="mt-2">
                      <small className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        To assign another processor, you must first unassign the current one.
                      </small>
                    </div>
                  </div>
                )}

                {/* Request information */}
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Request:</strong> #{assignRequest.id} - {assignRequest.type?.toUpperCase()}
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeModalAndCleanup} 
                  disabled={assigning}
                >
                  <i className="bi bi-x me-2"></i>
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleAssign} 
                  disabled={!selectedProcessor || assigning || existingAssignments.length > 0}
                >
                  {assigning ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Assigning...
                    </>
                  ) : existingAssignments.length > 0 ? (
                    <>
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Processor already assigned
                    </>
                  ) : (
                    <>
                      <i className="bi bi-person-plus me-2"></i>
                      Assign Processor
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Global notification */}
      {globalSuccess && (
        <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1060 }}>
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            <i className="bi bi-check-circle me-2"></i>
            {globalSuccess}
            <button type="button" className="btn-close" onClick={() => setGlobalSuccess("")}></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequestLoan;
