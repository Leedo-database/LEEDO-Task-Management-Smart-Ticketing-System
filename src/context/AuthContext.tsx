import React, { createContext, useContext, useState, useEffect } from "react";
import { Employee, Role } from "../types";
import { storage } from "../services/storage";

interface AuthContextType {
  currentUser: Employee | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  login: (eid: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  switchUserByEid: (eid: string) => void;
  hasRole: (roles: Role[]) => boolean;
  canManageEmployees: boolean;
  canAccessEmployeeDatabase: boolean;
  canViewAllTasks: boolean;
  canApproveTasks: boolean;
  canViewAllOrgData: boolean;
  canManageSettings: boolean;
  isSupervisorOrHigher: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentEid, setCurrentEid] = useState<string | null>(() => storage.getCurrentSessionEid());
  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const eid = storage.getCurrentSessionEid();
    return eid ? storage.getEmployeeByEid(eid) || null : null;
  });

  // Sync state whenever storage updates
  useEffect(() => {
    const unsubscribe = storage.subscribe(() => {
      const eid = storage.getCurrentSessionEid();
      setCurrentEid(eid);
      if (eid) {
        setCurrentUser(storage.getEmployeeByEid(eid) || null);
      } else {
        setCurrentUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const login = async (eid: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEid = eid.trim();
    const emp = storage.getEmployeeByEid(cleanEid);

    if (!emp) {
      return { success: false, error: "Employee ID not found in master records." };
    }

    if (emp.employmentStatus === "Inactive" || emp.employmentStatus === "Archived") {
      return { success: false, error: "This employee account is inactive. Please contact HR." };
    }

    if (emp.provisioningStatus === "Deactivated") {
      return { success: false, error: "Account access has been deactivated by administrator." };
    }

    // Initial password check: default is EID unless changed
    const expectedPassword = emp.passwordHash || emp.eid;
    if (password !== expectedPassword) {
      return { success: false, error: "Invalid password for this Employee ID." };
    }

    storage.setCurrentSessionEid(emp.eid);
    setCurrentEid(emp.eid);
    setCurrentUser(emp);

    storage.logAudit(
      emp.eid,
      "USER_LOGIN",
      "Auth",
      emp.eid,
      `User ${emp.name} (${emp.eid}) logged in successfully.`
    );

    return { success: true };
  };

  const logout = () => {
    if (currentUser) {
      storage.logAudit(
        currentUser.eid,
        "USER_LOGOUT",
        "Auth",
        currentUser.eid,
        `User ${currentUser.name} (${currentUser.eid}) logged out.`
      );
    }
    storage.setCurrentSessionEid("");
    setCurrentEid(null);
    setCurrentUser(null);
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser) {
      return { success: false, error: "No active session." };
    }

    if (newPassword.length < 6) {
      return { success: false, error: "Password must be at least 6 characters long." };
    }

    if (newPassword === currentUser.eid) {
      return { success: false, error: "New password cannot be identical to your Employee ID." };
    }

    const updated: Employee = {
      ...currentUser,
      passwordHash: newPassword,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    };

    storage.saveEmployee(updated, currentUser.eid);
    storage.logAudit(
      currentUser.eid,
      "PASSWORD_CHANGED",
      "Auth",
      currentUser.eid,
      "Initial mandatory password reset successfully completed."
    );

    setCurrentUser(updated);
    return { success: true };
  };

  const switchUserByEid = (eid: string) => {
    const emp = storage.getEmployeeByEid(eid);
    if (emp) {
      storage.setCurrentSessionEid(emp.eid);
      setCurrentEid(emp.eid);
      setCurrentUser(emp);
      storage.logAudit(
        emp.eid,
        "SWITCH_USER_PERSONA",
        "Auth",
        emp.eid,
        `Switched active role preview to ${emp.name} (${emp.designation}, Role: ${emp.role})`
      );
    }
  };

  const hasRole = (roles: Role[]): boolean => {
    if (!currentUser) return false;
    return roles.includes(currentUser.role) || currentUser.role === "admin";
  };

  const isAuthorizedManagementThree =
    currentUser?.eid === "1001" ||
    currentUser?.eid === "1002" ||
    currentUser?.eid === "1057";

  const canManageEmployees = isAuthorizedManagementThree;
  const canAccessEmployeeDatabase = isAuthorizedManagementThree;
  const canViewAllOrgData = isAuthorizedManagementThree;
  const canViewAllTasks = isAuthorizedManagementThree;

  const canApproveTasks =
    isAuthorizedManagementThree ||
    currentUser?.role === "supervisor" ||
    currentUser?.role === "team_leader";

  const canManageSettings = isAuthorizedManagementThree;

  const isSupervisorOrHigher =
    isAuthorizedManagementThree ||
    currentUser?.role === "supervisor" ||
    currentUser?.role === "team_leader";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: Boolean(currentUser),
        mustChangePassword: Boolean(currentUser?.mustChangePassword),
        login,
        logout,
        changePassword,
        switchUserByEid,
        hasRole,
        canManageEmployees,
        canAccessEmployeeDatabase,
        canViewAllTasks,
        canApproveTasks,
        canViewAllOrgData,
        canManageSettings,
        isSupervisorOrHigher,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
