import React, { useState } from 'react';
import LogoLogin from '../../assets/LogoLogin.svg';
import backgroundImage from '../../assets/background/loginback.jpg';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../../Api/auth';

const RecoverPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState({ email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
   
    const handleChange = (e) => {
        setEmail({ [e.target.name]: e.target.value });
    }

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setLoading(true);
        setError('');
        setSuccess(false);
        
        try {
            await forgotPassword({ email: email.email });
            setSuccess(true);
            setTimeout(() => {
                navigate('/recover-confirmation');
            }, 2000);
        } catch (err) {
            console.error('Forgot password error:', err);
            
            // Extract specific error message from backend
            if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else if (err.response?.data?.message) {
                setError(err.response.data.message);
            } else if (err.message) {
                setError(err.message);
            } else {
                setError('Error sending recovery email. Please try again.');
            }
        } finally {
            setLoading(false);
        }
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
      
      {/* Error message - outside the card */}
      {error && (
        <div 
          className="alert alert-danger py-2 mb-3 rounded-pill"
          style={{
            maxWidth: '450px',
            zIndex: 2,
            position: 'relative',
            margin: '0 auto 20px auto'
          }}
        >
          {error}
        </div>
      )}

      {/* Success message - outside the card */}
      {success && (
        <div 
          className="alert alert-success py-2 mb-3 rounded-pill"
          style={{
            maxWidth: '450px',
            zIndex: 2,
            position: 'relative',
            margin: '0 auto 20px auto'
          }}
        >
          Recovery email sent successfully! Redirecting...
        </div>
      )}

      {/* Centered recovery form */}
      <div 
        className="bg-white rounded-4 p-4 shadow-lg"
        style={{
          maxWidth: '450px',
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
            Recover Password
          </h2>
          <p className="text-muted fs-6 mb-0">
            Enter your email to receive instructions
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <input
              type="email"
              name='email'
              value={email.email}
              onChange={handleChange}
              className="form-control rounded-pill border-2"
              placeholder="Email address"
              required
              autoFocus
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
            {loading ? 'Sending...' : 'Send link'}
          </button>

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

export default RecoverPassword;
