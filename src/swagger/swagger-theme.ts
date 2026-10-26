/**
 * ==============================================================================
 * SWAGGER CUSTOM THEME: LIGHT MINIMALISM (NOTION / STRIPE / IMPECCABLE STYLE)
 * ==============================================================================
 */

export const SWAGGER_CUSTOM_CSS = `
/* --- ROOT VARIABLES (Design System Tokens) --- */
:root {
  --sw-bg: #f8fafc;
  --sw-card-bg: #ffffff;
  --sw-text-main: #0f172a;
  --sw-text-muted: #64748b;
  --sw-border: #e2e8f0;
  --sw-border-light: #f1f5f9;
  --sw-radius-sm: 6px;
  --sw-radius-md: 10px;
  --sw-radius-lg: 14px;
  --sw-shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
  --sw-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -2px rgba(0, 0, 0, 0.04);
  --sw-shadow-lg: 0 12px 24px -4px rgba(15, 23, 42, 0.08), 0 4px 8px -2px rgba(15, 23, 42, 0.03);

  /* Method Pastel Palette */
  --sw-get-bg: #f0fdf4;
  --sw-get-border: #bbf7d0;
  --sw-get-badge: #16a34a;
  
  --sw-post-bg: #eff6ff;
  --sw-post-border: #bfdbfe;
  --sw-post-badge: #2563eb;
  
  --sw-patch-bg: #fffbeb;
  --sw-patch-border: #fef3c7;
  --sw-patch-badge: #d97706;
  
  --sw-delete-bg: #fef2f2;
  --sw-delete-border: #fecaca;
  --sw-delete-badge: #dc2626;
  
  --sw-font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  --sw-font-mono: 'JetBrains Mono', 'Fira Code', Consolas, Menlo, Monaco, monospace;
}

/* --- GLOBAL RESETS & TYPOGRAPHY --- */
body {
  background-color: var(--sw-bg) !important;
  font-family: var(--sw-font-sans) !important;
  color: var(--sw-text-main) !important;
  -webkit-font-smoothing: antialiased;
}

.swagger-ui {
  font-family: var(--sw-font-sans) !important;
  color: var(--sw-text-main) !important;
}

/* ẨN HOÀN TOÀN THANH TOPBAR ĐEN CỦA SWAGGER */
.swagger-ui .topbar {
  display: none !important;
}

/* --- BANNER HEADER & TỰA ĐỀ DỰ ÁN (CENTERED) --- */
.swagger-ui .information-container {
  background: var(--sw-card-bg) !important;
  border-radius: var(--sw-radius-lg) !important;
  border: 1px solid var(--sw-border) !important;
  padding: 36px 36px 28px 36px !important;
  margin-top: 24px !important;
  margin-bottom: 24px !important;
  box-shadow: var(--sw-shadow-md) !important;
  text-align: center !important;
}

.swagger-ui .info {
  margin: 0 auto !important;
  text-align: center !important;
}

.swagger-ui .info .title {
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  text-align: center !important;
  font-family: var(--sw-font-sans) !important;
  font-weight: 800 !important;
  font-size: 32px !important;
  letter-spacing: -0.03em !important;
  color: var(--sw-text-main) !important;
  margin-bottom: 8px !important;
}

.swagger-ui .info .title small.version-stamp {
  background-color: #e0f2fe !important;
  color: #0369a1 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  padding: 4px 10px !important;
  border-radius: 9999px !important;
  margin-left: 12px !important;
  top: -2px !important;
}

.swagger-ui .info .description {
  text-align: center !important;
  margin-top: 14px !important;
}

.swagger-ui .info .description table {
  margin: 16px auto 0 auto !important;
  max-width: 680px !important;
  text-align: left !important;
  background-color: #ffffff !important;
}

.swagger-ui .info p, 
.swagger-ui .info li,
.swagger-ui .markdown p {
  color: var(--sw-text-muted) !important;
  line-height: 1.65 !important;
  font-size: 14.5px !important;
}

/* --- BẢNG THÔNG TIN REALTIME / MARKDOWN TABLES --- */
.swagger-ui .markdown table {
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border: 1px solid var(--sw-border) !important;
  border-radius: var(--sw-radius-md) !important;
  overflow: hidden !important;
  margin: 16px 0 !important;
  box-shadow: var(--sw-shadow-sm) !important;
}

.swagger-ui .markdown table thead tr th {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  text-transform: uppercase !important;
  letter-spacing: 0.04em !important;
  padding: 12px 16px !important;
  border-bottom: 1px solid var(--sw-border) !important;
  border-top: none !important;
}

.swagger-ui .markdown table tbody tr td {
  padding: 12px 16px !important;
  border-bottom: 1px solid var(--sw-border-light) !important;
  color: #475569 !important;
  font-size: 14px !important;
}

.swagger-ui .markdown table tbody tr:last-child td {
  border-bottom: none !important;
}

.swagger-ui .markdown table code {
  font-family: var(--sw-font-mono) !important;
  background-color: #f1f5f9 !important;
  color: #0f172a !important;
  padding: 3px 6px !important;
  border-radius: 4px !important;
  font-size: 13px !important;
  border: 1px solid #e2e8f0 !important;
}

/* --- SERVERS DROPDOWN BAR --- */
.swagger-ui .scheme-container {
  background: var(--sw-card-bg) !important;
  border: 1px solid var(--sw-border) !important;
  border-radius: var(--sw-radius-md) !important;
  padding: 16px 24px !important;
  box-shadow: var(--sw-shadow-sm) !important;
  margin-bottom: 24px !important;
}

.swagger-ui .servers > label select {
  font-family: var(--sw-font-sans) !important;
  border: 1px solid var(--sw-border) !important;
  border-radius: var(--sw-radius-sm) !important;
  padding: 6px 12px !important;
  background-color: #ffffff !important;
  color: var(--sw-text-main) !important;
  font-weight: 500 !important;
  outline: none !important;
}

/* --- NÚT AUTHORIZE CHÍNH --- */
.swagger-ui .btn.authorize {
  background-color: #0f172a !important;
  border-color: #0f172a !important;
  color: #ffffff !important;
  border-radius: var(--sw-radius-sm) !important;
  font-weight: 600 !important;
  font-size: 13.5px !important;
  padding: 8px 18px !important;
  transition: all 0.2s ease !important;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
}

.swagger-ui .btn.authorize:hover {
  background-color: #1e293b !important;
  border-color: #1e293b !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1) !important;
}

.swagger-ui .btn.authorize svg {
  fill: #ffffff !important;
}

/* --- CÁC KHỐI TAG / NHÓM API --- */
.swagger-ui .opblock-tag-section {
  margin-bottom: 20px !important;
}

.swagger-ui .opblock-tag {
  font-family: var(--sw-font-sans) !important;
  font-weight: 700 !important;
  font-size: 18px !important;
  color: var(--sw-text-main) !important;
  border-bottom: 1px solid var(--sw-border) !important;
  padding: 12px 4px !important;
  margin-bottom: 12px !important;
}

.swagger-ui .opblock-tag small {
  color: var(--sw-text-muted) !important;
  font-weight: 400 !important;
  font-size: 13px !important;
  margin-left: 12px !important;
}

/* --- OPERATION CARDS (Minimal Modern Cards) --- */
.swagger-ui .opblock {
  border-radius: var(--sw-radius-md) !important;
  margin: 0 0 12px 0 !important;
  border: 1px solid var(--sw-border) !important;
  box-shadow: var(--sw-shadow-sm) !important;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1) !important;
  background: var(--sw-card-bg) !important;
  overflow: hidden !important;
}

.swagger-ui .opblock:hover {
  box-shadow: var(--sw-shadow-md) !important;
  border-color: #cbd5e1 !important;
}

.swagger-ui .opblock .opblock-summary {
  padding: 12px 18px !important;
}

/* GET Method */
.swagger-ui .opblock.opblock-get {
  background: #ffffff !important;
  border-left: 4px solid var(--sw-get-badge) !important;
}
.swagger-ui .opblock.opblock-get .opblock-summary-method {
  background-color: var(--sw-get-badge) !important;
  border-radius: var(--sw-radius-sm) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  padding: 5px 12px !important;
}

/* POST Method */
.swagger-ui .opblock.opblock-post {
  background: #ffffff !important;
  border-left: 4px solid var(--sw-post-badge) !important;
}
.swagger-ui .opblock.opblock-post .opblock-summary-method {
  background-color: var(--sw-post-badge) !important;
  border-radius: var(--sw-radius-sm) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  padding: 5px 12px !important;
}

/* PATCH Method */
.swagger-ui .opblock.opblock-patch {
  background: #ffffff !important;
  border-left: 4px solid var(--sw-patch-badge) !important;
}
.swagger-ui .opblock.opblock-patch .opblock-summary-method {
  background-color: var(--sw-patch-badge) !important;
  border-radius: var(--sw-radius-sm) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  padding: 5px 12px !important;
}

/* DELETE Method */
.swagger-ui .opblock.opblock-delete {
  background: #ffffff !important;
  border-left: 4px solid var(--sw-delete-badge) !important;
}
.swagger-ui .opblock.opblock-delete .opblock-summary-method {
  background-color: var(--sw-delete-badge) !important;
  border-radius: var(--sw-radius-sm) !important;
  font-size: 12px !important;
  font-weight: 700 !important;
  letter-spacing: 0.05em !important;
  padding: 5px 12px !important;
}

/* URL Path & Description trong Card */
.swagger-ui .opblock .opblock-summary-path {
  font-family: var(--sw-font-mono) !important;
  font-weight: 600 !important;
  font-size: 14px !important;
  color: var(--sw-text-main) !important;
}

.swagger-ui .opblock .opblock-summary-description {
  color: var(--sw-text-muted) !important;
  font-size: 13.5px !important;
  font-weight: 400 !important;
}

/* Body mở rộng khi click vào Operation */
.swagger-ui .opblock-body {
  background-color: #fafbfd !important;
  border-top: 1px solid var(--sw-border) !important;
  padding: 20px 24px !important;
}

/* --- BUTTONS & CONTROLS BÊN TRONG OPERATION --- */
.swagger-ui .btn.try-out__btn {
  background: #ffffff !important;
  border: 1px solid var(--sw-border) !important;
  border-radius: var(--sw-radius-sm) !important;
  color: #334155 !important;
  font-weight: 600 !important;
  padding: 6px 14px !important;
  font-size: 12.5px !important;
  box-shadow: var(--sw-shadow-sm) !important;
}

.swagger-ui .btn.execute {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: #ffffff !important;
  border-radius: var(--sw-radius-sm) !important;
  font-weight: 600 !important;
  font-size: 13px !important;
}

.swagger-ui .btn.cancel {
  border-radius: var(--sw-radius-sm) !important;
}

/* --- INPUTS & TEXTAREAS --- */
.swagger-ui input[type=text],
.swagger-ui textarea,
.swagger-ui select {
  font-family: var(--sw-font-sans) !important;
  border: 1px solid var(--sw-border) !important;
  border-radius: var(--sw-radius-sm) !important;
  background-color: #ffffff !important;
  padding: 8px 12px !important;
  color: var(--sw-text-main) !important;
  outline: none !important;
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.02) !important;
}

.swagger-ui input[type=text]:focus,
.swagger-ui textarea:focus,
.swagger-ui select:focus {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15) !important;
}

/* --- RESPONSE BLOCKS --- */
.swagger-ui .responses-inner {
  padding: 0 !important;
}

.swagger-ui .responses-table {
  border-collapse: separate !important;
  border-spacing: 0 !important;
  border-radius: var(--sw-radius-sm) !important;
}

.swagger-ui .highlight-code {
  border-radius: var(--sw-radius-sm) !important;
  overflow: hidden !important;
}

.swagger-ui .microlight {
  font-family: var(--sw-font-mono) !important;
  background-color: #0f172a !important;
  color: #f8fafc !important;
  border-radius: var(--sw-radius-sm) !important;
  padding: 14px 18px !important;
  font-size: 13px !important;
}

/* --- MODAL AUTHORIZE CAO CẤP --- */
.swagger-ui .dialog-ux .backdrop-ux {
  background: rgba(15, 23, 42, 0.45) !important;
  backdrop-filter: blur(4px) !important;
}

.swagger-ui .dialog-ux .modal-ux {
  background: #ffffff !important;
  border-radius: var(--sw-radius-lg) !important;
  box-shadow: var(--sw-shadow-lg) !important;
  border: 1px solid var(--sw-border) !important;
  max-width: 600px !important;
  padding: 24px !important;
}

.swagger-ui .dialog-ux .modal-ux-header {
  border-bottom: 1px solid var(--sw-border) !important;
  padding-bottom: 14px !important;
}

.swagger-ui .dialog-ux .modal-ux-header h3 {
  font-family: var(--sw-font-sans) !important;
  font-weight: 700 !important;
  color: var(--sw-text-main) !important;
  font-size: 20px !important;
}

.swagger-ui .dialog-ux .modal-ux-content {
  padding: 18px 0 !important;
}

/* --- THANH QUICK-AUTH NỔI BẬT ĐƯỢC CHÈN THÊM --- */
#swagger-quick-auth-bar {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px 20px;
  margin-bottom: 24px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.sqa-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sqa-title {
  font-weight: 700;
  font-size: 14px;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 6px;
}

.sqa-status-badge {
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 9999px;
  background-color: #f1f5f9;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.sqa-status-badge.active {
  background-color: #ecfdf5;
  color: #059669;
  border-color: #a7f3d0;
}

.sqa-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sqa-btn {
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 600;
  padding: 6px 13px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #334155;
  cursor: pointer;
  transition: all 0.15s ease;
}

.sqa-btn:hover {
  background-color: #f8fafc;
  border-color: #94a3b8;
  color: #0f172a;
}

.sqa-btn.admin {
  background-color: #eff6ff;
  border-color: #bfdbfe;
  color: #1d4ed8;
}
.sqa-btn.admin:hover {
  background-color: #dbeafe;
}

.sqa-btn.member {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
  color: #15803d;
}
.sqa-btn.member:hover {
  background-color: #dcfce7;
}

.sqa-btn.logout {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}
.sqa-btn.logout:hover {
  background-color: #fee2e2;
}

/* Selector trong Modal */
#modal-token-selector-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

#modal-token-selector-box label {
  font-weight: 600;
  font-size: 13px;
  color: #334155;
  display: block;
  margin-bottom: 6px;
}

#modal-token-select {
  width: 100%;
  padding: 8px 10px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #0f172a;
}

/* --- TOAST NOTIFICATIONS (Chuyên nghiệp & Tối giản) --- */
#swagger-toast-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 999999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.swagger-toast {
  pointer-events: auto;
  min-width: 290px;
  max-width: 440px;
  padding: 12px 18px;
  border-radius: 10px;
  background: #ffffff;
  color: #0f172a;
  font-family: var(--sw-font-sans, -apple-system, sans-serif);
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.5;
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06);
  display: flex;
  align-items: center;
  gap: 12px;
  animation: sw-toast-slide-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition: all 0.25s ease;
  border: 1px solid #e2e8f0;
}

.swagger-toast.hide {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

.swagger-toast-icon {
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.swagger-toast-success {
  border-left: 4px solid #10b981;
}
.swagger-toast-success .swagger-toast-icon {
  background-color: #ecfdf5;
  color: #059669;
}

.swagger-toast-error {
  border-left: 4px solid #ef4444;
}
.swagger-toast-error .swagger-toast-icon {
  background-color: #fef2f2;
  color: #dc2626;
}

.swagger-toast-info {
  border-left: 4px solid #3b82f6;
}
.swagger-toast-info .swagger-toast-icon {
  background-color: #eff6ff;
  color: #2563eb;
}

@keyframes sw-toast-slide-in {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
`;

/**
 * ==============================================================================
 * SWAGGER CUSTOM JAVASCRIPT: AUTO TOKEN CAPTURE & SELECTOR ENGINE
 * ==============================================================================
 */
export const SWAGGER_CUSTOM_JS = `
(function() {
  const STORAGE_KEY = 'scheduling_api_saved_tokens';

  // Lấy danh sách token đã lưu từ localStorage
  function getSavedTokens() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  }

  // Lưu danh sách token vào localStorage
  function saveTokens(tokens) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    updateQuickAuthUI();
  }

  // Thêm hoặc cập nhật một token
  function addOrUpdateToken(flagName, token, userEmail, userRole, tokenType = 'accessToken') {
    if (!token) return;
    const tokens = getSavedTokens();
    const existingIndex = tokens.findIndex(t => t.flagName === flagName);
    const item = {
      flagName,
      token,
      userEmail,
      userRole,
      tokenType,
      updatedAt: new Date().toLocaleTimeString('vi-VN')
    };
    if (existingIndex >= 0) {
      tokens[existingIndex] = item;
    } else {
      tokens.unshift(item);
    }
    saveTokens(tokens);
  }

  // Tự động Authorize token vào Swagger UI
  function applyTokenToSwagger(token, displayName = '') {
    if (!token) return;
    try {
      if (window.ui && typeof window.ui.preauthorizeApiKey === 'function') {
        window.ui.preauthorizeApiKey('JWT-auth', token);
      } else if (window.ui && window.ui.authActions && window.ui.authActions.authorize) {
        window.ui.authActions.authorize({
          'JWT-auth': {
            name: 'JWT-auth',
            schema: { type: 'http', scheme: 'bearer' },
            value: token
          }
        });
      }
      localStorage.setItem('scheduling_active_auth_label', displayName || 'Custom Token');
      updateQuickAuthUI();
      
      // Nếu modal đang mở, tự động điền vào input và đóng lại
      const input = document.querySelector('.swagger-ui .modal-ux input[aria-label="auth-bearer-value"]') ||
                    document.querySelector('.swagger-ui .modal-ux input[type="text"]');
      if (input) {
        input.value = token;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    } catch (err) {
      console.warn('[Swagger Auth Engine] Error applying token:', err);
    }
  }

  // Đăng xuất khỏi Swagger UI
  function logoutSwagger() {
    try {
      if (window.ui && window.ui.authActions && window.ui.authActions.logout) {
        window.ui.authActions.logout(['JWT-auth']);
      }
      localStorage.removeItem('scheduling_active_auth_label');
      updateQuickAuthUI();
    } catch (err) {
      console.warn('[Swagger Auth Engine] Error during logout:', err);
    }
  }

  // Hiển thị Toast Notification thay cho alert
  function showToast(message, type = 'success', duration = 3500) {
    let container = document.getElementById('swagger-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'swagger-toast-container';
      document.body.appendChild(container);
    }

    const icons = {
      success: '✓',
      error: '✕',
      info: 'ℹ'
    };

    const toast = document.createElement('div');
    toast.className = 'swagger-toast swagger-toast-' + type;
    toast.innerHTML = \`
      <div class="swagger-toast-icon">\${icons[type] || '•'}</div>
      <div style="flex: 1;">\${message}</div>
    \`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hide');
      setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) container.remove();
      }, 260);
    }, duration);
  }

  // Hook vào response của Swagger để Auto-Capture token khi Login/Register/Refresh
  const originalFetch = window.fetch;
  window.fetch = async function(...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const url = args[0] ? args[0].toString() : '';
      if (url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh')) {
        const clone = response.clone();
        clone.json().then(data => {
          if (data && data.success && data.data) {
            const body = data.data;
            const user = body.user || {};
            const email = user.email || 'user';
            const role = user.role || 'MEMBER';
            const username = email.split('@')[0];

            if (body.accessToken) {
              const flagName = username + '_accessToken (' + role + ')';
              addOrUpdateToken(flagName, body.accessToken, email, role, 'accessToken');
              // Tự động Authorize luôn ngay sau khi login thành công
              applyTokenToSwagger(body.accessToken, flagName);
              showToast('Đã tự động nạp quyền: ' + flagName, 'info');
            }
            if (body.refreshToken) {
              const flagName = username + '_refreshToken (' + role + ')';
              addOrUpdateToken(flagName, body.refreshToken, email, role, 'refreshToken');
            }
          }
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('[Swagger Token Capture] Hook error:', err);
    }
    return response;
  };

  // Nút Quick Login tiện lợi bằng API ngầm
  async function quickLogin(email, password, label) {
    try {
      const res = await originalFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data && data.success && data.data && data.data.accessToken) {
        const username = email.split('@')[0];
        const role = data.data.user?.role || 'MEMBER';
        const flagName = username + '_accessToken (' + role + ')';
        addOrUpdateToken(flagName, data.data.accessToken, email, role, 'accessToken');
        applyTokenToSwagger(data.data.accessToken, flagName);
        showToast('Đã đăng nhập thành công và nạp quyền: ' + label, 'success');
      } else {
        showToast('Đăng nhập thất bại: ' + (data.message || 'Lỗi không xác định'), 'error');
      }
    } catch (e) {
      showToast('Không thể kết nối máy chủ để đăng nhập: ' + e.message, 'error');
    }
  }

  // Cập nhật giao diện Quick Auth Bar ở trên đầu trang
  function updateQuickAuthUI() {
    let bar = document.getElementById('swagger-quick-auth-bar');
    if (!bar) {
      const container = document.querySelector('.swagger-ui .information-container');
      if (!container) return;
      bar = document.createElement('div');
      bar.id = 'swagger-quick-auth-bar';
      container.parentNode.insertBefore(bar, container.nextSibling);
    }

    const currentAuth = localStorage.getItem('scheduling_active_auth_label');
    const isAuthorized = !!currentAuth;

    bar.innerHTML = \`
      <div class="sqa-left">
        <span class="sqa-title"> Quick Token Authorize</span>
        <span class="sqa-status-badge \${isAuthorized ? 'active' : ''}">
          \${isAuthorized ? ' Đang nạp: ' + currentAuth : 'Chưa xác thực (Chưa có token)'}
        </span>
      </div>
      <div class="sqa-actions">
        <button class="sqa-btn admin" id="btn-quick-admin" title="Tự động login admin@example.com và cấp quyền">admin</button>
        <button class="sqa-btn member" id="btn-quick-m1" title="Tự động login member1@example.com và cấp quyền">member</button>
        <button class="sqa-btn member" id="btn-quick-m2" title="Tự động login member2@example.com và cấp quyền">memberthuhai</button>
        \${isAuthorized ? '<button class="sqa-btn logout" id="btn-quick-logout">Đăng xuất</button>' : ''}
      </div>
    \`;

    document.getElementById('btn-quick-admin')?.addEventListener('click', () => quickLogin('minhmhit.sgu@gmail.com', '123456', 'Admin'));
    document.getElementById('btn-quick-m1')?.addEventListener('click', () => quickLogin('nam@gmail.com', '123456', 'Member 1'));
    document.getElementById('btn-quick-m2')?.addEventListener('click', () => quickLogin('hai@gmail.com', '123456', 'Member 2'));
    document.getElementById('btn-quick-logout')?.addEventListener('click', () => {
      logoutSwagger();
      showToast('Đã đăng xuất khỏi Swagger UI', 'info');
    });
  }

  // Chèn Dropdown vào Modal Authorize khi người dùng mở modal
  function injectTokenSelectorIntoModal() {
    const modalContent = document.querySelector('.swagger-ui .dialog-ux .modal-ux-content');
    if (!modalContent || document.getElementById('modal-token-selector-box')) return;

    const tokens = getSavedTokens();
    const box = document.createElement('div');
    box.id = 'modal-token-selector-box';

    let optionsHtml = '<option value="">-- Chọn token vừa nhận được từ danh sách --</option>';
    tokens.forEach((t, index) => {
      optionsHtml += \`<option value="\${index}">[\${t.flagName}] - \${t.updatedAt}</option>\`;
    });

    box.innerHTML = \`
      <label for="modal-token-select"> Danh sách Token vừa nhận được (Lưu tự động):</label>
      <select id="modal-token-select">
        \${optionsHtml}
      </select>
      <div style="margin-top: 8px; display: flex; gap: 8px; justify-content: flex-end;">
        <button type="button" class="btn" style="padding: 4px 10px; font-size: 12px; background: #f1f5f9; border: 1px solid #cbd5e1;" id="btn-clear-saved-tokens">Xóa lịch sử token</button>
      </div>
    \`;

    // Chèn lên trước form input của Swagger
    modalContent.insertBefore(box, modalContent.firstChild);

    // Xử lý khi chọn từ dropdown
    document.getElementById('modal-token-select')?.addEventListener('change', function(e) {
      const idx = e.target.value;
      if (idx !== '' && tokens[idx]) {
        const selected = tokens[idx];
        const input = document.querySelector('.swagger-ui .modal-ux input[aria-label="auth-bearer-value"]') ||
                      document.querySelector('.swagger-ui .modal-ux input[type="text"]');
        if (input) {
          input.value = selected.token;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          showToast('Đã chọn token: ' + selected.flagName, 'info');
        }
      }
    });

    document.getElementById('btn-clear-saved-tokens')?.addEventListener('click', function() {
      if (confirm('Bạn có chắc muốn xóa danh sách token đã lưu?')) {
        saveTokens([]);
        box.remove();
        injectTokenSelectorIntoModal();
        showToast('Đã xóa sạch lịch sử token đã lưu', 'info');
      }
    });
  }

  // Theo dõi DOM để cập nhật Quick Auth Bar và Modal
  setInterval(() => {
    updateQuickAuthUI();
    if (document.querySelector('.swagger-ui .dialog-ux .modal-ux')) {
      injectTokenSelectorIntoModal();
    }
  }, 800);

})();
`;
