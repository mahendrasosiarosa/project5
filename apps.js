// app.js - RMD Monitoring System JavaScript

// Data aplikasi dengan user owner, admin, sales, dan gudang
let currentUser = null;
let appData = {
    users: [
        { 
            username: 'owner', 
            password: 'owner123', 
            role: 'owner', 
            fullName: 'Pemilik Perusahaan',
            permissions: ['all'],
            lastLogin: '2024-01-15 14:30'
        },
        { 
            username: 'admin', 
            password: 'admin123', 
            role: 'admin', 
            fullName: 'Administrator System',
            permissions: ['users', 'products', 'reports'],
            lastLogin: '2024-01-15 14:30'
        },
        { 
            username: 'sales01', 
            password: 'sales123', 
            role: 'sales', 
            fullName: 'Budi Santoso',
            permissions: ['visits', 'customers'],
            lastLogin: '2024-01-15 09:15'
        },
        { 
            username: 'gudang01', 
            password: 'gudang123', 
            role: 'gudang', 
            fullName: 'Siti Aminah',
            permissions: ['inventory', 'products'],
            lastLogin: '2024-01-15 08:45'
        }
    ],
    products: [
        { id: 'PRD-001', code: 'PRD-001', name: 'Produk A', category: 'Makanan', price: 50000, stock: 150, minStock: 20, status: 'active', barcode: 'PRD001' },
        { id: 'PRD-002', code: 'PRD-002', name: 'Produk B', category: 'Minuman', price: 75000, stock: 45, minStock: 15, status: 'active', barcode: 'PRD002' },
        { id: 'PRD-003', code: 'PRD-003', name: 'Produk C', category: 'Elektronik', price: 100000, stock: 25, minStock: 5, status: 'active', barcode: 'PRD003' }
    ],
    members: [
        { id: 'M001', name: 'Toko Maju Jaya', type: 'grosir', phone: '08123456789', email: 'maju@email.com', address: 'Jl. Merdeka No. 123', lat: -6.2088, lng: 106.8456, status: 'active' },
        { id: 'M002', name: 'Toko Sejahtera', type: 'agen', phone: '08198765432', email: 'sejahtera@email.com', address: 'Jl. Sudirman No. 456', lat: -6.2297, lng: 106.8227, status: 'active' },
        { id: 'M003', name: 'Warung Sederhana', type: 'retail', phone: '08111223344', email: '', address: 'Jl. Kecil No. 789', lat: -6.2146, lng: 106.8451, status: 'active' }
    ],
    visits: [],
    orders: [],
    currentLocation: null
};

// Variables untuk map
let memberMap = null;
let memberLocationMarker = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('RMD System Initializing...');
    initializeCharts();
    loadFromLocalStorage();
    setupEventListeners();
    initializeMemberMap();
    
    // Debug: Check if users data is loaded
    console.log('Users loaded:', appData.users);
});

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Login form submission
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleLogin();
        });
    } else {
        console.error('Login form not found!');
    }

    // Visit form submission
    const visitForm = document.getElementById('visitForm');
    if (visitForm) {
        visitForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveVisit();
        });
    }

    // Product form submission
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNewProduct();
        });
    }

    // Member form submission
    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
        addMemberForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveNewMember();
        });
    }

    // Mobile menu
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function() {
            document.getElementById('sidebar').classList.add('active');
            document.getElementById('sidebarOverlay').classList.add('active');
        });
    }

    // Sidebar overlay
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', function() {
            document.getElementById('sidebar').classList.remove('active');
            this.classList.remove('active');
        });
    }

    // Navigation
    document.querySelectorAll('.sidebar-menu a[data-page]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            
            if (page === 'financialReports' || page === 'userManagement') {
                if (currentUser && currentUser.role !== 'owner') {
                    alert('Hanya OWNER yang dapat mengakses halaman ini!');
                    return;
                }
            }
            
            showPage(page);
        });
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Apakah Anda yakin ingin logout?')) {
                currentUser = null;
                document.getElementById('appSection').classList.add('hidden');
                document.getElementById('loginSection').classList.remove('hidden');
                document.getElementById('loginForm').reset();
            }
        });
    }

    // Window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth >= 768) {
            document.getElementById('sidebar').classList.remove('active');
            document.getElementById('sidebarOverlay').classList.remove('active');
        }
    });
}

// ===== AUTHENTICATION & PERMISSIONS =====
function handleLogin() {
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    
    console.log('Login attempt:', { username, password });
    console.log('Available users:', appData.users);
    
    // Find user with matching credentials
    const user = appData.users.find(u => 
        u.username === username && u.password === password
    );
    
    if (user) {
        console.log('Login successful:', user);
        currentUser = user;
        user.lastLogin = new Date().toLocaleString('id-ID');
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('appSection').classList.remove('hidden');
        
        updateUIForUserRole();
        showPage('dashboard');
        loadDataForCurrentPage();
        saveToLocalStorage();
    } else {
        console.log('Login failed - no matching user found');
        alert('Username atau password salah!');
    }
}

function updateUIForUserRole() {
    if (!currentUser) return;
    
    const isOwner = currentUser.role === 'owner';
    const isAdmin = currentUser.role === 'admin';
    const isSales = currentUser.role === 'sales';
    const isGudang = currentUser.role === 'gudang';
    
    // Update user info in sidebar
    const sidebarUserInfo = document.getElementById('sidebarUserInfo');
    if (sidebarUserInfo) {
        sidebarUserInfo.textContent = 
            `${currentUser.fullName} (${currentUser.role.toUpperCase()})`;
    }
    
    // Update mobile header
    const mobileUserRole = document.getElementById('mobileUserRole');
    if (mobileUserRole) {
        mobileUserRole.textContent = 
            `${currentUser.role.toUpperCase()} Dashboard`;
    }
    
    const dashboardSubtitle = document.getElementById('dashboardSubtitle');
    if (dashboardSubtitle) {
        dashboardSubtitle.textContent = 
            `Dashboard ${currentUser.role.toUpperCase()} - Ringkasan lengkap`;
    }
    
    // Show/hide owner-only elements
    document.querySelectorAll('.owner-only').forEach(el => {
        el.classList.toggle('hidden', !isOwner);
    });
    
    // Control button access
    const addUserBtn = document.getElementById('addUserBtn');
    if (addUserBtn) {
        addUserBtn.style.display = (isOwner || isAdmin) ? 'block' : 'none';
    }
    
    const addProductBtn = document.getElementById('addProductBtn');
    if (addProductBtn) {
        addProductBtn.style.display = (isOwner || isAdmin || isGudang) ? 'block' : 'none';
    }
    
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.style.display = (isOwner || isAdmin || isSales) ? 'block' : 'none';
    }
    
    // Update sync status
    const sidebarSyncStatus = document.getElementById('sidebarSyncStatus');
    if (sidebarSyncStatus) {
        sidebarSyncStatus.className = 'sync-status sync-online';
        sidebarSyncStatus.innerHTML = 
            `<i class="fas fa-circle me-1"></i>Connected as ${currentUser.role.toUpperCase()}`;
    }
}

// ===== DATA LOADING =====
function loadDataForCurrentPage() {
    const currentPageElement = document.querySelector('.page-content:not(.hidden)');
    if (!currentPageElement) return;
    
    const currentPage = currentPageElement.id.replace('Page', '');
    
    console.log('Loading data for page:', currentPage);
    
    switch(currentPage) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'productManagement':
            loadProductData();
            break;
        case 'memberManagement':
            loadMemberData();
            break;
        case 'userManagement':
            loadUserData();
            break;
        case 'financialReports':
            loadFinancialData();
            break;
        case 'salesHistory':
            loadSalesHistory();
            break;
    }
}

function loadDashboardData() {
    console.log('Loading dashboard data...');
    
    // Update stat cards dengan data real
    const todayVisits = appData.visits.filter(v => {
        const today = new Date().toDateString();
        return new Date(v.date).toDateString() === today && v.status === 'success';
    });
    
    const statCard1 = document.getElementById('statSalesToday');
    if (statCard1) {
        statCard1.textContent = todayVisits.length || '0';
    }
    
    const totalRevenue = todayVisits.reduce((total, visit) => {
        const product = appData.products.find(p => p.id === visit.product);
        return total + (product ? product.price * visit.quantity : 0);
    }, 0);
    
    const statCard2 = document.getElementById('statRevenueToday');
    if (statCard2) {
        statCard2.textContent = formatCurrencyShort(totalRevenue);
    }
    
    const todayAllVisits = appData.visits.filter(v => {
        const today = new Date().toDateString();
        return new Date(v.date).toDateString() === today;
    });
    
    const statCard3 = document.getElementById('statVisitsToday');
    if (statCard3) {
        statCard3.textContent = todayAllVisits.length || '0';
    }
    
    const lowStockCount = appData.products.filter(p => p.stock <= p.minStock).length;
    
    const statCard4 = document.getElementById('statLowStock');
    if (statCard4) {
        statCard4.textContent = lowStockCount || '0';
    }
}

function loadProductData() {
    const tbody = document.getElementById('productTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = appData.products.map(product => `
        <tr>
            <td>${product.code}</td>
            <td>
                <div class="barcode-container">
                    <svg class="barcode" jsbarcode-value="${product.barcode}" jsbarcode-height="40" jsbarcode-width="2"></svg>
                </div>
            </td>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>
                <span class="${product.stock <= product.minStock ? 'text-danger fw-bold' : ''}">
                    ${product.stock}
                </span>
            </td>
            <td>
                <span class="badge ${product.status === 'active' ? 'bg-success' : 'bg-secondary'}">
                    ${product.status === 'active' ? 'Aktif' : 'Nonaktif'}
                </span>
                ${product.stock <= product.minStock ? '<span class="badge bg-warning ms-1">Stok Menipis</span>' : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning clickable" onclick="editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info clickable" onclick="viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin') ? `
                    <button class="btn btn-sm btn-danger clickable" onclick="deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
    
    // Initialize barcodes
    if (typeof JsBarcode !== 'undefined') {
        JsBarcode(".barcode").init();
    } else {
        console.warn('JsBarcode library not loaded');
    }
}

function loadMemberData() {
    const tbody = document.getElementById('memberTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = appData.members.map(member => `
        <tr>
            <td>${member.id}</td>
            <td>${member.name}</td>
            <td><span class="badge member-badge badge-${member.type}">${member.type.toUpperCase()}</span></td>
            <td>${member.phone}</td>
            <td class="text-truncate" style="max-width: 200px;" title="${member.address}">${member.address}</td>
            <td>
                ${member.lat && member.lng ? 
                    `<a href="https://maps.google.com/?q=${member.lat},${member.lng}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-map-marker-alt"></i> Lihat Peta
                    </a>` : 
                    '<span class="text-muted">Tidak ada</span>'
                }
            </td>
            <td><span class="badge ${member.status === 'active' ? 'bg-success' : 'bg-secondary'}">${member.status === 'active' ? 'Aktif' : 'Nonaktif'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-warning clickable" onclick="editMember('${member.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info clickable" onclick="viewMember('${member.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-primary clickable" onclick="contactMember('${member.id}')">
                        <i class="fas fa-phone"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Update member map
    updateMemberMap();
}

function loadUserData() {
    const tbody = document.getElementById('userTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = appData.users.map(user => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    ${user.role === 'owner' ? '<i class="fas fa-crown text-warning me-2" title="Owner"></i>' : ''}
                    <strong>${user.username}</strong>
                </div>
            </td>
            <td>${user.fullName}</td>
            <td><span class="badge badge-${user.role}">${user.role.toUpperCase()}</span></td>
            <td><span class="badge bg-success">Aktif</span></td>
            <td>${user.lastLogin}</td>
            <td>
                <div class="action-buttons">
                    ${user.role !== 'owner' ? `
                    <button class="btn btn-sm btn-warning clickable" onclick="editUser('${user.username}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-info clickable" onclick="resetPassword('${user.username}')">
                        <i class="fas fa-key"></i>
                    </button>
                    ${currentUser && currentUser.role === 'owner' ? `
                    <button class="btn btn-sm btn-danger clickable" onclick="deleteUser('${user.username}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                    ` : '<span class="text-muted">Cannot be modified</span>'}
                </div>
            </td>
        </tr>
    `).join('');
}

function loadSalesHistory() {
    const tbody = document.getElementById('visitTableBody');
    if (!tbody) return;
    
    // Filter visits berdasarkan user role
    let visitsToShow = appData.visits;
    if (currentUser && currentUser.role === 'sales') {
        visitsToShow = appData.visits.filter(v => v.salesPerson === currentUser.fullName);
    }
    
    tbody.innerHTML = visitsToShow.map(visit => {
        const product = appData.products.find(p => p.id === visit.product);
        return `
        <tr>
            <td>${visit.date}</td>
            <td>${visit.storeName}</td>
            <td>
                ${visit.lat && visit.lng ? 
                    `<a href="https://maps.google.com/?q=${visit.lat},${visit.lng}" target="_blank" class="btn btn-sm btn-outline-primary">
                        <i class="fas fa-map-marker-alt"></i> Lihat Lokasi
                    </a>` : 
                    '<span class="text-muted">Tidak ada</span>'
                }
            </td>
            <td>${product ? product.name : 'Produk tidak ditemukan'}</td>
            <td>${visit.quantity}</td>
            <td>
                <span class="badge ${visit.status === 'success' ? 'bg-success' : visit.status === 'followup' ? 'bg-warning' : 'bg-danger'}">
                    ${visit.status === 'success' ? 'Berhasil' : visit.status === 'followup' ? 'Follow Up' : 'Batal'}
                </span>
            </td>
            <td>${visit.salesPerson}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-sm btn-info clickable" onclick="viewVisitDetails('${visit.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${currentUser && (currentUser.role === 'owner' || currentUser.role === 'admin') ? `
                    <button class="btn btn-sm btn-danger clickable" onclick="deleteVisit('${visit.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `}).join('');
}

function loadFinancialData() {
    console.log('Loading financial data...');
    // Implementasi untuk memuat data keuangan
}

// ===== DASHBOARD FUNCTIONS =====
function initializeCharts() {
    // Sales Chart
    const salesCtx = document.getElementById('salesChart');
    if (salesCtx) {
        try {
            new Chart(salesCtx, {
                type: 'line',
                data: {
                    labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
                    datasets: [{
                        label: 'Penjualan',
                        data: [12000000, 19000000, 15000000, 25000000, 22000000, 30000000, 28000000],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback: function(value) {
                                    return 'Rp ' + (value / 1000000).toLocaleString('id-ID') + ' JT';
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error initializing chart:', error);
        }
    }
}

function refreshDashboard() {
    alert('Memperbarui data dashboard...');
    loadDashboardData();
}

function exportDashboard() {
    const dataStr = JSON.stringify(appData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    alert('Data dashboard berhasil diexport!');
}

function updateSalesChart(period) {
    alert(`Memperbarui chart dengan data: ${period}`);
    // Implementasi update chart berdasarkan periode
}

// ===== VISIT FORM FUNCTIONS =====
function getCurrentLocation() {
    if (navigator.geolocation) {
        const locationStatus = document.getElementById('locationStatus');
        if (locationStatus) {
            locationStatus.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Mengambil lokasi...';
        }
        
        navigator.geolocation.getCurrentPosition(
            function(position) {
                appData.currentLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                const locationContainer = document.getElementById('locationContainer');
                if (locationContainer) {
                    locationContainer.classList.add('active');
                }
                
                if (locationStatus) {
                    locationStatus.innerHTML = 
                        `<i class="fas fa-check-circle text-success me-2"></i>Lokasi berhasil diambil! 
                        (${appData.currentLocation.lat.toFixed(6)}, ${appData.currentLocation.lng.toFixed(6)})`;
                }
                
                // Enable submit button
                const submitVisitBtn = document.getElementById('submitVisitBtn');
                if (submitVisitBtn) {
                    submitVisitBtn.disabled = false;
                }
            },
            function(error) {
                let errorMessage = 'Error mengambil lokasi: ';
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage += "Izin lokasi ditolak";
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage += "Informasi lokasi tidak tersedia";
                        break;
                    case error.TIMEOUT:
                        errorMessage += "Permintaan lokasi timeout";
                        break;
                    default:
                        errorMessage += "Error tidak diketahui";
                        break;
                }
                
                if (locationStatus) {
                    locationStatus.innerHTML = 
                        `<i class="fas fa-exclamation-triangle text-danger me-2"></i>${errorMessage}`;
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        alert('Geolocation tidak didukung browser ini');
    }
}

function saveVisit() {
    if (!appData.currentLocation) {
        alert('Harus mengambil lokasi terlebih dahulu sebelum menyimpan kunjungan!');
        return;
    }

    const storeName = document.getElementById('storeName');
    const storeOwner = document.getElementById('storeOwner');
    const storePhone = document.getElementById('storePhone');
    const storeAddress = document.getElementById('storeAddress');
    const visitProduct = document.getElementById('visitProduct');
    const visitQuantity = document.getElementById('visitQuantity');
    const visitStatus = document.getElementById('visitStatus');
    const visitNotes = document.getElementById('visitNotes');

    if (!storeName || !storeOwner || !storePhone || !storeAddress || !visitProduct || !visitQuantity || !visitStatus) {
        alert('Semua field wajib diisi!');
        return;
    }

    const visitData = {
        id: 'VIS-' + Date.now(),
        storeName: storeName.value,
        storeOwner: storeOwner.value,
        storePhone: storePhone.value,
        storeAddress: storeAddress.value,
        product: visitProduct.value,
        quantity: parseInt(visitQuantity.value),
        status: visitStatus.value,
        notes: visitNotes.value,
        date: new Date().toLocaleString('id-ID'),
        salesPerson: currentUser ? currentUser.fullName : 'Unknown',
        lat: appData.currentLocation.lat,
        lng: appData.currentLocation.lng
    };

    appData.visits.push(visitData);
    
    // Reset form
    const visitForm = document.getElementById('visitForm');
    if (visitForm) {
        visitForm.reset();
    }
    
    appData.currentLocation = null;
    
    const locationContainer = document.getElementById('locationContainer');
    if (locationContainer) {
        locationContainer.classList.remove('active');
    }
    
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) {
        locationStatus.innerHTML = '';
    }
    
    const submitVisitBtn = document.getElementById('submitVisitBtn');
    if (submitVisitBtn) {
        submitVisitBtn.disabled = true;
    }
    
    alert('Kunjungan berhasil disimpan!');
    showPage('salesHistory');
    saveToLocalStorage();
}

function resetVisitForm() {
    const visitForm = document.getElementById('visitForm');
    if (visitForm) {
        visitForm.reset();
    }
    
    appData.currentLocation = null;
    
    const locationContainer = document.getElementById('locationContainer');
    if (locationContainer) {
        locationContainer.classList.remove('active');
    }
    
    const locationStatus = document.getElementById('locationStatus');
    if (locationStatus) {
        locationStatus.innerHTML = '';
    }
    
    const submitVisitBtn = document.getElementById('submitVisitBtn');
    if (submitVisitBtn) {
        submitVisitBtn.disabled = true;
    }
}

function scanBarcode() {
    alert('Fitur scan barcode akan menggunakan kamera perangkat. Fitur ini memerlukan akses kamera.');
    // Implementasi scan barcode akan memerlukan library tambahan seperti QuaggaJS atau menggunakan API kamera
}

function showVisitHistory() {
    showPage('salesHistory');
}

function showVisitForm() {
    showPage('visitForm');
}

function viewVisitDetails(visitId) {
    const visit = appData.visits.find(v => v.id === visitId);
    if (visit) {
        const product = appData.products.find(p => p.id === visit.product);
        alert(`Detail Kunjungan:\n\n` +
              `ID: ${visit.id}\n` +
              `Tanggal: ${visit.date}\n` +
              `Toko: ${visit.storeName}\n` +
              `Pemilik: ${visit.storeOwner}\n` +
              `Telepon: ${visit.storePhone}\n` +
              `Alamat: ${visit.storeAddress}\n` +
              `Produk: ${product ? product.name : 'Tidak ditemukan'}\n` +
              `Jumlah: ${visit.quantity}\n` +
              `Status: ${visit.status === 'success' ? 'Berhasil' : visit.status === 'followup' ? 'Follow Up' : 'Batal'}\n` +
              `Catatan: ${visit.notes || 'Tidak ada'}\n` +
              `Lokasi: ${visit.lat ? `${visit.lat}, ${visit.lng}` : 'Tidak ada'}\n` +
              `Sales: ${visit.salesPerson}`);
    }
}

function deleteVisit(visitId) {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
        alert('Hanya OWNER dan ADMIN yang dapat menghapus kunjungan!');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus kunjungan ini?')) {
        appData.visits = appData.visits.filter(v => v.id !== visitId);
        alert('Kunjungan berhasil dihapus!');
        loadSalesHistory();
        saveToLocalStorage();
    }
}

function exportVisitsData() {
    const visitsData = appData.visits.map(visit => {
        const product = appData.products.find(p => p.id === visit.product);
        return {
            'Tanggal': visit.date,
            'Nama Toko': visit.storeName,
            'Pemilik': visit.storeOwner,
            'Telepon': visit.storePhone,
            'Alamat': visit.storeAddress,
            'Produk': product ? product.name : 'Tidak ditemukan',
            'Jumlah': visit.quantity,
            'Status': visit.status === 'success' ? 'Berhasil' : visit.status === 'followup' ? 'Follow Up' : 'Batal',
            'Catatan': visit.notes || 'Tidak ada',
            'Lokasi': visit.lat ? `${visit.lat}, ${visit.lng}` : 'Tidak ada',
            'Sales': visit.salesPerson
        };
    });
    
    const csv = convertToCSV(visitsData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kunjungan-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    alert('Data kunjungan berhasil diexport!');
}

// ===== PRODUCT MANAGEMENT FUNCTIONS =====
function showAddProductModal() {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin' && currentUser.role !== 'gudang')) {
        alert('Anda tidak memiliki akses untuk menambah produk!');
        return;
    }
    
    // Generate product code automatically
    const nextId = appData.products.length + 1;
    const productCode = document.getElementById('productCode');
    if (productCode) {
        productCode.value = `PRD-${nextId.toString().padStart(3, '0')}`;
    }
    
    const modalElement = document.getElementById('addProductModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function generateBarcode() {
    const productCode = document.getElementById('productCode');
    if (!productCode || !productCode.value) {
        alert('Harap isi kode produk terlebih dahulu!');
        return;
    }

    if (typeof JsBarcode !== 'undefined') {
        JsBarcode("#barcode", productCode.value, {
            format: "CODE128",
            width: 2,
            height: 40,
            displayValue: true
        });
    } else {
        alert('Library barcode belum dimuat!');
    }
}

function saveNewProduct() {
    const productCode = document.getElementById('productCode');
    if (!productCode || !productCode.value) {
        alert('Kode produk harus diisi!');
        return;
    }

    const productName = document.getElementById('productName');
    const productCategory = document.getElementById('productCategory');
    const productPrice = document.getElementById('productPrice');
    const productStock = document.getElementById('productStock');

    if (!productName || !productCategory || !productPrice || !productStock) {
        alert('Semua field harus diisi!');
        return;
    }

    const productData = {
        id: 'PRD-' + Date.now(),
        code: productCode.value,
        name: productName.value,
        category: productCategory.value,
        price: parseInt(productPrice.value),
        stock: parseInt(productStock.value),
        minStock: 10,
        status: 'active',
        barcode: productCode.value
    };

    appData.products.push(productData);
    
    const modalElement = document.getElementById('addProductModal');
    if (modalElement) {
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
    }
    
    const addProductForm = document.getElementById('addProductForm');
    if (addProductForm) {
        addProductForm.reset();
    }
    
    alert('Produk berhasil ditambahkan!');
    loadProductData();
    saveToLocalStorage();
}

function editProduct(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (product) {
        const newPrice = prompt('Masukkan harga baru:', product.price);
        if (newPrice !== null && !isNaN(newPrice)) {
            product.price = parseInt(newPrice);
            alert('Harga produk berhasil diupdate!');
            loadProductData();
            saveToLocalStorage();
        }
    }
}

function viewProduct(productId) {
    const product = appData.products.find(p => p.id === productId);
    if (product) {
        alert(`Detail Produk:\n\nKode: ${product.code}\nNama: ${product.name}\nKategori: ${product.category}\nHarga: ${formatCurrency(product.price)}\nStok: ${product.stock}\nStatus: ${product.status}`);
    }
}

function deleteProduct(productId) {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
        alert('Hanya OWNER dan ADMIN yang dapat menghapus produk!');
        return;
    }
    
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
        appData.products = appData.products.filter(p => p.id !== productId);
        alert('Produk berhasil dihapus!');
        loadProductData();
        saveToLocalStorage();
    }
}

// ===== MEMBER MANAGEMENT FUNCTIONS =====
function initializeMemberMap() {
    const mapElement = document.getElementById('memberLocationMap');
    if (mapElement && typeof L !== 'undefined') {
        memberMap = L.map('memberLocationMap').setView([-6.2088, 106.8456], 10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(memberMap);
    }
}

function updateMemberMap() {
    if (!memberMap) return;
    
    // Clear existing markers
    if (memberLocationMarker) {
        memberMap.removeLayer(memberLocationMarker);
    }
    
    // Clear all existing markers
    memberMap.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            memberMap.removeLayer(layer);
        }
    });
    
    // Add markers for each member
    appData.members.forEach(member => {
        if (member.lat && member.lng) {
            const marker = L.marker([member.lat, member.lng]).addTo(memberMap);
            marker.bindPopup(`<b>${member.name}</b><br>${member.address}`);
        }
    });
    
    // Fit map to show all markers
    const markers = appData.members
        .filter(m => m.lat && m.lng)
        .map(m => L.marker([m.lat, m.lng]));
    
    if (markers.length > 0) {
        const group = new L.featureGroup(markers);
        memberMap.fitBounds(group.getBounds().pad(0.1));
    }
}

function showAddMemberModal() {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin' && currentUser.role !== 'sales')) {
        alert('Anda tidak memiliki akses untuk menambah member!');
        return;
    }
    
    const modalElement = document.getElementById('addMemberModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function getMemberLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                // Update map
                if (memberMap) {
                    memberMap.setView([lat, lng], 15);
                    
                    // Add/update marker
                    if (memberLocationMarker) {
                        memberMap.removeLayer(memberLocationMarker);
                    }
                    
                    memberLocationMarker = L.marker([lat, lng]).addTo(memberMap);
                    memberLocationMarker.bindPopup("Lokasi Member Baru").openPopup();
                    
                    // Store coordinates for saving
                    const addMemberModal = document.getElementById('addMemberModal');
                    if (addMemberModal) {
                        addMemberModal.dataset.tempLat = lat;
                        addMemberModal.dataset.tempLng = lng;
                    }
                    
                    alert(`Lokasi berhasil diambil: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                }
            },
            function(error) {
                alert('Error mengambil lokasi: ' + error.message);
            }
        );
    } else {
        alert('Geolocation tidak didukung browser ini');
    }
}

function saveNewMember() {
    const memberName = document.getElementById('memberName');
    const memberType = document.getElementById('memberType');
    const memberPhone = document.getElementById('memberPhone');
    const memberEmail = document.getElementById('memberEmail');
    const memberAddress = document.getElementById('memberAddress');

    if (!memberName || !memberType || !memberPhone || !memberAddress) {
        alert('Semua field wajib diisi!');
        return;
    }

    const addMemberModal = document.getElementById('addMemberModal');
    const tempLat = addMemberModal ? parseFloat(addMemberModal.dataset.tempLat) : null;
    const tempLng = addMemberModal ? parseFloat(addMemberModal.dataset.tempLng) : null;

    const memberData = {
        id: 'M' + (appData.members.length + 1).toString().padStart(3, '0'),
        name: memberName.value,
        type: memberType.value,
        phone: memberPhone.value,
        email: memberEmail ? memberEmail.value : '',
        address: memberAddress.value,
        lat: tempLat || null,
        lng: tempLng || null,
        status: 'active'
    };

    appData.members.push(memberData);
    
    if (addMemberModal) {
        const modal = bootstrap.Modal.getInstance(addMemberModal);
        if (modal) {
            modal.hide();
        }
        
        // Clear temporary location data
        delete addMemberModal.dataset.tempLat;
        delete addMemberModal.dataset.tempLng;
    }
    
    const addMemberForm = document.getElementById('addMemberForm');
    if (addMemberForm) {
        addMemberForm.reset();
    }
    
    alert('Member berhasil ditambahkan!');
    loadMemberData();
    saveToLocalStorage();
}

function editMember(memberId) {
    const member = appData.members.find(m => m.id === memberId);
    if (member) {
        const newPhone = prompt('Masukkan nomor telepon baru:', member.phone);
        if (newPhone !== null) {
            member.phone = newPhone;
            alert('Nomor telepon member berhasil diupdate!');
            loadMemberData();
            saveToLocalStorage();
        }
    }
}

function viewMember(memberId) {
    const member = appData.members.find(m => m.id === memberId);
    if (member) {
        alert(`Detail Member:\n\nID: ${member.id}\nNama: ${member.name}\nTipe: ${member.type}\nTelepon: ${member.phone}\nEmail: ${member.email || 'Tidak ada'}\nAlamat: ${member.address}\nStatus: ${member.status}`);
    }
}

function contactMember(memberId) {
    const member = appData.members.find(m => m.id === memberId);
    if (member) {
        if (confirm(`Hubungi ${member.name} di ${member.phone}?`)) {
            window.open(`tel:${member.phone}`, '_blank');
        }
    }
}

// ===== USER MANAGEMENT FUNCTIONS =====
function showAddUserModal() {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
        alert('Anda tidak memiliki akses untuk menambah user!');
        return;
    }
    alert('Fitur tambah user akan segera tersedia!');
}

function editUser(username) {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
        alert('Anda tidak memiliki akses untuk mengedit user!');
        return;
    }
    
    const user = appData.users.find(u => u.username === username);
    if (user) {
        const newName = prompt('Masukkan nama lengkap baru:', user.fullName);
        if (newName !== null) {
            user.fullName = newName;
            alert('Data user berhasil diupdate!');
            loadUserData();
            saveToLocalStorage();
        }
    }
}

function resetPassword(username) {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
        alert('Anda tidak memiliki akses untuk reset password!');
        return;
    }
    
    if (confirm(`Reset password untuk user ${username}?`)) {
        const user = appData.users.find(u => u.username === username);
        if (user) {
            user.password = '123456'; // Reset to default
            alert(`Password berhasil direset!\nUsername: ${username}\nPassword baru: 123456`);
            saveToLocalStorage();
        }
    }
}

function deleteUser(username) {
    if (!currentUser || currentUser.role !== 'owner') {
        alert('Hanya OWNER yang dapat menghapus user!');
        return;
    }
    
    if (username === 'owner') {
        alert('User OWNER tidak dapat dihapus!');
        return;
    }
    
    if (confirm(`Hapus user ${username} secara permanen?`)) {
        appData.users = appData.users.filter(u => u.username !== username);
        alert(`User ${username} berhasil dihapus!`);
        loadUserData();
        saveToLocalStorage();
    }
}

// ===== OWNER SPECIFIC FUNCTIONS =====
function generateOwnerReport() {
    if (!currentUser || currentUser.role !== 'owner') {
        alert('Hanya OWNER yang dapat mengakses laporan ini!');
        return;
    }
    
    const reportData = {
        financialSummary: {
            totalRevenue: 125000000,
            totalProfit: 45000000,
            totalExpenses: 80000000,
            accountsReceivable: 15000000
        },
        salesPerformance: {
            topSales: 'Budi Santoso',
            bestProduct: 'Produk A',
            conversionRate: '68%'
        },
        systemHealth: {
            activeUsers: appData.users.length,
            totalTransactions: appData.visits.length,
            systemUptime: '99.8%'
        }
    };
    
    alert(`OWNER REPORT GENERATED!\n\n` +
          `Financial Summary:\n` +
          `- Total Revenue: ${formatCurrency(reportData.financialSummary.totalRevenue)}\n` +
          `- Total Profit: ${formatCurrency(reportData.financialSummary.totalProfit)}\n` +
          `- Total Expenses: ${formatCurrency(reportData.financialSummary.totalExpenses)}\n` +
          `- Accounts Receivable: ${formatCurrency(reportData.financialSummary.accountsReceivable)}\n\n` +
          `Sales Performance:\n` +
          `- Top Sales: ${reportData.salesPerformance.topSales}\n` +
          `- Best Product: ${reportData.salesPerformance.bestProduct}\n` +
          `- Conversion Rate: ${reportData.salesPerformance.conversionRate}\n\n` +
          `System Health:\n` +
          `- Active Users: ${reportData.systemHealth.activeUsers}\n` +
          `- Total Transactions: ${reportData.systemHealth.totalTransactions}\n` +
          `- System Uptime: ${reportData.systemHealth.systemUptime}`);
}

function showFinancialSummary() {
    if (!currentUser || currentUser.role !== 'owner') {
        alert('Hanya OWNER yang dapat mengakses laporan keuangan!');
        return;
    }
    showPage('financialReports');
}

function showPerformanceReport() {
    if (!currentUser || currentUser.role !== 'owner') {
        alert('Hanya OWNER yang dapat mengakses laporan performa!');
        return;
    }
    alert('Menampilkan laporan performa...');
}

function showSystemHealth() {
    if (!currentUser || currentUser.role !== 'owner') {
        alert('Hanya OWNER yang dapat mengakses system health!');
        return;
    }
    alert('Menampilkan system health...');
}

function exportFinancialReport() {
    // Simulate Excel export
    alert('Laporan keuangan berhasil diexport ke format Excel!');
}

function generatePDFReport() {
    // Simulate PDF generation
    alert('Laporan PDF berhasil dibuat!');
}

function sendEmailReport() {
    const email = prompt('Masukkan alamat email untuk mengirim laporan:');
    if (email) {
        alert(`Laporan keuangan telah dikirim ke ${email}`);
    }
}

// ===== UTILITY FUNCTIONS =====
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('loginPassword');
    const icon = document.querySelector('#loginPassword ~ .btn i');
    
    if (!passwordInput || !icon) return;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatCurrencyShort(amount) {
    if (amount >= 1000000) {
        return 'Rp ' + (amount / 1000000).toFixed(1) + ' JT';
    } else if (amount >= 1000) {
        return 'Rp ' + (amount / 1000).toFixed(1) + ' RB';
    } else {
        return formatCurrency(amount);
    }
}

function showNotifications() {
    const notifications = [
        'Order baru #ORD-0012 dari Toko Maju Jaya',
        'Stok Produk A menipis - sisa 15 unit',
        'Member baru terdaftar - Toko Sejahtera'
    ];
    
    alert('NOTIFICATIONS:\n\n' + notifications.map((n, i) => `${i + 1}. ${n}`).join('\n'));
}

function convertToCSV(objArray) {
    const array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
    let str = '';
    
    // Header row
    let line = '';
    for (let index in array[0]) {
        if (line != '') line += ',';
        line += index;
    }
    str += line + '\r\n';
    
    // Data rows
    for (let i = 0; i < array.length; i++) {
        let line = '';
        for (let index in array[i]) {
            if (line != '') line += ',';
            line += '"' + array[i][index] + '"';
        }
        str += line + '\r\n';
    }
    
    return str;
}

// ===== NAVIGATION =====
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error('Page not found:', pageName + 'Page');
    }
    
    // Update active menu
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.classList.remove('active');
    });
    
    const activeLink = document.querySelector(`[data-page="${pageName}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
        document.getElementById('sidebar').classList.remove('active');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }
    
    // Load data for the page
    loadDataForCurrentPage();
}

function loadFromLocalStorage() {
    const savedData = localStorage.getItem('rmd_monitoring_data');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            appData = { ...appData, ...parsedData };
            console.log('Data loaded from localStorage');
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
        }
    }
}

function saveToLocalStorage() {
    try {
        localStorage.setItem('rmd_monitoring_data', JSON.stringify(appData));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving data to localStorage:', error);
    }
}

// Auto-save data setiap 30 detik
setInterval(saveToLocalStorage, 30000);

// Initialize data on first load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        loadProductData();
        loadMemberData();
        loadUserData();
    });
} else {
    loadProductData();
    loadMemberData();
    loadUserData();
}

// Debug function to check system status
function debugSystem() {
    console.log('=== RMD SYSTEM DEBUG INFO ===');
    console.log('Current User:', currentUser);
    console.log('App Data:', appData);
    console.log('Local Storage:', localStorage.getItem('rmd_monitoring_data'));
    console.log('=============================');
}

// Expose debug function to global scope for testing
window.debugSystem = debugSystem;