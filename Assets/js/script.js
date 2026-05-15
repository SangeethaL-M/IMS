const DB_NAME = 'AJU_STORES_FINAL_SYSTEM';
let inventory = JSON.parse(localStorage.getItem(DB_NAME)) || [];
const categories = ["Grocery", "Dairy", "Beverages", "Cleaning", "Snacks"];

function init() {
    // Generate 25 products if empty
    if (inventory.length === 0) {
        const list = ["Basmati Rice", "Full Cream Milk", "Filter Coffee", "Hand Soap", "Cooking Oil", "Green Tea", "Salted Butter", "Cheddar Cheese", "Brown Bread", "Organic Eggs", "Table Salt", "White Sugar", "Red Lentils", "Instant Noodles", "Hair Shampoo", "Toothpaste", "Dish Brush", "Fruit Jam", "Pure Honey", "Cow Ghee", "Fresh Curd", "Mango Juice", "Diet Coke", "Potato Chips", "Choco Cookies"];
        inventory = list.map((name, i) => ({
            invoice: `INV-26-${200 + i}`,
            sku: (5000 + i).toString(),
            name: name,
            cat: categories[i % categories.length],
            qty: Math.floor(Math.random() * 60) + 5,
            unit: i % 4 === 0 ? "kg" : "pcs",
            price: Math.floor(Math.random() * 450) + 25,
            exp: "2026-12-30"
        }));
        saveDB();
    }
    refreshUI();
}

function saveDB() { localStorage.setItem(DB_NAME, JSON.stringify(inventory)); }

function refreshUI() {
    renderStats();
    renderTable(inventory);
    renderCharts();
    document.getElementById('pCat').innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
}

function renderStats() {
    const today = new Date();
    document.getElementById('stat-total').innerText = inventory.length;
    document.getElementById('stat-value').innerText = `₹${inventory.reduce((a, b) => a + (b.price * b.qty), 0).toLocaleString()}`;
    document.getElementById('stat-low').innerText = inventory.filter(i => i.qty < 10).length;
    document.getElementById('stat-expired').innerText = inventory.filter(i => new Date(i.exp) < today).length;
}

function renderTable(data) {
    const container = document.getElementById('inventoryTable');
    container.innerHTML = data.map((item, idx) => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="p-6"><svg id="bc-${idx}" class="w-24 h-10"></svg></td>
            <td class="p-6 bold-text font-mono text-sm">${item.invoice}</td>
            <td class="p-6 refined-text">#${item.sku}</td>
            <td class="p-6 bold-text text-lg">${item.name}</td>
            <td class="p-6"><span class="px-3 py-1 bg-black text-white rounded-full text-[9px] font-black uppercase">${item.cat}</span></td>
            <td class="p-6 refined-text">${item.qty} ${item.unit}</td>
            <td class="p-6 bold-text text-emerald-600">₹${item.price}</td>
            <td class="p-6 refined-text">${item.exp}</td>
            <td class="p-6 text-center">
                <button onclick="editItem(${idx})" class="text-blue-600 text-2xl mr-4 hover:scale-110 transition-transform"><i class="bi bi-pencil-square"></i></button>
                <button onclick="deleteItem(${idx})" class="text-rose-500 text-2xl hover:scale-110 transition-transform"><i class="bi bi-trash3"></i></button>
            </td>
        </tr>`).join('');
    data.forEach((item, idx) => JsBarcode(`#bc-${idx}`, item.sku, { displayValue: false, height: 35, width: 2, lineColor: "#000" }));
}

function renderCharts() {
    const pCtx = document.getElementById('pieChart').getContext('2d');
    const bCtx = document.getElementById('barChart').getContext('2d');
    
    if(window.pieInst) window.pieInst.destroy();
    if(window.barInst) window.barInst.destroy();

    window.pieInst = new Chart(pCtx, {
        type: 'pie',
        data: {
            labels: categories,
            datasets: [{ 
                data: categories.map(c => inventory.filter(i => i.cat === c).length), 
                backgroundColor: ['#10b981','#3b82f6','#f59e0b','#f43f5e','#8b5cf6'],
                borderWidth: 0 
            }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    window.barInst = new Chart(bCtx, {
        type: 'bar',
        data: {
            labels: inventory.slice(0, 6).map(i => i.name),
            datasets: [{ label: 'Stock', data: inventory.slice(0, 6).map(i => i.qty), backgroundColor: '#10b981', borderRadius: 10 }]
        },
        options: { maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

function multiSearch() {
    const val = document.getElementById('searchInput').value.toLowerCase();
    const filtered = inventory.filter(i => 
        i.name.toLowerCase().includes(val) || 
        i.cat.toLowerCase().includes(val) || 
        i.invoice.toLowerCase().includes(val) ||
        i.price.toString().includes(val)
    );
    renderTable(filtered);
}

function editItem(idx) {
    const item = inventory[idx];
    document.getElementById('editIndex').value = idx;
    document.getElementById('pInvoice').value = item.invoice;
    document.getElementById('pName').value = item.name;
    document.getElementById('pCat').value = item.cat;
    document.getElementById('pQty').value = item.qty;
    document.getElementById('pUnit').value = item.unit;
    document.getElementById('pPrice').value = item.price;
    document.getElementById('pExp').value = item.exp;
    openModal();
}

document.getElementById('productForm').onsubmit = (e) => {
    e.preventDefault();
    const idx = parseInt(document.getElementById('editIndex').value);
    let finalSku;
    if (idx === -1) {
        // NEW ITEM: Find highest SKU and add 1 (starting at 5001 if list is empty)
        const maxSku = inventory.length > 0 
            ? Math.max(...inventory.map(i => parseInt(i.sku) || 5000)) 
            : 5000;
        finalSku = (maxSku + 1).toString();
    } else {
        // EDITING: Keep the existing SKU
        finalSku = inventory[idx].sku;
    }
    const itemData = {
        invoice: document.getElementById('pInvoice').value,
        sku: finalSku, 
        name: document.getElementById('pName').value,
        cat: document.getElementById('pCat').value,
        qty: parseInt(document.getElementById('pQty').value),
        unit: document.getElementById('pUnit').value,
        price: parseInt(document.getElementById('pPrice').value),
        mfg: document.getElementById('pMfg').value,
        exp: document.getElementById('pExp').value
    };
    if (idx === -1) inventory.push(itemData);
    else inventory[idx] = itemData;
    saveDB();
    closeModal();
    refreshUI();
};

function openModal() { document.getElementById('modal').classList.remove('hidden');const today = new Date().toISOString().split('T')[0];
    document.getElementById('pMfg').setAttribute('max', today); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); document.getElementById('productForm').reset(); document.getElementById('editIndex').value = "-1"; }
function deleteItem(idx) { if(confirm("Confirm deletion?")) { inventory.splice(idx, 1); saveDB(); refreshUI(); } }

window.onload = init;