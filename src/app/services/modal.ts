// Thin wrappers around Bootstrap's modal API (loaded globally via angular.json scripts)
function instance(id: string) {
  const el = document.getElementById(id);
  const bs = (window as any).bootstrap;
  return el && bs ? bs.Modal.getOrCreateInstance(el) : null;
}

export function openModal(id: string) {
  instance(id)?.show();
}

export function closeModal(id: string) {
  instance(id)?.hide();
}
