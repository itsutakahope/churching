import React from 'react';

const AggregationSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const { totalAmount, byCategory } = summary;
  const categories = Object.keys(byCategory).sort();

  return (
    <div className="bg-success-50 border-l-4 border-success-500 p-6 rounded-r-lg">
      <h3 className="text-xl font-bold text-success-700 mb-4">計算結果摘要</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow">
          <thead className="bg-success-100">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-success-700">奉獻科目</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-success-700">金額</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category} className="border-b border-graphite-200 hover:bg-success-50">
                <td className="py-3 px-4 font-medium text-graphite-700">{category}</td>
                <td className="py-3 px-4 text-right text-graphite-900 font-mono">
                  {byCategory[category].toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-success-100">
            <tr>
              <td className="py-3 px-4 text-left text-lg font-bold text-success-700">總計</td>
              <td className="py-3 px-4 text-right text-lg font-bold text-success-700 font-mono">
                {totalAmount.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default AggregationSummary;
