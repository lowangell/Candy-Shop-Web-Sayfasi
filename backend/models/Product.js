const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },       // Ürün adı
  price: { type: Number, required: true },     // Fiyat
  description: { type: String },               // Ürün açıklaması
  stock: { type: Number, default: 0 },         // Stok miktarı
  image: { type: String },                     // Görsel URL'si
  category:{type:String, required:true}
});

module.exports = mongoose.model('Product', ProductSchema);