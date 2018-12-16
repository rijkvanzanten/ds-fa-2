const express = require("express");
const AWS = require("aws-sdk");
const formatRelative = require("date-fns/formatRelative");

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
  .get("/tag/:tag", renderTag)
  .get("/:slug", renderSingle)
  .all("*", notFound);

function renderHome(req, res) {
  // DynamoDB doesn't support a way to "query" data by a specific date range
  // Therefore, the next best thing we can do is retrieve all the items and display
  // those. 
  // I was hoping to fetch just the last 7 items sorted by date, but alas.
  const params = {
    TableName: process.env.AWS_TABLE,
    ProjectionExpression: "slug, author, image, title, link"
  };

  const data = db.scan(params, function(error, data) {
    if (error) {
      console.log(error);
      return res.status(500).end();
    }

    const items = data.Items.sort(function(a, b) {
      return new Date(a.datetime) < new Date(b.datetime) ? 1 : -1;
    });

    return res.render("index", { items: items, bodyClass: "home" });
  });
}

function renderSingle(req, res) {
  const slug = req.params.slug;

  const params = {
    TableName: process.env.AWS_TABLE,
    Key: {
      slug: slug
    },
    ProjectionExpression: "content.html, #dt, image, keywords, author, title, link",
    ExpressionAttributeNames: {
      "#dt": "datetime"
    }
  };

  db.get(params, function(error, data) {
    if (error) {
      console.log(error);
      return res.status(500).end();
    }

    if (!data.Item) return res.status(404).render("not-found");

    data = data.Item;

    data.datetimeRelative = formatRelative(new Date(data.datetime), new Date());

    return res.render("single", { item: data, bodyClass: "single" });
  });
}

function renderTag(req, res) {
  const tag = req.params.tag;

  const params = {
    TableName: process.env.AWS_TABLE,
    ProjectionExpression: "slug, author, image, title, link",
    FilterExpression: "contains(keywords, :tag)",
    ExpressionAttributeValues: {
      ":tag": tag
    }
  };

  const data = db.scan(params, function(error, data) {
    if (error) {
      console.log(error);
      return res.status(500).end();
    }

    const items = data.Items.sort(function(a, b) {
      return new Date(a.datetime) < new Date(b.datetime) ? 1 : -1;
    });

    return res.render("tag", {
      tag: tag,
      items: items,
      bodyClass: "tag"
    });
  });
}

function notFound(req, res) {
  res.render("not-found");
}
