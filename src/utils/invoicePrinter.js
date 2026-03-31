export function printInvoice() {
  window.print();
}

export function printTag() {
  window.print();
}

export function addPrintStyles(cssId, css) {
  if (!document.getElementById(cssId)) {
    const style = document.createElement('style');
    style.id = cssId;
    style.media = 'print';
    style.innerHTML = css;
    document.head.appendChild(style);
  }
}
