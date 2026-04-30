/* =========================================================
   Bookshelf — shared front-end logic
   ---------------------------------------------------------
   This file contains:
     - mobile menu toggle
     - cart count update in the navbar
     - simple form validations (login / signup / sell)
     - the "Add to cart" / "Remove" / "Pay" actions
     - the catalog search & filters (buy.html)
   ---------------------------------------------------------
   NOTE for the back-end developer (you):
     - All data is currently kept in localStorage so the
       website is fully usable on its own. When you add PHP +
       SQL, simply replace the localStorage calls with
       fetch() calls to your endpoints. The pieces marked
       with  // TODO_BACKEND   are the spots to plug into.
   ========================================================= */


/* ---------- 1. Tiny helpers ---------- */

// safely read JSON from localStorage
function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch (e) { return fallback; }
}

// save JSON
function saveLS(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// show a small message at the bottom of the screen
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2600);
}


/* ---------- 2. Mobile menu ---------- */

function setupMenu() {
  const btn   = document.querySelector('.menu-btn');
  const links = document.querySelector('.nav-links');
  if (!btn || !links) return;

  btn.addEventListener('click', () => {
    links.classList.toggle('open');
    const i = btn.querySelector('i');
    if (i) i.className = links.classList.contains('open') ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
  });

  links.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });
}


/* ---------- 3. Cart count in the navbar ---------- */

function refreshCartCount() {
  const cart = readLS('bookshelf_cart', []);
  const span = document.querySelector('.cart-count');
  if (span) span.textContent = cart.length;
}


/* ---------- 4. Auth (signup + login) ---------- */

// very simple e-mail regex (good enough for client-side check)
const EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// is there a user currently logged in ?
function isLoggedIn() {
  return !!readLS('bookshelf_current_user', null);
}

/* Auth gate
   ---------
   If the user IS logged in -> returns true (the action can continue).
   If the user is NOT logged in -> shows a toast, remembers where the
   user wanted to go (in sessionStorage) and redirects to login.html.
   After a successful login the user is sent back to that page. */
function requireAuth(targetUrl, message) {
  if (isLoggedIn()) return true;
  if (targetUrl) sessionStorage.setItem('bookshelf_redirect', targetUrl);
  showToast(message || 'Please log in to continue.');
  setTimeout(() => { location.href = 'login.html'; }, 900);
  return false;
}

/* Intercept the Buy and Sell links (in the navbar, hero and footer)
   so that clicking them while logged-out goes to login first. */
function setupAuthGate() {
  document.querySelectorAll('a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    const isBuy  = href === 'buy.html'  || href.endsWith('/buy.html');
    const isSell = href === 'sell.html' || href.endsWith('/sell.html');
    if (!isBuy && !isSell) return;

    a.addEventListener('click', (e) => {
      if (isLoggedIn()) return;          // already logged in -> let it through
      e.preventDefault();
      requireAuth(
        isBuy ? 'buy.html' : 'sell.html',
        isBuy ? 'Please log in to browse and buy books.'
              : 'Please log in to sell a book.'
      );
    });
  });
}

// after login / signup, send the user back to where they wanted to go
function postLoginRedirect(defaultUrl) {
  const target = sessionStorage.getItem('bookshelf_redirect');
  sessionStorage.removeItem('bookshelf_redirect');
  setTimeout(() => { location.href = target || defaultUrl; }, 900);
}

function setupSignup() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // grab + clean inputs (sanitization)
    const name    = form.name.value.trim();
    const email   = form.email.value.trim().toLowerCase();
    const pwd     = form.password.value;
    const confirm = form.confirm.value;

    // reset errors
    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    let ok = true;

    if (name.length < 2) {
      form.querySelector('[data-error="name"]').textContent = 'Please enter your name.';
      ok = false;
    }
    if (!EMAIL_RX.test(email)) {
      form.querySelector('[data-error="email"]').textContent = 'Please enter a valid e-mail.';
      ok = false;
    }
    if (pwd.length < 6) {
      form.querySelector('[data-error="password"]').textContent = 'Password must be at least 6 characters.';
      ok = false;
    }
    if (pwd !== confirm) {
      form.querySelector('[data-error="confirm"]').textContent = 'Passwords do not match.';
      ok = false;
    }

    if (!ok) return;

    // check if e-mail already used (in localStorage)
    const users = readLS('bookshelf_users', []);
    if (users.find(u => u.email === email)) {
      form.querySelector('[data-error="email"]').textContent = 'This e-mail is already registered.';
      return;
    }

    // TODO_BACKEND : POST these fields to /signup.php
    users.push({ id: Date.now(), name, email, password: pwd });
    saveLS('bookshelf_users', users);
    saveLS('bookshelf_current_user', { id: users[users.length-1].id, name, email });

    showToast('Welcome to Bookshelf, ' + name + ' !');
    postLoginRedirect('index.html');
  });
}

function setupLogin() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const email = form.email.value.trim().toLowerCase();
    const pwd   = form.password.value;
    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');

    if (!EMAIL_RX.test(email)) {
      form.querySelector('[data-error="email"]').textContent = 'Please enter a valid e-mail.';
      return;
    }
    if (pwd.length < 1) {
      form.querySelector('[data-error="password"]').textContent = 'Please enter your password.';
      return;
    }

    // TODO_BACKEND : POST to /login.php
    const users = readLS('bookshelf_users', []);
    const user  = users.find(u => u.email === email && u.password === pwd);
    if (!user) {
      form.querySelector('[data-error="password"]').textContent = 'Wrong e-mail or password.';
      return;
    }

    saveLS('bookshelf_current_user', { id: user.id, name: user.name, email: user.email });
    showToast('Welcome back, ' + user.name + ' !');
    postLoginRedirect('index.html');
  });
}


/* ---------- 5. Sell a book ---------- */

function setupSellForm() {
  const form = document.getElementById('sell-form');
  if (!form) return;

  // handle the file input — show the chosen file name
  const fileInput = form.querySelector('input[type="file"]');
  const fileName  = form.querySelector('.file-name');
  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files[0]
      ? fileInput.files[0].name
      : 'no file chosen';
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const title   = form.title.value.trim();
    const author  = form.author.value.trim();
    const pages   = form.pages.value;
    const quality = form.quality.value;
    const price   = parseFloat(form.price.value);
    const info    = form.info.value.trim();
    const file    = form.cover.files[0];
    const genres  = Array.from(form.querySelectorAll('input[name="genre"]:checked')).map(c => c.value);

    form.querySelectorAll('.form-error').forEach(el => el.textContent = '');
    let ok = true;

    if (title.length < 2)            { form.querySelector('[data-error="title"]').textContent   = 'Please enter the title.'; ok = false; }
    if (author.length < 2)           { form.querySelector('[data-error="author"]').textContent  = 'Please enter the author.'; ok = false; }
    if (!file)                       { form.querySelector('[data-error="cover"]').textContent   = 'Please add a cover image.'; ok = false; }
    if (!pages)                      { form.querySelector('[data-error="pages"]').textContent   = 'Please choose a page range.'; ok = false; }
    if (genres.length === 0)         { form.querySelector('[data-error="genre"]').textContent   = 'Please pick at least one genre.'; ok = false; }
    if (!quality)                    { form.querySelector('[data-error="quality"]').textContent = 'Please choose a quality.'; ok = false; }
    if (isNaN(price) || price <= 0)  { form.querySelector('[data-error="price"]').textContent   = 'Please enter a valid price.'; ok = false; }

    if (!ok) return;

    // make sure user is logged in
    const user = readLS('bookshelf_current_user', null);
    if (!user) {
      showToast('Please log in before selling a book.');
      setTimeout(() => location.href = 'login.html', 900);
      return;
    }

    // read the cover image as a base64 string
    const reader = new FileReader();
    reader.onload = () => {
      const books = readLS('bookshelf_books', []);
      const newBook = {
        id      : Date.now(),
        userId  : user.id,
        sellerName : user.name,
        title, author, pages, quality, price, info,
        genres,
        cover   : reader.result   // base64 image
      };
      books.push(newBook);
      saveLS('bookshelf_books', books);

      // TODO_BACKEND : POST FormData(form) to /sell.php
      // The PHP script must INSERT into the books table and
      // link user_id = $_SESSION["user_id"]

      showToast('Your book is now listed for sale !');
      form.reset();
      fileName.textContent = 'no file chosen';
    };
    reader.readAsDataURL(file);
  });
}


/* ---------- 6. Catalog : search + filters + add to cart ---------- */

const SAMPLE_BOOKS = [
  { id: 1001, title: "The Brothers Karamazov", author: "F. Dostoyevsky",
    pages: "400+", quality: "Very Good", genres: ["Fiction", "Classics"],
    price: 9.50, info: "A masterpiece of philosophical fiction.",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80" },
  { id: 1002, title: "Meditations", author: "Marcus Aurelius",
    pages: "100-200", quality: "Good", genres: ["Philosophy"],
    price: 6.00, info: "Personal writings of a Roman emperor.",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80" },
  { id: 1003, title: "Clean Code", author: "Robert C. Martin",
    pages: "400+", quality: "Acceptable", genres: ["Science", "Non-fiction"],
    price: 12.00, info: "A handbook of agile software craftsmanship.",
    cover: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500&q=80" },
  { id: 1004, title: "Pride and Prejudice", author: "Jane Austen",
    pages: "300-400", quality: "New", genres: ["Fiction", "Classics", "Romance"],
    price: 7.50, info: "A timeless novel of manners.",
    cover: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=500&q=80" },
  { id: 1005, title: "Sapiens", author: "Yuval Noah Harari",
    pages: "400+", quality: "Very Good", genres: ["Non-fiction", "History"],
    price: 11.00, info: "A brief history of humankind.",
    cover: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?w=500&q=80" },
  { id: 1006, title: "The Little Prince", author: "Antoine de Saint-Exupéry",
    pages: "0-100", quality: "Good", genres: ["Children", "Classics"],
    price: 4.50, info: "A poetic tale, with watercolour illustrations by the author.",
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&q=80" },
  { id: 1007, title: "A Brief History of Time", author: "Stephen Hawking",
    pages: "200-300", quality: "Acceptable", genres: ["Science", "Non-fiction"],
    price: 8.00, info: "From the big bang to black holes.",
    cover: "https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=500&q=80" },
  { id: 1008, title: "1984", author: "George Orwell",
    pages: "300-400", quality: "Very Good", genres: ["Fiction", "Classics"],
    price: 6.50, info: "A dystopian social science fiction novel.",
    cover: "https://images.unsplash.com/photo-1485322551133-3a4c27a9d925?w=500&q=80" },
];

// merge sample books with books posted by users (in localStorage)
function loadAllBooks() {
  const userBooks = readLS('bookshelf_books', []);
  return [...SAMPLE_BOOKS, ...userBooks];
}

function setupCatalog() {
  const grid = document.getElementById('book-grid');
  if (!grid) return;

  // current filters state
  const state = {
    query : '',
    genre : 'All',
    pages : 'All',
  };

  function render() {
    let books = loadAllBooks();

    if (state.query) {
      const q = state.query.toLowerCase();
      books = books.filter(b => b.title.toLowerCase().includes(q));
    }
    if (state.genre !== 'All') {
      books = books.filter(b => b.genres.includes(state.genre));
    }
    if (state.pages !== 'All') {
      books = books.filter(b => b.pages === state.pages);
    }

    grid.innerHTML = '';

    if (books.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-book-open"></i>
          <p>No book matches these filters yet.</p>
        </div>`;
      return;
    }

    const cart = readLS('bookshelf_cart', []);
    const inCart = id => cart.some(c => c.id === id);

    books.forEach(b => {
      const card = document.createElement('article');
      card.className = 'book-card';
      card.innerHTML = `
        <div class="book-cover"><img src="${b.cover}" alt="${b.title}"></div>
        <div class="book-body">
          <span class="book-tag">${b.quality}</span>
          <h3 class="book-title">${b.title}</h3>
          <p class="book-author">by ${b.author}</p>
          <p class="book-desc">${b.info || ''}</p>
          <div class="book-foot">
            <span class="book-price">$${Number(b.price).toFixed(2)}</span>
            <button class="btn-add ${inCart(b.id) ? 'added' : ''}"
                    data-id="${b.id}" ${inCart(b.id) ? 'disabled' : ''}>
              ${inCart(b.id) ? 'In cart' : 'Add to cart'}
            </button>
          </div>
        </div>`;
      grid.appendChild(card);
    });

    // attach click handlers on the new buttons
    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        // login required before adding anything to the cart
        if (!requireAuth('buy.html', 'Please log in to add books to your cart.')) return;

        const id = Number(btn.dataset.id);
        const book = loadAllBooks().find(b => b.id === id);
        if (!book) return;

        const cart = readLS('bookshelf_cart', []);
        if (cart.some(c => c.id === id)) return;
        cart.push(book);
        saveLS('bookshelf_cart', cart);

        // TODO_BACKEND : you can also POST to /cart.php here
        refreshCartCount();
        showToast('"' + book.title + '" added to your cart');
        render();
      });
    });
  }

  // search input
  const search = document.getElementById('search-input');
  if (search) search.addEventListener('input', () => {
    state.query = search.value;
    render();
  });

  // genre filter buttons
  document.querySelectorAll('[data-genre]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-genre]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.genre = btn.dataset.genre;
      render();
    });
  });

  // page-range select
  const pagesSelect = document.getElementById('pages-filter');
  if (pagesSelect) pagesSelect.addEventListener('change', () => {
    state.pages = pagesSelect.value;
    render();
  });

  render();
}


/* ---------- 7. Cart page ---------- */

function setupCartPage() {
  const list  = document.getElementById('cart-list');
  const total = document.getElementById('cart-total');
  if (!list) return;

  function render() {
    const cart = readLS('bookshelf_cart', []);
    list.innerHTML = '';

    if (cart.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-cart-shopping"></i>
          <p>Your cart is empty.<br>Browse the catalog to find your next read.</p>
          <a href="buy.html" class="btn" style="margin-top:1rem">Browse books</a>
        </div>`;
      total.textContent = '$0.00';
      document.getElementById('cart-pay').disabled = true;
      return;
    }

    let sum = 0;
    cart.forEach(b => {
      sum += Number(b.price);
      const item = document.createElement('div');
      item.className = 'cart-item';
      item.innerHTML = `
        <img src="${b.cover}" alt="${b.title}">
        <div>
          <h4>${b.title}</h4>
          <p>by ${b.author}</p>
          <div class="price">$${Number(b.price).toFixed(2)}</div>
        </div>
        <button class="remove" data-id="${b.id}" title="remove from cart">
          <i class="fa-solid fa-trash-can"></i>
        </button>`;
      list.appendChild(item);
    });

    total.textContent = '$' + sum.toFixed(2);
    document.getElementById('cart-pay').disabled = false;

    list.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        const newCart = readLS('bookshelf_cart', []).filter(c => c.id !== id);
        saveLS('bookshelf_cart', newCart);
        refreshCartCount();
        showToast('Removed from cart');
        render();
      });
    });
  }

  render();

  // pay button
  document.getElementById('cart-pay').addEventListener('click', () => {
    const user = readLS('bookshelf_current_user', null);
    if (!user) {
      showToast('Please log in to pay.');
      setTimeout(() => location.href = 'login.html', 900);
      return;
    }

    const cart = readLS('bookshelf_cart', []);
    if (cart.length === 0) return;

    // create "commande" rows
    const orders = readLS('bookshelf_commandes', []);
    cart.forEach(b => {
      orders.push({
        id      : Date.now() + Math.random(),
        userId  : user.id,
        bookId  : b.id,
        date    : new Date().toISOString()
      });
    });
    saveLS('bookshelf_commandes', orders);

    // remove the bought books from the user-listed catalog
    const userBooks = readLS('bookshelf_books', []);
    const boughtIds = cart.map(c => c.id);
    const remaining = userBooks.filter(b => !boughtIds.includes(b.id));
    saveLS('bookshelf_books', remaining);

    // empty the cart
    saveLS('bookshelf_cart', []);
    refreshCartCount();

    // TODO_BACKEND : here you should POST the cart to /pay.php
    //   - INSERT each (user_id, book_id) into the `commande` table
    //   - DELETE the bought books from `books`
    //   - return success
    showToast('Payment confirmed — happy reading !');
    setTimeout(render, 600);
  });
}


/* ---------- 8. Mark active nav link ---------- */

function markActiveLink() {
  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href === file || (file === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}


/* ---------- 9. Page boot ---------- */

document.addEventListener('DOMContentLoaded', () => {
  setupMenu();
  refreshCartCount();
  markActiveLink();
  setupAuthGate();
  setupSignup();
  setupLogin();
  setupSellForm();
  setupCatalog();
  setupCartPage();
});
