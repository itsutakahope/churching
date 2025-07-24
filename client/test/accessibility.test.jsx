import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PurchaseRequestBoard from '../PurchaseRequestBoard.jsx';

// Mock the AuthContext
const mockAuthContext = {
  currentUser: {
    uid: 'test-user',
    displayName: 'Test User',
    getIdToken: vi.fn().mockResolvedValue('mock-token')
  },
  isReimburser: true,
  userRoles: ['user']
};

vi.mock('../AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock axios
vi.mock('axios', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} })
  }
}));

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()) // Return unsubscribe function
}));

vi.mock('../firebaseConfig', () => ({
  firestore: {}
}));

// Mock other components
vi.mock('../CategorySelector', () => ({
  default: ({ value, onChange }) => (
    <select data-testid="category-selector" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">選擇類別</option>
      <option value="office">辦公用品</option>
    </select>
  )
}));

vi.mock('../TransferReimbursementModal.jsx', () => ({
  default: () => <div data-testid="transfer-modal">Transfer Modal</div>
}));

vi.mock('../ToastNotification.jsx', () => ({
  default: () => <div data-testid="toast">Toast</div>
}));

vi.mock('react-linkify', () => ({
  default: ({ children }) => <div>{children}</div>
}));

vi.mock('../pdfGenerator.js', () => ({
  generateVoucherPDF: vi.fn()
}));

describe('PurchaseRequestBoard Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have proper ARIA labels for view toggle buttons', () => {
    render(<PurchaseRequestBoard />);
    
    const listViewButton = screen.getByRole('tab', { name: /切換到列表檢視模式/i });
    const gridViewButton = screen.getByRole('tab', { name: /切換到網格檢視模式/i });
    
    expect(listViewButton).toBeInTheDocument();
    expect(gridViewButton).toBeInTheDocument();
    expect(listViewButton).toHaveAttribute('aria-selected');
    expect(gridViewButton).toHaveAttribute('aria-selected');
  });

  it('should have proper ARIA labels for filter buttons', () => {
    render(<PurchaseRequestBoard />);
    
    const allFilter = screen.getByRole('button', { name: /篩選全部採購需求/i });
    const pendingFilter = screen.getByRole('button', { name: /篩選待購買採購需求/i });
    const purchasedFilter = screen.getByRole('button', { name: /篩選已購買採購需求/i });
    
    expect(allFilter).toBeInTheDocument();
    expect(pendingFilter).toBeInTheDocument();
    expect(purchasedFilter).toBeInTheDocument();
    
    expect(allFilter).toHaveAttribute('aria-pressed');
    expect(pendingFilter).toHaveAttribute('aria-pressed');
    expect(purchasedFilter).toHaveAttribute('aria-pressed');
  });

  it('should have proper labels for sort dropdown', () => {
    render(<PurchaseRequestBoard />);
    
    const sortSelect = screen.getByLabelText(/選擇採購需求排序方式/i);
    expect(sortSelect).toBeInTheDocument();
    expect(sortSelect).toHaveAttribute('aria-label');
  });

  it('should have proper ARIA labels for main action buttons', () => {
    render(<PurchaseRequestBoard />);
    
    const addButton = screen.getByRole('button', { name: /新增一筆採購需求/i });
    const recordsButton = screen.getByRole('button', { name: /查看所有已購買的記錄/i });
    
    expect(addButton).toBeInTheDocument();
    expect(recordsButton).toBeInTheDocument();
    expect(addButton).toHaveAttribute('aria-label');
    expect(recordsButton).toHaveAttribute('aria-label');
  });

  it('should have proper focus management for buttons', () => {
    render(<PurchaseRequestBoard />);
    
    const addButton = screen.getByRole('button', { name: /新增一筆採購需求/i });
    
    // Focus the button
    addButton.focus();
    expect(addButton).toHaveFocus();
    
    // Check if it has focus styles
    expect(addButton).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-glory-red-500');
  });

  it('should support keyboard navigation for view toggle', () => {
    render(<PurchaseRequestBoard />);
    
    const listViewButton = screen.getByRole('tab', { name: /切換到列表檢視模式/i });
    const gridViewButton = screen.getByRole('tab', { name: /切換到網格檢視模式/i });
    
    // Test keyboard navigation
    fireEvent.keyDown(listViewButton, { key: 'Enter' });
    fireEvent.keyDown(gridViewButton, { key: ' ' }); // Space key
    
    expect(listViewButton).toHaveClass('focus:outline-none', 'focus:ring-2');
    expect(gridViewButton).toHaveClass('focus:outline-none', 'focus:ring-2');
  });

  it('should have proper role attributes for tablist', () => {
    render(<PurchaseRequestBoard />);
    
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
    expect(tablist).toHaveAttribute('aria-labelledby', 'view-mode-label');
  });

  it('should have screen reader only text for icons', () => {
    render(<PurchaseRequestBoard />);
    
    const listViewButton = screen.getByRole('tab', { name: /切換到列表檢視模式/i });
    const gridViewButton = screen.getByRole('tab', { name: /切換到網格檢視模式/i });
    
    // Check for screen reader only text
    expect(listViewButton.querySelector('.sr-only')).toBeInTheDocument();
    expect(gridViewButton.querySelector('.sr-only')).toBeInTheDocument();
  });

  it('should have proper loading state with accessibility', () => {
    render(<PurchaseRequestBoard />);
    
    // Check if loading state is accessible
    const loadingIndicator = screen.getByText('載入需求中...');
    expect(loadingIndicator).toBeInTheDocument();
    
    // Check if the loading spinner is present
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});