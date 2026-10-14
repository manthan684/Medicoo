import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API = "http://localhost:5000/api/auth";

// put the token on every request, or take it off
const setHeader = (token) => {
  if (token) axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete axios.defaults.headers.common.Authorization;
};

// read what was saved at the last visit
const saved = () => {
  try {
    const data = JSON.parse(localStorage.getItem("medicoo_auth"));
    if (data && data.token) setHeader(data.token);
    return data || null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(saved); // { token, user } or null

  const login = async (email, password) => {
    const res = await axios.post(`${API}/login`, { email, password });
    setHeader(res.data.token);
    localStorage.setItem("medicoo_auth", JSON.stringify(res.data));
    setAuth(res.data);
  };

  const logout = () => {
    setHeader(null);
    localStorage.removeItem("medicoo_auth");
    setAuth(null);
  };

  // if the server says "401" anywhere, the login is old: log out
  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const isLoginCall = err.config && err.config.url.includes("/auth/login");
        if (err.response && err.response.status === 401 && !isLoginCall) logout();
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user: auth ? auth.user : null, token: auth ? auth.token : null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);