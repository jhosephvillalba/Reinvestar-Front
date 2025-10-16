import styles from "./style.module.css";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const Pagination = ({ currentPage, totalPages, handlePaginate }) => {
  return (
    <nav className="w-100 px-4">
      <ul className="pagination justify-content-center">
        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
          <button
            className="page-link d-flex align-items-center justify-content-center"
            onClick={() => handlePaginate(currentPage - 1)}
            aria-label="Previous"
            title="Previous"
          >
            <FaChevronLeft size={14} />
          </button>
        </li>

        {Array.from({ length: totalPages }, (_, i) => (
          <li
            key={i + 1}
            className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
          >
            <button className="page-link" onClick={() => handlePaginate(i + 1)}>
              {i + 1}
            </button>
          </li>
        ))}

        <li
          className={`page-item ${
            currentPage === totalPages ? "disabled" : ""
          }`}
        >
          <button
            className="page-link d-flex align-items-center justify-content-center"
            onClick={() => handlePaginate(currentPage + 1)}
            aria-label="Next"
            title="Next"
          >
            <FaChevronRight size={14} />
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;
