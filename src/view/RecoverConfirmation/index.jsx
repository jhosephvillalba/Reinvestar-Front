import React from 'react';
import LogoLogin from '../../assets/LogoLogin.svg';
import backgroundImage from '../../assets/background/loginback.jpg';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RecoverConfirmation = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate a delay to mimic an API call or some processing
    const timer = setTimeout(() => {
      // Redirect to the home page after 2 seconds
      navigate('/login');
    }, 2000);

    // Cleanup the timer on component unmount
    return () => clearTimeout(timer);
  }, []);
  
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
      
      {/* Centered confirmation form */}
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
            Check your email
          </h2>
          <p className="text-muted fs-6 mb-0">
            We've sent a recovery link to your email account.
          </p>
        </div>

        {/* Confirmation message */}
        <div className="text-center mb-4">
          <div className="bg-light rounded-pill p-3 mb-3">
            <i className="fas fa-envelope text-success" style={{ fontSize: '2rem' }}></i>
          </div>
          <p className="text-muted mb-0">
            The link will be valid for 24 hours. Check your spam folder if you don't see it.
          </p>
        </div>

        {/* Button to return to login */}
        <div className="text-center">
          <button 
            type="button"
            className="btn w-100 rounded-pill fw-bold text-white mb-3"
            onClick={() => navigate('/login')}
            style={{
              backgroundColor: '#FFC862',
              border: 'none',
              padding: '12px 20px',
              fontSize: '16px',
              minHeight: '48px'
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecoverConfirmation;
