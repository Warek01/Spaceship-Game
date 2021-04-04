import express from "express";
import { join, sep } from "path";
import { getClientIp } from "@supercharge/request-ip";

const allowedRoutes = [
  "http://localhost:4200",
  "http://localhost:8000",
  "http://localhost:5000",
  "http://localhost:5500",
  "http://localhost:5550",
  "http://localhost:5555",
  "::ffff:127.0.0.1",
  "::1"
];

declare global {
  interface Array<T> {
    has(obj: T): boolean;
  }
}

Array.prototype.has = function (obj) {
  let len = this.length;
  while (len--) if (this[len] === obj) return true;

  return false;
};

let pathToTextures: string;

{
  let path = __dirname.split(sep);
  path.pop();
  pathToTextures = join(path.join(sep), "src", "img");
}

const app = express();

// app.use(express.static(__dirname));

app.route("/texture/:title").get((req, res, next) => {
  // const ip = getClientIp(req);
  // console.log(ip)
  // allowedRoutes.has(ip!) &&
    res.setHeader("Access-Control-Allow-Origin", "*");

  const title = req.params.title;
  console.log(title)

  if (title) res.sendFile(join(pathToTextures, title));
  else res.sendStatus(404);
});

app.listen(8000, () => console.log("Listnenig"));
