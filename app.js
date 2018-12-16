const express = require("express");
const AWS = require("aws-sdk");

require("dotenv").config();

AWS.config = new AWS.Config();
AWS.config.accessKeyId = process.env.AWS_ID;
AWS.config.secretAccessKey = process.env.AWS_KEY;
AWS.config.region = process.env.AWS_REGION;

const db = new AWS.DynamoDB.DocumentClient();

module.exports = express()
  .set("view engine", "ejs")
  .set("views", "./views")
  .use(express.static("./public"))
  .get("/", renderHome)
  .get("/:slug", renderSingle)
  .all("*", notFound);

function renderHome(req, res) {
  // DynamoDB doesn't support a way to "query" data by a specific date range
  // Therefore, the next best thing we can do is retrieve all the items and display
  // those. 
  // I was hoping to fetch just the last 7 items sorted by date, but alas.
  const params = {
    TableName: "deardiary",
    ProjectionExpression: "slug, author, image, title"
  };

  const data = db.scan(params, function(error, data) {
    if (error) {
      console.log(error);
      res.status(500).end();
    }

    const items = data.Items.sort((a, b) => {
      return new Date(a.datetime) < new Date(b.datetime) ? 1 : -1;
    });

    res.render("index", { items });
  });
}

function renderSingle(req, res) {
  res.render("single");
}

function notFound(req, res) {
  res.render("not-found");
}
