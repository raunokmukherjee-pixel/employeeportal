import { Routes, Route } from 'react-router-dom';
import { Layout } from './shared/Layout.jsx';
import { HomePage } from './modules/transfer-requests/pages/HomePage.jsx';
import { NewRequestPage } from './modules/transfer-requests/pages/NewRequestPage.jsx';
import { MyRequestsPage } from './modules/transfer-requests/pages/MyRequestsPage.jsx';
import { RequestDetailPage } from './modules/transfer-requests/pages/RequestDetailPage.jsx';
import { TaskQueuePage } from './modules/transfer-requests/pages/TaskQueuePage.jsx';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/requests/new" element={<NewRequestPage />} />
        <Route path="/requests/mine" element={<MyRequestsPage />} />
        <Route path="/requests/:id" element={<RequestDetailPage />} />
        <Route path="/tasks" element={<TaskQueuePage />} />
      </Routes>
    </Layout>
  );
}
