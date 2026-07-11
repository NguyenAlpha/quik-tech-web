import type { Order } from './types'
import { formatCurrency } from './utils'

function getStoreName(): string {
  try {
    const memberships = JSON.parse(localStorage.getItem('auth_memberships') ?? '[]')
    const storeId = localStorage.getItem('auth_store_id')
    for (const biz of memberships) {
      for (const store of biz.stores) {
        if (String(store.storeId) === storeId) return store.storeName
      }
    }
  } catch {}
  return 'Store'
}

export function printOrder(order: Order, customerName: string): void {
  const storeName = getStoreName()
  const date = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('vi-VN')
    : new Date().toLocaleDateString('vi-VN')

  const itemRows = order.items.map(item => `
    <tr>
      <td class="td-name">${item.productName}</td>
      <td class="td-center">${item.quantity}</td>
      <td class="td-right">${formatCurrency(item.unitPrice)}</td>
      ${item.discount > 0
        ? `<td class="td-right td-discount">-${item.discountType === 'PERCENT'
            ? `${item.discount}%`
            : formatCurrency(item.discount)}</td>`
        : '<td class="td-right td-muted">—</td>'}
      <td class="td-right td-bold">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('')

  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>Hóa đơn ${order.orderCode}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 13px;
      color: #111;
      background: #fff;
      padding: 32px 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 28px;
    }
    .store-name { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 {
      font-size: 17px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .invoice-meta p { color: #555; margin-bottom: 2px; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 20px 0; }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #888;
      margin-bottom: 3px;
    }
    .info-value { font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    thead tr { background: #f9fafb; }
    th {
      padding: 9px 12px;
      text-align: left;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #777;
      border-bottom: 2px solid #e5e7eb;
    }
    td { padding: 9px 12px; border-bottom: 1px solid #f3f4f6; vertical-align: middle; }
    .td-center { text-align: center; }
    .td-right  { text-align: right; }
    .td-bold   { font-weight: 600; }
    .td-muted  { color: #aaa; }
    .td-name   { max-width: 260px; }
    .td-discount { color: #059669; }
    .summary-wrap { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .summary { width: 300px; }
    .s-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 13px;
    }
    .s-label { color: #555; }
    .s-value { font-weight: 500; }
    .s-divider { border: none; border-top: 1px solid #e5e7eb; margin: 8px 0; }
    .s-total { font-size: 15px; font-weight: 700; padding: 6px 0; }
    .s-paid   { color: #059669; }
    .s-debt   { color: #dc2626; }
    .note { color: #666; font-style: italic; margin-bottom: 20px; }
    .footer {
      text-align: center;
      color: #aaa;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      margin-top: 8px;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 16mm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="store-name">${storeName}</div>
    </div>
    <div class="invoice-meta">
      <h2>Hóa đơn bán hàng</h2>
      <p>Số: <strong>${order.orderCode}</strong></p>
      <p>Ngày: ${date}</p>
    </div>
  </div>

  <hr>

  <div class="info-grid">
    <div>
      <div class="info-label">Khách hàng</div>
      <div class="info-value">${customerName}</div>
    </div>
    <div>
      <div class="info-label">Trạng thái</div>
      <div class="info-value">${order.status === 'COMPLETED' ? 'Hoàn thành' : order.status === 'PENDING' ? 'Chờ xử lý' : 'Đã hủy'}</div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Sản phẩm</th>
        <th class="td-center">SL</th>
        <th class="td-right">Đơn giá</th>
        <th class="td-right">Giảm giá</th>
        <th class="td-right">Thành tiền</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="summary-wrap">
    <div class="summary">
      <div class="s-row">
        <span class="s-label">Tạm tính</span>
        <span class="s-value">${formatCurrency(order.subtotal)}</span>
      </div>
      ${order.discount > 0 ? `
      <div class="s-row">
        <span class="s-label">Giảm giá</span>
        <span class="s-value" style="color:#059669">-${formatCurrency(order.discount)}</span>
      </div>` : ''}
      ${order.tax > 0 ? `
      <div class="s-row">
        <span class="s-label">Thuế</span>
        <span class="s-value">${formatCurrency(order.tax)}</span>
      </div>` : ''}
      <hr class="s-divider">
      <div class="s-row s-total">
        <span>Tổng cộng</span>
        <span>${formatCurrency(order.totalAmount)}</span>
      </div>
      <div class="s-row s-paid">
        <span>Đã thanh toán</span>
        <span>${formatCurrency(order.paidAmount)}</span>
      </div>
      ${order.debtAmount > 0 ? `
      <div class="s-row s-debt">
        <span>Còn nợ</span>
        <span>${formatCurrency(order.debtAmount)}</span>
      </div>` : ''}
    </div>
  </div>

  ${order.note ? `<p class="note">Ghi chú: ${order.note}</p>` : ''}

  <div class="footer">Cảm ơn quý khách hàng đã mua hàng!</div>

  <script>window.onload = function () { window.print() }</script>
</body>
</html>`

  const win = window.open('', '_blank', 'width=820,height=700,scrollbars=yes')
  if (!win) return
  win.document.open()
  win.document.write(html)
  win.document.close()
}
