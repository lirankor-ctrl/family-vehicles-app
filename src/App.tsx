import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { VehicleProvider } from './store/VehicleContext';
import Navigation from './components/Navigation';
import HomePage from './pages/HomePage';
import VehicleFormPage from './pages/VehicleFormPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import AlertsPage from './pages/AlertsPage';

export default function App() {
  return (
    <BrowserRouter>
      <VehicleProvider>
        <div className="app">
          <Routes>
            <Route path="/"                     element={<HomePage />} />
            <Route path="/vehicle/new"          element={<VehicleFormPage />} />
            <Route path="/vehicle/:id/edit"     element={<VehicleFormPage />} />
            <Route path="/vehicle/:id"          element={<VehicleDetailPage />} />
            <Route path="/alerts"               element={<AlertsPage />} />
          </Routes>
          <Navigation />
        </div>
      </VehicleProvider>
    </BrowserRouter>
  );
}
