var spots = {};
var selectedSpot = null;

var svgObject = document.getElementById("svgMap");

svgObject.addEventListener("load", function () {

  var svgDoc = svgObject.contentDocument;

  /* -------------------------
     Inject CSS INTO SVG
  -------------------------- */

  var style = svgDoc.createElementNS(
    "http://www.w3.org/2000/svg",
    "style"
  );

  style.textContent = `
    .spot path {
      fill: #dfe6e9 !important;
      stroke: #2d3436 !important;
      cursor: pointer;
    }

    .spot:hover path {
      fill: #74b9ff !important;
    }

    .spot.selected path {
      stroke-width: 1;
      stroke: #0984e3 !important;
    }

    .spot.rented path {
      fill: #55efc4 !important;
    }
  `;

  svgDoc.documentElement.appendChild(style);

  /* -------------------------
     Load Spots
  -------------------------- */

  var svgSpots = svgDoc.querySelectorAll(".spot");

  console.log("Found spots:", svgSpots.length);

  svgSpots.forEach(function (el) {

    spots[el.id] = {
      status: "available",
      income: 0,
      rental: null
    };

    el.addEventListener("click", function () {
      selectSpot(el.id, el);
    });

  });

  updateDashboard();

});

document.getElementById("saveBtn")
  .addEventListener("click", saveTenant);

/* ------------------------- */

function selectSpot(id, el) {

  clearSelections();

  selectedSpot = id;
  el.classList.add("selected");

  document.getElementById("spotStatus").innerText =
    "Selected Spot: " + id + " (" + spots[id].status + ")";
}

function clearSelections() {

  var svgDoc = svgObject.contentDocument;

  svgDoc.querySelectorAll(".spot")
    .forEach(function (el) {
      el.classList.remove("selected");
    });
}

/* ------------------------- */

function saveTenant() {

  if (!selectedSpot) {
    alert("Select a spot first");
    return;
  }

  var income =
    Number(document.getElementById("income").value || 0);

  spots[selectedSpot] = {
    status: "rented",
    income: income,
    rental: {
      category: category.value,
      brand: brand.value,
      supplier: supplier.value,
      rentPeriod: rentPeriod.value,
      remarks: remarks.value
    }
  };

  var svgDoc = svgObject.contentDocument;

  svgDoc
    .getElementById(selectedSpot)
    .classList.add("rented");

  updateDashboard();
}

/* ------------------------- */

function updateDashboard() {

  var all = Object.values(spots);

  totalSpots.innerText = all.length;

  rentedSpots.innerText =
    all.filter(function (s) {
      return s.status === "rented";
    }).length;

  availableSpots.innerText =
    all.filter(function (s) {
      return s.status === "available";
    }).length;

  totalIncome.innerText =
    all.reduce(function (sum, s) {
      return sum + s.income;
    }, 0).toLocaleString("id-ID");
}