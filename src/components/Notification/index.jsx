import { useRef, useEffect } from "react";
import Toast from "bootstrap/js/dist/toast"; // Import correcto

import Icon from "../../assets/eye.svg"; 

const Notification = ({ show, message=""}) => {
  const toastRef = useRef(null);

  useEffect(() => {
    if (show && toastRef.current) {
      const bsToast = new Toast(toastRef.current);
      bsToast.show();
    }
  }, [show]); 

  return (
    <div
      className="position-fixed bottom-0 end-0 p-3"
      style={{ zIndex: 11 }}
    >
      <div
        ref={toastRef}
        className="toast hide"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="toast-header">
          <img src={Icon} className="rounded me-2" alt="..." />
          <strong className="me-auto">Message</strong>
          <small>Just now</small>
          <button
            type="button"
            className="btn-close"
            data-bs-dismiss="toast"
            aria-label="Close"
          ></button>
        </div>
        <div className="toast-body">
          {message}
        </div>
      </div>
    </div>
  );
};


export default Notification; 