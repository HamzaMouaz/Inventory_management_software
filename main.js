const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database'); // Importer le module de base de données

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, // Activer l'isolement du contexte
      enableRemoteModule: false,
      nodeIntegration: false // Désactiver l'intégration Node pour plus de sécurité
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('add-product', (event, product) => {
  const { name, priceAchat, priceVente, quantité } = product;
  const sql = 'INSERT INTO products (name, priceAchat, priceVente, quantité) VALUES (?, ?, ?, ?)';

  db.run(sql, [name, priceAchat, priceVente, quantité], function(err) {
      if (err) {
          console.error('Erreur lors de l\'ajout du produit :', err.message);
          event.reply('add-product-response', { success: false });
      } else {
          console.log(`Produit ajouté avec l'ID : ${this.lastID}`);
          event.reply('add-product-response', { success: true, id: this.lastID });
      }
  });
});

function createProductWindow() {
  let ProductWindow = new BrowserWindow({
    width: 800,
    height: 600,
    title: 'Gestion des produits',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  ProductWindow.loadFile('gestion-produits.html');

  ProductWindow.on('closed', () => {
    ProductWindow = null;
  });
}

ipcMain.on('products-window', () => {
  console.log('Ouverture de la fenêtre Ajouter un produit'); // Debug
  createProductWindow();
});

ipcMain.on('get-products', (event) => {
  const sql = 'SELECT * FROM products';

  db.all(sql, [], (err, rows) => {
      if (err) {
          console.error('Erreur lors de la récupération des produits :', err.message);
          event.reply('get-products-response', { success: false });
      } else {
          event.reply('get-products-response', { success: true, products: rows });
      }
  });
});

// Suppression d'un produit
ipcMain.on('delete-product', (event, productId) => {
  const sql = 'DELETE FROM products WHERE id = ?';
  db.run(sql, [productId], function(err) {
      if (err) {
          console.error('Erreur lors de la suppression du produit :', err.message);
          event.reply('delete-product-response', { success: false });
      } else {
          // Notifie la fenêtre de rendu que le produit a été supprimé
          event.reply('delete-product-response', { success: true });
      }
  });
});

// Édition d'un produit
ipcMain.on('edit-product', (event, productId) => {
  const sql = 'SELECT * FROM products WHERE id = ?';
  db.get(sql, [productId], (err, row) => {
      if (err) {
          console.error('Erreur lors de la récupération du produit :', err.message);
      } else {
          const editProductWindow = new BrowserWindow({
              width: 400,
              height: 300,
              webPreferences: {
                  preload: path.join(__dirname, 'preload.js'),
                  contextIsolation: true,
                  nodeIntegration: false,
              }
          });

          editProductWindow.loadFile('edit-product.html');

          // Passer le produit à la nouvelle fenêtre
          editProductWindow.webContents.on('did-finish-load', () => {
              if (row) {
                  editProductWindow.webContents.send('load-product', row);
              } else {
                  console.error('Aucun produit trouvé avec l\'ID:', productId);
              }
          });
      }
  });
});

// Mise à jour d'un produit
ipcMain.on('update-product', (event, product) => {
  const sql = 'UPDATE products SET name = ?, priceAchat = ?, priceVente= ?, quantité= ? WHERE id = ?';
  db.run(sql, [product.name, product.priceAchat, product.priceVente, product.quantité, product.id], function(err) {
      if (err) {
          console.error('Erreur lors de la mise à jour du produit :', err.message);
          event.reply('product-updated', { success: false });
      } else {
          event.reply('product-updated', product.id); // Envoie une confirmation à la fenêtre de rendu
      }
  });
});

ipcMain.on('refresh-product-list', (event) => {
  // Ici, tu peux émettre un événement pour rafraîchir la liste dans la fenêtre des produits
  mainWindow.webContents.send('refresh-products');
});
