// Global State
var spots = {};
var selectedSpot = null;
var brandMaster = [];

// DOM Elements
var svgContainer = document.getElementById("svgMap");

// API Configuration
var API_BASE = "https://api-officeless-dev.mekari.com/28086";

// ============================================================================
// INITIALIZATION
// ============================================================================

window.onload = function () {
  loadBranches();
  loadCategories();
  loadBrands();
  loadSuppliers();
};

// ============================================================================
// EVENT LISTENERS
// ============================================================================

function setupEventListeners() {
  // Save button
  document.getElementById("saveBtn").addEventListener("click", handleSaveSpot);
  
  // Remove button
  document.getElementById("removeBtn").addEventListener("click", handleRemoveTenant);
  
  // Income formatting
  document.getElementById("income").addEventListener("input", handleIncomeInput);
}

// Initialize event listeners after DOM is ready
setupEventListeners();

// Branch change listener
document.getElementById("branch").addEventListener("change", handleBranchChange);

function handleBranchChange() {
  var branchId = this.value;

  if (!branchId) {
    clearMap();
    return;
  }

  ajaxGet(
    API_BASE + "/tms/api/maplayout?branch_id=" + branchId,
    function (res) {
      if (res.success && res.data.map_layout.length > 0) {
        var txtUrl = res.data.map_layout[0].url;
        loadSvgFromTxt(txtUrl);
      } else {
        alert("No map layout found");
      }
    }
  );
}

function handleIncomeInput(e) {
  let value = e.target.value.replace(/[^\d]/g, "");

  if (!value) {
    e.target.value = "";
    return;
  }

  e.target.value = formatRupiah(value);
}

function handleSaveSpot(e) {
  e.preventDefault();

  console.log("Selected spot:", selectedSpot);
  console.log("Spots object:", spots);

  if (!selectedSpot) {
    alert("Please select a spot first");
    return;
  }

  if (!validateTenantForm()) {
    return;
  }

  const incomeNumber = Number(
    document.getElementById("income").value.replace(/[^\d]/g, "")
  );

  const branchEl = document.getElementById("branch");
  const brandEl = document.getElementById("brand");
  const categoryEl = document.getElementById("category");
  const supplierEl = document.getElementById("supplier");

  const payload = {
    branch_id: branchEl.value,
    branch_name: branchEl.options[branchEl.selectedIndex].text,
    brand_id: brandEl.value,
    brand_name: brandEl.options[brandEl.selectedIndex].text,
    category_id: categoryEl.value,
    category_name: categoryEl.options[categoryEl.selectedIndex].text,
    supplier_id: supplierEl.value,
    supplier_name: supplierEl.options[supplierEl.selectedIndex].text,
    spot_id: spots[selectedSpot].spot_id,
    spot_code: selectedSpot,
    income: incomeNumber,
    remarks: document.getElementById("remarks").value,
    rent_start_date: dateToTimestamp(document.getElementById("rentStart").value),
    rent_end_date: dateToTimestamp(document.getElementById("rentEnd").value)
  };

  console.log("Payload:", payload);

  ajaxPost(API_BASE + "/tms/api/save-spot", payload, function (res) {
    console.log("Save response:", res);
    
    if (res.success) {
      alert("Spot saved successfully");
    } else {
      alert(res.message || "Failed to save spot");
    }
    
    // Always reset and reload regardless of success/failure
    document.getElementById("tenantForm").reset();
    document.getElementById("income").value = "";
    document.getElementById("remarks").value = "";
    
    // Force reload
    window.location.href = window.location.href;
  });
}

function handleRemoveTenant() {
  if (!selectedSpot) {
    alert("Please select a spot first");
    return;
  }

  if (spots[selectedSpot].status !== "rented") {
    alert("This spot is not rented");
    return;
  }

  if (!confirm("Are you sure you want to remove this tenant?")) {
    return;
  }

  const payload = {
    branch_id: document.getElementById("branch").value,
    spot_code: selectedSpot
  };

  ajaxPost(API_BASE + "/tms/api/remove-spot", payload, function (res) {
    console.log("Remove response:", res);
    
    if (res.success) {
      alert("Tenant removed successfully");
    } else {
      alert(res.message || "Failed to remove tenant");
    }
    
    // Always reset and reload regardless of success/failure
    document.getElementById("tenantForm").reset();
    document.getElementById("income").value = "";
    document.getElementById("remarks").value = "";
    
    // Force reload
    window.location.href = window.location.href;
  });
}

// ============================================================================
// AJAX FUNCTIONS
// ============================================================================

function ajaxGet(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        callback(JSON.parse(xhr.responseText));
      } else {
        console.error("AJAX ERROR:", url, xhr.status);
      }
    }
  };

  xhr.send();
}

function ajaxPost(url, data, callback) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          var response = xhr.responseText ? JSON.parse(xhr.responseText) : { success: true };
          callback(response);
        } catch (e) {
          console.error("JSON Parse Error:", e);
          callback({ success: true }); // Assume success if response is not JSON
        }
      } else {
        console.error("POST ERROR:", url, xhr.status, xhr.responseText);
        callback({ success: false, message: "Request failed" });
      }
    }
  };

  xhr.send(JSON.stringify(data));
}

// ============================================================================
// DATA LOADING
// ============================================================================

function loadBranches() {
  ajaxGet(API_BASE + "/tms/api/branches", function (res) {
    populateSelect("branch", res.data, "branch_id", "branch_name");
  });
}

function loadCategories() {
  ajaxGet(API_BASE + "/tms/api/categories", function (res) {
    populateSelect("category", res.data, "category_id", "category_name");
  });
}

function loadSuppliers() {
  ajaxGet(API_BASE + "/tms/api/suppliers", function (res) {
    populateSelect("supplier", res.data, "supplier_id", "supplier_name");
  });
}

function loadBrands() {
  ajaxGet(API_BASE + "/tms/api/brands", function (res) {
    brandMaster = res.data;
    populateSelect("brand", res.data, "brand_id", "brand_name");
    setupBrandCategoryLink();
  });
}

function setupBrandCategoryLink() {
  var brandSelect = document.getElementById("brand");
  var categorySelect = document.getElementById("category");

  brandSelect.addEventListener("change", function () {
    var brandId = this.value;

    categorySelect.innerHTML = "<option value=''>Select Category</option>";

    if (!brandId) {
      categorySelect.disabled = true;
      return;
    }

    var brand = brandMaster.find(function (b) {
      return b.brand_id === brandId;
    });

    if (brand) {
      var opt = document.createElement("option");
      opt.value = brand.category_id;
      opt.text = brand.category_name;
      categorySelect.appendChild(opt);
      categorySelect.value = brand.category_id;
    } else {
      categorySelect.disabled = true;
    }
  });
}

function populateSelect(id, items, valueKey, textKey) {
  var select = document.getElementById(id);
  select.innerHTML = "<option value=''>Select</option>";

  for (var i = 0; i < items.length; i++) {
    var opt = document.createElement("option");
    opt.value = items[i][valueKey];
    opt.text = items[i][textKey];
    select.appendChild(opt);
  }
}

// ============================================================================
// SVG MAP HANDLING
// ============================================================================

function loadSvgFromTxt(url) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        svgContainer.innerHTML = xhr.responseText;
        initializeSvg();
      } else {
        alert("Failed to load map");
      }
    }
  };

  xhr.send();
}

function initializeSvg() {
  spots = {};
  selectedSpot = null;

  var svgDoc = svgContainer.querySelector("svg");

  if (!svgDoc) {
    alert("No SVG tag found in map file");
    return;
  }

  svgDoc.setAttribute("width", "100%");
  svgDoc.setAttribute("height", "600");
  svgDoc.style.display = "block";

  injectSvgStyle(svgDoc);

  var svgSpots = svgDoc.querySelectorAll("g.spot");

  for (var i = 0; i < svgSpots.length; i++) {
    (function (el) {
      spots[el.id] = {
        spot_id: null,
        status: "available",
        income: 0,
        rental: null
      };

      el.addEventListener("click", function () {
        selectSpot(el.id, el);
      });
    })(svgSpots[i]);
  }

  // Load API data after initializing spots
  applySpotStatusFromAPI();
  
  // Update dashboard with stats
  updateDashboard();
}

function clearMap() {
  svgContainer.innerHTML = "";
  spots = {};
  selectedSpot = null;
  updateSpotStatus();
  updateDashboard(); // Clear dashboard stats
}

function injectSvgStyle(svgDoc) {
  var style = document.createElementNS("http://www.w3.org/2000/svg", "style");

  style.textContent =
    "g.spot path { fill: #2ecc71; stroke: #1e8449; stroke-width: 1; cursor: pointer; }" +
    "g.spot:hover path { fill: #58d68d; }" +
    "g.spot.selected path { fill: #74b9ff; stroke: #0984e3; stroke-width: 2; }" +
    "g.spot.rented path { fill: #e74c3c; stroke: #922b21; }" +
    "g.spot.rented:hover path { fill: #e74c3c; }" +
    "g.spot.rented.selected path { fill: #e74c3c; stroke: #922b21; }";

  var defs = svgDoc.querySelector("defs");

  if (defs) {
    defs.appendChild(style);
  } else {
    svgDoc.insertBefore(style, svgDoc.firstChild);
  }
}

// ============================================================================
// SPOT SELECTION & STATUS
// ============================================================================

function selectSpot(spotCode, el) {
  console.log("selectSpot called with:", spotCode);
  
  document.querySelectorAll("g.spot").forEach(function (s) {
    s.classList.remove("selected");
  });

  el.classList.add("selected");
  selectedSpot = spotCode;
  
  console.log("selectedSpot is now:", selectedSpot);

  updateSpotStatus(spotCode);

  // Always try to populate data from API for any clicked spot
  populateTenantFromAPI(spotCode);
  
  // Enable remove button only if the spot is rented
  if (spots[spotCode].status === "rented") {
    document.getElementById("removeBtn").disabled = false;
  } else {
    document.getElementById("removeBtn").disabled = true;
  }
}

function updateSpotStatus(spotCode) {
  const statusEl = document.getElementById("spotStatus");

  if (!spotCode) {
    statusEl.innerText = "No spot selected";
    return;
  }

  statusEl.innerText = "Selected Spot Code: " + spotCode;
}

function applySpotStatusFromAPI() {
  var branchId = document.getElementById("branch").value;

  ajaxGet(
    API_BASE + "/tms/api/spotstatus?branch_id=" + branchId,
    function (res) {
      if (!res.success) return;

      var spotData = res.data;

      for (var i = 0; i < spotData.length; i++) {
        var spot = spotData[i];
        var el = document.getElementById(spot.spot_code);

        if (!el) continue;

        if (!spots[spot.spot_code]) {
          spots[spot.spot_code] = {};
        }

        // Populate all spot data from API
        spots[spot.spot_code].spot_id = spot.spot_id;
        spots[spot.spot_code].status = spot.status;
        spots[spot.spot_code].income = spot.income || 0;

        if (spot.status === "rented") {
          el.classList.add("rented");
        } else {
          el.classList.remove("rented");
        }
      }
    }
  );
}

// ============================================================================
// FORM HANDLING
// ============================================================================

function validateTenantForm() {
  const requiredFields = [
    "branch",
    "brand",
    "category",
    "supplier",
    "rentStart",
    "rentEnd",
    "income",
    "remarks"
  ];

  for (let i = 0; i < requiredFields.length; i++) {
    const el = document.getElementById(requiredFields[i]);

    if (!el || !el.value.trim()) {
      alert("Please fill all required fields");
      el.focus();
      return false;
    }
  }

  const income = document.getElementById("income").value.replace(/[^\d]/g, "");
  if (Number(income) <= 0) {
    alert("Income must be greater than 0");
    return false;
  }

  const start = document.getElementById("rentStart").value;
  const end = document.getElementById("rentEnd").value;

  if (new Date(end) < new Date(start)) {
    alert("Rent end date must be after start date");
    return false;
  }

  return true;
}

function populateTenantFromAPI(spotCode) {
  const branchId = document.getElementById("branch").value;

  ajaxGet(
    API_BASE + "/tms/api/spot-detail?branch_id=" + branchId + "&spot_code=" + spotCode,
    function (res) {
      if (res.success && res.data) {
        // Spot has data, populate the form
        populateTenantForm(res.data);
      } else {
        // Spot has no data (available spot), clear the form
        clearTenantForm();
      }
    }
  );
}

function clearTenantForm() {
  // Save current branch selection
  const currentBranch = document.getElementById("branch").value;
  
  // Reset all fields
  document.getElementById("brand").value = "";
  document.getElementById("category").innerHTML = "<option value=''>Select Category</option>";
  document.getElementById("category").disabled = true;
  document.getElementById("supplier").value = "";
  document.getElementById("rentStart").value = "";
  document.getElementById("rentEnd").value = "";
  document.getElementById("income").value = "";
  document.getElementById("remarks").value = "";
  
  // Restore branch
  document.getElementById("branch").value = currentBranch;
}

function populateTenantForm(data) {
  // Set branch without triggering change event
  document.getElementById("branch").value = data.branch_id;
  
  // Set brand and trigger change to populate category
  setSelectValue("brand", data.brand_id);
  
  // Set category and supplier normally
  setSelectValue("category", data.category_id);
  setSelectValue("supplier", data.supplier_id);

  document.getElementById("income").value = formatRupiah(String(data.income || 0));
  document.getElementById("remarks").value = data.remarks || "";
  document.getElementById("rentStart").value = timestampToDate(data.rent_start_date);
  document.getElementById("rentEnd").value = timestampToDate(data.rent_end_date);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatRupiah(number) {
  return "Rp " + number.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function dateToTimestamp(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr + "T00:00:00").getTime();
}

function timestampToDate(ts) {
  if (!ts) return "";
  return new Date(ts).toISOString().split("T")[0];
}

function setSelectValue(id, value) {
  const el = document.getElementById(id);
  el.value = value;
  el.dispatchEvent(new Event("change"));
}

function updateDashboard() {
  var branchId = document.getElementById("branch").value;

  // If no branch selected, clear dashboard
  if (!branchId) {
    document.getElementById("totalSpots").innerText = "0";
    document.getElementById("rentedSpots").innerText = "0";
    document.getElementById("availableSpots").innerText = "0";
    document.getElementById("totalIncome").innerText = "0";
    return;
  }

  // Fetch dashboard stats from API
  ajaxGet(
    API_BASE + "/tms/api/dashboard-stats?branch_id=" + branchId,
    function (res) {
      if (res.success && res.data) {
        document.getElementById("totalSpots").innerText = res.data.total_spots || 0;
        document.getElementById("rentedSpots").innerText = res.data.rented_spots || 0;
        document.getElementById("availableSpots").innerText = res.data.available_spots || 0;
        
        // Format income with thousand separators
        var income = res.data.total_income || 0;
        document.getElementById("totalIncome").innerText = formatNumber(income);
      } else {
        // If API fails, show zeros
        document.getElementById("totalSpots").innerText = "0";
        document.getElementById("rentedSpots").innerText = "0";
        document.getElementById("availableSpots").innerText = "0";
        document.getElementById("totalIncome").innerText = "0";
      }
    }
  );
}

function formatNumber(number) {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}