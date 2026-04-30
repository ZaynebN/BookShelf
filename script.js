/* =========================================================
   Bookshelf — front-end logic (kept short & simple)
   All data lives in localStorage so the site works alone.
   When you wire it to PHP later, replace the localStorage
   calls (saveLS / readLS) with fetch() to your endpoints.
   ========================================================= */


/* ---------- Tiny helpers ---------- */

const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const readLS  = (key, fallback) => JSON.parse(localStorage.getItem(key)) || fallback;
const saveLS  = (key, value)    => localStorage.setItem(key, JSON.stringify(value));

function showToast(msg) {
  let t = $('.toast') || document.body.appendChild(Object.assign(document.createElement('div'), { className: 'toast' }));
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}


/* ---------- Auth (login required for Buy / Sell / Add to cart) ---------- */

const isLoggedIn = () => !!readLS('bookshelf_current_user', null);

function requireAuth(target, msg) {
  if (isLoggedIn()) return true;
  if (target) sessionStorage.setItem('bookshelf_redirect', target);
  showToast(msg || 'Please log in first.');
  setTimeout(() => location.href = 'login.html', 800);
  return false;
}

function setupAuthGate() {
  $$('a').forEach(a => {
    const href = (a.getAttribute('href') || '').toLowerCase();
    if (href !== 'buy.html' && href !== 'sell.html') return;
    a.addEventListener('click', e => {
      if (isLoggedIn()) return;
      e.preventDefault();
      requireAuth(href, 'Please log in to ' + (href === 'buy.html' ? 'browse books.' : 'sell a book.'));
    });
  });
}

function afterLogin(name) {
  showToast('Welcome, ' + name + ' !');
  const target = sessionStorage.getItem('bookshelf_redirect') || 'index.html';
  sessionStorage.removeItem('bookshelf_redirect');
  setTimeout(() => location.href = target, 800);
}


/* ---------- Signup ---------- */

function setupSignup() {
  const form = $('#signup-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const name    = form.name.value.trim();
    const email   = form.email.value.trim().toLowerCase();
    const pwd     = form.password.value;
    const confirm = form.confirm.value;

    if (name.length < 2)        return alert('Please enter your name.');
    if (!email.includes('@'))   return alert('Please enter a valid e-mail.');
    if (pwd.length < 6)         return alert('Password must be at least 6 characters.');
    if (pwd !== confirm)        return alert('Passwords do not match.');

    const users = readLS('bookshelf_users', []);
    if (users.find(u => u.email === email)) return alert('This e-mail is already registered.');

    const user = { id: Date.now(), name, email, password: pwd };
    users.push(user);
    saveLS('bookshelf_users', users);
    saveLS('bookshelf_current_user', user);
    afterLogin(name);
  });
}


/* ---------- Login ---------- */

function setupLogin() {
  const form = $('#login-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const email = form.email.value.trim().toLowerCase();
    const pwd   = form.password.value;

    const user = readLS('bookshelf_users', []).find(u => u.email === email && u.password === pwd);
    if (!user) return alert('Wrong e-mail or password.');

    saveLS('bookshelf_current_user', user);
    afterLogin(user.name);
  });
}


/* ---------- Sell a book ---------- */

function setupSellForm() {
  const form = $('#sell-form');
  if (!form) return;

  const fileInput = form.querySelector('input[type="file"]');
  const fileName  = form.querySelector('.file-name');
  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files[0] ? fileInput.files[0].name : 'no file chosen';
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!requireAuth('sell.html', 'Please log in to sell a book.')) return;

    const title   = form.title.value.trim();
    const author  = form.author.value.trim();
    const pages   = form.pages.value;
    const quality = form.quality.value;
    const price   = parseFloat(form.price.value);
    const info    = form.info.value.trim();
    const file    = form.cover.files[0];
    const genres  = [...form.querySelectorAll('input[name="genre"]:checked')].map(c => c.value);

    if (title.length < 2)            return alert('Please enter the title.');
    if (author.length < 2)           return alert('Please enter the author.');
    if (!file)                       return alert('Please add a cover image.');
    if (!pages)                      return alert('Please choose a page range.');
    if (genres.length === 0)         return alert('Please pick at least one genre.');
    if (!quality)                    return alert('Please choose a quality.');
    if (isNaN(price) || price <= 0)  return alert('Please enter a valid price.');

    const reader = new FileReader();
    reader.onload = () => {
      const user  = readLS('bookshelf_current_user', null);
      const books = readLS('bookshelf_books', []);
      books.push({
        id: Date.now(), userId: user.id, sellerName: user.name,
        title, author, pages, quality, price, info, genres,
        cover: reader.result
      });
      saveLS('bookshelf_books', books);
      showToast('Your book is now listed for sale !');
      form.reset();
      fileName.textContent = 'no file chosen';
    };
    reader.readAsDataURL(file);
  });
}


/* ---------- Sample catalog (shown until users add their own) ---------- */

const SAMPLE_BOOKS = [
  { id: 1, title: "The Brothers Karamazov", author: "F. Dostoyevsky",
    pages: "400+", quality: "Very Good", genres: ["Fiction", "Classics"],
    price: 9.50, info: "A masterpiece of philosophical fiction.",
    cover: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80" },
  { id: 2, title: "Meditations", author: "Marcus Aurelius",
    pages: "100-200", quality: "Good", genres: ["Philosophy"],
    price: 6.00, info: "Personal writings of a Roman emperor.",
    cover: "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80" },
  { id: 3, title: "Pride and Prejudice", author: "Jane Austen",
    pages: "300-400", quality: "New", genres: ["Fiction", "Classics", "Romance"],
    price: 7.50, info: "A timeless novel of manners.",
    cover: "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=500&q=80" },
  { id: 4, title: "1984", author: "George Orwell",
    pages: "300-400", quality: "Very Good", genres: ["Fiction", "Classics"],
    price: 6.50, info: "A dystopian social science fiction novel.",
    cover: "https://images.unsplash.com/photo-1485322551133-3a4c27a9d925?w=500&q=80" },
];

const allBooks = () => [...SAMPLE_BOOKS, ...readLS('bookshelf_books', [])];


/* ---------- Catalog (buy page) ---------- */

function setupCatalog() {
  const grid = $('#book-grid');
  if (!grid) return;

  let query = '', genre = 'All', pages = 'All';

  function render() {
    let books = allBooks();
    if (query)         books = books.filter(b => b.title.toLowerCase().includes(query.toLowerCase()));
    if (genre !== 'All') books = books.filter(b => b.genres.includes(genre));
    if (pages !== 'All') books = books.filter(b => b.pages === pages);

    const cart = readLS('bookshelf_cart', []);
    const inCart = id => cart.some(c => c.id === id);

    if (books.length === 0) {
      grid.innerHTML = '<div class="empty-state"><i class="fa-solid fa-book-open"></i><p>No book matches these filters.</p></div>';
      return;
    }

    grid.innerHTML = books.map(b => `
      <article class="book-card">
        <div class="book-cover"><img src="${b.cover}" alt="${b.title}"></div>
        <div class="book-body">
          <span class="book-tag">${b.quality}</span>
          <h3 class="book-title">${b.title}</h3>
          <p class="book-author">by ${b.author}</p>
          <p class="book-desc">${b.info || ''}</p>
          <div class="book-foot">
            <span class="book-price">$${Number(b.price).toFixed(2)}</span>
            <button class="btn-add ${inCart(b.id) ? 'added' : ''}" data-id="${b.id}" ${inCart(b.id) ? 'disabled' : ''}>
              ${inCart(b.id) ? 'In cart' : 'Add to cart'}
            </button>
          </div>
        </div>
      </article>`).join('');

    grid.querySelectorAll('.btn-add').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!requireAuth('buy.html', 'Please log in to add books to your cart.')) return;
        const book = allBooks().find(b => b.id === Number(btn.dataset.id));
        const cart = readLS('bookshelf_cart', []);
        if (!book || cart.some(c => c.id === book.id)) return;
        cart.push(book);
        saveLS('bookshelf_cart', cart);
        refreshCartCount();
        showToast('"' + book.title + '" added to your cart');
        render();
      });
    });
  }

  $('#search-input')?.addEventListener('input', e => { query = e.target.value; render(); });
  $('#pages-filter')?.addEventListener('change', e => { pages = e.target.value; render(); });
  $$('[data-genre]').forEach(btn => btn.addEventListener('click', () => {
    $$('[data-genre]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    genre = btn.dataset.genre;
    render();
  }));

  render();
}


/* ---------- Cart page ---------- */

function refreshCartCount() {
  const span = $('.cart-count');
  if (span) span.textContent = readLS('bookshelf_cart', []).length;
}

function setupCartPage() {
  const list = $('#cart-list');
  if (!list) return;
  const total = $('#cart-total');
  const payBtn = $('#cart-pay');

  function render() {
    const cart = readLS('bookshelf_cart', []);

    if (cart.length === 0) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>Your cart is empty.<br>Browse the catalog to find your next read.</p><a href="buy.html" class="btn" style="margin-top:1rem">Browse books</a></div>';
      total.textContent = '$0.00';
      payBtn.disabled = true;
      return;
    }

    let sum = 0;
    list.innerHTML = cart.map(b => {
      sum += Number(b.price);
      return `
        <div class="cart-item">
          <img src="${b.cover}" alt="${b.title}">
          <div>
            <h4>${b.title}</h4>
            <p>by ${b.author}</p>
            <div class="price">$${Number(b.price).toFixed(2)}</div>
          </div>
          <button class="remove" data-id="${b.id}" title="remove from cart">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>`;
    }).join('');
    total.textContent = '$' + sum.toFixed(2);
    payBtn.disabled = false;

    list.querySelectorAll('.remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = Number(btn.dataset.id);
        saveLS('bookshelf_cart', readLS('bookshelf_cart', []).filter(c => c.id !== id));
        refreshCartCount();
        showToast('Removed from cart');
        render();
      });
    });
  }

  payBtn.addEventListener('click', () => {
    if (!requireAuth('cart.html', 'Please log in to pay.')) return;
    const cart = readLS('bookshelf_cart', []);
    if (cart.length === 0) return;

    // create order rows (the "commande" table)
    const user = readLS('bookshelf_current_user', null);
    const orders = readLS('bookshelf_commandes', []);
    cart.forEach(b => orders.push({ userId: user.id, bookId: b.id, date: new Date().toISOString() }));
    saveLS('bookshelf_commandes', orders);

    // remove the bought books from the user-listed catalog
    const ids = cart.map(c => c.id);
    saveLS('bookshelf_books', readLS('bookshelf_books', []).filter(b => !ids.includes(b.id)));

    saveLS('bookshelf_cart', []);
    refreshCartCount();
    showToast('Payment confirmed — happy reading !');
    render();
  });

  render();
}


/* ---------- Navbar : mobile menu + active link ---------- */

function setupNavbar() {
  const btn = $('.menu-btn'), links = $('.nav-links');
  if (btn && links) btn.addEventListener('click', () => links.classList.toggle('open'));

  const file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  $$('.nav-links a').forEach(a => {
    if ((a.getAttribute('href') || '').toLowerCase() === file) a.classList.add('active');
  });
}


/* ---------- Boot ---------- */

document.addEventListener('DOMContentLoaded', () => {
  setupNavbar();
  refreshCartCount();
  setupAuthGate();
  setupSignup();
  setupLogin();
  setupSellForm();
  setupCatalog();
  setupCartPage();
});

