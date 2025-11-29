/**
 * PublicRoute Component (anteriormente AuthGuard)
 * 
 * Protege rutas públicas (login, registro, etc.) para evitar que usuarios
 * autenticados accedan a ellas.
 * - Si el usuario está autenticado, redirige a su ruta por defecto
 * - Usa replace: true para evitar que el usuario vuelva atrás al login
 * - Maneja estados de carga
 */

import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { validateSession, hasActiveSession } from "../../services/authService";

const PublicRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar rápidamente si hay tokens
        if (!hasActiveSession()) {
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        // Validar con backend (más rápido que hacer una petición completa)
        // Para rutas públicas, solo verificamos si hay sesión activa
        const { isValid, user: userData } = await validateSession();
        
        if (isValid && userData) {
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // Si falla la validación, asumir que no está autenticado
        console.error("Error verifying authentication:", error);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Estado de carga (más rápido para rutas públicas)
  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado, redirigir según su rol
  // IMPORTANTE: Usar replace: true para evitar que el botón "atrás" muestre el login
  if (isAuthenticated) {
    const defaultRoute = user?.roles?.[0] === "Procesador" ? "/requests" : "/dashboard";
    return <Navigate to={defaultRoute} replace />;
  }

  // Si no está autenticado, mostrar la ruta pública (login, registro, etc.)
  return <Outlet />;
};

export default PublicRoute;

