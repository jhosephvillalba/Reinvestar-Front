import React, { useState, useEffect } from 'react';
import LogoLogin from '../../assets/LogoLogin.svg';
import backgroundImage from '../../assets/background/loginback.jpg';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../Api/auth';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if token exists
  useEffect(() => {
    if (!token) {
      navigate('/recover-password');
    }
  }, [token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Validate passwords
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      
      if (newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setLoading(false);
        return;
      }
      
      // Call reset password API
      await resetPassword({ 
        token: token, 
        new_password: newPassword 
      });
      
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (err) {
      console.error('Reset password error:', err);
      
      // Extract specific error message from backend
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error resetting password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null; // Will redirect in useEffect
  }

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
      
      {/* Centered reset form */}
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
            Reset Password
          </h2>
          <p className="text-muted fs-6 mb-0">
            Enter your new password
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="form-control rounded-pill border-2"
              placeholder="New password"
              required
              autoFocus
              style={{
                padding: '10px 18px',
                fontSize: '16px',
                borderColor: '#E0E0E0'
              }}
            />
          </div>
          
          <div className="mb-4">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="form-control rounded-pill border-2"
              placeholder="Confirm new password"
              required
              style={{
                padding: '10px 18px',
                fontSize: '16px',
                borderColor: '#E0E0E0'
              }}
            />
          </div>

          {/* Submit button */}
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
            {loading ? 'Resetting...' : 'Reset Password'}
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

          {/* Success message */}
          {success && (
            <div 
              className="alert alert-success py-2 mb-3 rounded-pill"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                whiteSpace: 'normal'
              }}
            >
              Password reset successfully! Redirecting to login...
            </div>
          )}

          {/* Link to return to login */}
          <div className="text-center">
            <button 
              type="button"
              className="btn btn-link text-decoration-none"
              onClick={() => navigate('/login')}
              style={{
                color: '#000',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
