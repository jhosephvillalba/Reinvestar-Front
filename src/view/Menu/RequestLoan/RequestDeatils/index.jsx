import React, { useState, useEffect } from "react";
import Back from "../../../../assets/back.svg";
import styles from "./DetalleSolicitud.module.css";
import { useNavigate, useParams } from "react-router-dom";
import DocumentsRequest from "./DocumentsRequest";
import PipelineRequest from "./PipelineRequest";
import ProcessorForm from "./Processor";
import StatusManagement from "./StatusManagement";
import IntentionLetter from "./IntentionLetter";
import { getDscrById } from "../../../../Api/dscr";
import { getClientById } from "../../../../Api/client";
import DscrForm from "./FormRequest/Dscr";
import FixflipForm from "./FormRequest/Fixflip";
import Form from "./FormRequest/";
import ConstructionForm from "./FormRequest/Construction";
import { getFixflipById } from "../../../../Api/fixflip";
import { getConstructionById } from "../../../../Api/construction";

const RequestDetails = () => {
  const navigate = useNavigate();
  const { id, type } = useParams();
  const [activeTab, setActiveTab] = useState("home");
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      let data = null;
      if (type === "dscr") {
        data = await getDscrById(id);
      } else if (type === "fixflip") {
        data = await getFixflipById(id);
      } else if (type === "construction") {
        data = await getConstructionById(id);
      }
      setRequest(data);
    } catch (e) {
      console.error('Error fetching data:', e);
      setRequest(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (id && type) {
      fetchData();
    }
  }, [id, type]);

  // Load current user at start
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const handleBack = () => {
    navigate("/requests");
  };

  // Function to verify if user can see processor tab
  const canViewProcessorTab = () => {
    return currentUser && currentUser.roles?.[0] !== "Processor";
  };

  // Function to verify if user can see status tab
  const canViewStatusTab = () => {
    return currentUser && currentUser.roles?.[0] !== "Seller";
  };

  // Redirect to home tab if user is processor and is on processor tab
  // or if is seller and is on status tab
  useEffect(() => {
    if (currentUser) {
      const userRole = currentUser.roles?.[0];
      if ((userRole === "Processor" && activeTab === "processor") ||
          (userRole === "Seller" && activeTab === "status")) {
        setActiveTab("home");
      }
    }
  }, [currentUser, activeTab]);

  return (
    <>
      <div className={`${styles.scroll_section} internal_layout`}>
        <div className={`d-flex align-items-center justify-content-between px-4 py-3 ${styles.header}`}>
          <div className="d-flex align-items-center gap-3">
            <button className="btn border-none p-0" onClick={handleBack}>
              <img src={Back} alt="back" width={35} />
            </button>
            <h2 className={`${styles.title} fw-bolder my_title_color mb-0`}>
              Request Details
            </h2>
          </div>
          
          {request && (
            <div className={styles.requestInfo}>
              <span>ID: <strong>{request.id}</strong></span>
              {request.filing_number && (
                <>
                  <span className={styles.separator}>|</span>
                  <span>Filed: <strong>{request.filing_number}</strong></span>
                </>
              )}
              <span className={styles.separator}>|</span>
              <span>Type: <strong>{type?.toUpperCase()}</strong></span>
              {request.status && (
                <>
                  <span className={styles.separator}>|</span>
                  <span>Status: <strong>{request.status}</strong></span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="d-flex flex-column justify-content-center mx-4">
          <div className={styles.stickyTabs}>
          <ul className="nav nav-tabs" id="myTab" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${activeTab === "home" ? " active" : ""}`}
                id="home-tab"
                data-bs-toggle="tab"
                data-bs-target="#home"
                type="button"
                role="tab"
                aria-controls="home"
                aria-selected={activeTab === "home"}
                onClick={() => setActiveTab("home")}
              >
                Request
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${activeTab === "profile" ? " active" : ""}`}
                id="profile-tab"
                data-bs-toggle="tab"
                data-bs-target="#profile"
                type="button"
                role="tab"
                aria-controls="profile"
                aria-selected={activeTab === "profile"}
                onClick={() => setActiveTab("profile")}
              >
                Documents
              </button>
            </li>
            {canViewProcessorTab() && (
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link${activeTab === "processor" ? " active" : ""}`}
                  id="processor-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#processor"
                  type="button"
                  role="tab"
                  aria-controls="processor"
                  aria-selected={activeTab === "processor"}
                  onClick={() => setActiveTab("processor")}
                >
                  Processor
                </button>
              </li>
            )}
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link${activeTab === "contact" ? " active" : ""}`}
                id="contact-tab"
                data-bs-toggle="tab"
                data-bs-target="#contact"
                type="button"
                role="tab"
                aria-controls="contact"
                aria-selected={activeTab === "contact"}
                onClick={() => setActiveTab("contact")}
              >
                Activity
              </button>
            </li>
            {request?.status && ["PRICING", "ACCEPTED", "REJECTED", "CANCELLED", "CLOSED"].includes(request.status.toUpperCase()) && (
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link${activeTab === "intention" ? " active" : ""}`}
                  id="intention-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#intention"
                  type="button"
                  role="tab"
                  aria-controls="intention"
                  aria-selected={activeTab === "intention"}
                  onClick={() => setActiveTab("intention")}
                >
                  Letter of Intent
                </button>
              </li>
            )}
            {canViewStatusTab() && (
              <li className="nav-item" role="presentation">
                <button
                  className={`nav-link${activeTab === "status" ? " active" : ""}`}
                  id="status-tab"
                  data-bs-toggle="tab"
                  data-bs-target="#status"
                  type="button"
                  role="tab"
                  aria-controls="status"
                  aria-selected={activeTab === "status"}
                  onClick={() => setActiveTab("status")}
                >
                  Status
                </button>
              </li>
            )}
          </ul>
          </div>
          <div className="tab-content" id="myTabContent">
            <div
              className={`tab-pane fade${activeTab === "home" ? " show active" : ""}`}
              id="home"
              role="tabpanel"
              aria-labelledby="home-tab"
            >
              
              <div className={`d-flex justify-content-center aling-items-center ${styles.container_section_request} mt-5`}>
                {loading ? (
                  <div>Loading...</div>
                ) : request && type === "dscr" ? (
                  <DscrForm request={request} client={request.client} editable={true} />
                ) : request && type === "fixflip" ? (
                  <FixflipForm request={request} client={request.client} editable={true} />
                ) : request && type === "construction" ? (
                  <ConstructionForm request={request} client={request.client} editable={true} />
                ) : request && type === "" ? (
                  <Form request={request} client={request.client} editable={true} />
                ) : (
                  <div>Request not found</div>
                )}
              </div>
            </div>
            <div
              className={`tab-pane fade${activeTab === "profile" ? " show active" : ""}`}
              id="profile"
              role="tabpanel"
              aria-labelledby="profile-tab"
            >
              <DocumentsRequest requestId={id} requestType={type} />
            </div>
            {canViewProcessorTab() && (
              <div
                className={`tab-pane fade${activeTab === "processor" ? " show active" : ""}`}
                id="processor"
                role="tabpanel"
                aria-labelledby="processor-tab"
              >
                <ProcessorForm 
                  key={`${type}-${id}`} 
                  requestId={id} 
                  requestType={type}
                  onDataNeedsRefresh={fetchData}
                />
              </div>
            )}
            <div
              className={`tab-pane fade${activeTab === "contact" ? " show active" : ""}`}
              id="contact"
              role="tabpanel"
              aria-labelledby="contact-tab"
            >
              <PipelineRequest requestId={id} requestType={type} />
            </div>
            {request?.status && ["PRICING", "ACCEPTED", "REJECTED", "CANCELLED", "CLOSED"].includes(request.status.toUpperCase()) && (
              <div
                className={`tab-pane fade${activeTab === "intention" ? " show active" : ""}`}
                id="intention"
                role="tabpanel"
                aria-labelledby="intention-tab"
              >
                <IntentionLetter 
                  requestId={id} 
                  requestType={type} 
                  solicitud={request} 
                />
              </div>
            )}
            {canViewStatusTab() && (
              <div
                className={`tab-pane fade${activeTab === "status" ? " show active" : ""}`}
                id="status"
                role="tabpanel"
                aria-labelledby="status-tab"
              >
                <StatusManagement 
                  requestId={id} 
                  requestType={type} 
                  currentStatus={request?.status || "PENDING"}
                  onDataNeedsRefresh={fetchData}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RequestDetails;