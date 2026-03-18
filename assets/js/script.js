/* =================================================================
                        ENHANCED E-COMMERCE SCRIPT
   ================================================================= */

// Wait for the DOM to be fully loaded before running scripts
document.addEventListener("DOMContentLoaded", () => {
  /* ================================================
     INITIAL UI/SWIPER SETUP (FROM YOUR ORIGINAL FILE)
     ================================================ */
  const navMenu = document.getElementById("nav-menu");
  const navClose = document.getElementById("nav-close");
  const navToggle = document.getElementById("nav-toggle");

  if (navToggle) {
    navToggle.addEventListener("click", () => {
      navMenu.classList.add("show-menu");
    });
  }
  if (navClose) {
    navClose.addEventListener("click", () => {
      navMenu.classList.remove("show-menu");
    });
  }

  // SWIPER CATEGORIES
  if (document.querySelector(".categories-container")) {
    new Swiper(".categories-container", {
      spaceBetween: 24,
      loop: true,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        350: { slidesPerView: 2, spaceBetween: 24 },
        768: { slidesPerView: 3, spaceBetween: 24 },
        992: { slidesPerView: 4, spaceBetween: 24 },
        1200: { slidesPerView: 6, spaceBetween: 24 },
      },
    });
  }

  // SWIPER NEW ARRIVALS
  if (document.querySelector(".new-container")) {
    new Swiper(".new-container", {
      spaceBetween: 24,
      loop: true,
      breakpoints: {
        576: { slidesPerView: 2, spaceBetween: 24 },
        768: { slidesPerView: 3, spaceBetween: 24 },
        1200: { slidesPerView: 4, spaceBetween: 40 },
      },
    });
  }
  
  // PRODUCT TABS
  const tabs = document.querySelectorAll("[data-target]");
  const tabContents = document.querySelectorAll("[content]");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = document.querySelector(tab.dataset.target);
      tabContents.forEach((tabContent) => tabContent.classList.remove("active-tab"));
      target.classList.add("active-tab");
      tabs.forEach((t) => t.classList.remove("active-tab"));
      tab.classList.add("active-tab");
    });
  });

  // DETAILS PAGE IMAGE GALLERY
  if (document.querySelector(".details-container")) {
    const mainImg = document.querySelector(".detials-img");
    const smallImgs = document.querySelectorAll(".detials-small-img");
    smallImgs.forEach((img) => {
      img.addEventListener("click", function () {
        mainImg.src = this.src;
      });
    });
  }

  /* ================================================
     CORE E-COMMERCE FUNCTIONALITY
     ================================================ */

  // --- STATE MANAGEMENT (using localStorage) ---
  const getCart = () => JSON.parse(localStorage.getItem("cart")) || [];
  const saveCart = (cart) => localStorage.setItem("cart", JSON.stringify(cart));
  const getWishlist = () => JSON.parse(localStorage.getItem("wishlist")) || [];
  const saveWishlist = (wishlist) => localStorage.setItem("wishlist", JSON.stringify(wishlist));

  const getProductData = (productEl, fallbackImage) => ({
    id: fallbackImage || productEl.querySelector(".product-img.default, .detials-img")?.src || productEl.dataset.productId || `product-${Date.now()}`,
    title: productEl.querySelector(".product-title, .details-title")?.textContent.trim() || "Featured product",
    price: parseFloat((productEl.querySelector(".new-price")?.textContent || "$0").replace("$", "")),
    image: fallbackImage || productEl.querySelector(".product-img.default, .detials-img")?.src || "",
    category: productEl.querySelector(".product-category")?.textContent.trim() || "New collection",
    ratingHtml: productEl.querySelector(".product-rating")?.innerHTML || "",
    quantity: parseInt(productEl.querySelector(".quantity")?.value || "1", 10),
  });

  const ensureToastContainer = () => {
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }
    return toastContainer;
  };

  const showToast = (message, type = "info", title = "Update") => {
    const toastContainer = ensureToastContainer();
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-title">${title}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    window.setTimeout(() => {
      toast.classList.remove("show");
      window.setTimeout(() => toast.remove(), 300);
    }, 2600);
  };

  // --- UI UPDATE FUNCTIONS ---
  const updateHeaderCounts = () => {
    const cartCount = document.querySelector('a[href="cart.html"] .count');
    const wishlistCount = document.querySelector('a[href="whishlist.html"] .count');
    if (cartCount) cartCount.textContent = getCart().length;
    if (wishlistCount) wishlistCount.textContent = getWishlist().length;
  };

  // --- CART & WISHLIST ACTIONS ---
  const addToCart = (product) => {
    let cart = getCart();
    const existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
      existingProduct.quantity += product.quantity;
    } else {
      cart.push(product);
    }
    saveCart(cart);
    updateHeaderCounts();
    showToast(`${product.title} was added to your cart.`, "success", "Cart updated");

    // GA4 Event
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
        'event': 'add_to_cart',
        'ecommerce': {
            'items': [{
                'item_name': product.title,
                'item_id': product.id,
                'price': product.price,
                'quantity': product.quantity
            }]
        }
    });
    console.log("DataLayer Push (add_to_cart):", window.dataLayer.slice(-1)[0]);
  };

  const addToWishlist = (product) => {
    let wishlist = getWishlist();
    if (!wishlist.some(item => item.id === product.id)) {
      wishlist.push(product);
      saveWishlist(wishlist);
      updateHeaderCounts();
      showToast(`${product.title} was saved to your wishlist.`, "success", "Wishlist updated");

      // GA4 Event
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
          'event': 'add_to_wishlist',
          'ecommerce': {
              'items': [{
                  'item_name': product.title,
                  'item_id': product.id,
                  'price': product.price,
                  'quantity': 1
              }]
          }
      });
      console.log("DataLayer Push (add_to_wishlist):", window.dataLayer.slice(-1)[0]);
    } else {
      showToast(`${product.title} is already in your wishlist.`, "info", "Already saved");
    }
  };

  // --- EVENT LISTENERS FOR PRODUCT CARDS & DETAILS PAGE ---
  const initializeProductListeners = () => {
    document.querySelectorAll(".product-item, .details-container").forEach(container => {
      const imageEl = container.querySelector(".product-img.default") || container.querySelector(".detials-img");
      if (!imageEl) return;
      const imageSrc = imageEl.src;

      // Event for selecting an item
      const productLink = container.querySelector('.product-images, .product-title');
      if (productLink) {
          productLink.addEventListener('click', (e) => {
              const productEl = e.target.closest('.product-item');
              if (productEl) {
                  const imageEl = productEl.querySelector('.product-img.default');
                  const product = {
                      item_name: productEl.querySelector('.product-title').textContent.trim(),
                      item_id: imageEl ? imageEl.src : 'N/A',
                      price: parseFloat(productEl.querySelector('.new-price').textContent.replace('$', '')),
                      item_category: productEl.querySelector('.product-category').textContent.trim(),
                  };

                  window.dataLayer = window.dataLayer || [];
                  window.dataLayer.push({
                      'event': 'select_item',
                      'ecommerce': {
                          'items': [product]
                      }
                  });
                   console.log("DataLayer Push (select_item):", window.dataLayer.slice(-1)[0]);
              }
          });
      }

      const cartBtn = container.querySelector(".cart-btn, .details-action .btn");
      if (cartBtn) {
        cartBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const productEl = e.target.closest(".product-item, .details-container");
          const quantityInput = productEl.querySelector(".quantity");
          
          const product = getProductData(productEl, imageSrc);
          product.quantity = quantityInput ? parseInt(quantityInput.value, 10) : 1;
          addToCart(product);
        });
      }
      
      const wishlistBtn = container.querySelector('a[aria-label="Add to Wishlist"], .detials-action-btn');
       if(wishlistBtn) {
           wishlistBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const productEl = e.target.closest('.product-item, .details-container');
                const product = getProductData(productEl, imageSrc);
                product.quantity = 1;
                addToWishlist(product);
           });
       }
    });
  };

  /* ================================================
     PAGE-SPECIFIC RENDERING LOGIC
     ================================================ */

  // --- RENDER CART PAGE ---
  const renderCartPage = () => {
    const cartItemsContainer = document.getElementById("cart-items");
    if (!cartItemsContainer) return;
    const cart = getCart();
    cartItemsContainer.innerHTML = "";

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<tr><td colspan="6">Your cart is empty.</td></tr>';
    } else {
      cart.forEach(item => {
        const itemTotal = item.quantity * item.price;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><img src="${item.image}" alt="${item.title}" class="table-img"></td>
            <td><h3 class="table-title">${item.title}</h3></td>
            <td><span class="table-price">$${item.price.toFixed(2)}</span></td>
            <td><input type="number" value="${item.quantity}" min="1" class="quantity" data-id="${item.id}"></td>
            <td><span class="table-subtotal">$${itemTotal.toFixed(2)}</span></td>
            <td><i class="ri-delete-bin-line table-trash" data-id="${item.id}"></i></td>
        `;
        cartItemsContainer.appendChild(row);
      });
    }
    updateCartTotals();
    addCartManagementListeners();
  };
  
  const updateCartTotals = () => {
      const cart = getCart();
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const shipping = cart.length > 0 ? 10.00 : 0;
      const total = subtotal + shipping;
      
      const subtotalEl = document.querySelector('.cart-total-table tr:nth-child(1) .cart-total-price');
      const shippingEl = document.querySelector('.cart-total-table tr:nth-child(2) .cart-total-price');
      const totalEl = document.querySelector('.cart-total-table tr:nth-child(3) .cart-total-price');
      
      if(subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
      if(shippingEl) shippingEl.textContent = `$${shipping.toFixed(2)}`;
      if(totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  };
  
  const clearCart = () => {
      if (confirm("Are you sure you want to empty your shopping cart?")) {
          saveCart([]);
          renderCartPage();
          updateHeaderCounts();
      }
  };

  const addCartManagementListeners = () => {
    document.querySelectorAll(".table-trash").forEach(button => {
      button.addEventListener("click", (e) => {
        const itemId = e.target.getAttribute("data-id");
        let cart = getCart().filter(item => item.id !== itemId);
        saveCart(cart);
        renderCartPage();
        updateHeaderCounts();
      });
    });

    document.querySelectorAll("#cart-items .quantity").forEach(input => {
      input.addEventListener("change", (e) => {
        const itemId = e.target.getAttribute("data-id");
        const newQuantity = parseInt(e.target.value);
        let cart = getCart();
        const itemIndex = cart.findIndex(item => item.id === itemId);
        if (itemIndex > -1 && newQuantity > 0) {
          cart[itemIndex].quantity = newQuantity;
          saveCart(cart);
          renderCartPage();
        }
      });
    });

    const clearCartBtn = document.getElementById('clear-cart-btn');
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            clearCart();
        });
    }
  };

  // --- RENDER WISHLIST PAGE ---
  const renderWishlistPage = () => {
      const wishlistContainer = document.getElementById('wishlist-items');
      if (!wishlistContainer) return;
      const wishlist = getWishlist();
      wishlistContainer.innerHTML = '';

      if (wishlist.length === 0) {
          wishlistContainer.innerHTML = '<tr><td colspan="6">Your wishlist is empty.</td></tr>';
      } else {
          wishlist.forEach(item => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td><img src="${item.image}" alt="${item.title}" class="table-img"></td>
                  <td><h3 class="table-title">${item.title}</h3></td>
                  <td><span class="table-price">$${item.price.toFixed(2)}</span></td>
                  <td><span class="table-stock">In Stock</span></td>
                  <td><a href="#" class="btn btn-sm wishlist-to-cart-btn" data-id="${item.id}">Add To Cart</a></td>
                  <td><i class="ri-delete-bin-line table-trash" data-id="${item.id}"></i></td>
              `;
              wishlistContainer.appendChild(row);
          });
      }
      addWishlistManagementListeners();
  };

  const addWishlistManagementListeners = () => {
    document.querySelectorAll('#wishlist-items .table-trash').forEach(button => {
        button.addEventListener('click', (e) => {
            const itemId = e.target.getAttribute('data-id');
            let wishlist = getWishlist().filter(item => item.id !== itemId);
            saveWishlist(wishlist);
            renderWishlistPage();
            updateHeaderCounts();
        });
    });
    
    document.querySelectorAll('.wishlist-to-cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const itemId = e.target.getAttribute('data-id');
            const wishlist = getWishlist();
            const itemToMove = wishlist.find(item => item.id === itemId);
            
            if (itemToMove) {
                addToCart(itemToMove);
                const newWishlist = wishlist.filter(item => item.id !== itemId);
                saveWishlist(newWishlist);
                renderWishlistPage();
            }
        });
    });
  };

  // --- RENDER CHECKOUT PAGE ---
  const renderCheckoutPage = () => {
      const orderItemsContainer = document.getElementById('checkout-order-items');
      if (!orderItemsContainer) return;
      
      const subtotalEl = document.getElementById('checkout-subtotal');
      const shippingEl = document.getElementById('checkout-shipping');
      const totalEl = document.getElementById('checkout-total');
      const cart = getCart();
      orderItemsContainer.innerHTML = '';
      
      const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
      const shipping = cart.length > 0 ? 10.00 : 0;
      const total = subtotal + shipping;

      cart.forEach(item => {
          const itemTotal = item.quantity * item.price;
          const row = document.createElement('tr');
          row.innerHTML = `
              <td><img src="${item.image}" alt="" class="order-img"></td>
              <td>
                  <h3 class="table-title">${item.title}</h3>
                  <p class="table-quantity">x ${item.quantity}</p>
              </td>
              <td><span class="table-price">$${itemTotal.toFixed(2)}</span></td>
          `;
          orderItemsContainer.appendChild(row);
      });

      subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
      shippingEl.textContent = `$${shipping.toFixed(2)}`;
      totalEl.textContent = `$${total.toFixed(2)}`;
  };
  
  // *** NEW: CHECKOUT PROCESSING AND THANK YOU PAGE LOGIC ***
  const handleCheckout = () => {
      const placeOrderBtn = document.getElementById('place-order-btn');
      if (!placeOrderBtn) return;

      placeOrderBtn.addEventListener('click', (e) => {
          e.preventDefault();
          const cart = getCart();
          if (cart.length === 0) {
              showToast("Your cart is empty. Add a product before placing an order.", "error", "Checkout unavailable");
              return;
          }

          // --- 1. Create Data Layer for Analytics ---
          const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
          const shipping = cart.length > 0 ? 10.00 : 0;
          const total = subtotal + shipping;

          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
              'event': 'purchase',
              'ecommerce': {
                  'purchase': {
                      'actionField': {
                          'id': 'T' + Math.floor(Math.random() * 1000000), // Example Transaction ID
                          'revenue': total.toFixed(2),
                          'shipping': shipping.toFixed(2),
                      },
                      'products': cart.map(item => ({
                          'name': item.title,
                          'id': item.id,
                          'price': item.price.toFixed(2),
                          'quantity': item.quantity
                      }))
                  }
              }
          });

          console.log("DataLayer Push:", window.dataLayer.slice(-1)[0]); // Log for debugging

          // --- 2. Show Thank You Message & Animation ---
          const checkoutContainer = document.querySelector('.checkout-container');
          const thankYouMessage = document.getElementById('thank-you-message');
          
          checkoutContainer.style.display = 'none';
          thankYouMessage.classList.add('visible');
          createSparkles();

          // --- 3. Clear Cart ---
          saveCart([]);
          updateHeaderCounts();
      });
  };

  const createSparkles = () => {
      const sparkleContainer = document.querySelector('.sparkles');
      if (!sparkleContainer) return;
      sparkleContainer.innerHTML = ''; // Clear old sparkles

      for (let i = 0; i < 30; i++) {
          const sparkle = document.createElement('span');
          sparkle.className = 'sparkle';
          sparkle.style.top = `${Math.random() * 100}%`;
          sparkle.style.left = `${Math.random() * 100}%`;
          sparkle.style.animationDelay = `${Math.random() * 1.5}s`;
          sparkleContainer.appendChild(sparkle);
      }
  };


  /* ================================================
     ANALYTICS-SPECIFIC FUNCTIONS
     ================================================ */

  // --- PUSH VIEW ITEM LIST EVENT ---
  const pushViewItemListEvent = () => {
    const productItems = document.querySelectorAll(".product-item");
    if (productItems.length > 0) {
      const items = [];
      productItems.forEach((productEl, index) => {
        const titleEl = productEl.querySelector(".product-title");
        const priceEl = productEl.querySelector(".new-price");
        const categoryEl = productEl.querySelector(".product-category");
        const imageEl = productEl.querySelector(".product-img.default");

        if (titleEl && priceEl && categoryEl) {
            items.push({
              item_name: titleEl.textContent.trim(),
              item_id: imageEl ? imageEl.src : "N/A",
              price: parseFloat(priceEl.textContent.replace("$", "")),
              item_category: categoryEl.textContent.trim(),
              index: index + 1,
            });
        }
      });

      if (items.length > 0) {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "view_item_list",
          ecommerce: {
            items: items,
          },
        });
        console.log("DataLayer Push (view_item_list):", window.dataLayer.slice(-1)[0]);
      }
    }
  };

  const handleBeginCheckout = () => {
    const checkoutBtn = document.getElementById("proceed-to-checkout-btn");
    if (checkoutBtn) {
      checkoutBtn.addEventListener("click", () => {
        const cart = getCart();
        const items = cart.map(item => ({
          item_name: item.title,
          item_id: item.id,
          price: item.price,
          quantity: item.quantity
        }));

        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "begin_checkout",
          ecommerce: {
            items: items,
          },
        });
        console.log("DataLayer Push (begin_checkout):", window.dataLayer.slice(-1)[0]);
      });
    }
  };

  const handleLogin = () => {
    const loginBtn = document.getElementById("login-btn");
    if (loginBtn) {
      loginBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "login",
          method: "email"
        });
        console.log("DataLayer Push (login):", window.dataLayer.slice(-1)[0]);
        showToast("Login interaction captured successfully.", "info", "Login event");
      });
    }
  };

  const handleSignUp = () => {
    const signUpBtn = document.getElementById("register-btn");
    if (signUpBtn) {
      signUpBtn.addEventListener("click", (e) => {
        e.preventDefault();
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
          event: "sign_up",
          method: "email"
        });
        console.log("DataLayer Push (sign_up):", window.dataLayer.slice(-1)[0]);
        showToast("Sign-up interaction captured successfully.", "info", "Registration event");
      });
    }
  };

  const handleSearch = () => {
    const searchBtn = document.querySelector(".search-btn");
    if (searchBtn) {
      searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const searchInput = document.querySelector(".header-search .form-input");
        if (searchInput && searchInput.value) {
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({
            event: "search",
            search_term: searchInput.value,
          });
          console.log("DataLayer Push (search):", window.dataLayer.slice(-1)[0]);
          showToast(`Showing results inspiration for “${searchInput.value}”.`, "info", "Search captured");
        }
      });
    }
  };

  const initializeScrollReveal = () => {
    const revealElements = document.querySelectorAll(".section-title, .product-item, .category-item, .deals-item, .showcase-item, .newsletter-container, .footer-content, .home-content, .home-visual");
    if (!("IntersectionObserver" in window)) {
      revealElements.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries, revealObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("reveal-on-scroll", "is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealElements.forEach((element, index) => {
      element.classList.add("reveal-on-scroll");
      element.style.transitionDelay = `${Math.min(index * 0.04, 0.18)}s`;
      observer.observe(element);
    });
  };

  const initializeHeroParallax = () => {
    const homeVisual = document.querySelector(".home-visual");
    const homeImage = document.querySelector(".home-img");
    if (!homeVisual || !homeImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const resetTilt = () => {
      homeImage.style.transform = "rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)";
    };

    homeVisual.addEventListener("mousemove", (event) => {
      const rect = homeVisual.getBoundingClientRect();
      const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
      const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
      homeImage.style.transform = `rotateX(${(-offsetY * 10).toFixed(2)}deg) rotateY(${(offsetX * 12).toFixed(2)}deg) translate3d(${(offsetX * 16).toFixed(1)}px, ${(offsetY * 16).toFixed(1)}px, 0)`;
    });

    homeVisual.addEventListener("mouseleave", resetTilt);
  };

  const initializeQuickViewModal = () => {
    const quickViewButtons = document.querySelectorAll('a[aria-label="Quick View"]');
    if (!quickViewButtons.length) return;

    const modal = document.createElement("div");
    modal.className = "quick-view-modal";
    modal.innerHTML = `
      <div class="quick-view-dialog" role="dialog" aria-modal="true" aria-labelledby="quick-view-title">
        <button type="button" class="quick-view-close" aria-label="Close quick view">
          <i class="ri-close-line"></i>
        </button>
        <div class="quick-view-content">
          <div class="quick-view-media">
            <img src="" alt="" class="quick-view-image">
          </div>
          <div class="quick-view-info">
            <span class="quick-view-category"></span>
            <h3 class="quick-view-title" id="quick-view-title"></h3>
            <div class="product-rating quick-view-rating"></div>
            <span class="quick-view-price"></span>
            <p class="quick-view-description">A closer look at the product’s finish, fit, and standout details before you jump into checkout.</p>
            <div class="quick-view-actions">
              <a href="details.html" class="btn">View Details</a>
              <button type="button" class="btn btn-secondary quick-view-add">Add to Cart</button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);

    const imageEl = modal.querySelector(".quick-view-image");
    const categoryEl = modal.querySelector(".quick-view-category");
    const titleEl = modal.querySelector(".quick-view-title");
    const ratingEl = modal.querySelector(".quick-view-rating");
    const priceEl = modal.querySelector(".quick-view-price");
    const addBtn = modal.querySelector(".quick-view-add");
    let activeProduct = null;

    const closeModal = () => modal.classList.remove("active");

    quickViewButtons.forEach((button) => {
      button.addEventListener("click", (event) => {
        event.preventDefault();
        const productEl = button.closest(".product-item");
        if (!productEl) return;
        activeProduct = getProductData(productEl);
        imageEl.src = activeProduct.image;
        imageEl.alt = activeProduct.title;
        categoryEl.textContent = activeProduct.category;
        titleEl.textContent = activeProduct.title;
        ratingEl.innerHTML = activeProduct.ratingHtml;
        priceEl.textContent = `$${activeProduct.price.toFixed(2)}`;
        modal.classList.add("active");
      });
    });

    modal.addEventListener("click", (event) => {
      if (event.target === modal || event.target.closest(".quick-view-close")) closeModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeModal();
    });

    addBtn.addEventListener("click", () => {
      if (!activeProduct) return;
      addToCart({
        id: activeProduct.id,
        title: activeProduct.title,
        price: activeProduct.price,
        image: activeProduct.image,
        quantity: 1,
      });
      closeModal();
    });
  };

  const initializeInteractiveCards = () => {
    document.querySelectorAll(".product-item").forEach((card) => {
      card.addEventListener("mouseenter", () => card.classList.add("is-lifted"));
      card.addEventListener("mouseleave", () => card.classList.remove("is-lifted"));
    });
  };

  const handleNewsletterSignup = () => {
    const newsletterForm = document.querySelector(".newsletter-form");
    const feedback = document.querySelector(".newsletter-feedback");
    if (!newsletterForm || !feedback) return;

    newsletterForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = newsletterForm.querySelector(".newsletter-input");
      const email = input?.value.trim();
      const isValidEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      feedback.classList.remove("is-success", "is-error");
      if (!isValidEmail) {
        feedback.textContent = "Please enter a valid email to unlock your offer.";
        feedback.classList.add("is-error");
        showToast("Enter a valid email address to subscribe.", "error", "Subscription failed");
        return;
      }

      feedback.textContent = `Thanks! ${email} is on the list for exclusive drops.`;
      feedback.classList.add("is-success");
      newsletterForm.reset();
      showToast("You’re subscribed for launch alerts and offers.", "success", "Subscribed");
    });
  };

  const initializeSmoothScrollButtons = () => {
    document.querySelectorAll("[data-scroll-target]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = document.querySelector(button.dataset.scrollTarget);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  /* ================================================
     INITIALIZATION
     ================================================ */
  updateHeaderCounts();
  initializeProductListeners();
  initializeInteractiveCards();
  initializeScrollReveal();
  initializeHeroParallax();
  initializeQuickViewModal();
  initializeSmoothScrollButtons();
  handleNewsletterSignup();

  renderCartPage();
  renderWishlistPage();
  renderCheckoutPage();
  handleCheckout(); // Initialize the new checkout logic
  pushViewItemListEvent(); // Fire on page load
  handleBeginCheckout();
  handleLogin();
  handleSignUp();
  handleSearch();

});
