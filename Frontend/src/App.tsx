import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Role } from './types/enums';
import { useAuth } from './context/AuthContext';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';

// User / General Pages
import { Dashboard } from './pages/dashboard/Dashboard';
import { CommunityFeed } from './pages/feed/CommunityFeed';
import { SearchBrowse } from './pages/search/SearchBrowse';
import { ReportItem } from './pages/items/ReportItem';
import { ItemDetails } from './pages/items/ItemDetails';
import { MyCases } from './pages/items/MyCases';
import { MyClaims } from './pages/claims/MyClaims';
import { ClaimDetails } from './pages/claims/ClaimDetails';
import { SavedSearches } from './pages/search/SavedSearches';
import { NotificationsPage } from './pages/notifications/NotificationsPage';
import { ProfileSettings } from './pages/profile/ProfileSettings';

// Staff & Admin Pages
import { AdminOverview } from './pages/admin/AdminOverview';
import { AdminCases } from './pages/admin/AdminCases';
import { AdminClaims } from './pages/admin/AdminClaims';
import { AdminMatches } from './pages/admin/AdminMatches';
import { AdminFoundItems } from './pages/admin/AdminFoundItems';
import { AdminStorageLocations } from './pages/admin/AdminStorageLocations';
import { AdminRedeemToken } from './pages/admin/AdminRedeemToken';
import { AdminAppeals } from './pages/admin/AdminAppeals';
import { AdminAuditLog } from './pages/admin/AdminAuditLog';

// Fallback Page
import { NotFound } from './pages/NotFound';

const RootRedirect: React.FC = () => {
  const { role } = useAuth();
  if (role === Role.ADMIN) {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated user routes inside AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<RootRedirect />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="search" element={<SearchBrowse />} />
        <Route path="feed" element={<CommunityFeed />} />
        <Route path="report" element={<ReportItem />} />
        <Route path="report/:initialType" element={<ReportItem />} />
        <Route path="items/:caseId" element={<ItemDetails />} />
        <Route path="my-cases" element={<MyCases />} />
        <Route path="my-claims" element={<MyClaims />} />
        <Route path="claims/:id" element={<ClaimDetails />} />
        <Route path="saved-searches" element={<SavedSearches />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<ProfileSettings />} />

        {/* Admin & Security Staff Only Routes */}
        <Route
          path="admin"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/cases"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminCases />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/claims"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminClaims />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/matches"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminMatches />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/found-items"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminFoundItems />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/storage"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminStorageLocations />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/redeem"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminRedeemToken />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/appeals"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminAppeals />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/analytics"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminOverview />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <ProtectedRoute allowedRoles={[Role.ADMIN]}>
              <AdminAuditLog />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
