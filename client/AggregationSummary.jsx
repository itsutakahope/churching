import React from 'react';

const AggregationSummary = ({ summary }) => {
  if (!summary) {
    return null;
  }

  const { totalAmount, byCategory } = summary;
  const categories = Object.keys(byCategory).sort();

  return (
    <div className="bg-success-50 dark:bg-graphite-800/40 border-l-4 border-success-500 dark:border-success-600 p-6 rounded-r-lg transition-theme">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 bg-success-500 dark:bg-success-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-success-700 dark:text-success-300 transition-theme">計算結果摘要</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-surface dark:bg-dark-surface rounded-lg shadow transition-theme">
          <thead className="bg-success-100 dark:bg-graphite-700 transition-theme">
            <tr>
              <th className="py-3 px-4 text-left text-sm font-semibold text-success-700 dark:text-dark-text-main transition-theme">奉獻科目</th>
              <th className="py-3 px-4 text-right text-sm font-semibold text-success-700 dark:text-dark-text-main transition-theme">金額</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(category => (
              <tr key={category} className="border-b border-graphite-200 dark:border-graphite-600 hover:bg-success-50 dark:hover:bg-graphite-600 transition-theme">
                <td className="py-3 px-4 font-medium text-graphite-700 dark:text-dark-text-main transition-theme">{category}</td>
                <td className="py-3 px-4 text-right text-graphite-900 dark:text-dark-text-main font-mono transition-theme">
                  {byCategory[category].toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-success-100 dark:bg-graphite-700 transition-theme">
            <tr>
              <td className="py-3 px-4 text-left text-lg font-bold text-success-700 dark:text-dark-text-main transition-theme">總計</td>
              <td className="py-3 px-4 text-right text-lg font-bold text-success-700 dark:text-dark-text-main font-mono transition-theme">
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
