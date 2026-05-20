import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VehicleProvider } from './store/VehicleContext';
import { NotificationProvider } from './store/NotificationContext';
import Navigation from './components/Navigation';
import Toast from './components/Toast';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import TreatmentsPage from './pages/TreatmentsPage';
import VehicleFormPage from './pages/VehicleFormPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import AlertsPage from './pages/AlertsPage';
import ArchivePage from './pages/ArchivePage';

export default function App() {
  return (
    <BrowserRouter>
      <VehicleProvider>
        {/* NotificationProvider must be inside VehicleProvider — it derives
            its alerts from the live vehicle list. */}
        <NotificationProvider>
          <div className="app">
            <Toast />
            <Routes>
              <Route path="/"                     element={<LandingPage />} />
              <Route path="/renewals"             element={<HomePage />} />
              <Route path="/treatments"           element={<TreatmentsPage />} />
              <Route path="/vehicle/new"          element={<VehicleFormPage />} />
              <Route path="/vehicle/:id/edit"     element={<VehicleFormPage />} />
              <Route path="/vehicle/:id"          element={<VehicleDetailPage />} />
              <Route path="/alerts"               element={<AlertsPage />} />
              <Route path="/archive"              element={<ArchivePage />} />
              {/* anything unknown → landing (keeps old bookmarks alive) */}
              <Route path="*"                     element={<Navigate to="/" replace />} />
            </Routes>
            <Navigation />
          </div>
        </NotificationProvider>
      </VehicleProvider>
    </BrowserRouter>
  );
}
