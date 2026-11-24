import { HashRouter, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { AnalyticsPage } from './pages/AnalyticsPage'
import { CustomersPage } from './pages/CustomersPage'
import { FinancesPage } from './pages/FinancesPage'
import { InvoicesPage } from './pages/InvoicesPage'
import { DiscountsPage } from './pages/DiscountsPage'
import { ChatsPage } from './pages/ChatsPage'
import { EmailPage } from './pages/EmailPage'
import { AppsPage } from './pages/AppsPage'
import { SettingsPage } from './pages/SettingsPage'
import { HelpPage } from './pages/HelpPage'

function NotFound() {
  return (
    <div className="glass card card-pad">
      <h2 className="card-title">الصفحة غير موجودة</h2>
      <p className="card-sub">هذا الركن من المتجر غير موجود.</p>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <HashRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="finances" element={<FinancesPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="discounts" element={<DiscountsPage />} />
            <Route path="chats" element={<ChatsPage />} />
            <Route path="email" element={<EmailPage />} />
            <Route path="apps" element={<AppsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </HashRouter>
    </StoreProvider>
  )
}
