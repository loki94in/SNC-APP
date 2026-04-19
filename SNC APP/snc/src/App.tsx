import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Patients from "@/pages/Patients";
import PatientDetail from "@/pages/PatientDetail";
import Sessions from "@/pages/Sessions";
import RegularVisits from "@/pages/RegularVisits";
import Payments from "@/pages/Payments";
import Calendar from "@/pages/Calendar";
import AdminTelegram from "@/pages/admin/Telegram";
import AdminSecurity from "@/pages/admin/Security";
import AdminRoles from "@/pages/admin/Roles";
import Login from "@/pages/Login";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:id" element={<PatientDetail />} />
            <Route path="sessions" element={<Sessions />} />
            <Route path="regular-visits" element={<RegularVisits />} />
            <Route path="payments" element={<Payments />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="admin/telegram" element={<AdminTelegram />} />
            <Route path="admin/security" element={<AdminSecurity />} />
            <Route path="admin/roles" element={<AdminRoles />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
