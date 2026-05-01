/**
 * Jest Setup File
 * Configures mocks and test environment before running tests
 */

// Mock Supabase before any tests run
jest.mock('./config/supabase', () => {
  const mockFrom = jest.fn();
  const mockSelect = jest.fn();
  const mockEq = jest.fn();
  const mockUpdate = jest.fn();
  const mockSingle = jest.fn();
  
  mockSelect.mockReturnValue({
    eq: mockEq.mockReturnValue({
      single: mockSingle.mockResolvedValue({ data: null, error: null })
    })
  });
  
  mockUpdate.mockReturnValue({
    eq: mockEq.mockResolvedValue({ error: null })
  });
  
  mockFrom.mockReturnValue({
    select: mockSelect,
    update: mockUpdate
  });
  
  return {
    from: mockFrom
  };
});

// Suppress console warnings during tests
const originalWarn = console.warn;
console.warn = jest.fn((...args) => {
  // Only suppress Supabase warnings
  if (!args[0]?.includes('Supabase')) {
    originalWarn(...args);
  }
});
