import React, { createContext, useState, useContext } from 'react';
import Cookies from 'js-cookie';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Initialize user from cookies on mount
  React.useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user cookie:", error);
        // Remove corrupted cookie
        Cookies.remove('user');
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);