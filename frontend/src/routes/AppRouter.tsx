import {
  BrowserRouter,
  Route,
  Routes
} from "react-router";

import DashboardPage from "../pages/DashboardPage";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import NotFoundPage from "../pages/NotFoundPage";
import RegisterPage from "../pages/RegisterPage";
import AuthLayout from "../components/layout/AuthLayout";
import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../components/layout/AppLayout";
import GroupsPage from "../pages/GroupsPage";
import GroupDetailPage from "../pages/GroupDetailPage";

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />

      <Route element={<AuthLayout />}>
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
</Route>

<Route element={<ProtectedRoute />}>
  <Route element={<AppLayout />}>
    <Route
      path="/dashboard"
      element={<DashboardPage />}
    />

    <Route
      path="/groups"
      element={<GroupsPage />}
    />
  </Route>
  <Route
  path="/groups/:groupId"
  element={<GroupDetailPage />}
/>
</Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;