import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { VehicleProvider } from './store/VehicleContext';
import { NotificationProvider } from './store/NotificationContext';
import { ChecklistProvider } from './store/ChecklistContext';
import Navigation from './components/Navigation';
import Toast from './components/Toast';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import TreatmentsPage from './pages/TreatmentsPage';
import VehicleFormPage from './pages/VehicleFormPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import AlertsPage from './pages/AlertsPage';
import ArchivePage from './pages/ArchivePage';
import ChecklistsPage from './pages/ChecklistsPage';
import ChecklistFormPage from './pages/ChecklistFormPage';
import ChecklistImportPage from './pages/ChecklistImportPage';
import ChecklistDetailPage from './pages/ChecklistDetailPage';
import LinksPage from './pages/LinksPage';

// Lazy-loaded: pulls in jspdf + html2canvas only when the user opens export,
// keeping them out of the initial bundle.
const ExportPage = lazy(() => import('./pages/ExportPage'));

export default function App() {
  return (
    <BrowserRouter>
      <VehicleProvider>
        {/* NotificationProvider must be inside VehicleProvider — it derives
            its alerts from the live vehicle list. */}
        <NotificationProvider>
          <ChecklistProvider>
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
                <Route path="/checklists"           element={<ChecklistsPage />} />
                <Route path="/checklists/new"       element={<ChecklistFormPage />} />
                <Route path="/checklists/import"    element={<ChecklistImportPage />} />
                <Route path="/checklists/:id"       element={<ChecklistDetailPage />} />
                <Route path="/links"                element={<LinksPage />} />
                <Route
                  path="/export"
                  element={
                    <Suspense fallback={<div className="content" style={{ paddingTop: 48, textAlign: 'center', color: 'var(--purple-200)' }}>טוען…</div>}>
                      <ExportPage />
                    </Suspense>
                  }
                />
                {/* anything unknown → landing (keeps old bookmarks alive) */}
                <Route path="*"                     element={<Navigate to="/" replace />} />
              </Routes>
              <Navigation />
            </div>
          </ChecklistProvider>
        </NotificationProvider>
      </VehicleProvider>
    </BrowserRouter>
  );
}
