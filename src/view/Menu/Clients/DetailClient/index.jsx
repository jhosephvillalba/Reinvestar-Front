import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./style.module.css";
import Back from "../../../../assets/back.svg";
import Notification from "../../../../components/Notification";
import Modal from "../../../../components/Popup";
import { isEqual } from "lodash";
import { getClientById, updateClient } from "../../../../Api/client"; 
import { getCompanies } from "../../../../Api/admin"; 

const DetailClient = () => {
  const navegate = useNavigate();
  const { id } = useParams(); 
  const [client, setClient] = useState(null);
  const [editform, setEditForm] = useState(true);
  const [currentData, setCurrentData] = useState(null);
  const [show, setShow] = useState(false); 
  const [modalShow, setModalShow] = useState(false); 
  const [message, setMessage] = useState(""); 
  const [error, setError] = useState(null); 
  const [feedback, setFeedback] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleGetClient = async (id) => {
      try{
        const data = await getClientById(id); 
        setClient(data); 
        setCurrentData(data);
      }catch(e){
        console.error({e});
      }
    }
    handleGetClient(id); 
  }, [id]);

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

  const handleNotification = (msg, duration = 1500) => {
    setFeedback(msg);
    if (msg.includes("successfully")) {
      setTimeout(() => {
        navegate("/clients");
      }, duration);
    }
  }

  const handleForm = (e) => {
    const { name, type, value, checked } = e.target;
    setClient({
      ...client,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleCancelUpdate = () => {
    setClient(currentData);
    setEditForm(!editform);
    handleNotification("Data update cancelled"); 
  }

  const handleEnableForm = () => {
    setEditForm(!editform);
    setCurrentData({...client});
  };

  const handleModalEvent = () => {
    setModalShow(!modalShow); 
    setTimeout(() => {
      setModalShow(false)
    }, 3000);
  }

  const handleback = () => {
    const equalValues = isEqual(client, currentData); 
    if(!equalValues){
      handleModalEvent();
      return; 
    }
    navegate("/clients");
  };

  const handleSumit = async (e) => {
    e.preventDefault(); 
    setLoading(true);
    setError(null);
    
    try {
      // Validations
      if (!client.full_name || !client.phone || !client.company_id || !client.address) {
        throw new Error("All fields are required");
      }

      // Mapping fields to API expected format
      const payload = {
        full_name: client.full_name,
        email: client.email,
        phone: client.phone,
        company_id: Number(client.company_id),
        address: client.address,
        purchase_or_refinancing: client.purchase_or_refinancing,
        has_a_mortgage: client.has_a_mortgage,
        has_delinquencies: client.has_delinquencies,
        pays_taxes: client.pays_taxes,
        current_hoa: client.current_hoa,
        subject_under_llc: client.subject_under_llc
      };

      await updateClient(id, payload);
      setCurrentData({ ...client });
      setEditForm(true);
      handleNotification("Client updated successfully!");
    } catch (err) {
      handleNotification(err.message || "Error updating client. Please try again.");
    }
    setLoading(false);
  }

  return (
    <>
      <div className={`${styles.container} p-5 internal_layout`}>
        {client ? (
          <>
            <div className="container-fluid mb-4">
              <div className="d-flex align-items-start">
                <button className="btn border-none" onClick={handleback}>
                  <img src={Back} alt="back" width={35} />
                </button>
                <h2 className={`${styles.title} fw-bolder my_title_color`}>
                  {`${editform ? "Client Details" : "Update Client"} - ${client.full_name}`}
                </h2>
              </div>
            </div>
            <div className="container-fluid p-4">
              <div className="row">
                <div className="col-12 col-lg-8 col-xl-6">
                  <form onSubmit={handleSumit} autoComplete="off">
                                         <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Full Name</label>
                          <input
                            type="text"
                            className={`form-control ${styles.input}`}
                            name="full_name"
                            value={client.full_name}
                            onChange={handleForm}
                            disabled={editform}
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Email</label>
                          <input
                            type="email"
                            className={`form-control ${styles.input}`}
                            name="email"
                            value={client.email}
                            onChange={handleForm}
                            disabled={editform}
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Phone</label>
                          <input
                            type="tel"
                            className={`form-control ${styles.input}`}
                            name="phone"
                            value={client.phone}
                            onChange={handleForm}
                            disabled={editform}
                          />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Company</label>
                          <select
                            name="company_id"
                            className={`form-select ${styles.input}`}
                            value={client.company_id || ""}
                            onChange={handleForm}
                            disabled={editform}
                            required
                          >
                            <option value="">Select a company</option>
                            {companies && companies.map(({ id, name }) => (
                              <option value={id} key={id}>{name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-12">
                          <label className="form-label fw-semibold mb-2" style={{color: "#000"}}>Primary Property Address</label>
                          <input
                            type="text"
                            className={`form-control ${styles.input}`}
                            name="address"
                            value={client.address}
                            onChange={handleForm}
                            disabled={editform}
                          />
                        </div>
                     </div>
                    
                                         {feedback && (
                       <div className={`alert ${feedback.includes("successfully") ? "alert-success" : "alert-danger"} py-2 mb-3`}>
                         {feedback}
                       </div>
                     )}
                     {!editform && (
                       <button
                         type="submit"
                         disabled={loading}
                         className="btn text-white fw-semibold px-3 py-2 rounded-pill mt-4"
                         style={{
                           backgroundColor: "#2c3e50",
                           border: "none",
                           fontSize: "16px",
                           minWidth: "180px",
                         }}
                       >
                         {loading ? "SAVING..." : "SAVE CHANGES"}
                       </button>
                     )}
                   </form>

                   {editform && (
                     <button
                       type="button"
                       className="btn btn-warning fw-semibold px-3 py-2 rounded-pill me-3 mb-3 mt-5"
                       style={{ minWidth: "180px" }}
                       onClick={handleEnableForm}
                     >
                       UPDATE
                     </button>
                   )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center w-100 py-5 text-muted">
            Client data not found.
          </div>
        )}
        <Notification show={show} message={message}/>
        <Modal show={modalShow} setShow={setModalShow} title={"Unsaved Changes!"}>
          There are unsaved changes. Do you want to leave?
        </Modal>
      </div>
    </>
  );
};

export default DetailClient;