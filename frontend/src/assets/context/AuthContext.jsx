import { createContext, useContext, useState } from "react";

// Creating AuthContext
export const AuthContext = createContext();

// Custom hook to access AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
};

// AuthContext Provider component
export const AuthContextProvider = ({ children }) => {
  const [authUser, setAuthUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("authUser");
      console.log("Stored User from localStorage at authContext:", storedUser);

      if (storedUser) {
        return JSON.parse(storedUser);
      }
      return null;
    } catch (error) {
      console.error("Error parsing authUser from localStorage", error);
      return null;
    }
  });

  // Initialize privateKey
  const [privateKey, setPrivateKey] = useState(() => {
    const storedPrivateKey = localStorage.getItem("privateKey");

    return storedPrivateKey || null;
  });
  //console.log("at context", privateKey);
  return (
    <AuthContext.Provider value={{ authUser, setAuthUser, privateKey }}>
      {children}
    </AuthContext.Provider>
  );
};
