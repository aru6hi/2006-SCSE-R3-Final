import React, { createContext, useContext, useState } from 'react';

const VehicleContext = createContext();

export const VehicleProvider = ({ children }) => {
  const [vehicleData, setVehicleData] = useState({
    email: '',
    vehicleNumber: '',
    iuNo: '',
    country: 'SG'
  });

  const updateVehicleData = (data) => {
    setVehicleData((prevData) => ({ ...prevData, ...data }));
  };

  return (
    <VehicleContext.Provider value={{ vehicleData, updateVehicleData }}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicleData = () => {
  return useContext(VehicleContext);
};