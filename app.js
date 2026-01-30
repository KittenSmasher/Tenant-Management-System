var spots = {};
var selectedSpot = null;

var brandMaster = [];

var svgContainer = document.getElementById("svgMap");

// API CONFIG
var API_BASE = "https://api-officeless-dev.mekari.com/28086";

// ON LOAD
window.onload = function () {
  loadBranches();
  loadCategories();
  loadBrands();
  loadSuppliers();
}

// AJAX
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

// POPULATE DROPDOWN
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

// LOAD MASTER DATA
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

function loadBrands() {
  ajaxGet(API_BASE + "/tms/api/brands", function (res) {
    brandMaster = res.data;
    populateSelect("brand", res.data, "brand_id", "brand_name");
  });
}

function loadSuppliers() {
  ajaxGet(API_BASE + "/tms/api/suppliers", function (res) {
    populateSelect("supplier", res.data, "supplier_id", "supplier_name");
  });
}

// BRANCH CHANGE -> LOAD MAP
document.getElementById("branch")
  .addEventListener("change", function () {

    var branchId = this.value;

    // If placeholder selected
    if (!branchId) {
      clearMap();
      return;
    }

    ajaxGet(
      API_BASE + "/tms/api/maplayout?branch_id=" + branchId,
      function (res) {

        if (
          res.success &&
          res.data.map_layout.length > 0
        ) {

          var txtUrl = res.data.map_layout[0].url;
          loadSvgFromTxt(txtUrl);

        } else {
          alert("No map layout found");
        }

      }
    );
  });

// LOAD SVG from TXT
function loadSvgFromTxt(url) {

  console.log("FETCHING:", url);

  var xhr = new XMLHttpRequest();
  xhr.open("GET", url, true);

  xhr.onreadystatechange = function () {

    if (xhr.readyState === 4) {

      console.log("STATUS:", xhr.status);
      console.log("RESPONSE TYPE:", typeof xhr.responseText);

      if (xhr.status === 200) {

        console.log("LENGTH:", xhr.responseText.length);
        console.log("FIRST 200:", xhr.responseText.substring(0, 200));

        svgContainer.innerHTML = xhr.responseText;

        console.log("HTML AFTER INJECT:", svgContainer.innerHTML.substring(0, 200));

        initializeSvg();

      } else {
        alert("Failed to load TXT");
      }
    }
  };

  xhr.send();
}

function initializeSvg() {

  spots = {};
  selectedSpot = null;

  var svgDoc = svgContainer.querySelector("svg");
  console.log("SVG FOUND:", svgDoc);

  if (!svgDoc) {
    alert("No SVG tag found inside TXT");
    return;
  }

  svgDoc.setAttribute("width", "100%");
  svgDoc.setAttribute("height", "600");
  svgDoc.style.display = "block";

  injectSvgStyle(svgDoc);

  var svgSpots = svgDoc.querySelectorAll("g.spot");
  console.log("SPOTS FOUND:", svgSpots.length);

  for (var i = 0; i < svgSpots.length; i++) {

    (function (el) {

      spots[el.id] = {
        status: "available",
        income: 0,
        rental: null
      };

      el.addEventListener("click", function () {
        selectSpot(el.id, el);
      });

    })(svgSpots[i]);

  }

  updateDashboard();

}

function clearMap() {
  svgContainer.innerHTML = "";
  spots = {};
  selectedSpot = null;
  updateDashboard();
}

function injectSvgStyle(svgDoc) {

  var style = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "style"
  );

  style.textContent =

    /* AVAILABLE */
    "g.spot path{" +
    "fill:#ecf0f1;" +
    "stroke:#2d3436;" +
    "stroke-width:1;" +
    "cursor:pointer;" +
    "}" +

    /* HOVER */
    "g.spot:hover path{" +
    "fill:#74b9ff;" +
    "}" +

    /* SELECTED */
    "g.spot.selected path{" +
    "stroke:#f1c40f;" +
    "stroke-width:8;" +
    "}" +

    /* RENTED */
    "g.spot.rented path{" +
    "fill:#55efc4;" +
    "}" +

    /* RENTED + HOVER */
    "g.spot.rented:hover path{" +
    "fill:#2ecc71;" +
    "}" +

    /* RENTED + SELECTED */
    "g.spot.rented.selected path{" +
    "stroke:#e67e22;" +
    "stroke-width:3;" +
    "}";

  var defs = svgDoc.querySelector("defs");

  if (defs) {
    defs.appendChild(style);
  } else {
    svgDoc.insertBefore(style, svgDoc.firstChild);
  }
}

