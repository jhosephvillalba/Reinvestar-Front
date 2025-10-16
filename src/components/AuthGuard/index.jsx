import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { getMe } from "../../Api/user";

const AuthGuard = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await getMe();
        if (userData) {
          setIsAuthenticated(true);
          setUser(userData);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (e) {
        console.error("Error verifying authentication:", e);
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return <div>Verifying authentication...</div>;
  }

  // If user is authenticated, redirect according to their role
  if (isAuthenticated) {
    const defaultRoute = user?.roles?.[0] === "Procesador" ? "/requests" : "/dashboard";
    return <Navigate to={defaultRoute} replace />;
  }

  // If not authenticated, show login component
  return <Outlet />;
};

export default AuthGuard;