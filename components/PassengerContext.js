import React, { createContext, useState } from "react";

export const PassengerContext = createContext();

export const PassengerProvider = ({ children }) => {
  const [passenger, setPassenger] = useState({
    name: '',
  username: '',
  phone: '',
  password: '',
  agency: '',
  });

  return (
    <PassengerContext.Provider value={{ passenger, setPassenger }}>
      {children}
    </PassengerContext.Provider>
  );
};
