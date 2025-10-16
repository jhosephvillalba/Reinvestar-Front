import FilterIcon from "../../../../assets/filter.svg";
import LoupeIcon from "../../../../assets/Loupe.svg";
import Eye from "../../../../assets/eye.svg"; 
import BookCheck from "../../../../assets/book-check.svg"; 
import styles from "./style.module.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Pagination from "../../../../components/Pagination";
import { getSellers } from "../../../../Api/seller";
import { getCompanies } from "../../../../Api/admin";

const Sellers = () => {
  // State for pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sellersData, setSellersData] = useState([]);
  const [totalSellers, setTotalSellers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState("");
  const [companies, setCompanies] = useState([]);
  const [companyMap, setCompanyMap] = useState({});
  const navegate = useNavigate();


  const handleRedirectDetails = (id) =>{
      navegate(`/sellers/${id}/details`)
  }

  useEffect(() => {
    fetchSellers();
    // eslint-disable-next-line
  }, [currentPage, search, estado]);

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

  const fetchSellers = async () => {
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
      const data = await getSellers(params);
      setSellersData(Array.isArray(data.items) ? data.items : []);
      setTotalSellers(typeof data.total === 'number' ? data.total : 0);
    } catch (error) {
      setSellersData([]);
      setTotalSellers(0);
    }
    setLoading(false);
  };

  const handleRedired = () => {
    navegate("/sellers/new-seller");
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
    fetchSellers();
  };

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div
      className={`${"d-flex flex-column"} internal_layout`}
      style={{ backgroundColor: "#fff" }}
    >
      <div className="d-flex flex-column align-items-start w-100 mb-4 px-4 mt-5">
        <p className="mb-4 fs-2 fw-bolder my_title_color">
          Sellers
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
              Create Seller
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

      {/* Sellers table */}
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
              {/* <th style={{ color: "#000" }}>Address</th> */}
              <th style={{ color: "#000" }}>Company</th>
              {/* <th style={{ color: "#000" }}>Role</th> */}
              <th style={{ color: "#000" }}>Status</th>
              <th style={{ color: "#000" }}>Options</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10}>Loading...</td></tr>
            ) : sellersData.length === 0 ? (
              <tr><td colSpan={10}>No sellers</td></tr>
            ) : (
              sellersData.map((seller) => (
                <tr key={seller.id}>
                  <td>{seller.id}</td>
                  <td>{seller.full_name}</td>
                  <td>{seller.email}</td>
                  <td>{seller.identification}</td>
                  {/* <td>{seller.address}</td> */}
                  <td>{seller.phone}</td>
                  <td>{companyMap[seller.company_id] || '-'}</td>
                  {/* <td>{Array.isArray(seller.roles) && seller.roles.length > 0 ? seller.roles[0] : '-'}</td> */}
                  <td>
                    <span className={`badge ${seller.is_active ? 'bg-success' : 'bg-secondary'}`}>
                      {seller.is_active ? "Active" : "Inactive"}
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
                      onClick={() => handleRedirectDetails(seller.id)}
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
      <Pagination currentPage={currentPage} totalPages={Math.ceil(totalSellers / itemsPerPage)} handlePaginate={paginate}/>
    </div>
  );
};

export default Sellers;
