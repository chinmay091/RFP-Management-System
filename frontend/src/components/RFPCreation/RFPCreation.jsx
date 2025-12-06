import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { rfpAPI } from '../../services/api';

const RFPCreation = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const examplePrompts = [
    'I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.',
    'Looking for office furniture: 25 ergonomic chairs and 10 standing desks. Budget $15,000. Delivery needed in 3 weeks. Net 45 payment terms.',
    'Need cloud storage solution for 100 users. Budget $10,000 annually. Must have 99.9% uptime SLA. Payment quarterly.',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please describe what you want to procure');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await rfpAPI.create({
        naturalLanguageInput: input,
      });

      if (response.data.success) {
        // Navigate to RFP detail page
        navigate(`/rfps/${response.data.data.id}`);
      }
    } catch (err) {
      console.error('Error creating RFP:', err);
      setError(err.response?.data?.message || 'Failed to create RFP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const applyExample = (example) => {
    setInput(example);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Create New RFP
        </h1>
        <p className="text-gray-600 mb-6">
          Describe what you want to procure in natural language, and AI will structure it for you.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="rfp-input"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Procurement Requirements
            </label>
            <textarea
              id="rfp-input"
              rows="8"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Example: I need to procure 50 laptops with 16GB RAM, budget $75,000, delivery in 30 days..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating RFP with AI...
                </span>
              ) : (
                '✨ Create RFP with AI'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>

        {/* Example Prompts */}
        <div className="mt-8">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Try these examples:
          </h3>
          <div className="space-y-2">
            {examplePrompts.map((example, index) => (
              <button
                key={index}
                onClick={() => applyExample(example)}
                className="w-full text-left p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-sm text-gray-600"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RFPCreation;