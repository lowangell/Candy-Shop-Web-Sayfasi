const mongoose = require("mongoose");
const Product = require("./models/Product");

// Veritabanı bağlantısı
mongoose.connect("mongodb://localhost:27017/mydatabase", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Connected to database!");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// Ürün verilerini eklemek
const seedProducts = async () => {
  try {
    const products = [
      { name: "Product 1", price: 100, description: "Description for product 1" },
      { name: "Product 2", price: 200, description: "Description for product 2" },
      { name: "Product 3", price: 300, description: "Description for product 3" },
      { name: "Product 4", price: 400, description: "Description for product 4" },
    ];

    // Ürünleri ekle
    await Product.insertMany(products);
    console.log("3 products added successfully!");
  } catch (error) {
    console.error("Error adding products:", error);
  } finally {
    // Veritabanı bağlantısını kapat
    mongoose.connection.close();
  }
};

// Seed fonksiyonunu çalıştır
seedProducts();
