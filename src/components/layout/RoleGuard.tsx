import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../api/types';
import { Navigate } from 'react-router-dom';

interface RoleGuardProps {
  roles: Role[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ roles, children }) => {
  const { hasRole } = useAuth();

  // Strict RBAC: completely hide the feature and redirect when not concerned
  if (!hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
