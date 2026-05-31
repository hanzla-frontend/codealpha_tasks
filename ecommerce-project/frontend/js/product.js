const id = new URLSearchParams(window.location.search).get("id");

async function loadProduct() {
  const res = await fetch(`${API}/products`);
  const products = await res.json();

  const p = products.find(x => x._id === id);

  document.getElementById("productDetail").innerHTML = `
    <div class="detail">
      <img src="${p.image}" />
      <h2>${p.name}</h2>
      <p>${p.description}</p>
      <h3>$${p.price}</h3>

      <button onclick="addToCart('${p._id}')">Add to Cart</button>
    </div>
  `;
}

loadProduct();

let cart = JSON.parse(localStorage.getItem("cart")) || [];

function addToCart(id) {
  cart.push(id);
  localStorage.setItem("cart", JSON.stringify(cart));
  alert("Added!");
}