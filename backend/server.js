require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // bcryptjs'yi kullanarak şifreyi hashleyeceğiz
const cors = require('cors');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart'); // Cart modelini import ediyoruz
const cartRoutes = require('./routes/cartRoutes'); // cartRoutes'u import ediyoruz
 const app = express();

// CORS middleware'ini ekliyoruz
app.use(cors());
app.use(bodyParser.json());
 
// MongoDB Bağlantısı
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Bağlandı'))
  .catch(err => console.error(err));

  app.post('/api/cart', async (req, res) => {
    try {
      const token = req.headers.token
      const jwtData = jwt.decode(token, process.env.JWT_SECRET)
      const { productId, quantity } = req.body;
      const userId = jwtData.user._id
    
      // Kullanıcıya ait sepeti bul
      let cart = await Cart.findOne({ userId });
    
      if (!cart) {
        // Eğer kullanıcıya ait sepet yoksa, yeni bir sepet oluştur
        cart = new Cart({ userId, products: [] });
      }
    
      // Sepette ürün var mı kontrol et
      const productIndex = cart.products.findIndex(
        (product) => product.productId.toString() === productId
      );
    
      if (productIndex > -1) {
        // Ürün zaten varsa, miktarı güncelle
        cart.products[productIndex].quantity += quantity;
      } else {
        // Ürün yoksa, sepet ürün listesine ekle
        cart.products.push({ productId, quantity });
      }
    
      // Sepeti kaydet
      await cart.save();
      res.status(200).json({ message: 'Ürün sepete eklendi', cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });
  
  app.get('/api/cart', async (req, res) => {
    try {
      const token = req.headers.token;
      const jwtData = jwt.decode(token, process.env.JWT_SECRET);
      const userId = jwtData?.user._id;
  
      // Kullanıcının sepetini bul ve ürün bilgilerini populate et
      const cart = await Cart.findOne({ userId }).populate('products.productId');
  
      if (!cart) {
        return res.status(404).json({ message: 'Sepet bulunamadı' });
      }
  
      res.status(200).json(cart);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });
  

  app.delete('/api/cart/:productId', async (req, res) => {
    try {
      const token = req.headers.token;
      const jwtData = jwt.decode(token, process.env.JWT_SECRET);
      const userId = jwtData.user._id;
  
      const { productId } = req.params; // productId'yi URL parametresi olarak alıyoruz
      
      // Kullanıcının sepetini bul
      const cart = await Cart.findOne({ userId });
  
      if (!cart) {
        return res.status(404).json({ message: 'Sepet bulunamadı' });
      }
  
      // Ürünü sepetten sil
      cart.products = cart.products.filter(
        (product) => product.productId.toString() !== productId
      );
  
      // Sepeti kaydet
      await cart.save();
      res.status(200).json({ message: 'Ürün sepetten silindi', cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });
  
  app.get('/api/products/category/:category', async (req, res) => {
    try {
      const { category } = req.params; // URL parametresinden kategoriyi alıyoruz
  
      // Veritabanında kategoriye göre ürünleri bul
      const products = await Product.find({ category });
  
      if (products.length === 0) {
        return res.status(404).json({ message: 'Bu kategoride ürün bulunamadı' });
      }
  
      res.status(200).json(products); // Kategorideki ürünleri döndür
    } catch (err) {
      console.error(err); // Hata logu ekleyin
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });
  

  app.delete('/api/cart/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
  
      // Kullanıcının sepetini bul
      const cart = await Cart.findOne({ userId });
  
      if (!cart) {
        return res.status(404).json({ message: 'Sepet bulunamadı' });
      }
  
      // Tüm ürünleri kaldır
      cart.products = [];
      await cart.save();
  
      res.status(200).json({ message: 'Sepet temizlendi', cart });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });
  app.get('/api/users', async (req, res) => {
    try {
      const users = await User.find(); // Veritabanındaki tüm kullanıcıları getir
      res.json(users); // Kullanıcıları döndür
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Sunucu hatası' });
    }
  });

// Kullanıcı Kaydı
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;

    // Alanların boş olup olmadığını kontrol et
    if (!username || !password || !email || !phone) {
      return res.status(400).json({ message: 'Lütfen Alanları Boş Bırakmayınız!' });
    }

    // username sadece harf içermelidir (sadece rakam ise hata mesajı)
    if (/^\d+$/.test(username)) { // sadece rakam kontrolü
      return res.status(400).json({ message: 'Kullanıcı adı sadece harflerden oluşmalıdır.' });
    }

    // Telefon numarası sadece rakam olmalı
    if (!/^\d+$/.test(phone)) {
      return res.status(400).json({ message: 'Telefon numarası sadece rakamlardan oluşmalıdır.' });
    }

    // Aynı email ya da telefon numarasıyla kaydın olup olmadığını kontrol et
    const existingUserByEmail = await User.findOne({ email });
    const existingUserByPhone = await User.findOne({ phone });

    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Bu email adresi zaten kayıtlı' });
    }

    if (existingUserByPhone) {
      return res.status(400).json({ message: 'Bu telefon numarası zaten kayıtlı' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Yeni kullanıcıyı oluştur ve kaydet
    const user = new User({ username, email, phone, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Kullanıcı başarıyla kaydedildi' });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Kullanıcı Girişi
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("password1", password);
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Kullanıcı adı ve şifre gereklidir' });
    }

    const user = await User.findOne({ username });
    console.log(user);

    if (!user) {
      return res.status(400).json({ message: 'Kullanıcı bulunamadı' });
    }

    // Şifreyi karşılaştır
    const isMatch = await bcrypt.compare(password, user.password); // Girdiğiniz şifreyi veritabanındaki hash'le karşılaştırın
    console.log('Girdiği şifre:', password); // Kullanıcının girdiği şifre
    console.log('Hashlenmiş şifre:', user.password); // Veritabanındaki hashlenmiş şifre
    console.log('Şifre karşılaştırma sonucu:', isMatch); // Karşılaştırma sonucu

    if (!isMatch) {
      return res.status(400).json({ message: 'Şifre yanlış' });
    }

    // JWT Token oluştur
    const token = jwt.sign({ user }, process.env.JWT_SECRET, { expiresIn: '1h' });

    // Token ve kullanıcı ID'sini geri gönder
    res.status(200).json({ message: 'Giriş başarılı', token, user: {
      name: user.username,
      email: user.email,
      phone: user.phone,
    } });

  } catch (err) {
    console.error(err); // Hata mesajlarını console'a yazdır
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});



// Ürünleri Listeleme
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Yeni Ürün Ekleme
app.post('/api/products', async (req, res) => {
  try {
    const { name, price, description,category } = req.body;

    // Alanların boş olup olmadığını kontrol et
    if (!name || !price || !description || !category) {
      return res.status(400).json({ message: 'Ürün adı, fiyatı, kategorisi ve açıklaması gereklidir' });
    }

    // Yeni ürünü oluştur
    const newProduct = new Product({
      name,
      price,
      description,
      category
    });

    // Ürünü kaydet
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct); // Başarıyla kaydedildi
  } catch (err) {
    console.error(err); // Hata logu ekleyin
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});


app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params; // URL parametresi olarak gelen ürün ID'sini alıyoruz

    // Ürünü bulup sil
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    res.status(200).json({ message: 'Ürün başarıyla silindi', deletedProduct });
  } catch (err) {
    console.error(err); // Hata logu ekleyin
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Sunucu Başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Sunucu ${PORT} portunda çalışıyor`));
