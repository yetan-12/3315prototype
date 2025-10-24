// script.js (Revised Version)

// Global variables
let map;
let markers; // <--- Add this line
let currentFilteredData = []; // Store currently filtered data
let userData = []; // Store user-inserted data
let currentUser = null; // Current logged-in user
let isLoggedIn = false; // Login status
let isEnterpriseAuthenticated = false; // Enterprise authentication status
let enterpriseAuthData = null; // Enterprise authentication data
let userEmail = ''; // User email address
let messageNotificationsEnabled = false; // Message notification toggle status
const ageCategoryColors = { // <--- Move color configuration here
    "< 5 years": "#27ae60",
    "5-10 years": "#f1c40f",
    "10-20 years": "#e67e22",
    "20+ years": "#e74c3c",
    "Unknown date": "#808080"
};

// Initialize all functions after page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('=== FloraAtlas Application Starting ===');
    console.log('DOM Content Loaded');
    
    initMap();
    console.log('Map initialized');
    
    initNavigation();
    console.log('Navigation initialized');
    
    initZoomControl();
    console.log('Zoom control initialized');
    
    initAuthLogic(); // Re-enable authentication logic
    console.log('Auth logic initialized');
    
    initSearch();
    console.log('Search initialized');
    
    initDownload(); // Initialize download functionality
    console.log('Download functionality initialized');
    
    initDataManagement(); // Initialize data management functionality
    console.log('Data management initialized');
    
    initProfileSettings(); // Initialize profile settings functionality
    console.log('Profile settings initialized');
    
    initEmailJS(); // Initialize EmailJS
    console.log('EmailJS initialization called');
    
    console.log('=== FloraAtlas Application Started ===');
    
    // Delayed check for data management button display
    setTimeout(() => {
        if (isLoggedIn && isEnterpriseAuthenticated) {
            const dataManagementSection = document.getElementById('dataManagementSection');
            if (dataManagementSection) {
                dataManagementSection.style.display = 'block';
                updateUserDataCount();
                console.log('Delayed check: Data management buttons displayed');
            }
        }
    }, 500);
});

// ===================================================================
// Map Initialization and Data Loading
// ===================================================================

function initMap() {
    const australiaBounds = [
        [-10.0, 113.0], // Northwest
        [-44.0, 154.0]  // Southeast
    ];

    map = L.map('map', {
        center: [-25.2744, 133.7751],
        zoom: 4.5,
        minZoom: 4.5,
        maxZoom: 6,
        zoomControl: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
        boxZoom: false,
        keyboard: false,
        dragging: false,
        maxBounds: australiaBounds,
        maxBoundsViscosity: 1.0
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);

    map.fitBounds(australiaBounds);
    
    // Directly call function to load and display data
    loadAndDisplayPlantData();
    
    // Add legend
    addColorLegend();
}

/**
 * Load plantData and display it on the map
 */
function loadAndDisplayPlantData() {
    // Check if global variable plantData exists (provided by plant-data-full.js)
    if (typeof plantData === 'undefined' || plantData.length === 0) {
        console.error('Plant data is not available or empty!');
        return;
    }

    // Merge original data and user data
    const allData = [...plantData, ...userData];
    
    console.log(`✅ Successfully loaded ${allData.length} plant records (${plantData.length} original + ${userData.length} user data). Now displaying...`);

    // Define color mapping table, consistent with your legend design and Python script output
    const ageCategoryColors = {
        "< 5 years": "#27ae60",
        "5-10 years": "#f1c40f", // Corrected color to match legend
        "10-20 years": "#e67e22",
        "20+ years": "#e74c3c",
        "Unknown date": "#808080"
    };

    // Clear existing markers
    if (markers) {
        map.removeLayer(markers);
    }
    
    // Use MarkerCluster to optimize display of large amounts of data points
    markers = L.markerClusterGroup();

    allData.forEach(point => {
        // [Fixed] Use correct field names to get data
        const lat = point["Decimal Latitude"];
        const lon = point["Decimal Longitude"];
        const species = point["Scientific Name"];
        const year = point["Year"];
        const ageCategory = point["AgeCategory"];

        if (lat && lon) {
            // [Fixed] Directly use pre-calculated AgeCategory to get color
            const fillColor = ageCategoryColors[ageCategory] || "#808080";

            const marker = L.circleMarker([lat, lon], {
                radius: 5,
                fillColor: fillColor,
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 0.8
            });

            // [Fixed] Create popup content
            const popupContent = `
                <div class="plant-popup">
                    <h3>${species}</h3>
                    <p><strong>Year:</strong> ${year || 'Unknown'}</p>
                    <p><strong>Record Age:</strong> ${ageCategory}</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markers.addLayer(marker); // Add marker to cluster layer
        }
    });

    map.addLayer(markers);
    console.log(`✅ Added ${allData.length} plant markers to map (${plantData.length} original + ${userData.length} user data).`);
}

/**
 * Add color legend to map
 */
function addColorLegend() {
    const legend = L.control({position: 'bottomright'});
    
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'color-legend');
        div.innerHTML = `
            <div class="legend-title">Plant Record Age</div>
            <div class="legend-item"><span class="legend-color" style="background-color: #27ae60;"></span><span class="legend-text">≤ 5 years</span></div>
            <div class="legend-item"><span class="legend-color" style="background-color: #f1c40f;"></span><span class="legend-text">5-10 years</span></div>
            <div class="legend-item"><span class="legend-color" style="background-color: #e67e22;"></span><span class="legend-text">10-20 years</span></div>
            <div class="legend-item"><span class="legend-color" style="background-color: #e74c3c;"></span><span class="legend-text">20+ years</span></div>
            <div class="legend-item"><span class="legend-color" style="background-color: #808080;"></span><span class="legend-text">Unknown date</span></div>
        `;
        return div;
    };
    
    legend.addTo(map);
}


// ===================================================================
// Page interaction logic (navigation, fullscreen, search, login) - No changes needed
// ===================================================================

function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const viewContainers = document.querySelectorAll('.view-container');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            viewContainers.forEach(container => container.classList.remove('active'));
            const viewType = this.getAttribute('data-view');
            const targetContainer = document.getElementById(`${viewType}-container`);
            if (targetContainer) {
                targetContainer.classList.add('active');
                if (viewType === 'map' && map) {
                    setTimeout(() => map.invalidateSize(), 100);
                }
            }
        });
    });
}

function initZoomControl() {
    const zoomBtn = document.getElementById('zoomBtn');
    let isFullscreen = false;
    const australiaBounds = [[-10.0, 113.0], [-44.0, 154.0]];
    zoomBtn.addEventListener('click', function() {
        const mapContainer = document.getElementById('map-container');
        const body = document.body;
        if (!isFullscreen) {
            mapContainer.classList.add('map-fullscreen');
            body.classList.add('fullscreen-active');
            map.setZoom(6);
            map.setMinZoom(2);
            map.setMaxZoom(18);
            map.scrollWheelZoom.enable();
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.boxZoom.enable();
            map.keyboard.enable();
            map.setMaxBounds(null);
            zoomBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>`;
            zoomBtn.title = "Exit Fullscreen";
        } else {
            mapContainer.classList.remove('map-fullscreen');
            body.classList.remove('fullscreen-active');
            map.setZoom(4.5);
            map.setMinZoom(4.5);
            map.setMaxZoom(6);
            map.scrollWheelZoom.disable();
            map.dragging.disable();
            map.touchZoom.disable();
            map.doubleClickZoom.disable();
            map.boxZoom.disable();
            map.keyboard.disable();
            map.setView([-25.2744, 133.7751], 4.5);
            map.setMaxBounds(australiaBounds);
            zoomBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
            zoomBtn.title = "Enter Fullscreen";
        }
        isFullscreen = !isFullscreen;
        setTimeout(() => map.invalidateSize(), 100);
    });
}
// ... (Add before initSearch function)

/**
 * Update map markers based on filtered data
 * @param {Array} filteredData - Filtered plant data
 */
function updateMapMarkers(filteredData) {
    // 1. Clear all current markers
    markers.clearLayers();

    // 2. Iterate through filtered data and add new markers
    filteredData.forEach(point => {
        const lat = point["Decimal Latitude"];
        const lon = point["Decimal Longitude"];
        const species = point["Scientific Name"];
        const year = point["Year"];
        const ageCategory = point["AgeCategory"];

        if (lat && lon) {
            const fillColor = ageCategoryColors[ageCategory] || "#808080";

            const marker = L.circleMarker([lat, lon], {
                radius: 5,
                fillColor: fillColor,
                color: "#000",
                weight: 0.5,
                opacity: 1,
                fillOpacity: 0.8
            });

            const popupContent = `
                <div class="plant-popup">
                    <h3>${species}</h3>
                    <p><strong>Year:</strong> ${year || 'Unknown'}</p>
                    <p><strong>Record Age:</strong> ${ageCategory}</p>
                </div>
            `;
            
            marker.bindPopup(popupContent);
            markers.addLayer(marker);
        }
    });
}
function initSearch() {
    const locationSearchInput = document.querySelector('.search-category:nth-child(1) .search-input');
    const speciesSearchInput = document.querySelector('.search-category:nth-child(2) .search-input');

    if (!locationSearchInput || !speciesSearchInput) {
        console.error("Search input fields not found! Please check your HTML structure.");
        return;
    }

    function performSearch() {
        const yearTerm = locationSearchInput.value.trim();
        const speciesTerm = speciesSearchInput.value.toLowerCase();

        console.log(`Filtering by Record Year: "${yearTerm}", Species: "${speciesTerm}"`);

        // Merge original data and user data for search
        const allData = [...plantData, ...userData];
        
        const filteredData = allData.filter(point => {
            const scientificName = (point["Scientific Name"] || '').toLowerCase();
            
            // Species search: match scientific name
            const speciesMatch = speciesTerm === '' || scientificName.startsWith(speciesTerm);
            
            // Record year search: filter by years within the specified range
            let yearMatch = true;
            if (yearTerm !== '') {
                const years = parseInt(yearTerm);
                if (!isNaN(years)) {
                    const currentYear = new Date().getFullYear();
                    const recordYear = point["Year"];
                    if (recordYear) {
                        const yearsAgo = currentYear - recordYear;
                        yearMatch = yearsAgo <= years;
                    } else {
                        yearMatch = false;
                    }
                }
            }

            // Debug logging for first few items
            if (allData.indexOf(point) < 3) {
                console.log(`Item: ${scientificName}, Year: ${point["Year"]}, SpeciesMatch: ${speciesMatch}, YearMatch: ${yearMatch}, Final: ${speciesMatch && yearMatch}`);
            }

            return speciesMatch && yearMatch;
        });

        console.log(`Search results: ${filteredData.length} items found (from ${allData.length} total)`);

        // Update currently filtered data
        currentFilteredData = filteredData;
        
        // Update map markers
        updateMapMarkers(filteredData);
        
        // Update download button status
        updateDownloadButton(filteredData);
    }

    locationSearchInput.addEventListener('input', performSearch);
    speciesSearchInput.addEventListener('input', performSearch);
    
    // Initialize to show all data (including user data)
    const allData = [...plantData, ...userData];
    currentFilteredData = allData;
    updateDownloadButton(allData);
}
function initAuthLogic() {
    // Authentication state management - restore state from localStorage to global variables
    isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    currentUser = localStorage.getItem('currentUser');
    isEnterpriseAuthenticated = localStorage.getItem('isEnterpriseAuthenticated') === 'true';
    enterpriseAuthData = JSON.parse(localStorage.getItem('enterpriseAuthData') || 'null');
    userEmail = localStorage.getItem('userEmail') || '';
    messageNotificationsEnabled = localStorage.getItem('messageNotificationsEnabled') === 'true';

    // Update login status display
    function updateLoginStatus() {
        const loginNavLink = document.querySelector('[data-view="login"], [data-view="profile"]');
        const authNavLink = document.querySelector('[data-view="auth"]');
        const downloadSection = document.querySelector('.download-section');
        
        if (isLoggedIn && currentUser) {
            // Update navigation links
            if (loginNavLink) {
                loginNavLink.textContent = 'Profile';
                loginNavLink.setAttribute('data-view', 'profile');
            }
            
            // Show authentication button
            if (authNavLink) {
                authNavLink.style.display = 'block';
            }
            
            // Show download button (visible for all logged in users)
            if (downloadSection) {
                downloadSection.style.display = 'block';
                console.log('Download section displayed for logged in user');
            }
            
            // Update user information
            const profileUsername = document.getElementById('profile-username');
            const profileStatus = document.getElementById('profile-status');
            if (profileUsername) profileUsername.textContent = currentUser;
            if (profileStatus) profileStatus.textContent = 'Active';
        } else {
            // Update navigation links
            if (loginNavLink) {
                loginNavLink.textContent = 'Login';
                loginNavLink.setAttribute('data-view', 'login');
            }
            
            // Hide authentication button
            if (authNavLink) {
                authNavLink.style.display = 'none';
            }
            
            // Hide download button
            if (downloadSection) {
                downloadSection.style.display = 'none';
            }
        }
    }
    
    // Update enterprise authentication status display
    function updateEnterpriseAuthStatus() {
        const dataManagementSection = document.getElementById('dataManagementSection');
        
        console.log('updateEnterpriseAuthStatus - Check enterprise authentication status:', {
            isLoggedIn,
            currentUser,
            isEnterpriseAuthenticated,
            enterpriseAuthData: !!enterpriseAuthData
        });
        
        if (dataManagementSection) {
            if (isLoggedIn && isEnterpriseAuthenticated) {
                dataManagementSection.style.display = 'block';
                updateUserDataCount();
                console.log('Data management section displayed for enterprise authenticated user');
            } else {
                dataManagementSection.style.display = 'none';
                console.log('Data management section hidden - not enterprise authenticated or not logged in');
            }
        } else {
            console.log('Data management section element not found');
        }
    }
    
    // Update all authentication status (combined function)
    function updateAllAuthStatus() {
        updateLoginStatus();
        updateEnterpriseAuthStatus();
    }

    // Authentication tab switching
    const authTabs = document.querySelectorAll('.auth-tab');
    const authForms = document.querySelectorAll('.auth-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove all active states
            authTabs.forEach(t => t.classList.remove('active'));
            authForms.forEach(f => f.classList.remove('active'));
            
            // Activate current tab and corresponding form
            tab.classList.add('active');
            const targetForm = document.querySelector(`.${tab.getAttribute('data-tab')}-form`);
            if (targetForm) {
                targetForm.classList.add('active');
            }
        });
    });

    // Login form submission
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
            const usernameInput = this.querySelector('input[type="text"]');
            const passwordInput = this.querySelector('input[type="password"]');
            
            if (usernameInput && usernameInput.value.trim()) {
            isLoggedIn = true;
                currentUser = usernameInput.value.trim();
                
                // Save to localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', currentUser);
                
                // Update last login time
                const lastLoginElement = document.getElementById('profile-last-login');
                if (lastLoginElement) {
                    lastLoginElement.textContent = new Date().toLocaleString();
                }
                
            // Use separated authentication status update function
            updateAllAuthStatus();
                
                // Clear form
                this.reset();
                
                // Auto redirect to map view after successful login
                const mapNavLink = document.querySelector('[data-view="map"]');
                if (mapNavLink) {
                    mapNavLink.click();
                }
            }
        });
    }

    // Registration form submission
    const registerForm = document.querySelector('.register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
        e.preventDefault();
            const usernameInput = this.querySelector('input[type="text"]');
            const emailInput = this.querySelector('input[type="email"]');
            const passwordInput = this.querySelector('input[type="password"]');
            const confirmPasswordInput = this.querySelectorAll('input[type="password"]')[1];
            
            // Simple validation
            if (usernameInput && usernameInput.value.trim() && 
                passwordInput && passwordInput.value &&
                passwordInput.value === confirmPasswordInput.value) {
                
            isLoggedIn = true;
                currentUser = usernameInput.value.trim();
                
                // Save to localStorage
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('currentUser', currentUser);
                
            // Use separated authentication status update function
            updateAllAuthStatus();
                
                // Switch to map view
                const mapNavLink = document.querySelector('[data-view="map"]');
                if (mapNavLink) {
                    mapNavLink.click();
                }
                
                // Clear form
                this.reset();
            } else {
                alert('Please check your input information and ensure passwords match');
            }
        });
    }

    // Logout functionality
    const logoutButtons = document.querySelectorAll('.logout-button');
    logoutButtons.forEach(button => {
        button.addEventListener('click', () => {
        isLoggedIn = false;
        currentUser = null;
            isEnterpriseAuthenticated = false;
            enterpriseAuthData = null;
            
            // Clear localStorage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('currentUser');
            localStorage.removeItem('isEnterpriseAuthenticated');
            localStorage.removeItem('enterpriseAuthData');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('messageNotificationsEnabled');
            
            // Refresh page after logout to ensure all states are completely reset
            window.location.reload();
        });
    });

    // Authentication redirect button
    const authRedirectButton = document.querySelector('.auth-redirect-button');
    if (authRedirectButton) {
        authRedirectButton.addEventListener('click', () => {
            const loginNavLink = document.querySelector('[data-view="login"]');
            if (loginNavLink) {
                loginNavLink.click();
            }
        });
    }

    // Enterprise authentication form submission
    const enterpriseAuthForm = document.querySelector('.enterprise-auth-form');
    if (enterpriseAuthForm) {
        enterpriseAuthForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const orgName = document.getElementById('organization-name').value;
            const department = document.getElementById('department').value;
            
            if (orgName && department) {
                // Simplified enterprise authentication process
                enterpriseAuthData = {
                    organization: orgName,
                    department: department,
                    submittedAt: new Date().toLocaleString()
                };
                
                // Immediate authentication approval (prototype version)
                isEnterpriseAuthenticated = true;
                
                // Save enterprise authentication status to localStorage
                localStorage.setItem('isEnterpriseAuthenticated', 'true');
                localStorage.setItem('enterpriseAuthData', JSON.stringify(enterpriseAuthData));
                
                updateAllAuthStatus(); // Update all authentication status
                
                // Force display data management buttons
                const dataManagementSection = document.getElementById('dataManagementSection');
                if (dataManagementSection) {
                    dataManagementSection.style.display = 'block';
                    updateUserDataCount();
                }
                
                // Hide form, show status
                this.style.display = 'none';
                document.getElementById('enterprise-auth-status').style.display = 'block';
                
                alert('Organization authentication successful! Database access granted.');
            } else {
                alert('Please fill in organization name and department information.');
            }
        });
    }
    
    // Update enterprise authentication status display
    function updateEnterpriseAuthStatus() {
        if (enterpriseAuthData) {
            const orgNameDisplay = document.getElementById('org-name-display');
            const deptNameDisplay = document.getElementById('dept-name-display');
            const enterpriseStatusDisplay = document.getElementById('enterprise-status-display');
            const databaseAccessDisplay = document.getElementById('database-access-display');
            
            if (orgNameDisplay) orgNameDisplay.textContent = enterpriseAuthData.organization;
            if (deptNameDisplay) deptNameDisplay.textContent = enterpriseAuthData.department;
            if (enterpriseStatusDisplay) enterpriseStatusDisplay.textContent = isEnterpriseAuthenticated ? 'Verified' : 'Pending';
            if (databaseAccessDisplay) databaseAccessDisplay.textContent = isEnterpriseAuthenticated ? 'Granted' : 'Not Granted';
        }
    }
    
    // Revoke enterprise authentication
    const revokeAuthButton = document.querySelector('.revoke-auth-button');
    if (revokeAuthButton) {
        revokeAuthButton.addEventListener('click', () => {
            isEnterpriseAuthenticated = false;
            enterpriseAuthData = null;
            
            // Clear enterprise authentication status from localStorage
            localStorage.removeItem('isEnterpriseAuthenticated');
            localStorage.removeItem('enterpriseAuthData');
            
            // Update authentication status to hide data management buttons
            updateAllAuthStatus();
            
            // Show form, hide status
            document.querySelector('.enterprise-auth-form').style.display = 'block';
            document.getElementById('enterprise-auth-status').style.display = 'none';
            
            // Clear form
            document.querySelector('.enterprise-auth-form').reset();
            
            alert('Enterprise authentication revoked, database access withdrawn.');
        });
    }
    
    // Initialize authentication status
    updateAllAuthStatus();
    
    // If already authenticated, show authentication status page
    if (isEnterpriseAuthenticated && enterpriseAuthData) {
        // Hide form, show status
        const authForm = document.querySelector('.enterprise-auth-form');
        const authStatus = document.getElementById('enterprise-auth-status');
        if (authForm) authForm.style.display = 'none';
        if (authStatus) authStatus.style.display = 'block';
        
        // Ensure data management buttons are displayed (authenticated users)
        const dataManagementSection = document.getElementById('dataManagementSection');
        if (dataManagementSection) {
            dataManagementSection.style.display = 'block';
            updateUserDataCount();
        }
    }
    
    // Debug: Check authentication status
    console.log('认证状态检查:', {
        isLoggedIn,
        currentUser,
        isEnterpriseAuthenticated,
        enterpriseAuthData: !!enterpriseAuthData
    });
}

// Update download button status
function updateDownloadButton(filteredData) {
    const downloadBtn = document.getElementById('downloadBtn');
    const resultCount = document.getElementById('result-count');
    
    if (downloadBtn && resultCount) {
        const count = filteredData.length;
        resultCount.textContent = count;
        
        if (count > 0) {
            downloadBtn.disabled = false;
            downloadBtn.style.opacity = '1';
        } else {
            downloadBtn.disabled = true;
            downloadBtn.style.opacity = '0.5';
        }
    }
}

// Download data functionality
function downloadData() {
    if (currentFilteredData.length === 0) {
        alert('No data available for download');
        return;
    }
    
    // Create CSV content
    const headers = [
        'Scientific Name',
        'Decimal Latitude', 
        'Decimal Longitude',
        'Year',
        'AgeCategory'
    ];
    
    const csvContent = [
        headers.join(','),
        ...currentFilteredData.map(row => 
            headers.map(header => {
                const value = row[header] || '';
                // Handle values containing commas
                return `"${value.toString().replace(/"/g, '""')}"`;
            }).join(',')
        )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `plant_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log(`Downloaded ${currentFilteredData.length} records`);
}

// Initialize download functionality
function initDownload() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadData);
    }
}

// Data management functionality
function initDataManagement() {
    // Insert data button
    const insertBtn = document.getElementById('insertBtn');
    const insertModal = document.getElementById('insert-modal');
    const closeInsertModal = document.getElementById('closeInsertModal');
    const cancelInsert = document.getElementById('cancelInsert');
    const insertForm = document.getElementById('insertForm');
    
    if (insertBtn) {
        insertBtn.addEventListener('click', () => {
            insertModal.style.display = 'flex';
        });
    }
    
    if (closeInsertModal) {
        closeInsertModal.addEventListener('click', () => {
            insertModal.style.display = 'none';
        });
    }
    
    if (cancelInsert) {
        cancelInsert.addEventListener('click', () => {
            insertModal.style.display = 'none';
        });
    }
    
    // Insert form submission
    if (insertForm) {
        insertForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const scientificName = document.getElementById('insert-scientific-name').value;
            const latitude = document.getElementById('insert-latitude').value;
            const longitude = document.getElementById('insert-longitude').value;
            const year = document.getElementById('insert-year').value;
            const notes = document.getElementById('insert-notes').value;
            
            if (scientificName) {
                // Check if in edit mode
                if (window.editingIndex !== undefined) {
                    // Edit existing data
                    const updatedData = {
                        id: userData[window.editingIndex].id, // Keep original ID
                        'Scientific Name': scientificName,
                        'Decimal Latitude': latitude ? parseFloat(latitude) : null,
                        'Decimal Longitude': longitude ? parseFloat(longitude) : null,
                        'Year': year ? parseInt(year) : null,
                        'AgeCategory': year ? calculateAgeCategory(parseInt(year)) : 'Unknown date',
                        'Notes': notes,
                        'Created By': userData[window.editingIndex]['Created By'], // Keep original creator
                        'Created At': userData[window.editingIndex]['Created At'] // Keep original creation time
                    };
                    
                    // Update user data
                    userData[window.editingIndex] = updatedData;
                    
                    console.log('数据已更新:', updatedData);
                    console.log('当前用户数据总数:', userData.length);
                    
                    // Reset edit mode
                    window.editingIndex = undefined;
                    
                    alert('Data updated successfully!');
                } else {
                    // Create new data record
                    const newData = {
                        id: Date.now(), // Simple ID generation
                        'Scientific Name': scientificName,
                        'Decimal Latitude': latitude ? parseFloat(latitude) : null,
                        'Decimal Longitude': longitude ? parseFloat(longitude) : null,
                        'Year': year ? parseInt(year) : null,
                        'AgeCategory': year ? calculateAgeCategory(parseInt(year)) : 'Unknown date',
                        'Notes': notes,
                        'Created By': currentUser,
                        'Created At': new Date().toISOString()
                    };
                    
                    // Add to user data
                    userData.push(newData);
                    
                    console.log('新数据已添加:', newData);
                    console.log('当前用户数据总数:', userData.length);
                    
                    alert('Data inserted successfully!');
                }
                
                // Update map display
                updateMapWithUserData();
                updateUserDataCount();
                
                // If management modal is open, update management page display
                const manageModal = document.getElementById('manage-modal');
                if (manageModal && manageModal.style.display !== 'none') {
                    displayUserData();
                }
                
                // Close modal and clear form
                insertModal.style.display = 'none';
                insertForm.reset();
            }
        });
    }
    
    // Manage data button
    const manageBtn = document.getElementById('manageBtn');
    const manageModal = document.getElementById('manage-modal');
    const closeManageModal = document.getElementById('closeManageModal');
    
    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            displayUserData();
            manageModal.style.display = 'flex';
        });
    }
    
    if (closeManageModal) {
        closeManageModal.addEventListener('click', () => {
            manageModal.style.display = 'none';
        });
    }
}

// Calculate age category
function calculateAgeCategory(year) {
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;
    
    if (age < 5) return '< 5 years';
    if (age < 10) return '5-10 years';
    if (age < 20) return '10-20 years';
    if (age >= 20) return '20+ years';
    return 'Unknown date';
}

// Update user data count
function updateUserDataCount() {
    const userDataCount = document.getElementById('user-data-count');
    if (userDataCount) {
        userDataCount.textContent = userData.length;
    }
}

// Display user data
function displayUserData() {
    const userDataList = document.getElementById('userDataList');
    if (!userDataList) return;
    
    if (userData.length === 0) {
        userDataList.innerHTML = '<div style="text-align: center; color: rgba(255,255,255,0.7); padding: 20px;">暂无数据</div>';
        return;
    }
    
    userDataList.innerHTML = userData.map((data, index) => `
        <div class="data-item">
            <div class="data-item-header">
                <h3 class="data-item-title">${data['Scientific Name']}</h3>
                <div class="data-item-actions">
                    <button class="edit-btn" onclick="editUserData(${index})">Edit</button>
                    <button class="delete-btn" onclick="deleteUserData(${index})">Delete</button>
                </div>
            </div>
            <div class="data-item-details">
                <div class="data-detail">
                    <div class="data-detail-label">Latitude</div>
                    <div class="data-detail-value">${data['Decimal Latitude'] || 'N/A'}</div>
                </div>
                <div class="data-detail">
                    <div class="data-detail-label">Longitude</div>
                    <div class="data-detail-value">${data['Decimal Longitude'] || 'N/A'}</div>
                </div>
                <div class="data-detail">
                    <div class="data-detail-label">Year</div>
                    <div class="data-detail-value">${data['Year'] || 'N/A'}</div>
                </div>
                <div class="data-detail">
                    <div class="data-detail-label">Age Category</div>
                    <div class="data-detail-value">${data['AgeCategory']}</div>
                </div>
                ${data['Notes'] ? `
                <div class="data-detail" style="grid-column: 1 / -1;">
                    <div class="data-detail-label">Notes</div>
                    <div class="data-detail-value">${data['Notes']}</div>
                </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Edit user data
function editUserData(index) {
    const data = userData[index];
    
    // Fill edit form
    document.getElementById('insert-scientific-name').value = data['Scientific Name'];
    document.getElementById('insert-latitude').value = data['Decimal Latitude'] || '';
    document.getElementById('insert-longitude').value = data['Decimal Longitude'] || '';
    document.getElementById('insert-year').value = data['Year'] || '';
    document.getElementById('insert-notes').value = data['Notes'] || '';
    
    // Show insert modal
    document.getElementById('insert-modal').style.display = 'flex';
    
    // Mark as edit mode
    window.editingIndex = index;
}

// Delete user data
function deleteUserData(index) {
    if (confirm('Are you sure you want to delete this data?')) {
        const deletedData = userData[index];
        userData.splice(index, 1);
        
        console.log('数据已删除:', deletedData);
        console.log('当前用户数据总数:', userData.length);
        
        updateMapWithUserData();
        updateUserDataCount();
        displayUserData();
        alert('Data deleted successfully!');
    }
}

// Update map display (including user data)
function updateMapWithUserData() {
    // Merge original data and user data
    const allData = [...plantData, ...userData];
    
    // Update current filtered data
    currentFilteredData = allData;
    
    // Reload map markers
    loadAndDisplayPlantData();
    
    console.log('地图已更新，显示用户数据点');
}

// Modify insert form submission logic to support editing
document.addEventListener('DOMContentLoaded', function() {
    const insertForm = document.getElementById('insertForm');
    if (insertForm) {
        insertForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const scientificName = document.getElementById('insert-scientific-name').value;
            const latitude = document.getElementById('insert-latitude').value;
            const longitude = document.getElementById('insert-longitude').value;
            const year = document.getElementById('insert-year').value;
            const notes = document.getElementById('insert-notes').value;
            
            if (scientificName) {
                const newData = {
                    id: window.editingIndex !== undefined ? userData[window.editingIndex].id : Date.now(),
                    'Scientific Name': scientificName,
                    'Decimal Latitude': latitude ? parseFloat(latitude) : null,
                    'Decimal Longitude': longitude ? parseFloat(longitude) : null,
                    'Year': year ? parseInt(year) : null,
                    'AgeCategory': year ? calculateAgeCategory(parseInt(year)) : 'Unknown date',
                    'Notes': notes,
                    'Created By': currentUser,
                    'Created At': window.editingIndex !== undefined ? userData[window.editingIndex]['Created At'] : new Date().toISOString()
                };
                
                if (window.editingIndex !== undefined) {
                    // Edit mode
                    userData[window.editingIndex] = newData;
                    window.editingIndex = undefined;
                } else {
                    // Insert mode
                    userData.push(newData);
                }
                
                updateMapWithUserData();
                updateUserDataCount();
                
                document.getElementById('insert-modal').style.display = 'none';
                insertForm.reset();
                
                alert(window.editingIndex !== undefined ? 'Data updated successfully!' : 'Data inserted successfully!');
            }
        });
    }
});

// ===================================================================
// Profile Settings Functionality
// ===================================================================

function initProfileSettings() {
    const emailInput = document.getElementById('user-email');
    const messageToggle = document.getElementById('message-toggle');
    
    // Restore saved settings
    if (emailInput) {
        emailInput.value = userEmail;
    }
    
    if (messageToggle) {
        messageToggle.checked = messageNotificationsEnabled;
    }
    
    // Email input event listener
    if (emailInput) {
        emailInput.addEventListener('input', function() {
            userEmail = this.value.trim();
            localStorage.setItem('userEmail', userEmail);
            console.log('User email updated:', userEmail);
            
            // If email is empty, automatically disable message notifications
            if (!userEmail) {
                messageToggle.checked = false;
                messageNotificationsEnabled = false;
                localStorage.setItem('messageNotificationsEnabled', 'false');
                console.log('Message notifications disabled - no email provided');
            }
        });
        
        emailInput.addEventListener('blur', function() {
            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                alert('Please enter a valid email address');
                this.focus();
            }
        });
    }
    
    // Message notification toggle event listener
    if (messageToggle) {
        messageToggle.addEventListener('change', function() {
            messageNotificationsEnabled = this.checked;
            localStorage.setItem('messageNotificationsEnabled', messageNotificationsEnabled.toString());
            
            if (messageNotificationsEnabled) {
                if (!userEmail) {
                    alert('Please enter your email address first to receive messages');
                    this.checked = false;
                    messageNotificationsEnabled = false;
                    localStorage.setItem('messageNotificationsEnabled', 'false');
                    return;
                }
                
                // Send confirmation email
                sendWelcomeMessage();
                console.log('Message notifications enabled for:', userEmail);
            } else {
                console.log('Message notifications disabled');
            }
        });
    }
}

// Initialize EmailJS
function initEmailJS() {
    console.log('=== EmailJS Initialization Started ===');
    
    // Check if EmailJS is loaded
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS is not loaded! Check if the script is included in HTML.');
        return;
    }
    
    console.log('EmailJS library loaded successfully');
    
    // Initialize EmailJS
    try {
        emailjs.init('xkLymGPDq9sNnJWGD');
        console.log('EmailJS initialized with key: xkLymGPDq9sNnJWGD');
        console.log('=== EmailJS Initialization Completed ===');
    } catch (error) {
        console.error('Failed to initialize EmailJS:', error);
    }
}

// Send welcome message (when user enables message notifications)
function sendWelcomeMessage() {
    console.log('=== sendWelcomeMessage() called ===');
    console.log('Current user:', currentUser);
    console.log('User email:', userEmail);
    
    const welcomeMessage = "You can now receive messages from FloraAtlas";
    console.log(`Sending welcome message to ${userEmail}: ${welcomeMessage}`);
    
    // Check if EmailJS is available
    if (typeof emailjs === 'undefined') {
        console.error('EmailJS is not available!');
        alert('EmailJS is not loaded. Please refresh the page and try again.');
        return false;
    }
    
    // Use EmailJS to send real email
    const templateParams = {
        to_email: userEmail,
        to_name: currentUser || 'User',
        message: welcomeMessage,
        from_name: 'FloraAtlas Team',
        // Add more possible field name variants
        email: userEmail,
        recipient_email: userEmail,
        user_email: userEmail
    };
    
    console.log('Template parameters:', templateParams);
    
    // Send email
    console.log('Attempting to send email with params:', templateParams);
    emailjs.send('ye', 'template_fsedz0q', templateParams)
        .then(function(response) {
            console.log('Welcome email sent successfully!', response.status, response.text);
            alert(`Welcome message sent to ${userEmail}!\n\n"${welcomeMessage}"`);
        }, function(error) {
            console.error('Failed to send welcome email:', error);
            console.error('Error details:', {
                status: error.status,
                text: error.text,
                message: error.message
            });
            
            // Display more detailed error information
            let errorMessage = 'Failed to send welcome message.\n\n';
            if (error.status === 400) {
                errorMessage += 'Error 400: Bad Request - Check your template and service configuration.';
            } else if (error.status === 401) {
                errorMessage += 'Error 401: Unauthorized - Check your EmailJS public key.';
            } else if (error.status === 403) {
                errorMessage += 'Error 403: Forbidden - Check your service permissions.';
            } else if (error.status === 404) {
                errorMessage += 'Error 404: Not Found - Check your service ID and template ID.';
            } else {
                errorMessage += `Error ${error.status}: ${error.text || error.message}`;
            }
            
            alert(errorMessage);
        });
    
    return true;
}

// Send message functionality (using EmailJS to send real emails)
function sendMessageToUser(message) {
    if (messageNotificationsEnabled && userEmail) {
        console.log(`Sending message to ${userEmail}: ${message}`);
        
        const templateParams = {
            to_email: userEmail,
            to_name: currentUser || 'User',
            message: message,
            from_name: 'FloraAtlas Team',
            // Add more possible field name variants
            email: userEmail,
            recipient_email: userEmail,
            user_email: userEmail
        };
        
        // Send email
        console.log('Attempting to send message with params:', templateParams);
        emailjs.send('ye', 'template_fsedz0q', templateParams)
            .then(function(response) {
                console.log('Message sent successfully!', response.status, response.text);
                alert(`Message sent to ${userEmail}: ${message}`);
            }, function(error) {
                console.error('Failed to send message:', error);
                console.error('Error details:', {
                    status: error.status,
                    text: error.text,
                    message: error.message
                });
                
                // Display more detailed error information
                let errorMessage = 'Failed to send message.\n\n';
                if (error.status === 400) {
                    errorMessage += 'Error 400: Bad Request - Check your template and service configuration.';
                } else if (error.status === 401) {
                    errorMessage += 'Error 401: Unauthorized - Check your EmailJS public key.';
                } else if (error.status === 403) {
                    errorMessage += 'Error 403: Forbidden - Check your service permissions.';
                } else if (error.status === 404) {
                    errorMessage += 'Error 404: Not Found - Check your service ID and template ID.';
                } else {
                    errorMessage += `Error ${error.status}: ${error.text || error.message}`;
                }
                
                alert(errorMessage);
            });
        
        return true;
    } else {
        console.log('Cannot send message - notifications disabled or no email provided');
        return false;
    }
}

// Check if messages can be sent
function canSendMessages() {
    return messageNotificationsEnabled && userEmail && userEmail.trim() !== '';
}