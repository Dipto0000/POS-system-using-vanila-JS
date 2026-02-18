import { getAll, add, update, remove } from './db.js';

export const initProducts = async (container) => {
    const products = await getAll('products');

    container.innerHTML = `
    <div class="product-list-container">
      <div style="display: flex; justify-content: flex-end; margin-bottom: 1rem;">
        <button id="add-product-btn">Add Product</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Sl No</th>
            <th>Product Name</th>
            <th>Description</th>
            <th>Quantity in stock</th>
            <th>Price</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${products.length === 0 ? '<tr><td colspan="6" style="text-align:center">No products found</td></tr>' :
            products.map((p, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${p.name}</td>
                <td>${p.description || '-'}</td>
                <td>${p.stock}</td>
                <td>${p.price} BDT</td>
                <td>
                  <button class="edit-btn" data-id="${p.id}">Edit</button>
                  <button class="delete-btn" data-id="${p.id}" style="background-color: var(--danger-color)">Delete</button>
                </td>
              </tr>
            `).join('')
        }
        </tbody>
      </table>
    </div>
  `;

    document.getElementById('add-product-btn').addEventListener('click', () => showProductModal());

    container.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => showProductModal(parseInt(btn.dataset.id)));
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to delete this product?')) {
                await remove('products', parseInt(btn.dataset.id));
                initProducts(container);
            }
        });
    });
};

const showProductModal = async (id = null) => {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalContent = document.getElementById('modal-content');
    let product = id ? await getAll('products').then(list => list.find(p => p.id === id)) : null;

    modalContent.innerHTML = `
    <div class="modal-header">
      <h2>${id ? 'Edit Product' : 'Add New Product'}</h2>
      <span class="close-btn" id="close-modal">&times;</span>
    </div>
    <form id="product-form">
      <label>Product Name</label>
      <input type="text" id="p-name" value="${product ? product.name : ''}" required>
      <label>Description</label>
      <textarea id="p-desc">${product ? product.description : ''}</textarea>
      <label>Stock Quantity</label>
      <input type="number" id="p-stock" value="${product ? product.stock : ''}" required>
      <label>Price (BDT)</label>
      <input type="number" id="p-price" value="${product ? product.price : ''}" required>
      <div style="display:flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem;">
        <button type="button" class="secondary" id="cancel-modal">Cancel</button>
        <button type="submit">${id ? 'Update' : 'Save'}</button>
      </div>
    </form>
  `;

    modalOverlay.style.display = 'flex';

    const close = () => modalOverlay.style.display = 'none';
    document.getElementById('close-modal').onclick = close;
    document.getElementById('cancel-modal').onclick = close;

    document.getElementById('product-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            name: document.getElementById('p-name').value,
            description: document.getElementById('p-desc').value,
            stock: parseInt(document.getElementById('p-stock').value),
            price: parseFloat(document.getElementById('p-price').value),
        };

        if (id) {
            await update('products', { id, ...data });
        } else {
            await add('products', data);
        }

        close();
        initProducts(document.getElementById('app-content'));
    };
};
