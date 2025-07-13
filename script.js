// Chat history for follow-up questions
let chatHistory = [];

// Handle Generate Routine button click
const generateRoutineBtn = document.getElementById("generateRoutine");
if (generateRoutineBtn) {
  generateRoutineBtn.addEventListener("click", async () => {
    const allProducts = await loadProducts();
    const selectedProducts = allProducts.filter((p) =>
      selectedProductIds.includes(p.id)
    );

    if (selectedProducts.length === 0) {
      chatWindow.innerHTML += `<div class="bot-message error">Please select at least one product to generate a routine.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
      return;
    }

    // Build a message for the AI
    const productList = selectedProducts
      .map(
        (p, i) =>
          `Product ${i + 1}:\nName: ${p.name}\nBrand: ${p.brand}\nCategory: ${
            p.category || "N/A"
          }\nDescription: ${p.description || "N/A"}`
      )
      .join("\n\n");
    const routinePrompt = `I have selected the following products. Please create a personalized skincare/haircare/makeup routine using only these products. Be clear, concise, and explain the order and purpose of each step.\n\n${productList}`;

    // Add to chat history
    chatHistory = [{ role: "user", content: routinePrompt }];

    // Show the user's request in the chat window
    chatWindow.innerHTML += `<div class="user-message"><b>You:</b> Generate a routine for my selected products.</div>`;
    chatWindow.innerHTML += `<div class="bot-message loading">Thinking...</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;

    try {
      const response = await fetch(
        "https://patient-base-cf2f.jfrederick2022.workers.dev",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatHistory }),
        }
      );
      const data = await response.json();
      const loadingMsg = document.querySelector(".bot-message.loading");
      if (loadingMsg) loadingMsg.remove();

      let botReply = "Sorry, no response received.";
      if (
        data &&
        data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content
      ) {
        botReply = data.choices[0].message.content;
        // Add bot reply to chat history
        chatHistory.push({ role: "assistant", content: botReply });
      }

      // Format bot reply for better readability
      function formatBotReply(text) {
        // Replace markdown headings (###, ##, #) with <strong> or <h3>
        text = text.replace(/^### (.*)$/gm, "<strong>$1</strong>");
        text = text.replace(/^## (.*)$/gm, "<strong>$1</strong>");
        text = text.replace(/^# (.*)$/gm, "<strong>$1</strong>");
        // Replace **bold** with <b>
        text = text.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
        // Replace newlines with <br>
        text = text.replace(/\n/g, "<br>");
        return text;
      }

      chatWindow.innerHTML += `<div class="bot-message"><b>Bot:</b> ${formatBotReply(
        botReply
      )}</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    } catch (error) {
      const loadingMsg = document.querySelector(".bot-message.loading");
      if (loadingMsg) loadingMsg.remove();
      chatWindow.innerHTML += `<div class="bot-message error">Error: Could not connect to the chatbot.</div>`;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
  });
}
/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Show initial placeholder until user selects a category */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category to view products
  </div>
`;

/* Load product data from JSON file */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  return data.products;
}

// Array to keep track of selected product IDs
let selectedProductIds = [];

// Load selected products from localStorage if available
if (localStorage.getItem("selectedProductIds")) {
  selectedProductIds = JSON.parse(localStorage.getItem("selectedProductIds"));
}

// Function to update localStorage with selected products
function saveSelectedProducts() {
  localStorage.setItem(
    "selectedProductIds",
    JSON.stringify(selectedProductIds)
  );
}

// Function to update the Selected Products section
function updateSelectedProductsList(allProducts) {
  const selectedProductsList = document.getElementById("selectedProductsList");
  if (!selectedProductsList) return;

  // Get the selected product objects
  const selectedProducts = allProducts.filter((p) =>
    selectedProductIds.includes(p.id)
  );

  // Show a message if nothing is selected
  if (selectedProducts.length === 0) {
    selectedProductsList.innerHTML = `<div class="placeholder-message">No products selected yet.</div>`;
    // Remove Clear All button if present
    const clearBtn = document.getElementById("clearSelectedBtn");
    if (clearBtn) clearBtn.remove();
    return;
  }

  // Show each selected product with a remove button
  selectedProductsList.innerHTML = selectedProducts
    .map(
      (product) => `
        <div class="selected-product-item">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <strong>${product.name}</strong><br />
            <span>${product.brand}</span>
          </div>
          <button class="remove-selected" data-id="${product.id}">&times;</button>
        </div>
      `
    )
    .join("");

  // Add Clear All button if not present
  if (!document.getElementById("clearSelectedBtn")) {
    const clearBtn = document.createElement("button");
    clearBtn.id = "clearSelectedBtn";
    clearBtn.textContent = "Clear All";
    clearBtn.className = "remove-selected clear-all-btn";
    clearBtn.style.marginLeft = "10px";
    clearBtn.style.marginTop = "10px";
    selectedProductsList.parentElement.appendChild(clearBtn);
    clearBtn.addEventListener("click", () => {
      selectedProductIds = [];
      saveSelectedProducts();
      updateSelectedProductsList(allProducts);
      displayProducts(allProducts);
    });
  }

  // Add event listeners to remove buttons
  document.querySelectorAll(".remove-selected").forEach((btn) => {
    if (btn.id !== "clearSelectedBtn") {
      btn.addEventListener("click", (e) => {
        const id = parseInt(e.target.getAttribute("data-id"));
        selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
        saveSelectedProducts();
        updateSelectedProductsList(allProducts);
        displayProducts(allProducts);
      });
    }
  });
}

// Function to display product cards and handle selection
function displayProducts(products) {
  productsContainer.innerHTML = products
    .map((product) => {
      // Add 'selected' class if this product is selected
      const isSelected = selectedProductIds.includes(product.id);
      return `
        <div class="product-card${isSelected ? " selected" : ""}" data-id="${
        product.id
      }">
          <img src="${product.image}" alt="${product.name}">
          <div class="product-info">
            <h3>${product.name}</h3>
            <p>${product.brand}</p>
          </div>
          <div class="product-overlay">
            <div class="overlay-content">
              <strong>Description:</strong><br />
              <span>${product.description || "No description available."}</span>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  // Add click event listeners to each product card
  document.querySelectorAll(".product-card").forEach((card) => {
    card.addEventListener("click", () => {
      const id = parseInt(card.getAttribute("data-id"));
      if (selectedProductIds.includes(id)) {
        // Unselect if already selected
        selectedProductIds = selectedProductIds.filter((pid) => pid !== id);
      } else {
        // Select the product
        selectedProductIds.push(id);
      }
      saveSelectedProducts();
      displayProducts(products);
      updateSelectedProductsList(products);
    });
  });

  // Update the selected products list
  updateSelectedProductsList(products);
}

// Store current filter state
let currentCategory = "";
let currentSearch = "";

// Helper to filter products by category and search
function filterProducts(products) {
  return products.filter((product) => {
    const matchesCategory = currentCategory
      ? product.category === currentCategory
      : true;
    const search = currentSearch.trim().toLowerCase();
    const matchesSearch = search
      ? (product.name && product.name.toLowerCase().includes(search)) ||
        (product.brand && product.brand.toLowerCase().includes(search)) ||
        (product.description &&
          product.description.toLowerCase().includes(search))
      : true;
    return matchesCategory && matchesSearch;
  });
}

// Listen for category changes
categoryFilter.addEventListener("change", async (e) => {
  currentCategory = e.target.value;
  const products = await loadProducts();
  displayProducts(filterProducts(products));
});

// Listen for search input
const productSearch = document.getElementById("productSearch");
if (productSearch) {
  productSearch.addEventListener("input", async (e) => {
    currentSearch = e.target.value;
    const products = await loadProducts();
    displayProducts(filterProducts(products));
  });
}

// On page load, show selected products if any and set up initial grid
window.addEventListener("DOMContentLoaded", async () => {
  const products = await loadProducts();
  updateSelectedProductsList(products);
  displayProducts(filterProducts(products));
});

/* Chat form submission handler - connects to OpenAI API via Cloudflare */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Get the user's message from the input field
  const chatInput = document.getElementById("chatInput");
  const userMessage = chatInput.value.trim();

  // If the input is empty, do nothing
  if (!userMessage) return;

  // Show the user's message in the chat window
  chatWindow.innerHTML += `<div class="user-message"><b>You:</b> ${userMessage}</div>`;

  // Clear the input field
  chatInput.value = "";

  // Show a loading message while waiting for the response
  chatWindow.innerHTML += `<div class="bot-message loading">Thinking...</div>`;
  chatWindow.scrollTop = chatWindow.scrollHeight;

  // Add user message to chat history
  chatHistory.push({ role: "user", content: userMessage });

  try {
    // Send the full chat history for context
    const response = await fetch(
      "https://patient-base-cf2f.jfrederick2022.workers.dev",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory }),
      }
    );
    const data = await response.json();
    const loadingMsg = document.querySelector(".bot-message.loading");
    if (loadingMsg) loadingMsg.remove();

    let botReply = "Sorry, no response received.";
    if (
      data &&
      data.choices &&
      data.choices[0] &&
      data.choices[0].message &&
      data.choices[0].message.content
    ) {
      botReply = data.choices[0].message.content;
      // Add bot reply to chat history
      chatHistory.push({ role: "assistant", content: botReply });
    }
    chatWindow.innerHTML += `<div class="bot-message"><b>Bot:</b> ${botReply}</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  } catch (error) {
    const loadingMsg = document.querySelector(".bot-message.loading");
    if (loadingMsg) loadingMsg.remove();
    chatWindow.innerHTML += `<div class="bot-message error">Error: Could not connect to the chatbot.</div>`;
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
});
