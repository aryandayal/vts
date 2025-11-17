import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Cookies from 'js-cookie';
import { useUser } from '../components/UserContext';
import './login.css';

function Login() {
  const [user_id, setuser_id] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setUser } = useUser();

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
        // Access the nested data object
        const { user, accessToken, refreshToken } = data.data;
        
        // Store access token in cookie
        Cookies.set('token', accessToken, { 
          expires: 7,
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
        
        // Store refresh token in cookie (optional but recommended)
        Cookies.set('refreshToken', refreshToken, { 
          expires: 7,
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
        
        // Store user data in cookie
        Cookies.set('user', JSON.stringify(user), { 
          expires: 7,
          secure: true,
          sameSite: 'strict',
          path: '/'
        });
        
        // Update user context
        setUser(user);
        
        console.log('Access token saved in cookie');
        console.log('Refresh token saved in cookie');
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
        <div className="login-blue">
          <h2 className="login-title">VTS</h2>
          <p className="login-desc">Vehicle Tracking</p>
        </div>
        <div className="login-form-section">
          <form className="login-form" onSubmit={handleSubmit}>
            <h3>Admin Login</h3>
            {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
            
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

export default Login;
// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { useUser } from '../components/UserContext';
// import './login.css';

// function Login() {
//   const [user_id, setuser_id] = useState('');
//   const [password, setPassword] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const { login } = useUser(); // Use login function instead of setUser

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
//         body: JSON.stringify({ user_id, password }),
//       });

//       if (!response.ok) {
//         throw new Error('Login failed');
//       }

//       const data = await response.json();

//       if (data.success) {
//         // Access the nested data object
//         const { user, accessToken, refreshToken } = data.data;
        
//         // Use the login function from context to set both user and token
//         login(user, accessToken);
        
//         console.log('User logged in successfully');
//         console.log('Access token:', accessToken);
//         console.log('User data:', user);
        
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
//         <div className="login-blue">
//           <h2 className="login-title">VTS</h2>
//           <p className="login-desc">Vehicle Tracking</p>
//         </div>
//         <div className="login-form-section">
//           <form className="login-form" onSubmit={handleSubmit}>
//             <h3>Admin Login</h3>
//             {error && <div className="error-message" style={{ color: 'red', textAlign: 'center', marginBottom: '10px' }}>{error}</div>}
            
//             {isLoading && (
//               <div className="loading-overlay">
//                 <div className="loader"></div>
//                 <p>Authenticating...</p>
//               </div>
//             )}
            
//             <div className="input-group">
//               <input
//                 type="text"
//                 placeholder="username"
//                 value={user_id}
//                 onChange={e => setuser_id(e.target.value)}
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

// export default Login;