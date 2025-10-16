import React, { useState } from "react";
import styles from "./style.module.css";
import VerifyIcon from "../../../../../assets/verify-icon.png";

const pipelineData = [
    {
        tipo: "Status",
        descripcion: "Status has been changed to APPROVED",
        fecha: "01-05-2025 - 3:20 am"
    },
    {
        tipo: "Comment",
        descripcion: "Please check that the document is signed as soon as possible",
        fecha: "01-05-2025 - 3:20 am"
    },
    {
        tipo: "Document",
        descripcion: "The property document is not legible, please upload again",
        fecha: "01-05-2025 - 3:20 am"
    },
    {
        tipo: "Status",
        descripcion: "Status has been changed to PENDING",
        fecha: "01-05-2025 - 3:20 am"
    },
    {
        tipo: "Process",
        descripcion: "The request has been assigned to the Processor for management",
        fecha: "01-05-2025 - 3:20 am"
    },
    {
        tipo: "Status",
        descripcion: "Status has been changed to CREATED",
        fecha: "01-05-2025 - 3:20 am"
    }
];

const PipelineRequest = () => {
    const [tipo, setTipo] = useState("");
    const [comentario, setComentario] = useState("");
    const [enviarCliente, setEnviarCliente] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        // Here you can send data to an API or handle it as needed
        console.log({ tipo, comentario, enviarCliente });
    };

    return (
        <div className="row">
            <div className="col-7">
                <div className={styles.pipeline_container}>
                    {/* <h3 className={styles.title}>Detalles de la solicitud</h3> */}
                    <div className={styles.steps_list}>
                        {pipelineData.map((item, idx) => (
                            <div key={idx} className={styles.step_item}>
                                <div className={styles.step_header}>
                                    <span className={styles.step_type}>{item.tipo}</span>
                                    <span className={styles.step_date}>{item.fecha}</span>
                                </div>
                                <div className={styles.step_desc}>{item.descripcion}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <div className="col-5">
                <form className={styles.comment_box_container} onSubmit={handleSubmit}>
                    {/* <div className={styles.comment_icon_wrapper}>
                        <span className={styles.comment_icon}>📝</span>
                    </div> */}
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center mx-auto"
                      style={{
                        width: "80px",
                        height: "80px",
                        marginBottom:"1rem"
                      }}
                    >
                      <img src={VerifyIcon} alt="verify-icon" />
                    </div>
                    <h4 className={styles.comment_title}>Create Comment</h4>
                    <select
                        className={styles.comment_select}
                        value={tipo}
                        onChange={e => setTipo(e.target.value)}
                        required
                    >
                        <option value="">Activity Type</option>
                        <option value="Comment">Comment</option>
                        <option value="Status">Status</option>
                        <option value="Document">Document</option>
                        <option value="Process">Process</option>
                    </select>
                    <textarea
                        className={styles.comment_textarea}
                        placeholder="Observations about the document to report news"
                        rows={4}
                        value={comentario}
                        onChange={e => setComentario(e.target.value)}
                        required
                    />
                    <div className={styles.comment_checkbox_row}>
                        <label className={styles.comment_checkbox_label}>
                            SEND TO CLIENT
                            <input
                                type="checkbox"
                                className={styles.comment_checkbox}
                                checked={enviarCliente}
                                onChange={e => setEnviarCliente(e.target.checked)}
                            />
                        </label>
                    </div>
                    <button className={styles.comment_button} type="submit">SEND</button>
                </form>
            </div>
        </div>
    );
};

export default PipelineRequest; 