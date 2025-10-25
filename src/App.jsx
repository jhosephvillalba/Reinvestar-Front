import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import Login from './view/Login'
import Layout from './view/Layout'
import DetalleSolicitud from './view/Menu/RequestLoan/RequestDeatils'
import RecoverPassword from './view/RecoverPassword'
import RecoverConfirmation from './view/RecoverConfirmation'
import ResetPassword from './view/ResetPassword'
import Clients from './view/Menu/Clients'
import CreateClient from './view/Menu/Clients/CreateClient'
import RequestLoan from './view/Menu/RequestLoan'
import CreateRequest from './view/Menu/RequestLoan/CreateRequest'
import ClientDetails from './view/Menu/Clients/DetailClient'
import Productos from './view/Menu/Products'
import CreateSeller from './view/Menu/Users/Sellers/CreateSeller'
import Sellers from './view/Menu/Users/Sellers'
import Coordinators from './view/Menu/Users/Coordinator'
import CreateCoordinators from './view/Menu/Users/Coordinator/CreateCoordinantor'
import Procesors from './view/Menu/Users/Procesors'
import CreateProcesor from './view/Menu/Users/Procesors/CreateProcesor'
import System from './view/Menu/Users/System'
import CreateUserSystem from './view/Menu/Users/System/CreateUserSystem'
import PrivateRoute from './components/PrivateRouter'
import AuthGuard from './components/AuthGuard'
import DetailSeller from './view/Menu/Users/Sellers/DetailsSeller'
import DetailCoordinator from './view/Menu/Users/Coordinator/DetailCoordinantor'
import DetailUserSystem from './view/Menu/Users/System/DetailUserSystem'
import DetailProcesor from './view/Menu/Users/Procesors/DetailProcesor'
import Parameters from './view/Menu/Parameters'
import Dashboard from './view/Menu/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas protegidas por AuthGuard */}
        <Route element={<AuthGuard />}>
          <Route path="/login" element={<Login />} />
          <Route path="/recover-password" element={<RecoverPassword/>} />
          <Route path="/recover-confirmation" element={<RecoverConfirmation/>} />
          <Route path="/reset-password" element={<ResetPassword/>} />
        </Route>
        {/* Rutas privadas */}
        <Route element={<PrivateRoute />}> 
          <Route path="/" element={<Layout />} >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="requests" element={<RequestLoan />} />
            <Route path="requests/:type/:id/details" element={<DetalleSolicitud />} />
            <Route path="products" element={<Productos />} />
            <Route path="clients" element={<Clients />} />
            <Route path="clients/:id/details" element={<ClientDetails />} />
            <Route path="clients/new-client" element={<CreateClient />} />
            <Route path="parameters" element={<Parameters/>} />
            <Route path="requests/new-request" element={<CreateRequest/>} />
            <Route path="sellers" element={<Sellers/>}/>
            <Route path="sellers/new-seller" element={<CreateSeller/>}/>
            <Route path="sellers/:id/details" element={<DetailSeller/>}/>
            <Route path='coordinators' element={<Coordinators/>} />
            <Route path='coordinators/new-coordinator' element={<CreateCoordinators/>} />
            <Route path='/coordinators/:id/details' element={<DetailCoordinator/>} />
            <Route path='processors' element={<Procesors/>}/>
            <Route path='processors/new-process' element={<CreateProcesor/>}/>
            <Route path='processors/:id/details' element={<DetailProcesor/>}/>
            <Route path='system' element={<System/>}/>
            <Route path='system/new-admin' element={<CreateUserSystem/>}/>
            <Route path='system/:id/details' element={<DetailUserSystem/>}/>
            <Route path="*" element={<h1>404 Not Found</h1>} />
          </Route>
        </Route>
        <Route path="*" element={<h1>404 Not Found</h1>} />
      </Routes>
    </Router>
  )
}

export default App
