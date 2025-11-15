// Dashboard.js
import React from "react";
import Header from "../components/Header";
import MapView from "../components/MapView";
import './vehicletracking.css';

const VehicleTracking = () => {
  return (
    <div>
      <Header />
      <MapView />
    </div>
  );
};

export default VehicleTracking;