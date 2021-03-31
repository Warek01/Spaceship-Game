"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = require("path");
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
Array.prototype.has = function (obj) {
    let len = this.length;
    while (len--)
        if (this[len] === obj)
            return true;
    return false;
};
let pathToTextures;
{
    let path = __dirname.split(path_1.sep);
    path.pop();
    pathToTextures = path_1.join(path.join(path_1.sep), "src", "img");
}
const app = express_1.default();
// app.use(express.static(__dirname));
app.route("/texture/:title").get((req, res, next) => {
    // const ip = getClientIp(req);
    // console.log(ip)
    // allowedRoutes.has(ip!) &&
    res.setHeader("Access-Control-Allow-Origin", "*");
    const title = req.params.title;
    console.log(title);
    if (title)
        res.sendFile(path_1.join(pathToTextures, title));
    else
        res.sendStatus(404);
});
app.listen(8000, () => console.log("Listnenig"));
