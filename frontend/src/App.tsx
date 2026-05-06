import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import PortalCreate from './pages/PortalCreate'
import PortalDetail from './pages/PortalDetail'
import PortalEdit from './pages/PortalEdit'
import Dashboard from './pages/Dashboard'
import EventReview from './pages/EventReview'

const qc = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout><Home /></Layout>} path="/" />
          <Route element={<Layout><PortalCreate /></Layout>} path="/portals/new" />
          <Route element={<Layout><PortalDetail /></Layout>} path="/portals/:id" />
          <Route element={<Layout><PortalEdit /></Layout>} path="/portals/:id/edit" />
          <Route element={<Layout><Dashboard /></Layout>} path="/portals/:id/dashboard" />
          <Route element={<Layout><EventReview /></Layout>} path="/events/:id/review" />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
