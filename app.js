const spots = {
  S1: { status: "available", income: 0, rental: null },
  S2: { status: "available", income: 0, rental: null },
  S3: { status: "available", income: 0, rental: null },
  S4: { status: "available", income: 0, rental: null }
};

let selectedSpot = null;

document.querySelectorAll(".spot").forEach(spot => {
  spot.addEventListener("click", () => selectSpot(spot.id));
});

document.getElementById("saveBtn").addEventListener("click", saveTenant);

function selectSpot(id) {
  selectedSpot = id;
  document.getElementById("spotStatus").innerText =
    `Selected Spot: ${id} (${spots[id].status})`;
}

function saveTenant() {
  if (!selectedSpot) {
    alert("Select a spot first");
    return;
  }

  const income = Number(document.getElementById("income").value || 0);

  spots[selectedSpot] = {
    status: "rented",
    income,
    rental: {
      category: category.value,
      brand: brand.value,
      supplier: supplier.value,
      rentPeriod: rentPeriod.value,
      remarks: remarks.value
    }
  };

  document.getElementById(selectedSpot).classList.add("rented");
  updateDashboard();
}

function updateDashboard() {
  const all = Object.values(spots);
  totalSpots.innerText = all.length;
  rentedSpots.innerText = all.filter(s => s.status === "rented").length;
  availableSpots.innerText = all.filter(s => s.status === "available").length;
  totalIncome.innerText =
    all.reduce((sum, s) => sum + s.income, 0).toLocaleString("id-ID");
}

updateDashboard();
