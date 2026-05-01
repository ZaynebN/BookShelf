/* Bookshelf — all data stored in localStorage */

const get  = id  => document.getElementById(id);
const all  = sel => document.querySelectorAll(sel);
const load = k   => JSON.parse(localStorage.getItem(k)) || [];
const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

/* ── toast ── */
function toast(msg) {
  let t = document.querySelector('.toast') ||
          document.body.appendChild(Object.assign(document.createElement('div'), {className:'toast'}));
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── cart count in navbar ── */
function updateCartCount() {
  const el = document.querySelector('.cart-count');
  if (el) el.textContent = load('cart').length;
}

/* ── mobile menu ── */
const menuBtn = document.querySelector('.menu-btn');
const navLinks = document.querySelector('.nav-links');
if (menuBtn) menuBtn.onclick = () => navLinks.classList.toggle('open');

/* ── active nav link ── */
const page = location.pathname.split('/').pop() || 'index.html';
all('.nav-links a').forEach(a => {
  if (a.getAttribute('href') === page) a.classList.add('active');
});

/* ── SIGNUP ── */
if (get('signup-form')) {
  get('signup-form').onsubmit = e => {
    e.preventDefault();
    const f = e.target;
    const name = f.name.value.trim(), email = f.email.value.trim().toLowerCase();
    const pwd  = f.password.value,    conf  = f.confirm.value;

    if (name.length < 2)      return alert('Enter your name.');
    if (!email.includes('@')) return alert('Enter a valid e-mail.');
    if (pwd.length < 6)       return alert('Password must be 6+ characters.');
    if (pwd !== conf)         return alert('Passwords do not match.');

    const users = load('users');
    if (users.find(u => u.email === email)) return alert('E-mail already used.');

    const user = { id: Date.now(), name, email, password: pwd };
    users.push(user);
    save('users', users);
    save('current_user', user);
    toast('Welcome, ' + name + '!');
    setTimeout(() => location.href = 'index.html', 800);
  };
}

/* ── LOGIN ── */
if (get('login-form')) {
  get('login-form').onsubmit = e => {
    e.preventDefault();
    const f     = e.target;
    const email = f.email.value.trim().toLowerCase();
    const pwd   = f.password.value;
    const user  = load('users').find(u => u.email === email && u.password === pwd);
    if (!user) return alert('Wrong e-mail or password.');
    save('current_user', user);
    toast('Welcome back, ' + user.name + '!');
    setTimeout(() => location.href = 'index.html', 800);
  };
}

/* ── SELL ── */
if (get('sell-form')) {
  const fileInput = document.querySelector('input[type=file]');
  const fileLabel = document.querySelector('.file-name');
  fileInput.onchange = () => fileLabel.textContent = fileInput.files[0]?.name || 'no file chosen';

  get('sell-form').onsubmit = e => {
    e.preventDefault();
    const f       = e.target;
    const title   = f.title.value.trim(), author = f.author.value.trim();
    const pages   = f.pages.value,        quality = f.quality.value;
    const price   = parseFloat(f.price.value);
    const genres  = [...f.querySelectorAll('input[name=genre]:checked')].map(c => c.value);
    const file    = fileInput.files[0];

    if (!title)              return alert('Enter the title.');
    if (!author)             return alert('Enter the author.');
    if (!file)               return alert('Add a cover image.');
    if (!pages)              return alert('Choose a page range.');
    if (!genres.length)      return alert('Pick at least one genre.');
    if (!quality)            return alert('Choose a quality.');
    if (!price || price < 0) return alert('Enter a valid price.');

    const reader = new FileReader();
    reader.onload = () => {
      const user  = JSON.parse(localStorage.getItem('current_user'));
      const books = load('user_books');
      books.push({ id: Date.now(), userId: user?.id, title, author, pages, quality, price,
                   genres, info: f.info.value.trim(), cover: reader.result });
      save('user_books', books);
      toast('Book listed!');
      e.target.reset();
      fileLabel.textContent = 'no file chosen';
    };
    reader.readAsDataURL(file);
  };
}

/* ── CATALOG ── */
const BOOKS = [
  { id:1, title:'The Brothers Karamazov', author:'F. Dostoyevsky', pages:'400+',    quality:'Very Good', genres:['Fiction','Classics'],  price:9.50, info:'A masterpiece of philosophical fiction.',  cover:'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=500&q=80' },
  { id:2, title:'Meditations',            author:'Marcus Aurelius', pages:'100-200', quality:'Good',      genres:['Philosophy'],           price:6.00, info:'Personal writings of a Roman emperor.',   cover:'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=500&q=80' },
  { id:3, title:'Pride and Prejudice',    author:'Jane Austen',     pages:'300-400', quality:'New',       genres:['Fiction','Romance'],     price:7.50, info:'A timeless novel of manners.',           cover:'https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=500&q=80' },
  { id:4, title:'1984',                   author:'George Orwell',   pages:'300-400', quality:'Very Good', genres:['Fiction','Classics'],    price:6.50, info:'A dystopian social science fiction novel.', cover:'https://images.unsplash.com/photo-1485322551133-3a4c27a9d925?w=500&q=80' },
];

if (get('book-grid')) {
  let q = '', genre = 'All', pages = 'All';

  function renderCatalog() {
    let books = [...BOOKS, ...load('user_books')];
    if (q)           books = books.filter(b => b.title.toLowerCase().includes(q.toLowerCase()));
    if (genre !== 'All') books = books.filter(b => b.genres.includes(genre));
    if (pages !== 'All') books = books.filter(b => b.pages === pages);

    const cart = load('cart'), inCart = id => cart.some(c => c.id === id);
    get('book-grid').innerHTML = books.length ? books.map(b => `
      <article class="book-card">
        <div class="book-cover"><img src="${b.cover}" alt="${b.title}"></div>
        <div class="book-body">
          <span class="book-tag">${b.quality}</span>
          <h3 class="book-title">${b.title}</h3>
          <p class="book-author">by ${b.author}</p>
          <p class="book-desc">${b.info}</p>
          <div class="book-foot">
            <span class="book-price">$${Number(b.price).toFixed(2)}</span>
            <button class="btn-add ${inCart(b.id)?'added':''}" data-id="${b.id}" ${inCart(b.id)?'disabled':''}>
              ${inCart(b.id) ? 'In cart' : 'Add to cart'}
            </button>
          </div>
        </div>
      </article>`).join('')
      : '<div class="empty-state"><i class="fa-solid fa-book-open"></i><p>No books match.</p></div>';

    get('book-grid').querySelectorAll('.btn-add').forEach(btn => {
      btn.onclick = () => {
        const book = [...BOOKS, ...load('user_books')].find(b => b.id === Number(btn.dataset.id));
        const cart = load('cart');
        cart.push(book); save('cart', cart); updateCartCount();
        toast('"' + book.title + '" added to cart'); renderCatalog();
      };
    });
  }

  get('search-input').oninput  = e => { q     = e.target.value; renderCatalog(); };
  get('pages-filter').onchange = e => { pages = e.target.value; renderCatalog(); };
  all('[data-genre]').forEach(btn => btn.onclick = () => {
    all('[data-genre]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); genre = btn.dataset.genre; renderCatalog();
  });
  renderCatalog();
}

/* ── CART ── */
if (get('cart-list')) {
  function renderCart() {
    const cart = load('cart');
    const list = get('cart-list'), payBtn = get('cart-pay'), totalEl = get('cart-total');

    if (!cart.length) {
      list.innerHTML = '<div class="empty-state"><i class="fa-solid fa-cart-shopping"></i><p>Your cart is empty.</p><a href="buy.html" class="btn" style="margin-top:1rem">Browse books</a></div>';
      totalEl.textContent = '$0.00'; payBtn.disabled = true; return;
    }

    let sum = 0;
    list.innerHTML = cart.map(b => { sum += Number(b.price); return `
      <div class="cart-item">
        <img src="${b.cover}" alt="${b.title}">
        <div><h4>${b.title}</h4><p>by ${b.author}</p><div class="price">$${Number(b.price).toFixed(2)}</div></div>
        <button class="remove" data-id="${b.id}"><i class="fa-solid fa-trash-can"></i></button>
      </div>`;}).join('');
    totalEl.textContent = '$' + sum.toFixed(2); payBtn.disabled = false;

    list.querySelectorAll('.remove').forEach(btn => {
      btn.onclick = () => {
        save('cart', load('cart').filter(c => c.id !== Number(btn.dataset.id)));
        updateCartCount(); toast('Removed'); renderCart();
      };
    });
  }

  get('cart-pay').onclick = () => {
    const cart = load('cart'); if (!cart.length) return;
    const user = JSON.parse(localStorage.getItem('current_user'));
    const orders = load('commandes');
    cart.forEach(b => orders.push({ userId: user?.id, bookId: b.id, date: new Date().toISOString() }));
    save('commandes', orders);
    save('user_books', load('user_books').filter(b => !cart.some(c => c.id === b.id)));
    save('cart', []); updateCartCount(); toast('Payment confirmed!'); renderCart();
  };

  renderCart();
}

updateCartCount();
