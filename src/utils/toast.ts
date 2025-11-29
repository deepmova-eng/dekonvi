// src/utils/toast.ts

type ToastType = 'success' | 'error' | 'info' | 'warning';

const icons = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠'
};

export function showToast(
  type: ToastType, 
  title: string, 
  message: string, 
  duration = 4000
) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconDiv = document.createElement('div');
  iconDiv.className = 'toast-icon';
  iconDiv.textContent = icons[type];

  const contentDiv = document.createElement('div');
  contentDiv.className = 'toast-content';

  const titleDiv = document.createElement('div');
  titleDiv.className = 'toast-title';
  titleDiv.textContent = title;

  const messageDiv = document.createElement('div');
  messageDiv.className = 'toast-message';
  messageDiv.textContent = message;

  contentDiv.appendChild(titleDiv);
  contentDiv.appendChild(messageDiv);
  
  toast.appendChild(iconDiv);
  toast.appendChild(contentDiv);

  const closeBtn = document.createElement('div');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×';
  closeBtn.onclick = () => toast.remove();
  toast.appendChild(closeBtn);

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-exit');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
