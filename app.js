const express = require("express");

require("dotenv").config();

module.exports = express()
  .set("view engine", "ejs")
  .set("views", "./views")
  .use(express.static("./public"))
  .get("/", renderHome)
  .get("/:slug", renderSingle)
  .all("*", notFound);

function renderHome(req, res) {
  res.render("index");
}

function renderSingle(req, res) {
  res.render("single");
}

function notFound(req, res) {
  res.render("not-found");
}
