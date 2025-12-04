// ==================== STATE MANAGEMENT ====================
const state = {
  connected: false,
  currentPage: 'login',
  dbName: '',
  currentTable: null,
  currentModal: null
};

// ==================== API CLIENT ====================
const API = {
  baseURL: 'http://localhost:3000/api',

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      const data = await response.json();

      if (!response.ok && !data.success) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  connect: (credentials) => API.request('/connect', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  disconnect: () => API.request('/disconnect'),

  getDashboard: () => API.request('/dashboard'),

  getTables: () => API.request('/tables'),

  getTableInfo: (tableName) => API.request(`/tables/${tableName}/info`),

  getTableContent: (tableName, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return API.request(`/tables/${tableName}/content?${queryString}`);
  },

  executeQuery: (query, type) => API.request(`/query/${type}`, {
    method: 'POST',
    body: JSON.stringify({ query })
  })
};

// ==================== UI UTILITIES ====================
function showLoading() {
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

function showAlert(message, type = 'error') {
  return `<div class="alert alert-${type}">${message}</div>`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

// ==================== NAVIGATION ====================
function navigate(page) {
  state.currentPage = page;

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.dataset.page === page);
  });

  switch (page) {
    case 'dashboard':
      renderDashboard();
      break;
    case 'tables':
      renderTablesPage();
      break;
    case 'sql':
      renderSQLPlayground();
      break;
  }
}

// ==================== LOGIN PAGE ====================
function renderLoginPage() {
  const mainContent = document.getElementById('main-content');
  const navbar = document.getElementById('navbar');

  navbar.classList.add('hidden');

  mainContent.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <div class="login-icon"><img src="/icons/database.svg" class="icon" alt="Database"></div>
          <h1 class="login-title">Database Manager</h1>
          <p class="login-subtitle">Connect to your MySQL database</p>
        </div>
        
        <div id="loginAlert"></div>
        
        <form id="loginForm">
          <div class="form-group">
            <label class="form-label">Host</label>
            <input type="text" name="host" class="form-input" placeholder="localhost" value="localhost">
          </div>
          
          <div class="form-group">
            <label class="form-label">Username *</label>
            <input type="text" name="user" class="form-input" placeholder="root" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" name="password" class="form-input" placeholder="••••••••">
          </div>
          
          <div class="form-group">
            <label class="form-label">Database Name *</label>
            <input type="text" name="database" class="form-input" placeholder="my_database" required>
          </div>
          
          <button type="submit" class="btn btn-primary">
            <img src="/icons/plug.svg" class="icon" alt="Connect"> Connect to Database
          </button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('loginForm').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const credentials = {
    host: formData.get('host') || 'localhost',
    user: formData.get('user'),
    password: formData.get('password'),
    database: formData.get('database')
  };

  const alertDiv = document.getElementById('loginAlert');
  alertDiv.innerHTML = '';

  try {
    showLoading();
    const result = await API.connect(credentials);
    hideLoading();

    if (result.success) {
      state.connected = true;
      state.dbName = result.database;
      document.getElementById('navbar').classList.remove('hidden');
      document.getElementById('navDbName').textContent = `(${result.database})`;
      navigate('dashboard');
    }
  } catch (error) {
    hideLoading();
    alertDiv.innerHTML = showAlert(error.message);
  }
}

// ==================== DASHBOARD ====================
async function renderDashboard() {
  const mainContent = document.getElementById('main-content');

  mainContent.innerHTML = `
    <div class="page-header">
      <h1 class="page-title"><img src="/icons/dashboard.svg" class="icon icon-lg" alt="Dashboard" style="vertical-align: text-bottom; margin-right: 0.5rem;"> Dashboard</h1>
      <p class="page-subtitle">Database overview and statistics</p>
    </div>
    
    <div id="dashboardContent">
      <div class="stats-grid">
        <div class="stat-card"><div class="stat-header"><span class="stat-icon"><img src="/icons/table.svg" class="icon" alt="Tables"></span></div><div class="stat-label">Total Tables</div><div class="stat-value" id="statTables">-</div></div>
        <div class="stat-card"><div class="stat-header"><span class="stat-icon"><img src="/icons/storage.svg" class="icon" alt="Storage"></span></div><div class="stat-label">Database Size</div><div class="stat-value" id="statSize">-</div></div>
        <div class="stat-card"><div class="stat-header"><span class="stat-icon"><img src="/icons/ruler.svg" class="icon" alt="Size"></span></div><div class="stat-label">Avg Table Size</div><div class="stat-value" id="statAvgSize">-</div></div>
        <div class="stat-card"><div class="stat-header"><span class="stat-icon"><img src="/icons/key.svg" class="icon" alt="Keys"></span></div><div class="stat-label">Primary Keys</div><div class="stat-value" id="statPK">-</div></div>
        <div class="stat-card"><div class="stat-header"><span class="stat-icon"><img src="/icons/link.svg" class="icon" alt="Links"></span></div><div class="stat-label">Foreign Keys</div><div class="stat-value" id="statFK">-</div></div>
        <div class="stat-card"><div class="stat-header"><span class="stat-icon"><img src="/icons/index.svg" class="icon" alt="Indexes"></span></div><div class="stat-label">Total Indexes</div><div class="stat-value" id="statIndexes">-</div></div>
      </div>
      
      <div class="chart-container">
        <h3 class="chart-title">Table Size Distribution</h3>
        <canvas id="tableSizeChart" height="80"></canvas>
      </div>
    </div>
  `;

  try {
    showLoading();
    const result = await API.getDashboard();
    hideLoading();

    if (result.success) {
      const stats = result.stats;
      document.getElementById('statTables').textContent = formatNumber(stats.tableCount);
      document.getElementById('statSize').textContent = formatBytes(stats.totalSize);
      document.getElementById('statAvgSize').textContent = formatBytes(stats.avgSize);
      document.getElementById('statPK').textContent = formatNumber(stats.primaryKeyCount);
      document.getElementById('statFK').textContent = formatNumber(stats.foreignKeyCount);
      document.getElementById('statIndexes').textContent = formatNumber(stats.indexCount);
      renderTableSizeChart(stats.tableSizes);
    }
  } catch (error) {
    hideLoading();
    mainContent.innerHTML += showAlert(error.message);
  }
}

function renderTableSizeChart(tableSizes) {
  const ctx = document.getElementById('tableSizeChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: tableSizes.map(t => t.table_name || t.TABLE_NAME),
      datasets: [{
        label: 'Size (bytes)',
        data: tableSizes.map(t => t.size || t.SIZE || 0),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return `Size: ${formatBytes(context.raw)}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (value) { return formatBytes(value); },
            color: '#a0a0c0'
          },
          grid: { color: 'rgba(102, 126, 234, 0.1)' }
        },
        x: {
          ticks: { color: '#a0a0c0' },
          grid: { display: false }
        }
      }
    }
  });
}

// ==================== TABLES PAGE ====================
async function renderTablesPage() {
  const mainContent = document.getElementById('main-content');

  mainContent.innerHTML = `
    <div class="page-header">
      <h1 class="page-title"><img src="/icons/table.svg" class="icon icon-lg" alt="Tables" style="vertical-align: text-bottom; margin-right: 0.5rem;"> Tables</h1>
      <p class="page-subtitle">Browse and explore database tables</p>
    </div>
    <div id="tablesContent"></div>
  `;

  try {
    showLoading();
    const result = await API.getTables();
    hideLoading();

    if (result.success) {
      renderTableList(result.tables);
    }
  } catch (error) {
    hideLoading();
    document.getElementById('tablesContent').innerHTML = showAlert(error.message);
  }
}

function renderTableList(tables) {
  const tablesContent = document.getElementById('tablesContent');

  if (tables.length === 0) {
    tablesContent.innerHTML = '<p class="text-muted text-center">No tables found in this database.</p>';
    return;
  }

  const tableListHTML = tables.map(table => {
    const tableName = table.table_name || table.TABLE_NAME;
    const tableRows = table.table_rows || table.TABLE_ROWS || 0;
    const tableSize = table.size || table.SIZE || 0;
    const tableEngine = table.engine || table.ENGINE || 'N/A';

    return `
    <div class="table-item">
      <div class="table-info">
        <div class="table-name"><img src="/icons/file.svg" class="icon" alt="Table" style="vertical-align: sub; margin-right: 0.35rem;"> ${tableName}</div>
        <div class="table-meta">
          <span>Rows: ${formatNumber(tableRows)}</span>
          <span>Size: ${formatBytes(tableSize)}</span>
          <span>Engine: ${tableEngine}</span>
        </div>
      </div>
      <div class="table-actions">
        <button class="btn btn-sm btn-secondary" onclick="showTableInfo('${tableName}')"><img src="/icons/info.svg" class="icon" alt="Info"> Info</button>
        <button class="btn btn-sm btn-secondary" onclick="showTableContent('${tableName}')"><img src="/icons/content.svg" class="icon" alt="Content"> Content</button>
      </div>
    </div>
  `;
  }).join('');

  tablesContent.innerHTML = `<div class="table-list">${tableListHTML}</div>`;
}

// ==================== TABLE INFO MODAL ====================
async function showTableInfo(tableName) {
  try {
    showLoading();
    const result = await API.getTableInfo(tableName);
    hideLoading();

    if (result.success) {
      const { schema } = result;
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.id = 'tableInfoModal';

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Table Info: ${tableName}</h2>
            <button class="modal-close" onclick="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <h3 style="margin-bottom: 1rem;">Columns</h3>
            <div class="data-table-container">
              <table class="data-table">
                <thead>
                  <tr><th>Column Name</th><th>Data Type</th><th>Nullable</th><th>Key</th><th>Default</th><th>Extra</th></tr>
                </thead>
                <tbody>
                  ${schema.columns.map(col => `
                    <tr>
                      <td><strong>${col.COLUMN_NAME || col.column_name}</strong></td>
                      <td><code>${col.COLUMN_TYPE || col.column_type}</code></td>
                      <td>${(col.IS_NULLABLE || col.is_nullable) === 'YES' ? '<img src="/icons/check.svg" class="icon" alt="Yes" style="color: #10b981;">' : '<img src="/icons/x.svg" class="icon" alt="No" style="color: #ef4444;">'}</td>
                      <td>${(col.COLUMN_KEY || col.column_key) ? `<code>${col.COLUMN_KEY || col.column_key}</code>` : '-'}</td>
                      <td>${(col.COLUMN_DEFAULT !== null && col.COLUMN_DEFAULT !== undefined) ? col.COLUMN_DEFAULT : (col.column_default !== null && col.column_default !== undefined) ? col.column_default : '-'}</td>
                      <td>${col.EXTRA || col.extra || '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ${schema.indexes.length > 0 ? `
              <h3 style="margin: 2rem 0 1rem;">Indexes</h3>
              <div class="data-table-container">
                <table class="data-table">
                  <thead><tr><th>Index Name</th><th>Column</th><th>Unique</th></tr></thead>
                  <tbody>
                    ${schema.indexes.map(idx => `<tr><td><strong>${idx.INDEX_NAME || idx.index_name}</strong></td><td>${idx.COLUMN_NAME || idx.column_name}</td><td>${(idx.NON_UNIQUE !== undefined ? idx.NON_UNIQUE : idx.non_unique) == 0 ? 'Yes' : 'No'}</td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
            ${schema.foreignKeys.length > 0 ? `
              <h3 style="margin: 2rem 0 1rem;">Foreign Keys</h3>
              <div class="data-table-container">
                <table class="data-table">
                  <thead><tr><th>Constraint</th><th>Column</th><th>References</th></tr></thead>
                  <tbody>
                    ${schema.foreignKeys.map(fk => `<tr><td><strong>${fk.CONSTRAINT_NAME || fk.constraint_name}</strong></td><td>${fk.COLUMN_NAME || fk.column_name}</td><td>${fk.REFERENCED_TABLE_NAME || fk.referenced_table_name}.${fk.REFERENCED_COLUMN_NAME || fk.referenced_column_name}</td></tr>`).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
  } catch (error) {
    hideLoading();
    alert(error.message);
  }
}

// ==================== TABLE CONTENT ====================
async function showTableContent(tableName, page = 1) {
  try {
    showLoading();
    const result = await API.getTableContent(tableName, { page, limit: 50 });
    hideLoading();

    if (result.success) {
      const modal = document.createElement('div');
      modal.className = 'modal active';
      modal.id = 'tableContentModal';
      const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];

      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h2 class="modal-title">Table Content: ${tableName}</h2>
            <button class="modal-close" onclick="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            ${result.rows.length === 0 ? '<p class="text-muted text-center">No data in this table.</p>' : `
              <div class="data-table-container">
                <table class="data-table">
                  <thead><tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr></thead>
                  <tbody>
                    ${result.rows.map(row => `<tr>${columns.map(col => `<td>${row[col] !== null ? row[col] : '<span class="text-muted">NULL</span>'}</td>`).join('')}</tr>`).join('')}
                  </tbody>
                </table>
              </div>
              <div class="pagination">
                <button ${page === 1 ? 'disabled' : ''} onclick="closeModal(); showTableContent('${tableName}', ${page - 1})">← Previous</button>
                <span>Page ${page} of ${result.pagination.totalPages}</span>
                <button ${page >= result.pagination.totalPages ? 'disabled' : ''} onclick="closeModal(); showTableContent('${tableName}', ${page + 1})">Next →</button>
              </div>
            `}
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    }
  } catch (error) {
    hideLoading();
    alert(error.message);
  }
}

function closeModal() {
  document.querySelectorAll('.modal').forEach(modal => modal.remove());
}

// ==================== SQL PLAYGROUND ====================
function renderSQLPlayground() {
  const mainContent = document.getElementById('main-content');

  mainContent.innerHTML = `
    <div class="page-header">
      <h1 class="page-title"><img src="/icons/lightning.svg" class="icon icon-lg" alt="SQL" style="vertical-align: text-bottom; margin-right: 0.5rem;"> SQL Playground</h1>
      <p class="page-subtitle">Execute SQL queries directly</p>
    </div>
    
    <div class="tabs">
      <button class="tab active" data-tab="ddl" onclick="switchTab('ddl')">DDL</button>
      <button class="tab" data-tab="dml" onclick="switchTab('dml')">DML</button>
      <button class="tab" data-tab="dql" onclick="switchTab('dql')">DQL</button>
    </div>
    
    <div id="ddl-tab" class="tab-content active">
      <div class="sql-editor">
        <textarea id="ddl-query" class="sql-textarea" placeholder="-- Data Definition Language\nCREATE TABLE example (\n  id INT PRIMARY KEY AUTO_INCREMENT,\n  name VARCHAR(100)\n);"></textarea>
        <div class="sql-actions"><button class="btn btn-success" onclick="executeSQL('ddl')"><img src="/icons/play.svg" class="icon" alt="Execute"> Execute DDL</button></div>
      </div>
      <div id="ddl-result" class="sql-result"></div>
    </div>
    
    <div id="dml-tab" class="tab-content">
      <div class="sql-editor">
        <textarea id="dml-query" class="sql-textarea" placeholder="-- Data Manipulation Language\nINSERT INTO example (name) VALUES ('Test');\nUPDATE example SET name = 'Updated' WHERE id = 1;\nDELETE FROM example WHERE id = 1;"></textarea>
        <div class="sql-actions"><button class="btn btn-success" onclick="executeSQL('dml')"><img src="/icons/play.svg" class="icon" alt="Execute"> Execute DML</button></div>
      </div>
      <div id="dml-result" class="sql-result"></div>
    </div>
    
    <div id="dql-tab" class="tab-content">
      <div class="sql-editor">
        <textarea id="dql-query" class="sql-textarea" placeholder="-- Data Query Language\nSELECT * FROM categories;\nSELECT * FROM products WHERE price > 50;"></textarea>
        <div class="sql-actions"><button class="btn btn-success" onclick="executeSQL('dql')"><img src="/icons/play.svg" class="icon" alt="Execute"> Execute SELECT</button></div>
      </div>
      <div id="dql-result" class="sql-result"></div>
    </div>
  `;
}

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.tab === tabName);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
}

async function executeSQL(type) {
  const query = document.getElementById(`${type}-query`).value.trim();
  const resultDiv = document.getElementById(`${type}-result`);

  if (!query) {
    resultDiv.innerHTML = showAlert('Please enter a SQL query');
    return;
  }

  try {
    showLoading();
    const result = await API.executeQuery(query, type);
    hideLoading();

    if (result.success) {
      if (type === 'dql' && result.rows) {
        const columns = result.rows.length > 0 ? Object.keys(result.rows[0]) : [];
        resultDiv.innerHTML = showAlert(`Query returned ${result.rowCount} row(s)`, 'success') +
          (result.rows.length > 0 ? `
            <div class="data-table-container mt-2">
              <table class="data-table">
                <thead><tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr></thead>
                <tbody>
                  ${result.rows.map(row => `<tr>${columns.map(col => `<td>${row[col] !== null ? row[col] : '<span class="text-muted">NULL</span>'}</td>`).join('')}</tr>`).join('')}
                </tbody>
              </table>
            </div>
          ` : '');
      } else {
        resultDiv.innerHTML = showAlert(`✅ ${result.message}<br>Affected rows: ${result.affectedRows || 0}`, 'success');
      }
    } else {
      resultDiv.innerHTML = showAlert(`❌ Error: ${result.error || result.sqlMessage}`);
    }
  } catch (error) {
    hideLoading();
    resultDiv.innerHTML = showAlert(`❌ Error: ${error.message}`);
  }
}

// ==================== DISCONNECT ====================
async function handleDisconnect() {
  if (!confirm('Are you sure you want to disconnect?')) return;

  try {
    showLoading();
    await API.disconnect();
    hideLoading();
    state.connected = false;
    state.dbName = '';
    renderLoginPage();
  } catch (error) {
    hideLoading();
    alert(error.message);
  }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  renderLoginPage();

  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navigate(link.dataset.page);
    });
  });

  document.getElementById('disconnectBtn').addEventListener('click', handleDisconnect);
});

// Make functions globally accessible
window.navigate = navigate;
window.showTableInfo = showTableInfo;
window.showTableContent = showTableContent;
window.closeModal = closeModal;
window.switchTab = switchTab;
window.executeSQL = executeSQL;
