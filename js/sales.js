import { getAll } from './db.js';

export const initSales = async (container) => {
    const sales = await getAll('sales');

    container.innerHTML = `
    <div class="sales-history-container">
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Customer Name</th>
            <th>Total Amount</th>
            <th>Paid</th>
            <th>Due</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${sales.length === 0 ? '<tr><td colspan="6" style="text-align:center">No sales records found</td></tr>' :
            sales.reverse().map(s => `
              <tr class="sale-row">
                <td>${new Date(s.date).toLocaleDateString()}</td>
                <td>${s.customer}</td>
                <td>${s.total.toFixed(2)} BDT</td>
                <td>${s.paid.toFixed(2)} BDT</td>
                <td style="color: ${s.due > 0 ? 'var(--danger-color)' : 'var(--success-color)'}">
                  ${s.due.toFixed(2)} BDT
                </td>
                <td>
                  <button class="view-details-btn" data-id="${s.id}">View Details</button>
                </td>
              </tr>
              <tr class="details-row" id="details-${s.id}" style="display: none;">
                <td colspan="6">
                  <div style="padding: 1rem; background: var(--sidebar-bg); border-radius: 4px;">
                    <strong>Products Sold:</strong>
                    <ul>
                      ${s.items.map(item => `<li>${item.name} x ${item.qty} (${(item.price * item.qty).toFixed(2)} BDT)</li>`).join('')}
                    </ul>
                    <p>Method: ${s.method}</p>
                  </div>
                </td>
              </tr>
            `).join('')
        }
        </tbody>
      </table>
    </div>
  `;

    container.querySelectorAll('.view-details-btn').forEach(btn => {
        btn.onclick = () => {
            const detailsRow = document.getElementById(`details-${btn.dataset.id}`);
            detailsRow.style.display = detailsRow.style.display === 'none' ? 'table-row' : 'none';
            btn.textContent = detailsRow.style.display === 'none' ? 'View Details' : 'Hide Details';
        };
    });
};
