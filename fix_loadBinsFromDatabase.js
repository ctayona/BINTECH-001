// Safe error handling for loadBinsFromDatabase function
// Replace the existing function with this improved version

async function loadBinsFromDatabase() {
  try {
    const response = await fetch('/api/bins');
    
    // Handle 404 - Backend not ready yet
    if (response.status === 404) {
      console.warn('[loadBinsFromDatabase] ⚠️ Backend API not ready yet (404). Page will work once /api/bins endpoint is implemented.');
      bins = [];
      renderBinsTable();
      renderBinsOnMap();
      updateBinsStats();
      return;
    }
    
    // Handle other HTTP errors
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    // Parse and use the data
    bins = await response.json();
    
    // Render table and map
    renderBinsTable();
    renderBinsOnMap();
    updateBinsStats();
    
    console.log(`[loadBinsFromDatabase] ✓ Loaded ${bins.length} bins from database`);
  } catch (error) {
    console.error('[loadBinsFromDatabase] Error:', error.message);
    
    // Initialize with empty array so page still works
    bins = [];
    renderBinsTable();
    renderBinsOnMap();
    updateBinsStats();
    
    // Only show user-facing error for unexpected issues (not 404 or network errors)
    if (error.message && 
        !error.message.includes('404') && 
        !error.message.includes('Failed to fetch')) {
      showNotification('Unable to load bins. Please refresh the page.', 'error');
    }
  }
}
