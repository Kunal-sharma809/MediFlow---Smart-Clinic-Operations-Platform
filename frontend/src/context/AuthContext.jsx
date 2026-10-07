import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('clinic_access_token') || null);
  const [activeClinic, setActiveClinic] = useState(null);
  const [allClinics, setAllClinics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Clinics list
  const fetchClinics = async () => {
    try {
      const res = await api.get('/tenants');
      if (res.success && res.data.length > 0) {
        setAllClinics(res.data);
        const storedTenantId = localStorage.getItem('clinic_tenant_id');
        const selected = res.data.find(c => c._id === storedTenantId) || res.data[0];
        setActiveClinic(selected);
        localStorage.setItem('clinic_tenant_id', selected._id);
      }
    } catch (err) {
      console.error('Failed to load clinic tenants:', err);
    }
  };

  // Fetch current user details
  const fetchCurrentUser = async () => {
    if (!localStorage.getItem('clinic_access_token')) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.success) {
        setUser(res.data);
        if (res.data.clinicId) {
          setActiveClinic(res.data.clinicId);
          localStorage.setItem('clinic_tenant_id', res.data.clinicId._id || res.data.clinicId);
        }
      }
    } catch (err) {
      console.warn('Session expired or invalid token:', err.message);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics();
    fetchCurrentUser();
  }, []);

  const login = async (email, password, clinicCode) => {
    const res = await api.post('/auth/login', { email, password, clinicCode });
    if (res.success) {
      const { accessToken, refreshToken, user: userData } = res.data;
      setToken(accessToken);
      setUser(userData);
      localStorage.setItem('clinic_access_token', accessToken);
      localStorage.setItem('clinic_refresh_token', refreshToken);
      if (userData.clinic) {
        setActiveClinic(userData.clinic);
        localStorage.setItem('clinic_tenant_id', userData.clinic.id);
      }
      return userData;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('clinic_access_token');
    localStorage.removeItem('clinic_refresh_token');
  };

  const switchClinic = (clinic) => {
    setActiveClinic(clinic);
    localStorage.setItem('clinic_tenant_id', clinic._id);
  };

  // Quick 1-click Demo Role Switcher
  const quickLoginAs = async (role) => {
    const credentials = {
      SUPER_ADMIN: { email: 'admin@platform.com', password: 'admin123' },
      CLINIC_ADMIN: { email: 'clinicadmin@apex.com', password: 'admin123', clinicCode: 'apex' },
      DOCTOR: { email: 'dr.sarah@apex.com', password: 'doctor123', clinicCode: 'apex' },
      RECEPTIONIST: { email: 'receptionist@apex.com', password: 'reception123', clinicCode: 'apex' },
      PATIENT: { email: 'patient@apex.com', password: 'patient123', clinicCode: 'apex' }
    };

    const cred = credentials[role];
    if (cred) {
      return await login(cred.email, cred.password, cred.clinicCode);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      activeClinic,
      allClinics,
      loading,
      login,
      logout,
      switchClinic,
      quickLoginAs
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
