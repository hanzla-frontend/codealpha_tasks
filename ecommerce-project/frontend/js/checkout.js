document.getElementById("orderForm").addEventListener("submit", (e) => {
  e.preventDefault();

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  if (cart.length === 0) {
    alert("Cart empty!");
    return;
  }

  const order = {
    items: cart,
    user: localStorage.getItem("user"),
    date: new Date()
  };

  console.log("Order placed:", order);

  localStorage.removeItem("cart");

  alert("Order placed successfully!");
  window.location.href = "index.html";
});