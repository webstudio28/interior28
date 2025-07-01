import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import CreateFlat from './pages/CreateFlat'
import FlatDetails from './pages/FlatDetails'
import RoomDetails from './pages/RoomDetails'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/create-flat" 
              element={
                <ProtectedRoute>
                  <CreateFlat />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/flat/:id" 
              element={
                <ProtectedRoute>
                  <FlatDetails />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/room/:id" 
              element={
                <ProtectedRoute>
                  <RoomDetails />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  )
}

export default App