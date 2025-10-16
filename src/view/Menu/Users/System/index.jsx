import FilterIcon from "../../../../assets/filter.svg";
import LoupeIcon from "../../../../assets/Loupe.svg";
import Eye from "../../../../assets/eye.svg"; 
import BookCheck from "../../../../assets/book-check.svg"; 
import styles from "./style.module.css";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Pagination from "../../../../components/Pagination";
import { getAdmins } from "../../../../Api/admin";

const System = () => {
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [adminsData, setAdminsData] = useState([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const navegate = useNavigate();

  const handleRedirect = (id) => {
    navegate(`/system/${id}/details`); 
  }

  useEffect(() => {
    fetchAdmins();
    // eslint-disable-next-line
  }, [currentPage, search, estado]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const params = {
        skip: (currentPage - 1) * itemsPerPage,
        limit: itemsPerPage,
      };
      if (search) params.search = search;
      // Enable status filter
      if (estado && estado !== "") {
        params.is_active = estado === "Active" ? true : false;
      }
      const data = await getAdmins(params);
      setAdminsData(Array.isArray(data.items) ? data.items : []);
      setTotalAdmins(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      setAdminsData([]);
      setTotalAdmins(0);
    }
    setLoading(false);
  };

  const handleRedired = () => {
    navegate("/system/new-admin");
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleEstadoChange = (e) => {
    setEstado(e.target.value);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchAdmins();
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div
      className={`${"d-flex flex-column"} internal_layout`}
      style={{ backgroundColor: "#fff" }}
    >
      <div className="d-flex flex-column align-items-start w-100 mb-4 px-4 mt-5">
        <p className="mb-4 fs-2 fw-bolder my_title_color">
          Administrator Users
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
              Create Admin
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
            <input type="text" className={`form-control ${styles.searchInput}`} placeholder="Search" value={search} onChange={handleSearchChange} />
            <button className="btn btn-primary" type="button" onClick={handleSearch}>
              <img src={LoupeIcon} alt="" width={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Admin table */}
      <div
        className={`${"w-100 px-4 mb-3"} table_height`}
      >
        <table className="table table-bordered table-hover">
          <thead className="sticky-top">
            <tr>
              <th style={{ color: "#000" }}>ID</th>
              <th style={{ color: "#000" }}>Full Name</th>
              <th style={{ color: "#000" }}>Email</th>
              <th style={{ color: "#000" }}>Phone</th>
              <th style={{ color: "#000" }}>Identification</th>
              <th style={{ color: "#000" }}>Status</th>
              <th style={{ color: "#000" }}>Options</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7}>Loading...</td></tr>
            ) : adminsData.length === 0 ? (
              <tr><td colSpan={7}>No administrators</td></tr>
            ) : (
              adminsData.map((admin) => (
                <tr key={admin.id}>
                  <td>{admin.id}</td>
                  <td>{admin.full_name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.phone}</td>
                  <td>{admin.identification}</td>
                  <td>
                    <span className={`badge ${admin.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {admin.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    {/* <button
                      className="btn btn-sm me-1"
                      style={{ backgroundColor: "#000" }}
                    >
                      <img src={BookCheck} alt="check-data" width={15} />
                    </button> */}
                    <button
                      className="btn btn-sm"
                      style={{ backgroundColor: "#000" }}
                      onClick={()=>handleRedirect(admin.id)}
                    >
                      <img src={Eye} alt="detail-client" width={10}/>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={currentPage} totalPages={Math.ceil(totalAdmins / itemsPerPage)} handlePaginate={paginate}/>
    </div>
  );
};

export default System;
