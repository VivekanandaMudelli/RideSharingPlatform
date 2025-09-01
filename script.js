// ---- Helpers ----
function saveTrips(trips) { localStorage.setItem("trips", JSON.stringify(trips)); }
function loadTrips() { return JSON.parse(localStorage.getItem("trips") || "[]"); }
function saveFeedback(feedbacks) { localStorage.setItem("feedbacks", JSON.stringify(feedbacks)); }
function loadFeedback() { return JSON.parse(localStorage.getItem("feedbacks") || "[]"); }

// Haversine formula (distance in km)
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) *
            Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLon/2)**2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---- Traveler ----
let watchId = null;

function showTraveler() {
  const main = document.getElementById("main");
  main.innerHTML = `
    <h2>Traveler (Trip Starter)</h2>
    <input id="tripId" placeholder="Trip ID">
    <input id="destination" placeholder="Destination">
    <button onclick="createTrip()">Start Trip</button>
    <h3>My Trips</h3>
    <div id="audit"></div>
  `;
  renderAudit();
}

function createTrip() {
  const trips = loadTrips();
  const tripId = document.getElementById("tripId").value;
  const dest = document.getElementById("destination").value;
  if (!tripId || !dest) { alert("Fill all fields."); return; }

  const trip = {
    tripId, destination: dest,
    status: "in-progress", createdAt: new Date().toLocaleString(),
    distance: 0, startLocation: null, lastLocation: null
  };

  trips.push(trip);
  saveTrips(trips);
  renderAudit();
}

function startTracking(tripId) {
  let trips = loadTrips();
  let trip = trips.find(t => t.tripId === tripId);
  if (!trip) return alert("Trip not found");

  if (!navigator.geolocation) return alert("Geolocation not supported!");

  trip.status = "tracking";
  saveTrips(trips);

  watchId = navigator.geolocation.watchPosition(pos => {
    const { latitude, longitude } = pos.coords;
    if (!trip.startLocation) trip.startLocation = { lat: latitude, lng: longitude };
    trip.lastLocation = { lat: latitude, lng: longitude };
    trip.distance = haversine(
      trip.startLocation.lat, trip.startLocation.lng, latitude, longitude
    ).toFixed(2);

    saveTrips(trips);
    renderAudit();
  });
}

function stopTracking(tripId) {
  let trips = loadTrips();
  let trip = trips.find(t => t.tripId === tripId);
  if (!trip) return;

  // Confirm before stopping
  if (!confirm(`Are you sure you want to stop trip ${tripId}?`)) return;

  if (watchId) navigator.geolocation.clearWatch(watchId);
  trip.status = "completed";
  saveTrips(trips);
  renderAudit();
}


function renderAudit() {
  const trips = loadTrips();
  const audit = document.getElementById("audit");
  audit.innerHTML = trips.map(t =>
    `<p><strong>${t.tripId}</strong> → ${t.destination} (${t.status})<br>
     ${t.lastLocation ? `📍 ${t.lastLocation.lat.toFixed(4)}, ${t.lastLocation.lng.toFixed(4)}<br>
     Distance: ${t.distance} km` : "No location yet"}<br>
     <button onclick="startTracking('${t.tripId}')">Start Tracking</button>
     <button onclick="stopTracking('${t.tripId}')">Stop Trip</button>
     </p>`
  ).join("");
}

// ---- Companion ----
let trackInterval = null;

function showCompanion() {
  const main = document.getElementById("main");
  main.innerHTML = `
    <h2>Traveler Companion</h2>
    <input id="trackId" placeholder="Enter Trip ID">
    <button onclick="startTrackingCompanion()">Join Trip</button>
    <div id="trackResult"></div>
    <h3>Feedback</h3>
    <textarea id="feedback" placeholder="Your feedback"></textarea>
    <button onclick="sendFeedback()">Send</button>
  `;
}

function startTrackingCompanion() {
  const id = document.getElementById("trackId").value;
  if (!id) return alert("Enter Trip ID");
  if (trackInterval) clearInterval(trackInterval);

  function update() {
    const trips = loadTrips();
    const trip = trips.find(t => t.tripId === id);
    const trackResult = document.getElementById("trackResult");
    if (!trip) { trackResult.innerHTML = "<p>Trip not found</p>"; return; }

    let locText = trip.lastLocation
      ? `📍 ${trip.lastLocation.lat.toFixed(4)}, ${trip.lastLocation.lng.toFixed(4)}`
      : "No location yet";

    trackResult.innerHTML = `
      <p>Trip to ${trip.destination}<br>
      Status: ${trip.status}<br>
      ${locText}<br>
      Distance: ${trip.distance || 0} km</p>
    `;
  }

  update();
  trackInterval = setInterval(update, 3000);
}

function sendFeedback() {
  const feedbacks = loadFeedback();
  const text = document.getElementById("feedback").value;
  if (text.trim()) {
    feedbacks.push({ text, time: new Date().toLocaleString() });
    saveFeedback(feedbacks);
    alert("Feedback sent!");
    document.getElementById("feedback").value = "";
  }
}

// ---- Admin ----
function showAdmin() {
  const main = document.getElementById("main");
  const trips = loadTrips();
  const feedbacks = loadFeedback();

  main.innerHTML = `
    <h2>Admin Panel</h2>
    <h3>All Trips</h3>
    ${trips.map(t => `<p><strong>${t.tripId}</strong> → ${t.destination} (${t.status})<br>
       ${t.lastLocation ? `📍 ${t.lastLocation.lat.toFixed(4)}, ${t.lastLocation.lng.toFixed(4)}<br>
       Distance: ${t.distance} km` : "No location yet"}</p>`).join("") || "No trips"}
    <h3>All Feedbacks</h3>
    ${feedbacks.map(f => `<p>${f.text} (${f.time})</p>`).join("") || "No feedback"}
  `;
}

// ---- Default ----
showTraveler();
