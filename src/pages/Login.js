import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie'; // Import js-cookie library
import { useUser } from '../components/UserContext'; // Import the useUser hook
import './login.css';
// import Logo from '../assets/logos.png';

function Login() {
  const [user_id, setuser_id] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser(); // Get the setUser function from context

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://3.109.186.142:3005/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (data.success) {
        // Store token in cookie with security settings
        Cookies.set('token', data.token, { 
          expires: 7, // Expires in 7 days
          secure: true, // Only sent over HTTPS
          sameSite: 'strict', // Prevent CSRF attacks
          path: '/' // Available across entire site
        });
        
        // Store user data in cookie
        Cookies.set('user', JSON.stringify(data.user), { 
          expires: 7,
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
        
        // Update user context with the user data
        setUser(data.user);
        
        console.log('Token saved in cookie');
        console.log('User data saved in cookie');
        console.log('User context updated');
        
        // Redirect to dashboard
        navigate('/dashboard');
        
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-container">
        {/* Blue Section */}
        <div className="login-blue">
          {/* <img src={Logo} alt="Logo" className="login-logo" /> */}
          <h2 className="login-title">VTS</h2>
          <p className="login-desc">Vehicle Tracking</p>
        </div>
        {/* Login Form Section */}
        <div className="login-form-section">
          <form className="login-form" onSubmit={handleSubmit}>
            <h3>Admin Login</h3>
            {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
            
            {/* Loading overlay */}
            {isLoading && (
              <div className="loading-overlay">
                <div className="loader"></div>
                <p>Authenticating...</p>
              </div>
            )}
            
            <div className="input-group">
              <input
                type="text"
                placeholder="username"
                value={user_id}
                onChange={e => setuser_id(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <span className="login-helper">Login to continue.</span>
          </form>
        </div>
      </div>
    </div>
  );
}

// Logout function that removes cookies and clears context
export const logout = () => {
  // Remove token and user data cookies
  Cookies.remove('token', { path: '/' });
  Cookies.remove('user', { path: '/' });
  
  // Clear user context by setting it to null
  // Note: This function is called outside of React components, so we can't use setUser directly
  // The context will be cleared in the Header component's handleLogout function
  
  console.log('Token removed from cookie');
  console.log('User data removed from cookie');
  
  // Redirect to login page
  window.location.href = '/';
};

export default Login;

// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import Cookies from 'js-cookie'; // Import js-cookie library
// import { useUser } from '../components/UserContext'; // Import the useUser hook
// import './login.css';
// // import Logo from '../assets/logos.png';

// function Login() {
//   const [username, setUsername] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const { setUser } = useUser(); // Get the setUser function from context

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError('');

//     try {
//       const response = await fetch('http://3.109.186.142:3005/api/auth/login', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ username, password }),
//       });

//       if (!response.ok) {
//         throw new Error('Login failed');
//       }

//       const data = await response.json();

//       if (data.success) {
//         // Store token in cookie with security settings
//         Cookies.set('token', data.token, { 
//           expires: 7, // Expires in 7 days
//           secure: true, // Only sent over HTTPS
//           sameSite: 'strict', // Prevent CSRF attacks
//           path: '/' // Available across entire site
//         });
        
//         // Store user data in cookie
//         Cookies.set('user', JSON.stringify(data.user), { 
//           expires: 7,
//           secure: true,
//           sameSite: 'strict',
//           path: '/'
//         });
        
//         // Update user context with the user data
//         setUser(data.user);
        
//         console.log('Token saved in cookie');
//         console.log('User data saved in cookie');
//         console.log('User context updated');
        
//         // Redirect to dashboard
//         navigate('/dashboard');
        
//       } else {
//         setError(data.message || 'Login failed');
//       }
//     } catch (err) {
//       setError(err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="login-bg">
//       <div className="login-container">
//         {/* Blue Section */}
//         <div className="login-blue">
//           {/* <img src={Logo} alt="Logo" className="login-logo" /> */}
//           <h2 className="login-title">VTS</h2>
//           <p className="login-desc">Vehicle Tracking</p>
//         </div>
//         {/* Login Form Section */}
//         <div className="login-form-section">
//           <form className="login-form" onSubmit={handleSubmit}>
//             <h3>Admin Login</h3>
//             {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
            
//             {/* Loading overlay */}
//             {isLoading && (
//               <div className="loading-overlay">
//                 <div className="loader"></div>
//                 <p>Authenticating...</p>
//               </div>
//             )}
            
//             <div className="input-group">
//               <input
//                 type="text"
//                 placeholder="Username"
//                 value={username}
//                 onChange={e => setUsername(e.target.value)}
//                 required
//                 disabled={isLoading}
//               />
//             </div>
//             <div className="input-group">
//               <input
//                 type="password"
//                 placeholder="Password"
//                 value={password}
//                 onChange={e => setPassword(e.target.value)}
//                 required
//                 disabled={isLoading}
//               />
//             </div>
//             <button type="submit" disabled={isLoading}>
//               {isLoading ? 'Logging in...' : 'Login'}
//             </button>
//             <span className="login-helper">Login to continue.</span>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

// // Logout function that removes cookies and clears context
// export const logout = () => {
//   // Remove token and user data cookies
//   Cookies.remove('token', { path: '/' });
//   Cookies.remove('user', { path: '/' });
  
//   // Clear user context by setting it to null
//   // Note: This function is called outside of React components, so we can't use setUser directly
//   // The context will be cleared in the Header component's handleLogout function
  
//   console.log('Token removed from cookie');
//   console.log('User data removed from cookie');
  
//   // Redirect to login page
//   window.location.href = '/';
// };

// export default Login;