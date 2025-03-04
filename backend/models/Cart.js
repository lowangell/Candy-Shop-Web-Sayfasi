const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
  userId: { type: String, required: true },    // Kullanıcı ID'si
  products: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }, // Ürün ID'si
      quantity: { type: Number, required: true }                          // Ürün miktarı
    }
  ]
});

module.exports = mongoose.model('Cart', CartSchema);