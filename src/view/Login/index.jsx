import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { login } from '../../Api/auth';
import { getMe } from '../../Api/user';
import backgroundImage from '../../assets/background/loginback.jpg';
import LogoLogin from '../../assets/LogoLogin.svg';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login({ email, password });
      if (data && data.access_token) {
        localStorage.setItem("token", data.access_token);
        // Get user and their role
        const user = await getMe();
        localStorage.setItem("user", JSON.stringify(user));
        
        // Redirect based on role
        if (user && user.roles && user.roles[0] === "Procesador") {
          navigate("/requests");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // Extract specific error message from backend
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError("Invalid credentials or network error");
      }
    }
    setLoading(false);
  };

  return (
    <div 
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative'
      }}
    >
      {/* Dark overlay to improve readability */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 1
        }}
      ></div>
      
      {/* Centered login form */}
      <div 
        className="bg-white rounded-4 p-4 shadow-lg"
        style={{
          width: '280px',
          zIndex: 2,
          position: 'relative'
        }}
      >
        {/* Official REINVESTAR logo */}
        <div className="text-center mb-4">
          <img
            src={LogoLogin}
            alt="REINVESTAR CAPITAL GROUP"
            className="img-fluid mb-3"
            style={{
              maxWidth: '180px',
              height: 'auto'
            }}
          />
        </div>

        {/* Form title */}
        <div className="text-start mb-4">
          <h2 
            className="fw-bold"
            style={{ 
              fontSize: '1.3rem'
            }}
          >
            Sign In
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="text"
              className="form-control rounded-pill border-2"
              placeholder="Enter Username"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
              style={{
                padding: '10px 18px',
                fontSize: '16px',
                borderColor: '#E0E0E0'
              }}
            />
          </div>
          
          <div className="mb-3">
            <input
              type="password"
              className="form-control rounded-pill border-2"
              placeholder="Enter Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                padding: '10px 18px',
                fontSize: '16px',
                borderColor: '#E0E0E0'
              }}
            />
          </div>

          {/* Forgot password link */}
          <div className="text-center mb-4">
            <NavLink 
              to={'/recover-password'} 
              style={{
                color: '#000',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Forgot your password?
            </NavLink>
          </div>

          {/* Sign in button */}
          <button 
            type="submit" 
            className="btn w-100 rounded-pill fw-bold text-white mb-3"
            disabled={loading}
            style={{
              backgroundColor: '#FFC862',
              border: 'none',
              padding: '12px 20px',
              fontSize: '16px',
              minHeight: '48px'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {/* Error message */}
          {error && (
            <div 
              className="alert alert-danger py-2 mb-3 rounded-pill"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              {error}
            </div>
          )}

        </form>
      </div>
    </div>
  );
};

export default Login;
