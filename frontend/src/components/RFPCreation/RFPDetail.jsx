import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfpAPI, proposalAPI, emailAPI } from '../../services/api';

const RFPDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRFPDetail();
    fetchProposals();
  }, [id]);

  const fetchRFPDetail = async () => {
    try {
      const response = await rfpAPI.getById(id);
      if (response.data.success) {
        setRfp(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching RFP:', err);
      setError('Failed to load RFP details');
    } finally {
      setLoading(false);
    }
  };

  const fetchProposals = async () => {
    try {
      const response = await proposalAPI.getByRFP(id);
      if (response.data.success) {
        setProposals(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching proposals:', err);
    }
  };

  const handleFetchEmails = async () => {
    setFetchingEmails(true);
    try {
      const response = await emailAPI.fetchProposals();
      if (response.data.success) {
        alert(response.data.message);
        // Refresh proposals
        fetchProposals();
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
      alert('Failed to fetch emails');
    } finally {
      setFetchingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading RFP details...</div>
      </div>
    );
  }

  if (error || !rfp) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-600">{error || 'RFP not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-2 text-blue-600 hover:underline"
        >
          ← Back to RFPs
        </button>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => navigate('/')}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to RFPs
      </button>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {rfp.title}
            </h1>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                rfp.status === 'draft'
                  ? 'bg-gray-100 text-gray-800'
                  : rfp.status === 'sent'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}
            >
              {rfp.status}
            </span>
          </div>
          <div className="flex gap-2">
            {rfp.status === 'sent' && (
              <button
                onClick={handleFetchEmails}
                disabled={fetchingEmails}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
              >
                {fetchingEmails ? '🔄 Fetching...' : '📥 Fetch New Proposals'}
              </button>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-gray-700">{rfp.description}</p>
        </div>

        {/* Key Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Total Budget
            </h4>
            <p className="text-lg font-semibold text-gray-900">
              ${parseFloat(rfp.total_budget || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Delivery Deadline
            </h4>
            <p className="text-lg font-semibold text-gray-900">
              {rfp.delivery_deadline
                ? new Date(rfp.delivery_deadline).toLocaleDateString()
                : 'Not specified'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Payment Terms
            </h4>
            <p className="text-lg font-semibold text-gray-900">
              {rfp.payment_terms || 'Not specified'}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-500 mb-1">
              Warranty Requirements
            </h4>
            <p className="text-lg font-semibold text-gray-900">
              {rfp.warranty_requirements || 'Not specified'}
            </p>
          </div>
        </div>

        {/* Items Required */}
        {rfp.structured_requirements?.items && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Items Required
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Specifications
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {rfp.structured_requirements.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.specifications}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions */}
        {rfp.status === 'draft' && (
          <div className="border-t pt-6">
            <button
              onClick={() => navigate(`/rfps/${rfp.id}/send`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              📧 Send to Vendors
            </button>
          </div>
        )}
      </div>

      {/* Proposals Section */}
      {rfp.status === 'sent' && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Vendor Proposals ({proposals.length})
            </h2>
            {proposals.length > 1 && (
              <button
                onClick={() => navigate(`/rfps/${rfp.id}/compare`)}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
              >
                📊 Compare Proposals
              </button>
            )}
          </div>

          {proposals.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📭</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No proposals yet
              </h3>
              <p className="text-gray-500 mb-4">
                Waiting for vendors to respond to your RFP
              </p>
              <button
                onClick={handleFetchEmails}
                disabled={fetchingEmails}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                {fetchingEmails ? 'Checking...' : '📥 Check for New Proposals'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <div
                  key={proposal.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {proposal.vendor.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {proposal.vendor.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        ${parseFloat(proposal.total_price || 0).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {proposal.delivery_time
                          ? `${proposal.delivery_time} days delivery`
                          : 'Delivery time not specified'}
                      </p>
                    </div>
                  </div>

                  {/* Proposal Items */}
                  {proposal.parsed_data?.items && (
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Items Quoted:
                      </h4>
                      <div className="space-y-1">
                        {proposal.parsed_data.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="text-sm text-gray-600 flex justify-between"
                          >
                            <span>
                              {item.name} ({item.quantity} units @ $
                              {item.unit_price})
                            </span>
                            <span className="font-semibold">
                              ${(item.unit_price * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Payment Terms:</span>{' '}
                      <span className="font-medium">
                        {proposal.parsed_data?.payment_terms || 'Not specified'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Warranty:</span>{' '}
                      <span className="font-medium">
                        {proposal.parsed_data?.warranty || 'Not specified'}
                      </span>
                    </div>
                  </div>

                  {/* Received At */}
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    Received: {new Date(proposal.received_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RFPDetail;