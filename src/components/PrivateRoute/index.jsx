/**
 * PrivateRoute Component
 * 
 * Protege rutas que requieren autenticación.
 * - Valida la sesión con el backend al montar
 * - Redirige a /login si no está autenticado
 * - Soporta redirección por roles
 * - Maneja estados de carga
 */

import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { validateSession, hasActiveSession } from "../../services/authService";

/**
 * Propiedades opcionales para controlar el acceso por roles
 * @param {Array<string>} allowedRoles - Roles permitidos para acceder a esta ruta
 * @param {string} redirectTo - Ruta a la que redirigir si el rol no está permitido
 */
const PrivateRoute = ({ allowedRoles = null, redirectTo = "/dashboard" }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Primero verificar si hay tokens en storage
        if (!hasActiveSession()) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validar la sesión con el backend
        const { isValid, user: userData } = await validateSession();
        
        if (isValid && userData) {
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Estado de carga
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, redirigir a login con la ruta intentada guardada
  if (!isAuthenticated) {
    return (
      <Navigate 
        to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} 
        replace 
      />
    );
  }

  // Verificar si hay restricciones de rol
  if (allowedRoles && Array.isArray(allowedRoles) && allowedRoles.length > 0) {
    const userRole = user?.roles?.[0];
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirigir según el rol del usuario a su ruta por defecto
      const defaultRoute = userRole === "Procesador" ? "/requests" : redirectTo;
      return <Navigate to={defaultRoute} replace />;
    }
  }

  // Redirigir procesadores que intentan acceder a /dashboard
  if (user?.roles?.[0] === "Procesador" && location.pathname === "/dashboard") {
    return <Navigate to="/requests" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;

