import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';
import Login from './Pages/Login';
import LoginAdmin from './Pages/LogInAdminPage';
import InvoicePage from './Pages/manager/InvoivePage';
import AddStockPage from './Pages/manager/AddStock';
import CheckStockPage from './Pages/manager/CheckStock';
import StockSellingHistory from './Pages/manager/StockSellingHistory';
import InstalmentPayment from './Pages/manager/InstallmentPayment';
import CheckInstalments from './Pages/manager/CheckInstallment';
import AddShop from './Pages/admin/AddShop';
import AdminAddStockPage from './Pages/admin/AddStock';
import AddUser from './Pages/admin/AddUsers';
import AdminCheckInstalments from './Pages/admin/CheckInstallment';
import AdminCheckStockPage from './Pages/admin/CheckStock';
import AdminInvoicePage from './Pages/admin/InvoivePage';
import AdminStockSellingHistory from './Pages/admin/StockSellingHistory';
import GeneralLedger from './Pages/admin/Ledger';
import AdminInstalmentPayment from './Pages/admin/InstallmentPayment';
import AdminEditStockSellingHistory from './Pages/admin/EditStockSellingHistory';
import ManagerGeneralLedger from './Pages/manager/GeneralLedger';


function App() {

  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Login />}></Route>
          <Route path="/admin-login" element={<LoginAdmin />} />
          <Route path="/manager-invoice" element={<InvoicePage />} />
          <Route path='/manager-add-stock' element={<AddStockPage/>} />
          <Route path='/manager-check-stock' element={<CheckStockPage/>} />
          <Route path='/manager-stock-selling-history' element={<StockSellingHistory/>} />
          <Route path='/manager-Instalment-payment' element={<InstalmentPayment/>} />
          <Route path='/manager-Check-Instalment' element={<CheckInstalments/>} />
          <Route path='/manager-ledger' element={<ManagerGeneralLedger/>} />
          <Route path='/add-shop' element={<AddShop/>} />
          <Route path='/admin-add-stock' element={<AdminAddStockPage/>} />
          <Route path='/add-user' element={<AddUser/>}/>
          <Route path='/admin-Check-Instalment' element={<AdminCheckInstalments/>} />
          <Route path='/admin-check-stock' element={<AdminCheckStockPage/>} />
          <Route path='/admin-Instalment-payment' element={<AdminInstalmentPayment/>} />
          <Route path="/admin-invoice" element={<AdminInvoicePage />} />
          <Route path='/admin-stock-selling-history' element={<AdminStockSellingHistory/>} />
          <Route path='/admin-ledger' element={<GeneralLedger/>} />
          <Route path='/admin-edit-stock-selling-history' element={<AdminEditStockSellingHistory/>} />
        </Routes>
      </Router>
    </>
  )
}

export default App
