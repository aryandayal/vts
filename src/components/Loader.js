import React from 'react';
import './loader.css';

const Loader = ({ loading, error, message = "Loading devices from AIS-140 system..." }) => {
  if (loading) {
    return (
      <div className="loader-container">
        <div className="loading-spinner"></div>
        <p>{message}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="loader-container">
        <p>Error loading devices: {error}</p>
        <button onClick={() => window.location.reload()}>Retry Connection</button>
      </div>
    );
  }

  return null;
};

export default Loader;