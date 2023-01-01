// require packages used in the project
const express = require("express");
const app = express();
const port = 3000;
const Url = require("./models/url.js");
const generatePassword = require("./utils/generate_password.js");
// require express-handlebars here
const exphbs = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); // 載入 mongoose
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}); // 設定連線到 mongoDB
// 取得資料庫連線狀態
const db = mongoose.connection;
// 連線異常
db.on("error", () => {
  console.log("mongodb error!");
});
// 連線成功
db.once("open", () => {
  console.log("mongodb connected!");
});
// setting template engine
app.engine("handlebars", exphbs.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(bodyParser.urlencoded({ extended: true }));
// routes setting
app.get("/", (req, res) => {
  res.render("index");
});
//輸入網址轉換成短網址
app.post("/", (req, res) => {
  const original_url = req.body.original_url;
  return Url.findOne({ original_url: original_url })
    .lean()
    .then((link) => {
      if (link === null) {
        let myPassword = generatePassword();
        const url = new Url({
          original_url: original_url,
          password: myPassword,
        });
        const id = url._id.toHexString();
        return url
          .save()
          .then(() => {
            return Url.findById(id).lean();
          })
          .then((link) => {
            res.render("success", { link });
          })
          .catch((error) => console.log(error));
      } else {
        res.render("success", { link });
      }
    });
});
//透過短網址轉址到原本網址
app.get("/:password", (req, res) => {
  const myPassword = req.params.password;
  return Url.findOne({ password: myPassword }).then((link) => {
    res.redirect(`${link.original_url}`);
  });
});
// start and listen on the Express server
app.listen(port, () => {
  console.log(`Express is listening on localhost:${port}`);
});
