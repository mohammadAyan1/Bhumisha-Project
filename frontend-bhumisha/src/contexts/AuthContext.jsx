// import React, { createContext, useContext, useEffect, useState } from "react";
// import authUtil from "../utils/auth";

// const AuthContext = createContext(null);

// export function AuthProvider({ children }) {
//   const [token, setToken] = useState(authUtil.getAuthToken());
//   const [user, setUser] = useState(authUtil.getAuthUser());
//   const [poOrder, setPoOrder] = useState("");

//   useEffect(() => {
//     // keep token in sync if changed externally
//     const handleStorage = () => {
//       setToken(authUtil.getAuthToken());
//       setUser(authUtil.getAuthUser());
//     };
//     window.addEventListener("storage", handleStorage);
//     return () => window.removeEventListener("storage", handleStorage);
//   }, []);

//   const login = (token, user, options = {}, callback) => {
//     authUtil.saveAuth(token, user);
//     setToken(token);
//     setUser(user);
//     if (callback) callback();
//   };

//   const logout = () => {
//     authUtil.clearAuth();
//     setToken(null);
//     setUser(null);
//   };

//   return (
//     <AuthContext.Provider
//       value={{
//         token,
//         user,
//         login,
//         logout,
//         setPoOrder,
//         poOrder,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   return useContext(AuthContext);
// }

// export default AuthContext;

import React, { createContext, useContext, useEffect, useState } from "react";
import authUtil from "../utils/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [poOrder, setPoOrder] = useState("");
  const [loading, setLoading] = useState(true); // ✅ ADD THIS

  useEffect(() => {
    // 🔑 Initialize auth ONCE
    const initAuth = () => {
      const savedToken = authUtil.getAuthToken();
      const savedUser = authUtil.getAuthUser();

      setToken(savedToken);
      setUser(savedUser);
      setLoading(false); // ✅ AUTH READY
    };

    initAuth();

    // Keep token in sync across tabs
    const handleStorage = () => {
      setToken(authUtil.getAuthToken());
      setUser(authUtil.getAuthUser());
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const login = (token, user, options = {}, callback) => {
    authUtil.saveAuth(token, user);
    setToken(token);
    setUser(user);
    if (callback) callback();
  };

  const logout = () => {
    authUtil.clearAuth();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading, // ✅ EXPOSE THIS
        login,
        logout,
        setPoOrder,
        poOrder,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
