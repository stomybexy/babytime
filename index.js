const contractions = [];

function compare(el1, el2) {
  if (el1 < el2) {
    return -1;
  }
  if (el2 > el1) {
    return 1;
  }
  return 0;
}

function sortBy(arr, by) {
  return arr.slice().sort((el1, el2) => {
    const key1 = el1[by];
    const key2 = el2[by];
    return compare(key1, key2);
  });
}

function formatDate(date) {
  if (!date) {
    return "";
  }
  const dtf = new Intl.DateTimeFormat("fr", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return dtf.format(new Date(date));
}

function displayContraction({ date, timeInterval }) {
  const row = table.insertRow(1);
  const cell0 = row.insertCell(0);
  const cell1 = row.insertCell(1);

  cell0.appendChild(document.createTextNode(formatDate(date)));
  cell1.appendChild(document.createTextNode(`${timeInterval || 0} min`));
}

function addNewContraction(db) {
  const date = new Date();
  let timeInterval = 0;
  if (contractions.length > 0) {
    const { date: lastDate } = contractions[contractions.length - 1];
    const inter = (date - lastDate) / 1000 / 60; // min
    timeInterval = Math.round(inter);
  }
  if (contractions.length === 0 || timeInterval > 1) {
    const contraction = { date, timeInterval, id: contractions.length + 1 };
    contractions.push(contraction);
    storeContraction(contraction, db);
    displayContraction(contraction);
  }
}

function storeContraction(contraction, db) {
  const transaction = db.transaction("contractions", "readwrite");
  const request = transaction.objectStore("contractions");
  request.add(contraction);
}

const openRequest = indexedDB.open("db", 1);
openRequest.onupgradeneeded = function () {
  const db = openRequest.result;
  if (!db.objectStoreNames.contains("contractions")) {
    // if there's no "contractions" store
    db.createObjectStore("contractions", {
      autoIncrement: true,
    }); // create it
  }
};

openRequest.onerror = function () {
  console.error("Error", openRequest.error);
};

openRequest.onsuccess = function () {
  const db = openRequest.result;
  // continue working with database using db object
  const transaction = db.transaction("contractions", "readonly");
  const request = transaction.objectStore("contractions");

  const output = request.getAll();
  output.onsuccess = function () {
    const storedContractions = sortBy(output.result, "date");
    contractions.push(...storedContractions);

    contractions.forEach(displayContraction);

    add.addEventListener("click", () => addNewContraction(db));
  };

  output.onerror = function (e) {
    console.error(e);
    alert("Error when initializing the app. Try relaoding the page");
  };
};
