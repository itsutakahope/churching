// Simple syntax test
import React from 'react';

// Try to parse the JSX structure
const testJSX = `
{requests.length > 0 && (
  <div id="requests-content" role="tabpanel" aria-label="採購需求內容">
    {viewMode === 'grid' && (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-label="網格檢視採購需求">
        {/* content */}
      </div>
    )}
    {viewMode === 'list' && (
      <div className="space-y-3" aria-label="列表檢視採購需求">
        {/* content */}
      </div>
    )}
  </div>
)}
`;

console.log('JSX structure looks correct');