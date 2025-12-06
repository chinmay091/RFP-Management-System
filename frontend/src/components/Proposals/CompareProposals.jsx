import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { rfpAPI, proposalAPI } from '../../services/api';

const CompareProposals = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRfp] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const rfpResponse = await rfpAPI.getById(id);
      if (rfpResponse.data.success) {
        setRfp(rfpResponse.data.data);
      }
    } catch (err) {
      console.error('Error fetching RFP:', err);
      setError('Failed to load RFP');
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setComparing(true);
    setError('');

    try {
      const response = await proposalAPI.compare(id);
      if (response.data.success) {
        setComparison(response.data.data);
      }
    } catch (err) {
      console.error('Error comparing proposals:', err);
      setError(err.response?.data?.message || 'Failed to compare proposals');
    } finally {
      setComparing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
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

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Compare Proposals
        </h1>
        <p className="text-gray-600 mb-4">
          AI-powered analysis for: <span className="font-semibold">{rfp?.title}</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!comparison ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🤖</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Ready to Compare Proposals
            </h3>
            <p className="text-gray-500 mb-6">
              AI will analyze all vendor proposals and provide scores, pros/cons, and a recommendation
            </p>
            <button
              onClick={handleCompare}
              disabled={comparing}
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 text-lg"
            >
              {comparing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing with AI...
                </span>
              ) : (
                '🚀 Start AI Comparison'
              )}
            </button>
          </div>
        ) : (
          <div>
            {/* Recommendation Box */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 mb-6">
              <div className="flex items-start">
                <div className="text-4xl mr-4">🏆</div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Recommended Vendor
                  </h2>
                  <p className="text-2xl font-bold text-purple-600 mb-3">
                    {comparison.recommendation.vendor_name}
                  </p>
                  <div className="mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      comparison.recommendation.confidence_level === 'high'
                        ? 'bg-green-100 text-green-800'
                        : comparison.recommendation.confidence_level === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-orange-100 text-orange-800'
                    }`}>
                      {comparison.recommendation.confidence_level.toUpperCase()} CONFIDENCE
                    </span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {comparison.recommendation.reasoning}
                  </p>
                </div>
              </div>
            </div>

            {/* Overall Analysis */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                📊 Overall Market Analysis
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {comparison.overall_analysis}
              </p>
            </div>

            {/* Individual Evaluations */}
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Vendor Evaluations
            </h3>
            <div className="space-y-6">
              {comparison.evaluations.map((evaluation, index) => (
                <div
                  key={evaluation.vendor_id}
                  className={`border-2 rounded-lg p-6 ${
                    evaluation.vendor_id === comparison.recommendation.vendor_id
                      ? 'border-purple-300 bg-purple-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-gray-900 flex items-center">
                        {evaluation.vendor_name}
                        {evaluation.vendor_id === comparison.recommendation.vendor_id && (
                          <span className="ml-2 text-2xl">👑</span>
                        )}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className={`text-4xl font-bold ${getScoreColor(evaluation.score)}`}>
                        {evaluation.score}
                      </div>
                      <div className="text-sm text-gray-500">Overall Score</div>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className={`${getScoreBg(evaluation.price_score)} p-4 rounded-lg text-center`}>
                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.price_score)}`}>
                        {evaluation.price_score}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Price Score</div>
                    </div>
                    <div className={`${getScoreBg(evaluation.delivery_score)} p-4 rounded-lg text-center`}>
                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.delivery_score)}`}>
                        {evaluation.delivery_score}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Delivery Score</div>
                    </div>
                    <div className={`${getScoreBg(evaluation.completeness_score)} p-4 rounded-lg text-center`}>
                      <div className={`text-2xl font-bold ${getScoreColor(evaluation.completeness_score)}`}>
                        {evaluation.completeness_score}
                      </div>
                      <div className="text-sm text-gray-600 font-medium">Completeness</div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">{evaluation.summary}</p>
                  </div>

                  {/* Pros and Cons */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-semibold text-green-700 mb-2 flex items-center">
                        <span className="mr-2">✅</span> Strengths
                      </h5>
                      <ul className="space-y-1">
                        {evaluation.pros.map((pro, idx) => (
                          <li key={idx} className="text-sm text-gray-700 pl-4">
                            • {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold text-red-700 mb-2 flex items-center">
                        <span className="mr-2">⚠️</span> Weaknesses
                      </h5>
                      <ul className="space-y-1">
                        {evaluation.cons.map((con, idx) => (
                          <li key={idx} className="text-sm text-gray-700 pl-4">
                            • {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => navigate(`/rfps/${id}`)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                ← Back to Proposals
              </button>
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400"
              >
                🔄 Re-analyze
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompareProposals;