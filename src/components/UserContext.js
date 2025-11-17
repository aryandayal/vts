// import React, { createContext, useState, useContext, useEffect } from 'react';
// import Cookies from 'js-cookie';

// const UserContext = createContext();

// export const UserProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [token, setToken] = useState(null);

//   // Initialize user and token from cookies on mount
//   useEffect(() => {
//     const userData = Cookies.get('user');
//     const accessToken = Cookies.get('accessToken');
    
//     if (userData) {
//       try {
//         const parsedUser = JSON.parse(userData);
//         setUser(parsedUser);
//       } catch (error) {
//         console.error("Failed to parse user cookie:", error);
//         Cookies.remove('user');
//       }
//     }
    
//     if (accessToken) {
//       setToken(accessToken);
//     }
//   }, []);

//   // Function to update user and cookies
//   const updateUser = (userData) => {
//     if (userData) {
//       Cookies.set('user', JSON.stringify(userData), { 
//         expires: 7,
//         secure: true,
//         sameSite: 'strict',
//         path: '/'
//       });
//     } else {
//       Cookies.remove('user', { path: '/' });
//     }
//     setUser(userData);
//   };

//   // Function to update token and cookies
//   const updateToken = (accessToken) => {
//     if (accessToken) {
//       Cookies.set('accessToken', accessToken, { 
//         expires: 7,
//         secure: true,
//         sameSite: 'strict',
//         path: '/'
//       });
//       setToken(accessToken);
//     } else {
//       Cookies.remove('accessToken', { path: '/' });
//       setToken(null);
//     }
//   };

//   // Function to handle login
//   const login = (userData, accessToken) => {
//     updateUser(userData);
//     updateToken(accessToken);
//   };

//   // Function to handle logout
//   const logout = () => {
//     updateUser(null);
//     updateToken(null);
//   };

//   return (
//     <UserContext.Provider value={{ 
//       user, 
//       setUser: updateUser,
//       token, 
//       setToken: updateToken,
//       login,
//       logout
//     }}>
//       {children}
//     </UserContext.Provider>
//   );
// };

// export const useUser = () => useContext(UserContext);

import React, { createContext, useState, useContext, useEffect } from 'react';
import Cookies from 'js-cookie';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Helper function to decode JWT token and extract user data
  const decodeToken = (token) => {
    if (!token) return null;
    
    try {
      // JWT tokens are base64 encoded, so we can decode the payload
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Initialize user and token from cookies on mount
  useEffect(() => {
    const userData = Cookies.get('user');
    const accessToken = Cookies.get('accessToken');
    
    if (accessToken) {
      setToken(accessToken);
      
      // If we have a token but no user cookie, decode the token to get user data
      if (!userData) {
        const decodedToken = decodeToken(accessToken);
        if (decodedToken) {
          // Extract user information from the token
          const userInfo = {
            id: decodedToken.id || decodedToken.sub || decodedToken.userId,
            user_id: decodedToken.user_id || decodedToken.id || decodedToken.sub,
            email: decodedToken.email,
            full_name: decodedToken.full_name || decodedToken.name,
            role: decodedToken.role,
            is_email_verified: decodedToken.is_email_verified,
            is_disabled: decodedToken.is_disabled,
            created_at: decodedToken.created_at,
            last_login: decodedToken.last_login
          };
          
          setUser(userInfo);
          // Store the extracted user data in a cookie
          Cookies.set('user', JSON.stringify(userInfo), { 
            expires: 7,
            secure: true,
            sameSite: 'strict',
            path: '/'
          });
        }
      } else {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (error) {
          console.error("Failed to parse user cookie:", error);
          Cookies.remove('user');
          
          // If parsing fails, try to get user data from token
          const decodedToken = decodeToken(accessToken);
          if (decodedToken) {
            const userInfo = {
              id: decodedToken.id || decodedToken.sub || decodedToken.userId,
              user_id: decodedToken.user_id || decodedToken.id || decodedToken.sub,
              email: decodedToken.email,
              full_name: decodedToken.full_name || decodedToken.name,
              role: decodedToken.role,
              is_email_verified: decodedToken.is_email_verified,
              is_disabled: decodedToken.is_disabled,
              created_at: decodedToken.created_at,
              last_login: decodedToken.last_login
            };
            
            setUser(userInfo);
            Cookies.set('user', JSON.stringify(userInfo), { 
              expires: 7,
              secure: true,
              sameSite: 'strict',
              path: '/'
            });
          }
        }
      }
    } else if (userData) {
      // If we have user data but no token, try to parse the user data
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse user cookie:", error);
        Cookies.remove('user');
      }
    }
  }, []);

  // Function to update user and cookies
  const updateUser = (userData) => {
    if (userData) {
      Cookies.set('user', JSON.stringify(userData), { 
        expires: 7,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });
    } else {
      Cookies.remove('user', { path: '/' });
    }
    setUser(userData);
  };

  // Function to update token and cookies
  const updateToken = (accessToken) => {
    if (accessToken) {
      Cookies.set('accessToken', accessToken, { 
        expires: 7,
        secure: true,
        sameSite: 'strict',
        path: '/'
      });
      setToken(accessToken);
      
      // When updating the token, also update the user data from the token
      const decodedToken = decodeToken(accessToken);
      if (decodedToken) {
        const userInfo = {
          id: decodedToken.id || decodedToken.sub || decodedToken.userId,
          user_id: decodedToken.user_id || decodedToken.id || decodedToken.sub,
          email: decodedToken.email,
          full_name: decodedToken.full_name || decodedToken.name,
          role: decodedToken.role,
          is_email_verified: decodedToken.is_email_verified,
          is_disabled: decodedToken.is_disabled,
          created_at: decodedToken.created_at,
          last_login: decodedToken.last_login
        };
        
        setUser(userInfo);
        Cookies.set('user', JSON.stringify(userInfo), { 
          expires: 7,
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
      }
    } else {
      Cookies.remove('accessToken', { path: '/' });
      setToken(null);
    }
  };

  // Function to handle login
  const login = (userData, accessToken) => {
    // First set the token
    updateToken(accessToken);
    
    // Then set the user data, prioritizing the provided userData
    if (userData) {
      updateUser(userData);
    } else if (accessToken) {
      // If no user data provided, extract from token
      const decodedToken = decodeToken(accessToken);
      if (decodedToken) {
        const userInfo = {
          id: decodedToken.id || decodedToken.sub || decodedToken.userId,
          user_id: decodedToken.user_id || decodedToken.id || decodedToken.sub,
          email: decodedToken.email,
          full_name: decodedToken.full_name || decodedToken.name,
          role: decodedToken.role,
          is_email_verified: decodedToken.is_email_verified,
          is_disabled: decodedToken.is_disabled,
          created_at: decodedToken.created_at,
          last_login: decodedToken.last_login
        };
        
        updateUser(userInfo);
      }
    }
  };

  // Function to handle logout
  const logout = () => {
    updateUser(null);
    updateToken(null);
  };

  // Function to refresh user data from token
  const refreshUserData = () => {
    if (token) {
      const decodedToken = decodeToken(token);
      if (decodedToken) {
        const userInfo = {
          id: decodedToken.id || decodedToken.sub || decodedToken.userId,
          user_id: decodedToken.user_id || decodedToken.id || decodedToken.sub,
          email: decodedToken.email,
          full_name: decodedToken.full_name || decodedToken.name,
          role: decodedToken.role,
          is_email_verified: decodedToken.is_email_verified,
          is_disabled: decodedToken.is_disabled,
          created_at: decodedToken.created_at,
          last_login: decodedToken.last_login
        };
        
        updateUser(userInfo);
        return userInfo;
      }
    }
    return null;
  };

  return (
    <UserContext.Provider value={{ 
      user, 
      setUser: updateUser,
      token, 
      setToken: updateToken,
      login,
      logout,
      refreshUserData
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);