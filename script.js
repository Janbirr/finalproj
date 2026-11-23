// Edit the packages below. amount = in-game currency, price = PHP.
// Example: 50 = 56 PHP. The other tiers use the same rate (1 = 1.12 PHP) as placeholders.
var games = [
  { id: "mlbb", name: "Mobile Legends: Bang Bang", currency: "Diamonds", icon: "⚔️",
    packages: [{ amount: 50, price: 56 }, { amount: 100, price: 112 }, { amount: 250, price: 280 }, { amount: 500, price: 560 }, { amount: 1000, price: 1120 }] },
  { id: "codm", name: "Call of Duty Mobile", currency: "CP", icon: "🎯",
    packages: [{ amount: 50, price: 56 }, { amount: 100, price: 112 }, { amount: 250, price: 280 }, { amount: 500, price: 560 }, { amount: 1000, price: 1120 }] },
  { id: "hok", name: "Honor of Kings", currency: "Tokens", icon: "👑",
    packages: [{ amount: 50, price: 56 }, { amount: 100, price: 112 }, { amount: 250, price: 280 }, { amount: 500, price: 560 }, { amount: 1000, price: 1120 }] },
  { id: "pubgm", name: "PUBG Mobile", currency: "UC", icon: "🔫",
    packages: [{ amount: 50, price: 56 }, { amount: 100, price: 112 }, { amount: 250, price: 280 }, { amount: 500, price: 560 }, { amount: 1000, price: 1120 }] }
];

function readData(key, defaultValue) {
  try {
    var savedText = localStorage.getItem(key);
    if (savedText === null) return defaultValue;
    return JSON.parse(savedText);
  } catch (error) {
    console.log("Saved data could not be read. Default data will be used.");
    return defaultValue;
  }
}

function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.log("Data could not be saved.");
    return false;
  }
}


function getCart() {
  var cart = readData("topupCart", []);
  if (!Array.isArray(cart)) return [];
  var valid = [];
  for (var i = 0; i < cart.length; i++) {
    if (typeof cart[i].price === "number" && cart[i].qty) valid.push(cart[i]);
  }
  return valid;
}


function getOrders() {
  var orders = readData("topupOrders", []);
  return Array.isArray(orders) ? orders : [];
}


function showTotal(total) {
  return typeof total === "number" ? money(total) : total;
}

function money(amount) {
  return "₱" + Number(amount).toFixed(2);
}
document.addEventListener("DOMContentLoaded", function () {
  var page = document.body.getAttribute("data-page");
  if (page === "games") showGames();
  if (page === "cart") {
    showCart();
    setupCheckout();
    setupOrderFilters();
    showOrders();
  }
});

function showGames() {
  var area = document.getElementById("gamesContainer");
  if (!area) return;

  var html = "";
  for (var i = 0; i < games.length; i++) {
    var game = games[i];
    html += '<article class="game-card">';
    html += '<div class="game-select">';
    html += '<span class="game-icon">' + game.icon + '</span>';
    html += '<strong>' + game.name + '</strong>';
    html += '<span>Currency: ' + game.currency + '</span>';
    html += '</div>';
    html += '<div class="custom-amount">';
    html += '<label for="package-' + game.id + '">Choose a package</label>';
    html += '<select id="package-' + game.id + '">';
    for (var p = 0; p < game.packages.length; p++) {
      var pack = game.packages[p];
      html += '<option value="' + pack.amount + '">' + pack.amount + ' ' + game.currency + ' = ' + money(pack.price) + '</option>';
    }
    html += '</select>';
    html += '<button type="button" onclick="addToCart(\'' + game.id + '\')">Add to Cart</button>';
    html += '<div id="cartMsg-' + game.id + '" aria-live="polite"></div>';
    html += '</div></article>';
  }
  area.innerHTML = html;
}

function showCartMessage(gameId, text, isError) {
  var box = document.getElementById("cartMsg-" + gameId);
  if (!box) return;
  box.textContent = text;
  box.className = isError ? "message error" : "message";
}

function findGame(gameId) {
  for (var i = 0; i < games.length; i++) {
    if (games[i].id === gameId) return games[i];
  }
  return null;
}

function addToCart(gameId) {
  var selectedGame = findGame(gameId);
  if (!selectedGame) return;

  var amount = Number(document.getElementById("package-" + gameId).value);
  var pack = null;
  for (var i = 0; i < selectedGame.packages.length; i++) {
    if (selectedGame.packages[i].amount === amount) pack = selectedGame.packages[i];
  }
  if (!pack) {
    showCartMessage(gameId, "Please choose a valid package.", true);
    return;
  }

  var cart = getCart();
  var existing = null;
  for (var j = 0; j < cart.length; j++) {
    if (cart[j].gameId === gameId && cart[j].amount === amount) existing = cart[j];
  }

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({
      gameId: selectedGame.id,
      gameName: selectedGame.name,
      currency: selectedGame.currency,
      amount: pack.amount,
      price: pack.price,
      qty: 1
    });
  }

  if (saveData("topupCart", cart)) showCartMessage(gameId, pack.amount + " " + selectedGame.currency + " (" + money(pack.price) + ") added to cart.", false);
  else showCartMessage(gameId, "There was a problem saving your cart.", true);
}

function cartTotal(cart) {
  var total = 0;
  for (var i = 0; i < cart.length; i++) total += cart[i].price * cart[i].qty;
  return total;
}

function showCart() {
  var area = document.getElementById("cartContents");
  var totalArea = document.getElementById("cartTotal");
  if (!area) return;

  var cart = getCart();
  if (cart.length === 0) {
    area.innerHTML = '<p class="message">Your cart is empty. <a href="games.html">Browse games</a> to add a package.</p>';
    totalArea.textContent = money(0);
    updateZoneField();
    return;
  }

  var html = '<div class="table-wrap"><table><thead><tr><th>Game</th><th>Package</th><th>Price</th><th>Qty</th><th>Subtotal</th><th>Action</th></tr></thead><tbody>';
  for (var i = 0; i < cart.length; i++) {
    var item = cart[i];
    var args = "'" + item.gameId + "', " + item.amount;
    html += '<tr><td>' + item.gameName + '</td><td>' + item.amount + ' ' + item.currency + '</td><td>' + money(item.price) + '</td>';
    html += '<td><div class="quantity-controls"><button type="button" class="secondary" onclick="changeQty(' + args + ', -1)">-</button><span>' + item.qty + '</span><button type="button" class="secondary" onclick="changeQty(' + args + ', 1)">+</button></div></td>';
    html += '<td>' + money(item.price * item.qty) + '</td>';
    html += '<td><button class="danger" type="button" onclick="removeItem(' + args + ')">Remove</button></td></tr>';
  }

  html += '</tbody></table></div>';
  area.innerHTML = html;
  totalArea.textContent = money(cartTotal(cart));
  updateZoneField();
}

function changeQty(gameId, amount, change) {
  var cart = getCart();
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].gameId === gameId && cart[i].amount === amount) {
      cart[i].qty += change;
      if (cart[i].qty < 1) cart[i].qty = 1;
      if (cart[i].qty > 99) cart[i].qty = 99;
    }
  }
  saveData("topupCart", cart);
  showCart();
}

function removeItem(gameId, amount) {
  var cart = getCart();
  var updatedCart = [];
  for (var i = 0; i < cart.length; i++) {
    if (!(cart[i].gameId === gameId && cart[i].amount === amount)) updatedCart.push(cart[i]);
  }
  saveData("topupCart", updatedCart);
  showCart();
}

function cartHasMLBB() {
  var cart = getCart();
  for (var i = 0; i < cart.length; i++) {
    if (cart[i].gameId === "mlbb") return true;
  }
  return false;
}

function updateZoneField() {
  var zoneField = document.getElementById("zoneField");
  if (zoneField) zoneField.hidden = !cartHasMLBB();
}

function setupCheckout() {
  var form = document.getElementById("orderForm");
  if (!form) return;
  updateZoneField();

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    var cart = getCart();

    if (cart.length === 0) {
      showMessage("Your cart is empty. Add a package before placing an order.", true);
      return;
    }

    var playerName = document.getElementById("playerName").value.trim();
    var gameId = document.getElementById("gameId").value.trim();
    var zoneId = document.getElementById("zoneId").value.trim();
    var email = document.getElementById("email").value.trim();
    var payment = document.getElementById("paymentMethod").value;

    if (playerName === "") {
      showMessage("Please enter your Player Name.", true);
      return;
    }
    if (gameId === "") {
      showMessage("Please enter your Game ID / User ID.", true);
      return;
    }
    if (!/^\d+$/.test(gameId)) {
      showMessage("Game ID / User ID must contain numbers only.", true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showMessage("Please enter a valid email address.", true);
      return;
    }
    if (cartHasMLBB() && zoneId === "") {
      showMessage("Zone ID is required for Mobile Legends: Bang Bang.", true);
      return;
    }
    if (payment === "") {
      showMessage("Please choose a payment method.", true);
      return;
    }

    var total = cartTotal(cart);

    var orders = getOrders();
    var nextNumber = readData("topupNextReference", 1);
    if (typeof nextNumber !== "number" || nextNumber < 1) nextNumber = 1;

    var order = {
      reference: "TU-" + String(nextNumber).padStart(4, "0"),
      playerName: playerName,
      gameId: gameId,
      zoneId: zoneId,
      email: email,
      payment: payment,
      items: cart,
      total: total,
      status: "Pending",
      date: new Date().toLocaleString()
    };

    orders.push(order);
    if (!saveData("topupOrders", orders)) {
      showMessage("Could not save your order. Please try again.", true);
      return;
    }

    saveData("topupNextReference", nextNumber + 1);
    saveData("topupLatestOrder", order);
    saveData("topupCart", []);
    form.reset();
    showCart();
    showConfirmation(order);
    showOrders();
    showMessage("Your order was saved successfully.", false);
  });
}

function showMessage(message, isError) {
  var box = document.getElementById("formMessage");
  box.textContent = message;
  box.className = isError ? "message error" : "message";
}

function showConfirmation(order) {
  var section = document.getElementById("confirmationSection");
  var area = document.getElementById("summaryDetails");
  var html = '<h3>Reference Number: ' + order.reference + '</h3>';
  html += '<p><strong>Status:</strong> ' + order.status + '</p>';
  html += '<p><strong>Player Name:</strong> ' + order.playerName + '</p>';
  html += '<p><strong>Game ID / User ID:</strong> ' + order.gameId + '</p>';
  if (order.zoneId) html += '<p><strong>Server / Zone ID:</strong> ' + order.zoneId + '</p>';
  html += '<p><strong>Email:</strong> ' + order.email + '</p>';
  html += '<p><strong>Payment:</strong> ' + order.payment + ' (simulated)</p>';
  html += '<p><strong>Date:</strong> ' + order.date + '</p><h3>Items</h3><ul>';
  for (var i = 0; i < order.items.length; i++) {
    var item = order.items[i];
    html += '<li>' + item.gameName + ' - ' + item.amount + ' ' + item.currency + ' x' + item.qty + ' (' + money(item.price * item.qty) + ')</li>';
  }
  html += '</ul><h3>Total: ' + showTotal(order.total) + '</h3>';
  area.innerHTML = html;
  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth" });
}

function setupOrderFilters() {
  document.getElementById("orderSearch").addEventListener("input", showOrders);
  document.getElementById("gameFilter").addEventListener("change", showOrders);
  document.getElementById("statusFilter").addEventListener("change", showOrders);
}

function showOrders() {
  var area = document.getElementById("ordersTable");
  if (!area) return;

  var orders = getOrders();
  var searchText = document.getElementById("orderSearch").value.toLowerCase();
  var gameValue = document.getElementById("gameFilter").value;
  var statusValue = document.getElementById("statusFilter").value;
  var filtered = [];

  for (var i = 0; i < orders.length; i++) {
    var order = orders[i];
    var matchesSearch = order.reference.toLowerCase().indexOf(searchText) !== -1 || order.playerName.toLowerCase().indexOf(searchText) !== -1;
    var matchesGame = gameValue === "all";
    for (var j = 0; j < order.items.length; j++) {
      if (order.items[j].gameId === gameValue) matchesGame = true;
    }
    var matchesStatus = statusValue === "all" || order.status === statusValue;
    if (matchesSearch && matchesGame && matchesStatus) filtered.push(order);
  }

  if (filtered.length === 0) {
    area.innerHTML = '<p class="message">No orders found.</p>';
    return;
  }

  var html = '<div class="table-wrap"><table><thead><tr><th>Reference</th><th>Player</th><th>Items</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead><tbody>';
  for (var k = 0; k < filtered.length; k++) {
    var current = filtered[k];
    var itemNames = [];
    for (var m = 0; m < current.items.length; m++) itemNames.push(current.items[m].gameName + " - " + current.items[m].amount + " " + current.items[m].currency + " x" + (current.items[m].qty || 1));
    html += '<tr><td>' + current.reference + '</td><td>' + current.playerName + '</td><td>' + itemNames.join("<br>") + '</td>';
    html += '<td>' + showTotal(current.total) + '</td><td>' + current.status + '</td><td>';
    html += '<button type="button" onclick="viewOrder(\'' + current.reference + '\')">View</button> ';
    html += '<button type="button" class="secondary" onclick="updateStatus(\'' + current.reference + '\')">Update Status</button> ';
    html += '<button type="button" class="danger" onclick="deleteOrder(\'' + current.reference + '\')">Delete</button>';
    html += '</td></tr>';
  }
  html += '</tbody></table></div>';
  area.innerHTML = html;
}

function viewOrder(reference) {
  var orders = getOrders();
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].reference === reference) {
      showConfirmation(orders[i]);
      return;
    }
  }
}

function updateStatus(reference) {
  var orders = getOrders();
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].reference === reference) {
      orders[i].status = orders[i].status === "Pending" ? "Completed" : "Pending";
      saveData("topupOrders", orders);
      showOrders();
      return;
    }
  }
}

function deleteOrder(reference) {
  if (!confirm("Are you sure you want to delete order " + reference + "?")) return;
  var orders = getOrders();
  var remaining = [];
  for (var i = 0; i < orders.length; i++) {
    if (orders[i].reference !== reference) remaining.push(orders[i]);
  }
  saveData("topupOrders", remaining);
  showOrders();
}
