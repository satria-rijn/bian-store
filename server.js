require("dotenv").config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

const authenticateAdmin = (req, res, next) => {
  const { username, password, token } = req.body;
  if (
    username === ADMIN_USERNAME &&
    password === ADMIN_PASSWORD &&
    token === ADMIN_TOKEN
  ) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized" });
};

// Logging untuk Debugging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Endpoint untuk login admin
app.post("/admin-login", authenticateAdmin, (req, res) => {
  res.status(200).json({ message: "Login berhasil sebagai admin" });
});

// Endpoint untuk mengambil produk
app.get("/products", (req, res) => {
  fs.readFile("products.json", "utf8", (err, data) => {
    if (err) {
      console.error("Gagal membaca file products.json:", err);
      return res
        .status(500)
        .json({ error: "Internal Server Error saat membaca produk." });
    }

    try {
      const products = JSON.parse(data);
      console.log("Produk dikirim:", products);
      res.status(200).json(products);
    } catch (err) {
      console.error("File JSON tidak valid:", err);
      res.status(500).json({ error: "Data produk tidak valid." });
    }
  });
});

// Endpoint untuk menambah produk
app.post("/add-product", authenticateAdmin, (req, res) => {
  const newProduct = req.body;

  console.log("Produk Baru:", newProduct);

  fs.readFile("products.json", "utf8", (err, data) => {
    if (err) {
      console.error("Gagal membaca file products.json:", err);
      return res
        .status(500)
        .json({ error: "Internal Server Error saat membaca produk." });
    }

    try {
      const products = JSON.parse(data);
      products.push(newProduct);

      fs.writeFile(
        "products.json",
        JSON.stringify(products, null, 2),
        (err) => {
          if (err) {
            console.error("Gagal menyimpan produk:", err);
            return res
              .status(500)
              .json({ error: "Internal Server Error saat menyimpan produk." });
          }

          console.log("Produk berhasil ditambahkan!");
          res.status(200).json({ message: "Produk berhasil ditambahkan!" });
        }
      );
    } catch (err) {
      console.error("File JSON tidak valid:", err);
      res.status(500).json({ error: "Data produk tidak valid." });
    }
  });
});

//delete
app.delete("/products/by-name/:name", authenticateAdmin, (req, res) => {
  const productName = decodeURIComponent(req.params.name).toLowerCase();

  fs.readFile("./products.json", "utf8", (err, data) => {
    if (err)
      return res.status(500).json({ error: "Gagal membaca data produk." });

    let products = JSON.parse(data);
    const updatedProducts = products.filter(
      (p) => p.name.toLowerCase() !== productName
    );

    if (products.length === updatedProducts.length) {
      return res.status(404).json({ error: "Produk tidak ditemukan." });
    }

    fs.writeFile(
      "./products.json",
      JSON.stringify(updatedProducts, null, 2),
      (err) => {
        if (err)
          return res.status(500).json({ error: "Gagal menyimpan data." });
        res.json({ message: "Produk berhasil dihapus." });
      }
    );
  });
});

// Penanganan Error 404
app.use((req, res) => {
  console.log("Halaman tidak ditemukan:", req.url);
  res.status(404).send("Halaman tidak ditemukan.");
});

// Jalankan server
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
