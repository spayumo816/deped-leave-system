import { createContext, useContext, useEffect, useState } from "react";
import { apiFetch } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentMembership, setCurrentMembership] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  const refreshUser = async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await apiFetch("/auth/me");

      setUser(data.user || null);
      setCurrentMembership(data.currentMembership || null);
      setMemberships(data.memberships || []);

      return data;
    } catch {
      setUser(null);
      setCurrentMembership(null);
      setMemberships([]);

      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async ({ email, password }) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    await refreshUser();

    return data;
  };

  const switchMembership = async (userSchoolId) => {
    if (!userSchoolId) {
      throw new Error("Please select a valid school.");
    }

    const data = await apiFetch("/auth/switch-membership", {
      method: "PATCH",
      body: JSON.stringify({ userSchoolId }),
    });

    await refreshUser();

    return data;
  };

  const logout = async () => {
    try {
      await apiFetch("/auth/logout", {
        method: "POST",
      });
    } finally {
      setUser(null);
      setCurrentMembership(null);
      setMemberships([]);
    }
  };

  useEffect(() => {
    refreshUser({ showLoading: true });
  }, []);

  const role = currentMembership?.role || null;
  const school = currentMembership?.school || null;
  const isAuthenticated = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        currentMembership,
        memberships,
        role,
        school,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
        switchMembership,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}