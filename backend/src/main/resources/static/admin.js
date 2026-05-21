let adminUser = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadAppConfig();
    adminUser = getCurrentUser();

    if (!adminUser || !isAdminUser(adminUser)) {
        alert('Access Denied. Only the administrator can view this page.');
        window.location.href = 'index.html';
        return;
    }

    initAdmin();
});

async function initAdmin() {
    loadCategories();
    loadAdminProducts();
    loadAdminStats();

    document.getElementById('addProductForm').addEventListener('submit', handleAddProduct);
    
    // Local File Upload Logic with Auto-Resizing
    document.getElementById('fileUpload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                // Professional resizing: Keep images under a reasonable size (max 800px)
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max = 800;
                
                if (width > height && width > max) {
                    height *= max / width;
                    width = max;
                } else if (height > max) {
                    width *= max / height;
                    height = max;
                }
                
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed JPEG (0.7 quality)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                document.getElementById('pImage').value = dataUrl;
                alert('Image optimized and loaded successfully!');
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}

function switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    
    document.getElementById('productsSection').style.display = tab === 'products' ? 'block' : 'none';
    document.getElementById('ordersSection').style.display = tab === 'orders' ? 'block' : 'none';
}

async function loadCategories() {
    try {
        const res = await fetch(`${API_BASE_URL}/categories`);
        const cats = await res.json();
        const select = document.getElementById('pCategory');
        select.innerHTML = cats.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    } catch (e) { console.error('Admin categories error:', e); }
}

async function loadAdminProducts() {
    try {
        const res = await fetch(`${API_BASE_URL}/products`);
        const products = await res.json();
        const list = document.getElementById('productAdminList');
        list.innerHTML = products.map(p => `
            <tr>
                <td><img src="${p.imageUrl || p.image_url}" style="width:40px; height:40px; border-radius:6px; object-fit:cover;"></td>
                <td>${escapeHtml(p.name)}</td>
                <td>${escapeHtml(p.category?.name || 'Uncategorized')}</td>
                <td style="color:var(--primary); font-weight:700;">$${p.price.toFixed(2)}</td>
                <td>${p.stockQuantity || 0}</td>
                <td>
                    <div style="display:flex; gap:0.5rem;">
                        <button class="btn-primary" style="padding:0.4rem 0.8rem; font-size:0.75rem; margin:0;" onclick='editProduct(${JSON.stringify(p).replace(/'/g, "&apos;")})'>
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-delete" style="padding:0.4rem 0.8rem; font-size:0.75rem;" onclick="deleteProduct(${p.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (e) { console.error('Admin products error:', e); }
}

function editProduct(p) {
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-edit"></i> Update Existing Product';
    document.querySelector('#addProductForm button[type="submit"]').textContent = 'Save Changes to Catalog';
    
    document.getElementById('pId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pCategory').value = p.category?.id || '';
    document.getElementById('pImage').value = p.imageUrl || p.image_url || '';
    document.getElementById('pDesc').value = p.description || '';
    document.getElementById('pTags').value = p.tags || '';
    document.getElementById('pStock').value = p.stockQuantity || 0;
    
    document.getElementById('productsSection').scrollIntoView({ behavior: 'smooth' });
}

async function handleAddProduct(e) {
    e.preventDefault();
    const id = document.getElementById('pId').value;
    const product = {
        id: id ? parseInt(id) : null,
        name: document.getElementById('pName').value.trim(),
        price: parseFloat(document.getElementById('pPrice').value),
        imageUrl: document.getElementById('pImage').value.trim(),
        description: document.getElementById('pDesc').value.trim(),
        tags: document.getElementById('pTags').value.trim(),
        stockQuantity: parseInt(document.getElementById('pStock').value),
        category: { id: parseInt(document.getElementById('pCategory').value) }
    };

    try {
        const res = await fetch(`${API_BASE_URL}/admin/products/${adminUser.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        const data = await res.json();
        if (res.ok) {
            alert(id ? 'Product updated successfully!' : 'Product added successfully!');
            resetForm();
            loadAdminProducts();
        } else {
            alert('Error: ' + (data.message || 'Could not save product.'));
        }
    } catch (e) { 
        alert('Server error saving product.'); 
    }
}

function resetForm() {
    document.getElementById('addProductForm').reset();
    document.getElementById('pId').value = '';
    document.getElementById('formTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Add New Product';
    document.querySelector('#addProductForm button[type="submit"]').textContent = 'Add Product to Catalog';
}

async function deleteProduct(id) {
    if (!confirm('Are you sure you want to remove this product from the catalog?')) return;
    
    try {
        const res = await fetch(`${API_BASE_URL}/admin/products/${adminUser.id}/${id}`, {
            method: 'DELETE'
        });
        if (res.ok) {
            loadAdminProducts();
        } else {
            alert('Could not delete product.');
        }
    } catch (e) { alert('Server error deleting product'); }
}

async function loadAdminStats() {
    try {
        const res = await fetch(`${API_BASE_URL}/admin/stats/${adminUser.id}`);
        if (!res.ok) return;
        const data = await res.json();
        const list = document.getElementById('userOrdersList');
        
        if (data.length === 0) {
            list.innerHTML = '<p style="color:#94a3b8">No customer orders recorded yet.</p>';
            return;
        }

        list.innerHTML = data.map(u => `
            <div class="user-order-card">
                <div class="user-order-header">
                    <div>
                        <strong style="font-size:1.1rem; color:white;">${escapeHtml(u.username)}</strong>
                        <div style="font-size:0.85rem; color:#94a3b8;">${escapeHtml(u.email)}</div>
                    </div>
                    <span style="background:var(--primary); padding:0.3rem 0.8rem; border-radius:100px; font-size:0.75rem; color:white;">
                        ${u.orders.length} Order(s)
                    </span>
                </div>
                <div class="user-order-body">
                    ${u.orders.length > 0 ? u.orders.map(o => `
                        <div class="order-row">
                            <span>ID: #${o.id} • ${new Date(o.orderDate).toLocaleDateString()}</span>
                            <strong>$${o.totalAmount.toFixed(2)}</strong>
                        </div>
                    `).join('') : '<p style="font-size:0.85rem; color:#64748b">No orders yet.</p>'}
                </div>
            </div>
        `).join('');
    } catch (e) { console.error('Admin stats error:', e); }
}
