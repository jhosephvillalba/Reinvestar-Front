import FilterIcon from "../../../../assets/filter.svg";
import LoupeIcon from "../../../../assets/Loupe.svg";
import Eye from "../../../../assets/eye.svg"; 
import BookCheck from "../../../../assets/book-check.svg"; 
import styles from "./style.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../../components/Pagination";
import { getProcessors, getProcessorDetails } from "../../../../Api/procesor";
import { getCompanies } from "../../../../Api/admin";

const Procesors = () => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [processors, setProcessors] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [selectedWorkload, setSelectedWorkload] = useState(null);
  const [workloadLoading, setWorkloadLoading] = useState(false);
  const [workloadError, setWorkloadError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [companyMap, setCompanyMap] = useState({});
  const navegate = useNavigate();

  const handleRedirect = (id) => {
    navegate(`/processors/${id}/details`)
  }

  const fetchProcessors = async (page = 1, searchValue = "", estadoValue = "") => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        skip: (page - 1) * itemsPerPage,
        limit: itemsPerPage,
      };
      if (searchValue) params.search = searchValue;
      // Enable status filter
      if (estadoValue && estadoValue !== "") {
        params.is_active = estadoValue === "Active" ? true : false;
      }
      const data = await getProcessors(params);
      
      // Handle the new data structure
      if (Array.isArray(data)) {
        // If data is directly an array of processors
        setProcessors(data);
        setTotal(data.length);
      } else if (data && Array.isArray(data.items)) {
        // If data has the structure { items: [], total: number }
        setProcessors(data.items);
        setTotal(data.total || data.items.length);
      } else {
        setProcessors([]);
        setTotal(0);
      }
    } catch (err) {
      setError("Error loading processors");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await getCompanies({ skip: 0, limit: 100 });
        setCompanies(data);
        // Create a dictionary for quick access by id
        const map = {};
        data.forEach(c => { map[c.id] = c.name; });
        setCompanyMap(map);
      } catch (e) {
        setCompanies([]);
        setCompanyMap({});
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchProcessors(currentPage, search, estado);
    // eslint-disable-next-line
  }, [currentPage, search, estado]);

  const handleRedired = () => {
    navegate("/processors/new-process");
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchProcessors(1, search, estado);
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEstadoChange = (e) => {
    setEstado(e.target.value);
    setCurrentPage(1);
  };

  const handleShowWorkload = async (processor) => {
    setWorkloadLoading(true);
    setWorkloadError(null);
    setSelectedWorkload(null);
    
    try {
      console.log('Loading details for processor ID:', processor.id);
      const workloadData = await getProcessorDetails(processor.id);
      console.log('Data received from API:', workloadData);
      
      // Map data according to the real API structure
      const finalData = {
        ...processor,
        active_assignments_count: workloadData.active_assignments?.length || 0,
        pending_requests: workloadData.workload?.assigned || 0,
        in_progress_requests: workloadData.workload?.in_progress || 0,
        completed_requests: workloadData.workload?.completed || 0,
        total_assignments: workloadData.workload?.total_assignments || 0,
        active_assignments: workloadData.active_assignments || []
      };
      console.log('Final data for modal:', finalData);
      setSelectedWorkload(finalData);
    } catch (err) {
      console.error('Error loading processor details:', err);
      setWorkloadError('Error loading workload information');
      // In case of error, show at least basic processor information
      setSelectedWorkload({
        ...processor,
        active_assignments_count: 0,
        pending_requests: 0,
        in_progress_requests: 0,
        completed_requests: 0,
        active_assignments: []
      });
    } finally {
      setWorkloadLoading(false);
    }
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div
      className={`${"d-flex flex-column"} internal_layout`}
      style={{ backgroundColor: "#fff" }}
    >
      <div className="d-flex flex-column align-items-start w-100 mb-4 px-4 mt-5">
        <p className="mb-4 fs-2 fw-bolder my_title_color">
          Processors
        </p>
      </div>
      <div className="d-flex justify-content-between w-100 mb-4 px-4">
        <div>
          
          <button
            className="btn btn-primary d-flex align-items-center"
            onClick={handleRedired}
          >
            <i className={`bi bi-plus-lg ${styles.icon}`}></i>
            <span className={`${styles.text} my_title_color`}>
              CREATE PROCESSOR
            </span>
          </button>
        </div>
        <div className={`${"d-flex gap-3"}`}>
          {/* <button className="btn d-flex align-items-center">
            <img src={FilterIcon} alt="filter" width={18} />
          </button> */}
          <select className="form-select my_title_color" name="Estado" value={estado} onChange={handleEstadoChange} style={{ padding: "0 2rem" }}>
            <option value="">Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className={`input-group ${styles.searchGroup}`}>
            <input 
              type="text" 
              className={`form-control ${styles.searchInput}`} 
              placeholder="Search" 
              value={search} 
              onChange={handleSearchChange} 
            />
            <button className="btn btn-primary" type="button" onClick={handleSearch}>
              <img src={LoupeIcon} alt="" width={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Processors table */}
      <div
        className={`${"w-100 px-4 mb-3"} table_height`}
      >
        {loading ? (
          <div className="text-center py-5">Loading processors...</div>
        ) : error ? (
          <div className="text-danger text-center py-5">{error}</div>
        ) : (
        <table className="table table-bordered table-hover">
          <thead className="sticky-top">
            <tr>
              {/*<th style={{ color: "#000" }}>ID</th>*/}
              <th style={{ color: "#000" }}>Full Name</th>
              <th style={{ color: "#000" }}>Email</th>
              <th style={{ color: "#000" }}>Phone</th>
              <th style={{ color: "#000" }}>Identification</th>
              <th style={{ color: "#000" }}>Company</th>
              <th style={{ color: "#000" }}>Status</th>
              <th style={{ color: "#000" }}>Options</th>
            </tr>
          </thead>
          <tbody>
              {processors.length > 0 ? (
                processors.map((processor) => (
                  <tr key={processor.id}>
                   {/*<td>{processor.id}</td>*/}
                    <td>{processor.full_name}</td>
                    <td>{processor.email}</td>
                    <td>{processor.phone || '-'}</td>
                    <td>{processor.identification || '-'}</td>
                    {/* <td>{processor.company_id || '-'}</td> */}
                    <td>{companyMap[processor.company_id] || '-'}</td>
                    <td>
                      <span className={`badge ${processor.is_active ? 'bg-success' : 'bg-secondary'}`}>
                        {processor.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                <td>
                  <button
                    className="btn btn-sm me-1"
                    style={{ backgroundColor: "#000" }}
                        onClick={() => handleShowWorkload(processor)}
                        data-bs-toggle="modal"
                        data-bs-target="#workloadModal"
                  >
                    <img src={BookCheck} alt="check-data" width={15} />
                  </button>
                  <button
                        onClick={() => handleRedirect(processor.id)}
                    className="btn btn-sm"
                    style={{ backgroundColor: "#000" }}
                  >
                    <img src={Eye} alt="detail-client" width={10}/>
                  </button>
                </td>
              </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center">No processors to display</td>
                </tr>
              )}
          </tbody>
        </table>
        )}
      </div>

      <Pagination 
        currentPage={currentPage} 
        totalPages={Math.ceil(total / itemsPerPage) || 1} 
        handlePaginate={paginate}
      />

      {/* Workload Modal */}
      <div className="modal fade" id="workloadModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Workload Statistics</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {workloadLoading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading workload information...</p>
                </div>
              ) : workloadError ? (
                <div className="alert alert-warning">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  <strong>Warning:</strong> {workloadError}
                </div>
              ) : selectedWorkload ? (
                <div>
                  <div className="mb-4">
                    <h6 className="text-muted mb-3">Processor Information</h6>
                    <p className="mb-1"><strong>Name:</strong> {selectedWorkload.full_name}</p>
                    <p className="mb-1"><strong>Email:</strong> {selectedWorkload.email}</p>
                    <p className="mb-1"><strong>Status:</strong> 
                      <span className={`badge ${selectedWorkload.is_active ? 'bg-success' : 'bg-secondary'} ms-2`}>
                        {selectedWorkload.is_active ? "Active" : "Inactive"}
                      </span>
                    </p>
                    {selectedWorkload.phone && (
                      <p className="mb-1"><strong>Phone:</strong> {selectedWorkload.phone}</p>
                    )}
                    {selectedWorkload.identification && (
                      <p className="mb-1"><strong>Identification:</strong> {selectedWorkload.identification}</p>
                    )}
                    {selectedWorkload.address && (
                      <p className="mb-1"><strong>Address:</strong> {selectedWorkload.address}</p>
                    )}
                  </div>
                  
                  <h6 className="text-muted mb-3">Work Metrics</h6>
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="p-3 border rounded bg-light">
                        <div className="small text-muted">Active Assignments</div>
                        <div className="h3 mb-0 text-primary">{selectedWorkload.active_assignments_count || 0}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 border rounded bg-light">
                        <div className="small text-muted">Total Assignments</div>
                        <div className="h3 mb-0 text-secondary">{selectedWorkload.total_assignments || 0}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 border rounded bg-light">
                        <div className="small text-muted">Assigned</div>
                        <div className="h3 mb-0 text-warning">{selectedWorkload.pending_requests || 0}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 border rounded bg-light">
                        <div className="small text-muted">In Progress</div>
                        <div className="h3 mb-0 text-info">{selectedWorkload.in_progress_requests || 0}</div>
                      </div>
                    </div>
                    <div className="col-6">
                      <div className="p-3 border rounded bg-light">
                        <div className="small text-muted">Completed</div>
                        <div className="h3 mb-0 text-success">{selectedWorkload.completed_requests || 0}</div>
                      </div>
                    </div>
                  </div>

                  {selectedWorkload.active_assignments && selectedWorkload.active_assignments.length > 0 && (
                    <div className="mt-4">
                      <h6 className="text-muted mb-3">Active Assignments</h6>
                      <div className="list-group">
                        {selectedWorkload.active_assignments.map((assignment) => (
                          <div key={assignment.id} className="list-group-item">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <span className="badge bg-primary">{assignment.request_type}</span>
                              <small className="text-muted">
                                {new Date(assignment.assigned_at).toLocaleDateString()}
                              </small>
                            </div>
                            <p className="mb-1"><strong>Client:</strong> {assignment.client_name}</p>
                            <p className="mb-0">
                              <span className={`badge ${assignment.request_status === 'PENDING' ? 'bg-warning' : 'bg-info'}`}>
                                {assignment.request_status}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Procesors;
