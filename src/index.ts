import { scanFiles } from "./scanner/fileScanner.js";

const assets = await scanFiles("C:\\Study\\NPM\\asset-inspector-consumer");

console.log("FOUND ASSETS:", assets);
