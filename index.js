const request = require("request");
const express = require("express");
const serviceAccount = require("./key/serviceAccountKey.json");

const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

const app = express();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/update", (req, res) => {
  request(
    {
      url: "https://openexchangerates.org/api/latest.json?app_id=239acfbc66184e11a1cbee16cccca9f8",
      json: true,
      headers: { "User-Agent": "request" },
    },
    (err, res, data, response) => {
      if (err) {
        console.log("Error:", err);
      } else if (res.statusCode !== 200) {
        console.log("Status:", res.statusCode);
      } else {
        // data is already parsed as JSON:
        response = Object.assign(data.rates);
        setRates(db, response);
      }
    }
  );
  res.send("Updated Successfully");
});

app.get("/convert/:fromCur/:toCur/:value", (req, res) => {
  const fromCur = req.params.fromCur;
  const toCur = req.params.toCur;
  const value = req.params.value;
  let result = convert(db, fromCur, toCur, value);
  let responseObject = { fromCur, toCur, value, result };
  res.send(responseObject);
});

async function convert(db, fromCur, toCur, value) {
  const doc = await db.collection("exchnagerates").doc("rates").get();
  if (!doc.exists) {
    console.log("No such document!");
  } else {
    console.log("Document data:", doc.data());
    const res = doc.data()[toCur] * value;
    console.log("Converted is: ", res);
    return res;
  }
}

async function setRates(db, response) {
  const res = await db.collection("exchnagerates").doc("rates").set(response);
  console.log("Updated: ", res);
}

app.get("*", (req, res) => {
  res.redirect("/");
});

app.listen(process.env.PORT || 4000, () => {
  console.log("Server listening on port 4000");
});
