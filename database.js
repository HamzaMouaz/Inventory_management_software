const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Chemin vers la base de données
const dbPath = path.join(__dirname, 'products.db');

// Créer ou ouvrir la base de données
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données :', err.message);
    } else {
        console.log('Connecté à la base de données SQLite.');

        // Renommer l'ancienne table `products`
        db.serialize(() => {
            db.run(`ALTER TABLE products RENAME TO products_old`, (err) => {
                if (err) {
                    console.error('Erreur lors du renommage de la table :', err.message);
                } else {
                    console.log('Table renommée en "products_old".');

                    // Créer la nouvelle table sans la colonne `price` et avec les nouvelles colonnes `priceAchat` et `priceVente`
                    db.run(`CREATE TABLE products (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name TEXT NOT NULL,
                        priceAchat REAL NOT NULL,
                        priceVente REAL NOT NULL,
                        quantité INTEGER NOT NULL
                    )`, (err) => {
                        if (err) {
                            console.error('Erreur lors de la création de la nouvelle table :', err.message);
                        } else {
                            console.log('Nouvelle table "products" créée sans la colonne "price" et avec "priceAchat" et "priceVente" et "quantité".');

                            // Copier les données de `products_old` vers `products` (sans la colonne `price`)
                            db.run(`INSERT INTO products (id, name, priceAchat, priceVente, quantité)
                                    SELECT id, name, 0, 0 FROM products_old`, (err) => {
                                if (err) {
                                    console.error('Erreur lors de la copie des données :', err.message);
                                } else {
                                    console.log('Données copiées vers la nouvelle table "products".');

                                    // Supprimer l'ancienne table
                                    db.run(`DROP TABLE products_old`, (err) => {
                                        if (err) {
                                            console.error('Erreur lors de la suppression de "products_old" :', err.message);
                                        } else {
                                            console.log('Table "products_old" supprimée avec succès.');
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        });
    }
});

module.exports = db;
