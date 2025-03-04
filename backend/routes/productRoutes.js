// backend/routes/productRoutes.js
const express = require('express');
const { getProducts, createProduct } = require('../controllers/productController');

const router = express.Router();

// Ürünleri al
router.get('/products', getProducts);

// Ürün ekle
router.post('/products', createProduct);

module.exports = router;