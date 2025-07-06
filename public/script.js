document.addEventListener("DOMContentLoaded", () => {
  const homePage = document.getElementById("home-page");
  const paymentPage = document.getElementById("payment-page");
  const adminPage = document.getElementById("admin-page");
  const loginPage = document.getElementById("login-page");
  const loginForm = document.getElementById("login-form");
  const productForm = document.getElementById("product-form");
  const productList = document.getElementById("product-list");
  const menuLinks = document.querySelectorAll(".menu a");
  const hamburger = document.querySelector(".hamburger");
  const menu = document.querySelector(".menu");

  let isLoggedIn = false;
  let adminCredentials = null;

  // Hamburger menu toggle
  hamburger.addEventListener("click", () => {
    menu.classList.toggle("active");
    hamburger.classList.toggle("active");
  });

  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
      menu.classList.remove("active");
      hamburger.classList.remove("active");
    }
  });

  // Navigasi antar halaman
  menuLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = e.target.id;

      const pages = [homePage, paymentPage, adminPage, loginPage];
      pages.forEach((page) => {
        page.classList.remove("active");
        page.style.display = "none";
      });

      // Reset form tambah produk jika ada
      const addProductForm = document.getElementById("add-product-form");
      if (addProductForm) addProductForm.reset();

      setTimeout(() => {
        if (target === "home-link") {
          homePage.style.display = "block";
          homePage.classList.add("active");
        }
        if (target === "payment-link") {
          paymentPage.style.display = "block";
          paymentPage.classList.add("active");
        }
        if (target === "login-link") {
          loginPage.style.display = "block";
          loginPage.classList.add("active");
        }
        if (target === "admin-link") {
          if (isLoggedIn) {
            adminPage.style.display = "block";
            adminPage.classList.add("active");
          } else {
            loginPage.style.display = "block";
            loginPage.classList.add("active");
          }
        }
      }, 10);
    });
  });

  // Copy rekening
  const copyButtons = document.querySelectorAll(".copy-btn");
  copyButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const number = button.getAttribute("data-number");
      navigator.clipboard.writeText(number).then(() => {
        alert(`Nomor ${number} telah disalin!`);
      });
    });
  });

  // Login Admin
  document
    .getElementById("admin-login-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();
      const username = document.getElementById("admin-username").value;
      const password = document.getElementById("admin-password").value;
      const token = document.getElementById("admin-token").value;

      fetch("/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, token }),
      })
        .then((res) => {
          if (!res.ok) throw new Error("Login gagal");
          adminCredentials = { username, password, token };
          alert("Login berhasil");

          loginPage.style.display = "none";
          adminPage.style.display = "block";
          adminPage.classList.add("active");
          isLoggedIn = true;
          renderProducts();
        })
        .catch((err) => {
          document.getElementById("login-error").innerText =
            "Login gagal: " + err.message;
        });
    });

  // Fungsi render produk
  const renderProducts = () => {
    const container = document.getElementById("product-list");
    container.innerHTML = "";

    fetch("/products")
      .then((response) => {
        if (!response.ok) throw new Error("Gagal memuat produk.");
        return response.json();
      })
      .then((products) => {
        products.forEach((product) => {
          const productDiv = document.createElement("div");
          productDiv.classList.add("product-item");
          productDiv.innerHTML = `
            <h3>${product.name}</h3>
            <p>Creator :  ${product.author}</p>
            <p>Version :  ${product.version}</p>
            <p>Price :  Rp. ${product.price}</p>
            ${
              adminCredentials
                ? `<button onclick="deleteProductByName('${product.name}')">Hapus</button>`
                : ""
            }
          `;
          container.appendChild(productDiv);
        });
      })
      .catch((err) => console.error("Gagal memuat produk:", err));
  };

  // Fungsi hapus produk
  window.deleteProductByName = function (productName) {
    if (!adminCredentials) {
      alert("Akses ditolak");
      return;
    }

    fetch(`/products/by-name/${encodeURIComponent(productName)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(adminCredentials),
    })
      .then((res) => res.json())
      .then((data) => {
        alert(data.message);
        renderProducts();
      })
      .catch((err) => alert("Gagal hapus: " + err.message));
  };

  // Tambah Produk
  productForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newProduct = {
      name: document.getElementById("product-name").value,
      author: document.getElementById("product-author").value,
      version: document.getElementById("product-version").value,
      price: document.getElementById("product-price").value,
    };

    fetch("/add-product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newProduct, ...adminCredentials }),
    })
      .then((response) => {
        if (!response.ok) throw new Error("Gagal menambahkan produk.");
        return response.json();
      })
      .then((data) => {
        alert(data.message);
        renderProducts();
        productForm.reset();
      })
      .catch((err) => console.error("Gagal menambahkan produk:", err));
  });

  renderProducts();
});
