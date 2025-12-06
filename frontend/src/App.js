import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RFPCreation from './components/RFPCreation/RFPCreation';
import RFPList from './components/RFPCreation/RFPList';
import RFPDetail from './components/RFPCreation/RFPDetail';
import SendRFP from './components/RFPCreation/SendRFP';
import VendorManagement from './components/VendorManagement/VendorManagement';
import CompareProposals from './components/Proposals/CompareProposals';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Navigation Bar */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-xl font-bold text-blue-600 mr-8">
                  RFP Manager
                </span>
                <div className="flex space-x-8">
                  <Link
                    to="/"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    📋 RFPs
                  </Link>
                  <Link
                    to="/rfps/new"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    ➕ Create RFP
                  </Link>
                  <Link
                    to="/vendors"
                    className="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900 border-b-2 border-transparent hover:border-blue-500 transition-colors"
                  >
                    👥 Vendors
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Routes>
            <Route path="/" element={<RFPList />} />
            <Route path="/rfps/new" element={<RFPCreation />} />
            <Route path="/rfps/:id" element={<RFPDetail />} />
            <Route path="/rfps/:id/send" element={<SendRFP />} />
            <Route path="/rfps/:id/compare" element={<CompareProposals />} />
            <Route path="/vendors" element={<VendorManagement />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t mt-12">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <p className="text-center text-sm text-gray-500">
              AI-Powered RFP Management System • Built with React, Node.js & LangChain
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;