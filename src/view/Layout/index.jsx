import Logo from "../../assets/LogoReinvestar.svg";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import styles from "./style.module.css";

// Import SVG icons
import DashboardIcon from "../../assets/sidebar_icons/Dashboard.svg";
import SolicitudesIcon from "../../assets/sidebar_icons/Solicitudes.svg";
import ClientesIcon from "../../assets/sidebar_icons/Clientes.svg";
import UsuariosIcon from "../../assets/sidebar_icons/Usuarios.svg";
import SistemaIcon from "../../assets/sidebar_icons/Sistema.svg";
import VendedoresIcon from "../../assets/sidebar_icons/Vendedores.svg";
import ProcesadoresIcon from "../../assets/sidebar_icons/Procesadores.svg";
import CoordinadoresIcon from "../../assets/sidebar_icons/Coordinadores.svg";
import ParametrosIcon from "../../assets/sidebar_icons/Parametros.svg";
import LogoutIcon from "../../assets/sidebar_icons/logout.svg";
import ProfileIcon from "../../assets/circle-user.svg";

// image- profile (removed - using Bootstrap icon instead)

// Keep old references for visual compatibility if needed
import { useEffect, useState } from "react";
import React from "react";

const mainRoutes = [
  {
    id: 1,
    link: "/dashboard",
    name: "Dashboard",
    icon: DashboardIcon,
  },
  {
    id: 2,
    link: "/requests",
    name: "Requests",
    icon: SolicitudesIcon,
  },
  {
    id: 3,
    link: "/clients",
    name: "Clients",
    icon: ClientesIcon,
  },
];

const userRoutes = [
  {
    id: 5,
    link: "/system",
    name: "System",
    icon: SistemaIcon,
  },
  {
    id: 6,
    link: "/sellers",
    name: "Business Advisor",
    icon: VendedoresIcon,
  },
  {
    id: 7,
    link: "/processors",
    name: "Processors",
    icon: ProcesadoresIcon,
  },
  {
    id: 8,
    link: "/coordinators",
    name: "Coordinators",
    icon: CoordinadoresIcon,
  },
];

const otherRoutes = [
  {
    id: 9,
    link: "/parameters",
    name: "Parameters",
    icon: ParametrosIcon,
  },
];

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    setUser(JSON.parse(userData));
  }, []);

  // Automatic redirection for sellers
  useEffect(() => {
    if (user && user.roles && user.roles[0] === "Vendedor") {
      if (location.pathname === "/" || location.pathname === "/dashboard") {
        navigate("/clients", { replace: true });
      }
    }
  }, [user, location, navigate]);

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Menu filtering based on role
  let filteredMainRoutes = [];
  let filteredUserRoutes = [];
  let filteredOtherRoutes = [];
  
  if (user && user.roles) {
    const role = user.roles[0];

    if (role.toLowerCase() === 'vendedor') {
      // For sellers, only show Requests and Clients
      filteredMainRoutes = mainRoutes.filter(
        route => route.name === 'Requests' || route.name === 'Clients'
      );
      filteredUserRoutes = []; // Hide Users section
      filteredOtherRoutes = []; // Hide Settings section
    } else if (role.toLowerCase() === 'procesador') {
      // For processors, only show Requests
      filteredMainRoutes = mainRoutes.filter(
        route => route.name === 'Requests'
      );
      filteredUserRoutes = []; // Hide Users section
      filteredOtherRoutes = []; // Hide Settings section
    } else if (role.toLowerCase() === 'coordinador') {
      // For coordinators, show everything except Parameters, System and Coordinators
      filteredMainRoutes = mainRoutes;
      filteredUserRoutes = userRoutes.filter(
        route => route.name !== 'System' && route.name !== 'Coordinators'
      );
      filteredOtherRoutes = otherRoutes.filter(
        route => route.name !== 'Parameters'
      );
    } else {
      // For other roles, show everything
      filteredMainRoutes = mainRoutes;
      filteredUserRoutes = userRoutes;
      filteredOtherRoutes = otherRoutes;
    }
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="mb-4 d-flex justify-content-center">
          <img src={Logo} alt="Reinvest-logo" width={150} />
        </div>

        <nav className="flex-grow-1 mx-3" style={{ height: '71px' }}>
          {/* <div className={`${"nav-section-title"} mb-2`}>
            <p className="title_section" style={{color:'#9CA3AF'}}>Menu</p>
          </div> */}
          
          {/* Main routes */}
          {filteredMainRoutes.map((route) => (
            <NavLink
              key={route.id}
              to={route.link}
              className={({ isActive }) => `${isActive ? styles.active : styles.inactive} nav-link d-flex align-items-center`}
            >
              <img src={route.icon} alt={route.name} className="me-3 sidebar-icon" />
              <span>{route.name}</span>
            </NavLink>
          ))}

          {/* Users section */}
          {filteredUserRoutes.length > 0 && (
            <div className={`${"nav-section-title"} mb-2 mt-4`}>
              <p className="title_section" style={{color:'#9CA3AF'}}>Users</p>
            </div>
          )}
          {filteredUserRoutes.map((route) => (
            <NavLink
              key={route.id}
              to={route.link}
              className={({ isActive }) => `${isActive ? styles.active : styles.inactive} nav-link d-flex align-items-center`}
            >
              <img src={route.icon} alt={route.name} className="me-3 sidebar-icon" />
              <span>{route.name}</span>
            </NavLink>
          ))}

          {/* Settings section */}
          {filteredOtherRoutes.length > 0 && (
            <div className={`${"nav-section-title"} mb-2 mt-4`}>
              <p className="title_section" style={{color:'#9CA3AF'}}>Settings</p>
            </div>
          )}
          {filteredOtherRoutes.map((route) => (
            <NavLink
              key={route.id}
              to={route.link}
              className={({ isActive }) => `${isActive ? styles.active : styles.inactive} nav-link d-flex align-items-center`}
            >
              <img src={route.icon} alt={route.name} className="me-3 sidebar-icon" />
              <span>{route.name}</span>
            </NavLink>
          ))}
        </nav>

        <a
          href="#"
          className="nav-link d-flex justify-content-center align-items-center logout"
          onClick={handleLogout}
        >
          <img src={LogoutIcon} alt="logout" className="me-3 sidebar-icon" />
          <span>Sign Out</span>
        </a>
      </aside>

      {/* Main section */}
      <div className="flex-grow-1">
        <header className={`${"header"} ${styles.header_border_none}`}>
          <div className="user-info me-auto"></div>
          <div className={styles.header_buttons}>

            <div className="user-info ms-2">
              <span>Hello, {user.full_name}</span>
              <img src={ProfileIcon} alt="profile" width={20} />
            </div>
          </div>
        </header>

        <main className="main-content bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
