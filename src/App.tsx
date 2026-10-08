import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Loading } from './components/Loading';
import { forget, INDEX_URL } from './content/load';
import Devices from './pages/Devices';
import Overview from './pages/Overview';
import Wiring from './pages/Wiring';
import { DocGate, LatestRedirect, RobotRoute } from './shell/RobotRoute';
import { NotFound } from './pages/NotFound';

const Viewer3D = lazy(() => import('./pages/Viewer3D'));

export function AppRoutes() {
  return (
    <ErrorBoundary title="The docs index did not load" onRetry={() => forget(INDEX_URL)}>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route index element={<LatestRedirect />} />
          <Route path=":robot" element={<RobotRoute />}>
            <Route index element={<Overview />} />
            <Route path="wiring" element={<DocGate doc="wiring"><Wiring /></DocGate>} />
            <Route path="3d" element={<DocGate doc="3d"><Viewer3D /></DocGate>} />
            <Route path="devices" element={<DocGate doc="devices"><Devices /></DocGate>} />
            <Route path="*" element={<NotFound kind="page" />} />
          </Route>
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
