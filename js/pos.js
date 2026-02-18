import { getAll, add, update } from './db.js';
import { getUIState, setUIState } from './storage.js';

let cart = [];
let products = [];

export const initPOS = async (container) => {
    products = await getAll('products');
    const uiState = getUIState();

    container.innerHTML = `
    <div class="pos-grid" id="pos-grid">
      <div class="draggable-container" id="selection-section" draggable="true" data-id="selection" style="order: ${uiState.posOrder.indexOf('selection')}">
        <h3>Product Selection</h3>
        <label>Select Product</label>
        <select id="product-select">
          <option value="">-- Choose Product --</option>
          ${products.map(p => `<option value="${p.id}">${p.name} (${p.stock} in stock)</option>`).join('')}
        </select>
        
        <label>Product Price (BDT)</label>
        <input type="number" id="unit-price" readonly placeholder="Select a product">
        
        <label>Quantity</label>
        <input type="number" id="qty" value="1" min="1">
        
        <button id="add-to-cart" style="width: 100%; margin-top: 1rem;">Add to Cart</button>
      </div>

      <div class="draggable-container" id="summary-section" draggable="true" data-id="summary" style="order: ${uiState.posOrder.indexOf('summary')}">
        <h3>Sales Summary</h3>
        <table id="cart-table">
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Total</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody id="cart-body">
            <tr><td colspan="5" style="text-align:center">Cart is empty</td></tr>
          </tbody>
          <tfoot>
             <tr class="total-row">
               <td colspan="3">Total Payable</td>
               <td id="total-payable">0 BDT</td>
               <td></td>
             </tr>
          </tfoot>
        </table>
        <button id="go-to-payment" style="width: 100%; margin-top: 2rem; background-color: var(--success-color)">Go to Payment</button>
      </div>
    </div>
  `;

    setupEventListeners(container);
    setupDragAndDrop(container);
    updateCartUI();
};

const setupEventListeners = (container) => {
    const productSelect = document.getElementById('product-select');
    const unitPrice = document.getElementById('unit-price');
    const qtyInput = document.getElementById('qty');
    const addToCartBtn = document.getElementById('add-to-cart');
    const goToPaymentBtn = document.getElementById('go-to-payment');

    productSelect.addEventListener('change', (e) => {
        const product = products.find(p => p.id === parseInt(e.target.value));
        unitPrice.value = product ? product.price : '';
    });

    addToCartBtn.addEventListener('click', () => {
        const productId = parseInt(productSelect.value);
        const qty = parseInt(qtyInput.value);

        if (!productId || isNaN(qty) || qty <= 0) {
            alert('Please select a product and valid quantity');
            return;
        }

        const product = products.find(p => p.id === productId);
        if (qty > product.stock) {
            alert('Insufficient stock!');
            return;
        }

        const existingItem = cart.find(item => item.id === productId);
        if (existingItem) {
            if (existingItem.qty + qty > product.stock) {
                alert('Insufficient stock!');
                return;
            }
            existingItem.qty += qty;
        } else {
            cart.push({
                id: product.id,
                name: product.name,
                price: product.price,
                qty: qty
            });
        }

        updateCartUI();
    });

    goToPaymentBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Cart is empty!');
            return;
        }
        showPaymentModal();
    });
};

const updateCartUI = () => {
    const cartBody = document.getElementById('cart-body');
    const totalPayable = document.getElementById('total-payable');

    if (cart.length === 0) {
        cartBody.innerHTML = '<tr><td colspan="5" style="text-align:center">Cart is empty</td></tr>';
        totalPayable.textContent = '0 BDT';
        return;
    }

    cartBody.innerHTML = cart.map((item, index) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.price}</td>
      <td>${item.qty}</td>
      <td>${(item.price * item.qty).toFixed(2)} BDT</td>
      <td><button class="remove-item" data-index="${index}" style="background:var(--danger-color); padding: 0.2rem 0.5rem; font-size: 0.8rem;">X</button></td>
    </tr>
  `).join('');

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    totalPayable.textContent = `${total.toFixed(2)} BDT`;

    document.querySelectorAll('.remove-item').forEach(btn => {
        btn.onclick = () => {
            cart.splice(parseInt(btn.dataset.index), 1);
            updateCartUI();
        };
    });
};

const setupDragAndDrop = (container) => {
    const draggables = container.querySelectorAll('.draggable-container');
    const grid = document.getElementById('pos-grid');

    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', () => {
            draggable.classList.add('dragging');
        });

        draggable.addEventListener('dragend', () => {
            draggable.classList.remove('dragging');
            // Save new order
            const newOrder = Array.from(grid.children).map(child => child.dataset.id);
            setUIState({ posOrder: newOrder });
        });
    });

    grid.addEventListener('dragover', e => {
        e.preventDefault();
        const dragging = document.querySelector('.dragging');
        const afterElement = getDragAfterElement(grid, e.clientX);
        if (afterElement == null) {
            grid.appendChild(dragging);
        } else {
            grid.insertBefore(dragging, afterElement);
        }
    });
};

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.draggable-container:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

const showPaymentModal = () => {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');

    modalContent.innerHTML = `
    <div class="modal-header">
      <h2>Payment Confirmation</h2>
      <span class="close-btn" id="close-modal">&times;</span>
    </div>
    <div style="display: flex; gap: 2rem;">
      <div style="flex: 1;">
        <label>Customer Name</label>
        <input type="text" id="cust-name" placeholder="Walking Customer">
        
        <label>Total Paying</label>
        <input type="number" id="total-paying" value="${totalAmount}">
        
        <label>Total Due</label>
        <input type="number" id="total-due" value="0" readonly>
        
        <label>Paying through</label>
        <select id="pay-method">
          <option>Cash</option>
          <option>MFS</option>
          <option>CARD</option>
          <option>BANK</option>
        </select>
      </div>
      <div style="width: 200px; padding: 1rem; border: 1px solid var(--border-color); background: var(--sidebar-bg); border-radius: 4px;">
        <p>Total Payable: <strong>${totalAmount.toFixed(2)} BDT</strong></p>
        <p>Total Items: <strong>${cart.length}</strong></p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
      </div>
    </div>
    <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 2rem;">
      <button type="button" class="secondary" id="cancel-modal">Cancel</button>
      <button id="complete-sale" style="background-color: var(--success-color)">Complete</button>
    </div>
  `;

    modalOverlay.style.display = 'flex';

    const payingInput = document.getElementById('total-paying');
    const dueInput = document.getElementById('total-due');

    payingInput.addEventListener('input', () => {
        const paying = parseFloat(payingInput.value) || 0;
        dueInput.value = (totalAmount - paying).toFixed(2);
    });

    const close = () => modalOverlay.style.display = 'none';
    document.getElementById('close-modal').onclick = close;
    document.getElementById('cancel-modal').onclick = close;

    document.getElementById('complete-sale').onclick = async () => {
        const saleData = {
            customer: document.getElementById('cust-name').value || 'Walking Customer',
            items: [...cart],
            total: totalAmount,
            paid: parseFloat(payingInput.value) || 0,
            due: parseFloat(dueInput.value) || 0,
            method: document.getElementById('pay-method').value,
            date: new Date().toISOString()
        };

        // Update stocks
        for (const item of cart) {
            const product = products.find(p => p.id === item.id);
            product.stock -= item.qty;
            await update('products', product);
        }

        await add('sales', saleData);
        cart = [];
        close();
        alert('Sale completed successfully!');
        initPOS(document.getElementById('app-content'));
    };
};
