/**
 * RoleProtectedRoute Component
 * 
 * Wrapper para proteger rutas específicas por rol
 * Se usa anidando una ruta dentro de este componente
 */

import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getStoredUser, validateSession } from "../../services/authService";

const RoleProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Primero obtener usuario del storage
        const storedUser = getStoredUser();
        let userToCheck = storedUser;
        
        // Debug: ver qué hay en storage
        console.log('🔍 RoleProtectedRoute - Stored user from localStorage:', storedUser);
        
        if (!storedUser || !storedUser.roles) {
          // Si no hay usuario en storage, validar con backend
          console.log('⚠️ No user in storage, validating with backend...');
          const { isValid, user } = await validateSession();
          console.log('🔍 Backend validation result:', { isValid, user });
          
          if (!isValid || !user) {
            console.log('❌ Backend validation failed or no user');
            setIsAuthorized(false);
            setIsLoading(false);
            return;
          }
          userToCheck = user;
        }
        
        // Obtener todos los roles del usuario (es un array)
        const userRoles = userToCheck?.roles || [];
        console.log('🔍 User roles array:', userRoles);
        console.log('🔍 Allowed roles array:', allowedRoles);
        
        // Normalizar roles del usuario a minúsculas para comparación
        const normalizedUserRoles = userRoles.map(role => String(role || '').trim().toLowerCase()).filter(Boolean);
        
        // Normalizar roles permitidos a minúsculas y eliminar duplicados
        const normalizedAllowedRoles = [...new Set(allowedRoles.map(role => String(role || '').trim().toLowerCase()).filter(Boolean))];
        
        // Mapa de roles equivalentes (para manejar variaciones como "Administrador" = "Admin")
        const roleEquivalents = {
          'administrador': ['admin', 'administrador'],
          'admin': ['admin', 'administrador'],
          'superadmin': ['admin', 'administrador', 'superadmin'],
          'super administrador': ['admin', 'administrador', 'superadmin']
        };
        
        // Función para verificar si un rol coincide (incluyendo equivalentes)
        const roleMatches = (userRole, allowedRole) => {
          const userNorm = userRole.toLowerCase().trim();
          const allowedNorm = allowedRole.toLowerCase().trim();
          
          // Coincidencia exacta normalizada
          if (userNorm === allowedNorm) return true;
          
          // Verificar equivalentes
          const userEquivalents = roleEquivalents[userNorm] || [userNorm];
          const allowedEquivalents = roleEquivalents[allowedNorm] || [allowedNorm];
          
          // Si hay alguna intersección entre equivalentes, coincide
          return userEquivalents.some(eq => allowedEquivalents.includes(eq));
        };
        
        console.log('🔍 Normalized user roles:', normalizedUserRoles);
        console.log('🔍 Normalized allowed roles:', normalizedAllowedRoles);
        
        // Verificar si el usuario tiene AL MENOS UNO de los roles permitidos
        const hasRequiredRole = normalizedUserRoles.some(userRole => 
          normalizedAllowedRoles.some(allowedRole => 
            roleMatches(userRole, allowedRole)
          )
        );
        
        // También verificar coincidencias exactas (sin normalizar) por si acaso
        const hasExactMatch = userRoles.some(userRole => 
          allowedRoles.some(allowedRole => 
            roleMatches(userRole, allowedRole)
          )
        );
        
        const finalAuth = hasRequiredRole || hasExactMatch;
        
        // Debug logging (siempre mostrar para troubleshooting)
        console.log('🔒 RoleProtectedRoute Authorization Check:', {
          userEmail: userToCheck?.email || userToCheck?.name,
          userRoles,
          normalizedUserRoles,
          allowedRoles,
          normalizedAllowedRoles,
          hasRequiredRole,
          hasExactMatch,
          finalAuth,
          willAllowAccess: finalAuth
        });
        
        setIsAuthorized(finalAuth);
      } catch (error) {
        console.error("❌ Error checking authorization:", error);
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, [allowedRoles]);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    // Obtener usuario para determinar ruta de redirección
    const user = getStoredUser();
    const userRole = user?.roles?.[0];
    const defaultRoute = userRole === "Procesador" ? "/requests" : "/dashboard";
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default RoleProtectedRoute;

