import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import { ProtectedRoute } from "./ProtectedRoute";
import { PortalLayout } from "@/layouts/PortalLayout";
import { Skeleton } from "@/components/ui/skeleton";

const Landing = lazy(() => import("@/modules/landing/Landing"));
const NotFound = lazy(() => import("@/modules/landing/NotFound"));

const LoginEmployee = lazy(() => import("@/modules/employee/pages/Login"));
const LoginHR = lazy(() => import("@/modules/hr/pages/Login"));
const LoginManager = lazy(() => import("@/modules/team-manager/pages/Login"));
const LoginSuperAdmin = lazy(() => import("@/modules/super-admin/pages/Login"));
const LoginDigitalMarketing = lazy(() => import("@/modules/digital-marketing/pages/Login"));

// Employee pages
const EmpDashboard = lazy(() => import("@/modules/employee/pages/Dashboard"));
const EmpProfile = lazy(() => import("@/modules/employee/pages/Profile"));
const EmpAttendance = lazy(() => import("@/modules/employee/pages/Attendance"));
const EmpLeaves = lazy(() => import("@/modules/employee/pages/Leaves"));
const EmpHolidays = lazy(() => import("@/modules/employee/pages/Holidays"));
const EmpShifts = lazy(() => import("@/modules/employee/pages/Shifts"));
const EmpPayslips = lazy(() => import("@/modules/employee/pages/Payslips"));
const EmpDocuments = lazy(() => import("@/modules/employee/pages/Documents"));
const EmpAssets = lazy(() => import("@/modules/employee/pages/Assets"));
const EmpOnboarding = lazy(() => import("@/modules/employee/pages/Onboarding"));
const EmpExit = lazy(() => import("@/modules/employee/pages/Exit"));
const EmpNotifications = lazy(() => import("@/modules/employee/pages/Notifications"));
const EmpMessages = lazy(() => import("@/modules/employee/pages/Messages"));
const EmpSettings = lazy(() => import("@/modules/employee/pages/Settings"));

// HR pages
const HRDashboard = lazy(() => import("@/modules/hr/pages/Dashboard"));
const HREmployees = lazy(() => import("@/modules/hr/pages/Employees"));
const HRAttendance = lazy(() => import("@/modules/hr/pages/Attendance"));
const HRLeaves = lazy(() => import("@/modules/hr/pages/Leaves"));
const HRRecruitment = lazy(() => import("@/modules/hr/pages/Recruitment"));
const HRInterviews = lazy(() => import("@/modules/hr/pages/Interviews"));
const HRPerformance = lazy(() => import("@/modules/hr/pages/Performance"));
const HROnboarding = lazy(() => import("@/modules/hr/pages/Onboarding"));
const HRExit = lazy(() => import("@/modules/hr/pages/Exit"));
const HRAssets = lazy(() => import("@/modules/hr/pages/Assets"));
const HRHolidays = lazy(() => import("@/modules/hr/pages/Holidays"));
const HRShifts = lazy(() => import("@/modules/hr/pages/Shifts"));
const HRAnalytics = lazy(() => import("@/modules/hr/pages/Analytics"));
const HRReports = lazy(() => import("@/modules/hr/pages/Reports"));
const HRMail = lazy(() => import("@/modules/hr/pages/MailCenter"));
const HRAnnouncements = lazy(() => import("@/modules/hr/pages/Announcements"));
const HRSettings = lazy(() => import("@/modules/hr/pages/Settings"));
const HRClients = lazy(() => import("@/modules/digital-marketing/pages/Clients"));

// Team Manager pages
const TMDashboard = lazy(() => import("@/modules/team-manager/pages/Dashboard"));
const TMAttendance = lazy(() => import("@/modules/team-manager/pages/Attendance"));
const TMLeaves = lazy(() => import("@/modules/team-manager/pages/Leaves"));
const TMTasks = lazy(() => import("@/modules/team-manager/pages/Tasks"));
const TMPerformance = lazy(() => import("@/modules/team-manager/pages/Performance"));
const TMAnalytics = lazy(() => import("@/modules/team-manager/pages/Analytics"));
const TMSettings = lazy(() => import("@/modules/team-manager/pages/Settings"));

// Super Admin pages
const SADashboard = lazy(() => import("@/modules/super-admin/pages/Dashboard"));
const SACompanies = lazy(() => import("@/modules/super-admin/pages/Companies"));
const SARoles = lazy(() => import("@/modules/super-admin/pages/Roles"));
const SAPermissions = lazy(() => import("@/modules/super-admin/pages/Permissions"));
const SAUsers = lazy(() => import("@/modules/super-admin/pages/Users"));
const SASalary = lazy(() => import("@/modules/super-admin/pages/Salary"));
const SAAudit = lazy(() => import("@/modules/super-admin/pages/AuditLogs"));
const SASystem = lazy(() => import("@/modules/super-admin/pages/SystemLogs"));
const SAAnalytics = lazy(() => import("@/modules/super-admin/pages/Analytics"));
const SALocalization = lazy(() => import("@/modules/super-admin/pages/Localization"));
const SASettings = lazy(() => import("@/modules/super-admin/pages/Settings"));

// Digital Marketing pages
const DMDashboard = lazy(() => import("@/modules/digital-marketing/pages/Dashboard"));
const DMClients = lazy(() => import("@/modules/digital-marketing/pages/Clients"));
const DMInvoices = lazy(() => import("@/modules/digital-marketing/pages/Invoices"));

const Fallback = () => (
  <div className="space-y-4 p-8">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

export function AppRoutes() {
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/employee/login" element={<LoginEmployee />} />
        <Route path="/hr/login" element={<LoginHR />} />
        <Route path="/team-manager/login" element={<LoginManager />} />
        <Route path="/super-admin/login" element={<LoginSuperAdmin />} />
        <Route path="/digital-marketing/login" element={<LoginDigitalMarketing />} />

        {/* Employee */}
        <Route
          path="/employee"
          element={
            <ProtectedRoute allow={["employee", "hr", "super-admin"]}>
              <PortalLayout role="employee" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/employee/dashboard" replace />} />
          <Route path="dashboard" element={<EmpDashboard />} />
          <Route path="profile" element={<EmpProfile />} />
          <Route path="attendance" element={<EmpAttendance />} />
          <Route path="leaves" element={<EmpLeaves />} />
          <Route path="holidays" element={<EmpHolidays />} />
          <Route path="shifts" element={<EmpShifts />} />
          <Route path="payslips" element={<EmpPayslips />} />
          <Route path="documents" element={<EmpDocuments />} />
          <Route path="assets" element={<EmpAssets />} />
          <Route path="onboarding" element={<EmpOnboarding />} />
          <Route path="exit" element={<EmpExit />} />
          <Route path="notifications" element={<EmpNotifications />} />
          <Route path="messages" element={<EmpMessages />} />
          <Route path="settings" element={<EmpSettings />} />
        </Route>

        {/* HR */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allow={["hr", "super-admin"]}>
              <PortalLayout role="hr" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/hr/dashboard" replace />} />
          <Route path="dashboard" element={<HRDashboard />} />
          <Route path="employees" element={<HREmployees />} />
          <Route path="clients" element={<HRClients />} />
          <Route path="attendance" element={<HRAttendance />} />
          <Route path="leaves" element={<HRLeaves />} />
          <Route path="recruitment" element={<HRRecruitment />} />
          <Route path="interviews" element={<HRInterviews />} />
          <Route path="performance" element={<HRPerformance />} />
          <Route path="onboarding" element={<HROnboarding />} />
          <Route path="exit" element={<HRExit />} />
          <Route path="assets" element={<HRAssets />} />
          <Route path="holidays" element={<HRHolidays />} />
          <Route path="shifts" element={<HRShifts />} />
          <Route path="analytics" element={<HRAnalytics />} />
          <Route path="reports" element={<HRReports />} />
          <Route path="mail" element={<HRMail />} />
          <Route path="announcements" element={<HRAnnouncements />} />
          <Route path="settings" element={<HRSettings />} />
        </Route>

        {/* Team Manager */}
        <Route
          path="/team-manager"
          element={
            <ProtectedRoute allow={["team-manager", "hr", "super-admin"]}>
              <PortalLayout role="team-manager" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/team-manager/dashboard" replace />} />
          <Route path="dashboard" element={<TMDashboard />} />
          <Route path="attendance" element={<TMAttendance />} />
          <Route path="leaves" element={<TMLeaves />} />
          <Route path="tasks" element={<TMTasks />} />
          <Route path="performance" element={<TMPerformance />} />
          <Route path="analytics" element={<TMAnalytics />} />
          <Route path="settings" element={<TMSettings />} />
        </Route>

        {/* Super Admin */}
        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allow="super-admin">
              <PortalLayout role="super-admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/super-admin/dashboard" replace />} />
          <Route path="dashboard" element={<SADashboard />} />
          <Route path="companies" element={<SACompanies />} />
          <Route path="roles" element={<SARoles />} />
          <Route path="permissions" element={<SAPermissions />} />
          <Route path="users" element={<SAUsers />} />
          <Route path="salary" element={<SASalary />} />
          <Route path="audit" element={<SAAudit />} />
          <Route path="system" element={<SASystem />} />
          <Route path="analytics" element={<SAAnalytics />} />
          <Route path="localization" element={<SALocalization />} />
          <Route path="settings" element={<SASettings />} />
        </Route>

        {/* Digital Marketing */}
        <Route
          path="/digital-marketing"
          element={
            <ProtectedRoute allow={["digital-marketing", "hr", "super-admin"]}>
              <PortalLayout role="digital-marketing" />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/digital-marketing/dashboard" replace />} />
          <Route path="dashboard" element={<DMDashboard />} />
          <Route path="clients" element={<DMClients />} />
          <Route path="invoices" element={<DMInvoices />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
