// backend/controllers/productController.js
const Product = require('../models/Product');

// Ürünleri getir
const getProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Ürünler alınırken bir hata oluştu.' });
  }
};

// Ürün ekle
const createProduct = async (req, res) => {
  try {
    const { name, price, description } = req.body;

    const newProduct = new Product({
      name,
      price,
      description,
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(500).json({ message: 'Ürün eklenirken bir hata oluştu.' });
  }
};

module.exports = { getProducts, createProduct };
