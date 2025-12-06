import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfpAPI, vendorAPI } from '../../services/api';
import api from '../../services/api';

const SendRFP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [rfp, setRfp] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [rfpResponse, vendorsResponse] = await Promise.all([
        rfpAPI.getById(id),
        vendorAPI.getAll(),
      ]);

      if (rfpResponse.data.success) {
        setRfp(rfpResponse.data.data);
      }

      if (vendorsResponse.data.success) {
        setVendors(vendorsResponse.data.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId]
    );
  };

  const handleSelectAll = () => {
    if (selectedVendors.length === vendors.length) {
      setSelectedVendors([]);
    } else {
      setSelectedVendors(vendors.map((v) => v.id));
    }
  };

  const handleSend = async () => {
    if (selectedVendors.length === 0) {
      alert('Please select at least one vendor');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await api.post(`/email/send-rfp/${id}`, {
        vendorIds: selectedVendors,
      });

      if (response.data.success) {
        alert(response.data.message);
        // Navigate back to RFP detail
        navigate(`/rfps/${id}`);
      }
    } catch (err) {
      console.error('Error sending RFP:', err);
      setError(err.response?.data?.message || 'Failed to send RFP');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (error && !rfp) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => navigate(`/rfps/${id}`)}
          className="mt-2 text-blue-600 hover:underline"
        >
          ← Back to RFP
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate(`/rfps/${id}`)}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to RFP Details
      </button>

      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Send RFP to Vendors
        </h1>
        <p className="text-gray-600 mb-6">
          Select vendors to send "{rfp?.title}" RFP
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* RFP Summary */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-2">RFP Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Budget:</span>{' '}
              <span className="font-semibold">
                ${parseFloat(rfp?.total_budget || 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Deadline:</span>{' '}
              <span className="font-semibold">
                {rfp?.delivery_deadline
                  ? new Date(rfp.delivery_deadline).toLocaleDateString()
                  : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Items:</span>{' '}
              <span className="font-semibold">
                {rfp?.structured_requirements?.items?.length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Vendor Selection */}
        {vendors.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-5xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No vendors available
            </h3>
            <p className="text-gray-500 mb-4">
              You need to add vendors before sending RFPs
            </p>
            <button
              onClick={() => navigate('/vendors')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Vendors
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Select Vendors ({selectedVendors.length} selected)
              </h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedVendors.length === vendors.length
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>

            <div className="space-y-2 mb-6">
              {vendors.map((vendor) => (
                <div
                  key={vendor.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    selectedVendors.includes(vendor.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleVendorToggle(vendor.id)}
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedVendors.includes(vendor.id)}
                      onChange={() => handleVendorToggle(vendor.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {vendor.name}
                          </p>
                          <p className="text-sm text-gray-500">{vendor.email}</p>
                        </div>
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {vendor.category || 'uncategorized'}
                        </span>
                      </div>
                      {vendor.contact_person && (
                        <p className="text-xs text-gray-500 mt-1">
                          Contact: {vendor.contact_person}
                          {vendor.phone && ` • ${vendor.phone}`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <button
                onClick={() => navigate(`/rfps/${id}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || selectedVendors.length === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  `📧 Send to ${selectedVendors.length} Vendor(s)`
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SendRFP;