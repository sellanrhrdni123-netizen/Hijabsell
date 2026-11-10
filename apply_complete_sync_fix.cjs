const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app.html');
let content = fs.readFileSync(filePath, 'utf8');

console.log('Original content length:', content.length);

// 1. Update saveUsers(users)
const oldSaveUsers = `    function saveUsers(users) {
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      } catch(e) {}
    }`;

const newSaveUsers = `    function saveUsers(users) {
      try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        if (typeof window !== 'undefined' && window._byNvdilaSyncChannel) {
          window._byNvdilaSyncChannel.postMessage({ type: 'USERS_UPDATED' });
        }
      } catch(e) {}
      try {
        if (typeof App !== 'undefined' && App.broadcastCloudSync) {
          App.broadcastCloudSync({
            type: 'USERS_UPDATE',
            users: users,
            timestamp: Date.now()
          });
        }
      } catch(e) {}
    }`;

if (content.includes(oldSaveUsers)) {
  content = content.replace(oldSaveUsers, newSaveUsers);
  console.log('[1] saveUsers updated with real-time cross-device broadcast');
} else {
  console.log('[1] saveUsers target not matched');
}

// 2. Update resetEmptyState() and loadSampleData()
const oldResetEmptyState = `    function resetEmptyState() {
      state.data = { customers: [], products: [], orders: [], followups: [], activities: [] };
      saveData(state.data);
      state.selectedCustomerId = null;
      render();
    }`;

const newResetEmptyState = `    function resetEmptyState() {
      state.data = { customers: [], products: [], orders: [], followups: [], activities: [], deletedIds: [] };
      saveData(state.data);
      state.selectedCustomerId = null;
      try {
        if (typeof App !== 'undefined' && App.broadcastCloudSync) {
          App.broadcastCloudSync({
            type: 'RESET_EMPTY_STATE',
            data: state.data,
            timestamp: Date.now()
          });
        }
      } catch(e) {}
      render();
    }`;

if (content.includes(oldResetEmptyState)) {
  content = content.replace(oldResetEmptyState, newResetEmptyState);
  console.log('[2] resetEmptyState updated with cross-device broadcast');
}

const oldLoadSample = `    function loadSampleData() {
      state.data = getDefaultSampleData();
      saveData(state.data);
      if (!state.chats || state.chats.length === 0) {
        state.chats = getChats();
      }
      render();
    }`;

const newLoadSample = `    function loadSampleData() {
      state.data = getDefaultSampleData();
      saveData(state.data);
      if (!state.chats || state.chats.length === 0) {
        state.chats = getChats();
      }
      try {
        if (typeof App !== 'undefined' && App.broadcastCloudSync) {
          App.broadcastCloudSync({
            type: 'LOAD_SAMPLE_DATA',
            data: state.data,
            timestamp: Date.now()
          });
        }
      } catch(e) {}
      render();
    }`;

if (content.includes(oldLoadSample)) {
  content = content.replace(oldLoadSample, newLoadSample);
  console.log('[3] loadSampleData updated with cross-device broadcast');
}

// 3. Update handleAuthSubmit (Account Activation and Direct Login)
const oldAuthVerification = `        // 2. Consistent password verification (Requirement 7)
        let match = (state.data.customers || []).find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
        const custName = enteredName || (match ? match.name : (isSella ? 'Sella Nurhardiani' : email.split('@')[0]));
        const custPhone = enteredPhone || (match ? match.phone : '081234567890');
        const custAddress = match ? (match.address || '') : '';

        const users = getUsers();
        const userKey = email.toLowerCase();
        const existingUser = users[userKey];

        // If in login mode (and not Sella and not registration form with enteredName), user MUST already have an account!
        if (!isRegister && !isSella && !enteredName) {
          if (!existingUser) {
            alert('Akun belum terdaftar. Silakan daftar akun terlebih dahulu.');
            state.authMode = 'register';
            state.tempEmail = email;
            state.authError = 'Akun belum terdaftar. Silakan daftar akun terlebih dahulu.';
            render();
            const nameElAfter = document.getElementById('reg-name');
            if (nameElAfter && typeof nameElAfter.focus === 'function') nameElAfter.focus();
            return;
          }
        }

        if (existingUser) {
          if (password && existingUser.password && existingUser.password !== password) {
            alert('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
            state.authError = 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
            render();
            return;
          }
        } else {
          if (isRegister || enteredName) {
            users[userKey] = {
              email: userKey,
              password: password,
              name: custName,
              role: isSella ? 'admin' : 'customer',
              phone: custPhone,
              address: custAddress,
              createdAt: new Date().toISOString()
            };
            saveUsers(users);
          }
        }`;

const newAuthVerification = `        // 2. Consistent password verification & Account Activation
        let match = (state.data.customers || []).find(c => c.email && c.email.toLowerCase() === email.toLowerCase());
        const custName = enteredName || (match ? match.name : (isSella ? 'Sella Nurhardiani' : email.split('@')[0]));
        const custPhone = enteredPhone || (match ? match.phone : '081234567890');
        const custAddress = match ? (match.address || '') : '';

        const users = getUsers();
        const userKey = email.toLowerCase();
        let existingUser = users[userKey];

        // If user already exists in CRM database (customers) but not yet in local users dictionary, activate account directly!
        if (!existingUser && match) {
          existingUser = {
            email: userKey,
            password: password,
            name: match.name || custName,
            role: 'customer',
            phone: match.phone || custPhone,
            address: match.address || custAddress,
            createdAt: new Date().toISOString()
          };
          users[userKey] = existingUser;
          saveUsers(users);
        }

        // If in login mode (and not Sella and not registration form with enteredName), user MUST already have an account!
        if (!isRegister && !isSella && !enteredName) {
          if (!existingUser) {
            alert('Akun belum terdaftar. Silakan daftar akun terlebih dahulu.');
            state.authMode = 'register';
            state.tempEmail = email;
            state.authError = 'Akun belum terdaftar. Silakan daftar akun terlebih dahulu.';
            render();
            const nameElAfter = document.getElementById('reg-name');
            if (nameElAfter && typeof nameElAfter.focus === 'function') nameElAfter.focus();
            return;
          }
        }

        if (existingUser) {
          if (password && existingUser.password && existingUser.password !== password) {
            alert('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
            state.authError = 'Kata sandi yang Anda masukkan salah. Silakan periksa kembali.';
            render();
            return;
          } else if (!existingUser.password && password) {
            existingUser.password = password;
            users[userKey] = existingUser;
            saveUsers(users);
          }
        } else {
          if (isRegister || enteredName) {
            users[userKey] = {
              email: userKey,
              password: password,
              name: custName,
              role: isSella ? 'admin' : 'customer',
              phone: custPhone,
              address: custAddress,
              createdAt: new Date().toISOString()
            };
            saveUsers(users);
          }
        }`;

if (content.includes(oldAuthVerification)) {
  content = content.replace(oldAuthVerification, newAuthVerification);
  console.log('[4] handleAuthSubmit updated for seamless existing account login & sync');
}

// 4. Update saveCustomer and deleteCustomer
const oldSaveCustomer = `        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        state.activeModal = null;
        state.modalPayload = null;
        render();
      },
      deleteCustomer(id) {
        const c = (state.data.customers || []).find(x => x.id === id);
        const name = c ? c.name : id;
        if (confirm('Hapus pelanggan ' + name + '?')) {
          state.data.customers = (state.data.customers || []).filter(x => x.id !== id);
          if (state.selectedCustomerId === id) state.selectedCustomerId = null;
          saveData(state.data);
          render();
        }
      },`;

const newSaveCustomer = `        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        try {
          if (typeof App !== 'undefined' && App.broadcastCloudSync) {
            App.broadcastCloudSync({
              type: 'CUSTOMER_UPDATE',
              customer: newCust,
              data: state.data,
              timestamp: Date.now()
            });
          }
        } catch(e) {}
        state.activeModal = null;
        state.modalPayload = null;
        render();
      },
      deleteCustomer(id) {
        const c = (state.data.customers || []).find(x => x.id === id);
        const name = c ? c.name : id;
        if (confirm('Hapus pelanggan ' + name + '?')) {
          state.data.customers = (state.data.customers || []).filter(x => x.id !== id);
          if (state.selectedCustomerId === id) state.selectedCustomerId = null;
          state.data.deletedIds = state.data.deletedIds || [];
          if (!state.data.deletedIds.includes(id)) state.data.deletedIds.push(id);
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'CUSTOMER_DELETE',
                customerId: id,
                deletedIds: state.data.deletedIds,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();
        }
      },`;

if (content.includes(oldSaveCustomer)) {
  content = content.replace(oldSaveCustomer, newSaveCustomer);
  console.log('[5] saveCustomer & deleteCustomer updated with instant sync and delete tracking');
}

// 5. Update deleteProduct to ensure state.data.deletedIds
const oldDeleteProduct = `      deleteProduct(id) {
        const p = (state.data.products || []).find(x => x.id === id);
        const name = p ? p.name : id;
        if (confirm('Hapus produk ' + name + '?')) {
          state.data.products = (state.data.products || []).filter(x => x.id !== id);
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'PRODUCT_DELETE',
                productId: id,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();
        }
      },`;

const newDeleteProduct = `      deleteProduct(id) {
        const p = (state.data.products || []).find(x => x.id === id);
        const name = p ? p.name : id;
        if (confirm('Hapus produk ' + name + '?')) {
          state.data.products = (state.data.products || []).filter(x => x.id !== id);
          state.data.deletedIds = state.data.deletedIds || [];
          if (!state.data.deletedIds.includes(id)) state.data.deletedIds.push(id);
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'PRODUCT_DELETE',
                productId: id,
                deletedIds: state.data.deletedIds,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();
        }
      },`;

if (content.includes(oldDeleteProduct)) {
  content = content.replace(oldDeleteProduct, newDeleteProduct);
  console.log('[6] deleteProduct updated with deletedIds tracking');
}

// 6. Update clearAdminChat and clearCustomerChat with CHAT_CLEAR broadcast
const oldClearAdminChat = `          state.chats = (state.chats || []).filter(m => {
            const mId = m.customerId ? String(m.customerId).toLowerCase() : '';
            const mEmail = m.customerEmail ? m.customerEmail.toLowerCase() : '';
            const matchId = candidateIds.length > 0 && candidateIds.includes(mId);
            const matchEmail = candidateEmails.length > 0 && candidateEmails.includes(mEmail);
            return !(matchId || matchEmail);
          });
          saveChats(state.chats);
          render();`;

const newClearAdminChat = `          state.chats = (state.chats || []).filter(m => {
            const mId = m.customerId ? String(m.customerId).toLowerCase() : '';
            const mEmail = m.customerEmail ? m.customerEmail.toLowerCase() : '';
            const matchId = candidateIds.length > 0 && candidateIds.includes(mId);
            const matchEmail = candidateEmails.length > 0 && candidateEmails.includes(mEmail);
            return !(matchId || matchEmail);
          });
          saveChats(state.chats);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'CHAT_CLEAR',
                chats: state.chats,
                targetCustId: custIdStr,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();`;

if (content.includes(oldClearAdminChat)) {
  content = content.replace(oldClearAdminChat, newClearAdminChat);
  console.log('[7] clearAdminChat updated with CHAT_CLEAR broadcast');
}

const oldClearCustomerChat = `          state.chats = (state.chats || []).filter(m => {
            const mId = m.customerId ? String(m.customerId).toLowerCase() : '';
            const mEmail = m.customerEmail ? m.customerEmail.toLowerCase() : '';
            const matchId = candidateIds.length > 0 && candidateIds.includes(mId);
            const matchEmail = candidateEmails.length > 0 && candidateEmails.includes(mEmail);
            return !(matchId || matchEmail);
          });
          saveChats(state.chats);
          render();`;

const newClearCustomerChat = `          state.chats = (state.chats || []).filter(m => {
            const mId = m.customerId ? String(m.customerId).toLowerCase() : '';
            const mEmail = m.customerEmail ? m.customerEmail.toLowerCase() : '';
            const matchId = candidateIds.length > 0 && candidateIds.includes(mId);
            const matchEmail = candidateEmails.length > 0 && candidateEmails.includes(mEmail);
            return !(matchId || matchEmail);
          });
          saveChats(state.chats);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'CHAT_CLEAR',
                chats: state.chats,
                targetCustId: auth.customerId || auth.email,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();`;

if (content.includes(oldClearCustomerChat)) {
  content = content.replace(oldClearCustomerChat, newClearCustomerChat);
  console.log('[8] clearCustomerChat updated with CHAT_CLEAR broadcast');
}

// 7. Update saveOrder, updateOrderStatus, deleteOrder, cancelCustomerOrder
const oldSaveOrderEnd = `        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        state.activeModal = null;
        state.modalPayload = null;
        render();
      },
      updateOrderStatus(orderId, newStatus) {
        const ord = (state.data.orders || []).find(x => x.id === orderId);
        if (ord) {
          ord.orderStatus = newStatus;
          state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
          saveData(state.data);
          render();
        }
      },
      deleteOrder(orderId) {
        if (!confirm('Hapus pesanan ' + orderId + '? Stok produk akan dikembalikan.')) return;
        const ord = (state.data.orders || []).find(x => x.id === orderId);
        if (ord) {
          (ord.items || []).forEach(it => {
            const p = (state.data.products || []).find(x => x.id === it.productId);
            if (p) {
              p.stock += Number(it.quantity) || 1;
              if (p.stock > 5) p.status = 'Tersedia';
              else if (p.stock > 0) p.status = 'Stok Menipis';
            }
          });
        }
        state.data.orders = (state.data.orders || []).filter(x => x.id !== orderId);
        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        render();
      },`;

const newSaveOrderEnd = `        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        try {
          if (typeof App !== 'undefined' && App.broadcastCloudSync) {
            App.broadcastCloudSync({
              type: 'ORDER_CREATE',
              order: newOrd,
              products: state.data.products,
              customer: c,
              activity: state.data.activities[0],
              data: state.data,
              timestamp: Date.now()
            });
          }
        } catch(e) {}
        state.activeModal = null;
        state.modalPayload = null;
        render();
      },
      updateOrderStatus(orderId, newStatus) {
        const ord = (state.data.orders || []).find(x => x.id === orderId);
        if (ord) {
          ord.orderStatus = newStatus;
          state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'ORDER_UPDATE',
                order: ord,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();
        }
      },
      deleteOrder(orderId) {
        if (!confirm('Hapus pesanan ' + orderId + '? Stok produk akan dikembalikan.')) return;
        const ord = (state.data.orders || []).find(x => x.id === orderId);
        if (ord) {
          (ord.items || []).forEach(it => {
            const p = (state.data.products || []).find(x => x.id === it.productId);
            if (p) {
              p.stock += Number(it.quantity) || 1;
              if (p.stock > 5) p.status = 'Tersedia';
              else if (p.stock > 0) p.status = 'Stok Menipis';
            }
          });
        }
        state.data.orders = (state.data.orders || []).filter(x => x.id !== orderId);
        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        state.data.deletedIds = state.data.deletedIds || [];
        if (!state.data.deletedIds.includes(orderId)) state.data.deletedIds.push(orderId);
        saveData(state.data);
        try {
          if (typeof App !== 'undefined' && App.broadcastCloudSync) {
            App.broadcastCloudSync({
              type: 'ORDER_DELETE',
              orderId: orderId,
              deletedIds: state.data.deletedIds,
              products: state.data.products,
              data: state.data,
              timestamp: Date.now()
            });
          }
        } catch(e) {}
        render();
      },`;

if (content.includes(oldSaveOrderEnd)) {
  content = content.replace(oldSaveOrderEnd, newSaveOrderEnd);
  console.log('[9] saveOrder, updateOrderStatus, and deleteOrder updated with cross-device sync');
}

// 8. Update cancelCustomerOrder with broadcast
const oldCancelCustOrderEnd = `        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        alert('Pesanan ' + orderId + ' berhasil dibatalkan. Stok produk telah dikembalikan.');
        render();`;

const newCancelCustOrderEnd = `        state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
        saveData(state.data);
        try {
          if (typeof App !== 'undefined' && App.broadcastCloudSync) {
            App.broadcastCloudSync({
              type: 'ORDER_UPDATE',
              order: ord,
              products: state.data.products,
              activity: state.data.activities[0],
              data: state.data,
              timestamp: Date.now()
            });
          }
        } catch(e) {}
        alert('Pesanan ' + orderId + ' berhasil dibatalkan. Stok produk telah dikembalikan.');
        render();`;

if (content.includes(oldCancelCustOrderEnd)) {
  content = content.replace(oldCancelCustOrderEnd, newCancelCustOrderEnd);
  console.log('[10] cancelCustomerOrder updated with broadcast');
}

// 9. Update saveFollowup, toggleFollowup, and deleteFollowup
const oldFollowupActions = `        state.data.followups = [flw, ...(state.data.followups || [])];
        saveData(state.data);
        state.activeModal = null;
        state.modalPayload = null;
        render();
      },
      toggleFollowup(id) {
        const item = (state.data.followups || []).find(x => x.id === id);
        if (item) {
          item.status = item.status === 'Selesai' ? 'Belum Dihubungi' : 'Selesai';
          saveData(state.data);
          render();
        }
      },
      deleteFollowup(id) {
        if (confirm('Hapus jadwal follow-up ini?')) {
          state.data.followups = (state.data.followups || []).filter(x => x.id !== id);
          saveData(state.data);
          render();
        }
      },`;

const newFollowupActions = `        state.data.followups = [flw, ...(state.data.followups || [])];
        saveData(state.data);
        try {
          if (typeof App !== 'undefined' && App.broadcastCloudSync) {
            App.broadcastCloudSync({
              type: 'FOLLOWUP_UPDATE',
              followup: flw,
              data: state.data,
              timestamp: Date.now()
            });
          }
        } catch(e) {}
        state.activeModal = null;
        state.modalPayload = null;
        render();
      },
      toggleFollowup(id) {
        const item = (state.data.followups || []).find(x => x.id === id);
        if (item) {
          item.status = item.status === 'Selesai' ? 'Belum Dihubungi' : 'Selesai';
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'FOLLOWUP_UPDATE',
                followup: item,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();
        }
      },
      deleteFollowup(id) {
        if (confirm('Hapus jadwal follow-up ini?')) {
          state.data.followups = (state.data.followups || []).filter(x => x.id !== id);
          state.data.deletedIds = state.data.deletedIds || [];
          if (!state.data.deletedIds.includes(id)) state.data.deletedIds.push(id);
          saveData(state.data);
          try {
            if (typeof App !== 'undefined' && App.broadcastCloudSync) {
              App.broadcastCloudSync({
                type: 'FOLLOWUP_DELETE',
                followupId: id,
                deletedIds: state.data.deletedIds,
                data: state.data,
                timestamp: Date.now()
              });
            }
          } catch(e) {}
          render();
        }
      },`;

if (content.includes(oldFollowupActions)) {
  content = content.replace(oldFollowupActions, newFollowupActions);
  console.log('[11] Followup actions updated with instant sync and delete tracking');
}

// 10. Completely Upgrade handleIncomingSync
const oldHandleIncomingSyncStart = `      handleIncomingSync(rawMsg) {
        try {
          if (!rawMsg) return;
          let packet;
          if (typeof rawMsg === 'string') {
            try { packet = JSON.parse(rawMsg); } catch(e) { return; }
          } else if (typeof rawMsg === 'object') {
            packet = rawMsg;
          }
          if (!packet || typeof packet !== 'object') return;
          if (packet.clientId && packet.clientId === CLIENT_ID) return; // Do not process own echo

          let hasChanges = false;
          const dummyNames = ['Zahra Amelia Putri', 'Nabila Khairunnisa', 'Fathia Rahmadina', 'Dinda Ayu Maharani', 'Siti Hanifah'];
          const dummyProdIds = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005', 'PRD-006'];`;

const newHandleIncomingSyncFull = `      handleIncomingSync(rawMsg) {
        try {
          if (!rawMsg) return;
          let packet;
          if (typeof rawMsg === 'string') {
            try { packet = JSON.parse(rawMsg); } catch(e) { return; }
          } else if (typeof rawMsg === 'object') {
            packet = rawMsg;
          }
          if (!packet || typeof packet !== 'object') return;
          if (packet.clientId && packet.clientId === CLIENT_ID) return; // Do not process own echo

          let hasChanges = false;
          const dummyNames = ['Zahra Amelia Putri', 'Nabila Khairunnisa', 'Fathia Rahmadina', 'Dinda Ayu Maharani', 'Siti Hanifah'];
          const dummyProdIds = ['PRD-001', 'PRD-002', 'PRD-003', 'PRD-004', 'PRD-005', 'PRD-006'];

          // 0. Full Reset or Sample Data
          if (packet.type === 'RESET_EMPTY_STATE') {
            state.data = { customers: [], products: [], orders: [], followups: [], activities: [], deletedIds: [] };
            state.selectedCustomerId = null;
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
              }
            } catch(e) {}
            render();
            return;
          }
          if (packet.type === 'LOAD_SAMPLE_DATA' && packet.data) {
            state.data = packet.data;
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
              }
            } catch(e) {}
            render();
            return;
          }

          // 1. Maintain & Enforce Deletion Records (Tombstones)
          const remoteDeletedIds = new Set([
            ...(packet.deletedIds || []),
            ...(packet.data && packet.data.deletedIds ? packet.data.deletedIds : [])
          ]);
          if (packet.type === 'PRODUCT_DELETE' && packet.productId) remoteDeletedIds.add(packet.productId);
          if (packet.type === 'ORDER_DELETE' && packet.orderId) remoteDeletedIds.add(packet.orderId);
          if (packet.type === 'CUSTOMER_DELETE' && packet.customerId) remoteDeletedIds.add(packet.customerId);
          if (packet.type === 'FOLLOWUP_DELETE' && packet.followupId) remoteDeletedIds.add(packet.followupId);

          state.data.deletedIds = state.data.deletedIds || [];
          remoteDeletedIds.forEach(id => {
            if (!state.data.deletedIds.includes(id)) state.data.deletedIds.push(id);
          });
          const allDeletedIds = new Set(state.data.deletedIds);

          // Purge locally any item marked deleted
          const beforeP = (state.data.products || []).length;
          const beforeO = (state.data.orders || []).length;
          const beforeC = (state.data.customers || []).length;
          const beforeF = (state.data.followups || []).length;

          state.data.products = (state.data.products || []).filter(p => !allDeletedIds.has(p.id));
          state.data.orders = (state.data.orders || []).filter(o => !allDeletedIds.has(o.id));
          state.data.customers = (state.data.customers || []).filter(c => !allDeletedIds.has(c.id));
          state.data.followups = (state.data.followups || []).filter(f => !allDeletedIds.has(f.id));

          if (state.data.products.length !== beforeP || state.data.orders.length !== beforeO || state.data.customers.length !== beforeC || state.data.followups.length !== beforeF) {
            hasChanges = true;
          }

          // Direct single product deletion
          if (packet.type === 'PRODUCT_DELETE' && packet.productId) {
            const beforeLen = (state.data.products || []).length;
            state.data.products = (state.data.products || []).filter(function(p) { return p.id !== packet.productId; });
            if ((state.data.products || []).length !== beforeLen) hasChanges = true;
          }

          // Direct single order deletion
          if (packet.type === 'ORDER_DELETE' && packet.orderId) {
            const beforeLen = (state.data.orders || []).length;
            state.data.orders = (state.data.orders || []).filter(function(o) { return o.id !== packet.orderId; });
            if (Array.isArray(packet.products)) state.data.products = packet.products.filter(p => !allDeletedIds.has(p.id));
            state.data.customers = syncAllCustomerSegments(state.data.customers, state.data.orders);
            hasChanges = true;
          }

          // Direct single customer deletion
          if (packet.type === 'CUSTOMER_DELETE' && packet.customerId) {
            const beforeLen = (state.data.customers || []).length;
            state.data.customers = (state.data.customers || []).filter(function(c) { return c.id !== packet.customerId; });
            if (state.selectedCustomerId === packet.customerId) state.selectedCustomerId = null;
            if ((state.data.customers || []).length !== beforeLen) hasChanges = true;
          }

          // Direct single followup deletion
          if (packet.type === 'FOLLOWUP_DELETE' && packet.followupId) {
            const beforeLen = (state.data.followups || []).length;
            state.data.followups = (state.data.followups || []).filter(function(f) { return f.id !== packet.followupId; });
            if ((state.data.followups || []).length !== beforeLen) hasChanges = true;
          }

          // Direct single product update
          if (packet.product && typeof packet.product === 'object' && packet.product.id) {
            if (!allDeletedIds.has(packet.product.id)) {
              const rp = packet.product;
              const localProds = state.data.products || [];
              const idx = localProds.findIndex(function(lp) { return lp.id === rp.id; });
              if (idx === -1) {
                localProds.unshift(rp);
                hasChanges = true;
              } else {
                localProds[idx] = { ...localProds[idx], ...rp };
                hasChanges = true;
              }
              state.data.products = localProds;
            }
          }

          // Direct products array update (e.g. stock adjustment)
          if (Array.isArray(packet.products)) {
            state.data.products = packet.products.filter(p => !allDeletedIds.has(p.id));
            hasChanges = true;
          }

          // Direct single order creation/update
          if (packet.order && typeof packet.order === 'object' && packet.order.id && !allDeletedIds.has(packet.order.id)) {
            const ro = packet.order;
            const localOrders = state.data.orders || [];
            const oIdx = localOrders.findIndex(function(lo) { return lo.id === ro.id; });
            if (oIdx === -1) {
              localOrders.unshift(ro);
              hasChanges = true;
            } else {
              localOrders[oIdx] = { ...localOrders[oIdx], ...ro };
              hasChanges = true;
            }
            state.data.orders = localOrders;
          }

          // Direct single customer creation/update
          if (packet.customer && typeof packet.customer === 'object' && (packet.customer.id || packet.customer.email)) {
            const rc = packet.customer;
            if (!allDeletedIds.has(rc.id)) {
              const localCusts = state.data.customers || [];
              const cIdx = localCusts.findIndex(function(lc) {
                return (rc.id && lc.id === rc.id) || (rc.email && lc.email && lc.email.toLowerCase() === rc.email.toLowerCase());
              });
              if (cIdx === -1) {
                localCusts.unshift(rc);
                hasChanges = true;
              } else {
                localCusts[cIdx] = { ...localCusts[cIdx], ...rc };
                hasChanges = true;
              }
              state.data.customers = syncAllCustomerSegments(localCusts, state.data.orders);
            }
          }

          // Direct single followup update
          if (packet.followup && typeof packet.followup === 'object' && packet.followup.id && !allDeletedIds.has(packet.followup.id)) {
            const rf = packet.followup;
            const localFlws = state.data.followups || [];
            const fIdx = localFlws.findIndex(function(lf) { return lf.id === rf.id; });
            if (fIdx === -1) {
              localFlws.unshift(rf);
              hasChanges = true;
            } else {
              localFlws[fIdx] = { ...localFlws[fIdx], ...rf };
              hasChanges = true;
            }
            state.data.followups = localFlws;
          }

          // Direct single activity update
          if (packet.activity && typeof packet.activity === 'object' && packet.activity.id) {
            const localActs = state.data.activities || [];
            if (!localActs.some(a => a.id === packet.activity.id)) {
              state.data.activities = [packet.activity, ...localActs].slice(0, 150);
              hasChanges = true;
            }
          }

          // 2. Merge Products, Orders, Customers, Activities, Followups from packet.data
          if (packet.data && typeof packet.data === 'object') {
            const remote = packet.data;

            // Merge Products
            if (Array.isArray(remote.products)) {
              const localProds = state.data.products || [];
              remote.products.forEach(function(rp) {
                if (!rp || !rp.id || allDeletedIds.has(rp.id)) return;
                if (dummyProdIds.includes(rp.id) && !rp.name) return;
                const idx = localProds.findIndex(function(lp) { return lp.id === rp.id; });
                if (idx === -1) {
                  localProds.unshift(rp);
                  hasChanges = true;
                } else {
                  const lp = localProds[idx];
                  if (lp.stock !== rp.stock || lp.price !== rp.price || lp.name !== rp.name || lp.color !== rp.color || lp.image !== rp.image || lp.status !== rp.status || lp.category !== rp.category || lp.description !== rp.description) {
                    localProds[idx] = { ...lp, ...rp };
                    hasChanges = true;
                  }
                }
              });
              state.data.products = localProds.filter(p => !allDeletedIds.has(p.id));
            }

            // Merge Orders
            if (Array.isArray(remote.orders)) {
              const localOrders = state.data.orders || [];
              remote.orders.forEach(function(ro) {
                if (!ro || !ro.id || allDeletedIds.has(ro.id) || dummyNames.includes(ro.customerName) || ['ORD-2026-001', 'ORD-2026-002', 'ORD-2026-003', 'ORD-2026-004'].includes(ro.id)) return;
                const idx = localOrders.findIndex(function(lo) { return lo.id === ro.id; });
                if (idx === -1) {
                  localOrders.unshift(ro);
                  hasChanges = true;
                } else {
                  const lo = localOrders[idx];
                  if (lo.orderStatus !== ro.orderStatus || lo.paymentStatus !== ro.paymentStatus || lo.resi !== ro.resi || lo.total !== ro.total) {
                    localOrders[idx] = { ...lo, ...ro };
                    hasChanges = true;
                  }
                }
              });
              state.data.orders = localOrders.filter(o => !allDeletedIds.has(o.id));
            }

            // Merge Customers
            if (Array.isArray(remote.customers)) {
              const localCusts = state.data.customers || [];
              remote.customers.forEach(function(rc) {
                if (!rc || (!rc.id && !rc.email) || (rc.id && allDeletedIds.has(rc.id)) || dummyNames.includes(rc.name) || ['CUST-001', 'CUST-002', 'CUST-003', 'CUST-004', 'CUST-005'].includes(rc.id)) return;
                const idx = localCusts.findIndex(function(lc) {
                  return (rc.id && lc.id === rc.id) || (rc.email && lc.email && lc.email.toLowerCase() === rc.email.toLowerCase());
                });
                if (idx === -1) {
                  localCusts.push(rc);
                  hasChanges = true;
                } else {
                  localCusts[idx] = { ...localCusts[idx], ...rc };
                  hasChanges = true;
                }
              });
              state.data.customers = syncAllCustomerSegments(localCusts.filter(c => !allDeletedIds.has(c.id)), state.data.orders);
            }

            // Merge Activities
            if (Array.isArray(remote.activities)) {
              const localActs = state.data.activities || [];
              const actIds = new Set(localActs.map(function(a) { return a.id; }));
              const newActs = remote.activities.filter(function(a) {
                return a && a.id && !actIds.has(a.id) && !(a.title && a.title.includes('ORD-2026-00'));
              });
              if (newActs.length > 0) {
                state.data.activities = [...newActs, ...localActs].slice(0, 150);
                hasChanges = true;
              }
            }

            // Merge Followups
            if (Array.isArray(remote.followups)) {
              const localFlws = state.data.followups || [];
              const flwIds = new Set(localFlws.map(function(f) { return f.id; }));
              const newFlws = remote.followups.filter(function(f) {
                return f && f.id && !allDeletedIds.has(f.id) && !flwIds.has(f.id) && !dummyNames.includes(f.customerName);
              });
              if (newFlws.length > 0) {
                state.data.followups = [...newFlws, ...localFlws].filter(f => !allDeletedIds.has(f.id));
                hasChanges = true;
              }
            }
          }

          // 3. Merge or Clear Chats
          if (packet.type === 'CHAT_CLEAR') {
            if (packet.targetCustId) {
              const target = String(packet.targetCustId).trim().toLowerCase();
              state.chats = (state.chats || []).filter(m => {
                const mId = (m.customerId ? String(m.customerId) : '').toLowerCase();
                const mEmail = (m.customerEmail ? String(m.customerEmail) : '').toLowerCase();
                return mId !== target && mEmail !== target;
              });
            } else if (Array.isArray(packet.chats)) {
              state.chats = packet.chats;
            }
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(CHATS_KEY, JSON.stringify(state.chats));
              }
            } catch(e) {}
            hasChanges = true;
          } else if (Array.isArray(packet.chats)) {
            const localChats = state.chats || [];
            const chatKeys = new Set(localChats.map(function(c) {
              return c.id || (c.sender + '_' + c.timestamp + '_' + c.text);
            }));
            let newChatAdded = false;
            packet.chats.forEach(function(rc) {
              if (!rc) return;
              const key = rc.id || (rc.sender + '_' + rc.timestamp + '_' + (rc.text || rc.message || ''));
              if (!chatKeys.has(key)) {
                localChats.push({
                  id: rc.id || ('chat-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)),
                  customerId: rc.customerId || rc.customer_id || 'general',
                  sender: rc.sender || 'customer',
                  text: rc.text || rc.message || '',
                  timestamp: rc.timestamp || rc.created_at || new Date().toISOString(),
                  customerEmail: rc.customerEmail || ''
                });
                chatKeys.add(key);
                newChatAdded = true;
                hasChanges = true;
              }
            });
            if (newChatAdded) {
              localChats.sort(function(a, b) { return new Date(a.timestamp) - new Date(b.timestamp); });
              state.chats = localChats;
              try {
                if (typeof localStorage !== 'undefined') {
                  localStorage.setItem(CHATS_KEY, JSON.stringify(state.chats));
                }
              } catch(e) {}
            }
          }

          // 4. Merge Users (Seamless Cross-Device Login)
          if (packet.users && typeof packet.users === 'object') {
            const localUsers = getUsers() || {};
            let usersUpdated = false;
            Object.keys(packet.users).forEach(function(uKey) {
              const rUser = packet.users[uKey];
              if (rUser && typeof rUser === 'object') {
                const lUser = localUsers[uKey];
                if (!lUser || lUser.password !== rUser.password || lUser.name !== rUser.name || lUser.role !== rUser.role || lUser.phone !== rUser.phone || lUser.address !== rUser.address) {
                  localUsers[uKey] = { ...(lUser || {}), ...rUser };
                  usersUpdated = true;
                }
              }
            });
            if (usersUpdated) {
              try {
                localStorage.setItem(USERS_KEY, JSON.stringify(localUsers));
              } catch(e) {}
            }
          }

          // 5. Merge Store Settings
          if (packet.storeSettings && typeof packet.storeSettings === 'object') {
            state.storeSettings = { ...(state.storeSettings || {}), ...packet.storeSettings };
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORE_SETTINGS_KEY, JSON.stringify(state.storeSettings));
              }
            } catch(e) {}
            hasChanges = true;
          }

          if (hasChanges) {
            try {
              if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(state.data));
              }
            } catch(e) {}
            render();
          }
        } catch(err) {
          console.warn('Sync merge error:', err);
        }
      },`;

const handleIncomingRegex = /handleIncomingSync\(rawMsg\) \{[\s\S]*?console\.warn\('Sync merge error:', err\);\s*\}\s*\},/;
if (handleIncomingRegex.test(content)) {
  content = content.replace(handleIncomingRegex, newHandleIncomingSyncFull);
  console.log('[12] handleIncomingSync completely upgraded with tombstone deletion & user sync');
} else {
  console.log('[12] handleIncomingRegex failed to match');
}

// 11. Update initCloudSync to handle server users & deletedIds
const oldInitDataFetch = `                  if (serverState && typeof serverState === 'object') {
                    if (serverState.data) App.handleIncomingSync({ data: serverState.data });
                    if (serverState.chats) App.handleIncomingSync({ chats: serverState.chats });
                    if (serverState.storeSettings) App.handleIncomingSync({ storeSettings: serverState.storeSettings });
                  }`;

const newInitDataFetch = `                  if (serverState && typeof serverState === 'object') {
                    if (serverState.deletedIds) App.handleIncomingSync({ deletedIds: serverState.deletedIds });
                    if (serverState.data) App.handleIncomingSync({ data: serverState.data });
                    if (serverState.chats) App.handleIncomingSync({ chats: serverState.chats });
                    if (serverState.storeSettings) App.handleIncomingSync({ storeSettings: serverState.storeSettings });
                    if (serverState.users) App.handleIncomingSync({ users: serverState.users });
                  }`;

if (content.includes(oldInitDataFetch)) {
  content = content.replace(oldInitDataFetch, newInitDataFetch);
  console.log('[13] initCloudSync updated with serverState.users and serverState.deletedIds');
}

// Save modified app.html
fs.writeFileSync(filePath, content, 'utf8');
console.log('Saved updated app.html! New length:', content.length);

// Make index.html 100% binary identical to app.html
const indexPath = path.join(__dirname, 'index.html');
fs.writeFileSync(indexPath, content, 'utf8');
console.log('Synchronized index.html with app.html (100% identical).');

// Run build_dist
const buildDistPath = path.join(__dirname, 'build_dist.cjs');
require(buildDistPath);
