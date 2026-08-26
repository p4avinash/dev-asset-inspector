import { scanFiles } from "./scanner/fileScanner.js";

const assets = scanFiles("C:\\Study\\NPM\\asset-inspector-consumer");

console.log("FOUND ASSETS:", assets);

export function helloAssetInspector(): string {
  return "Hello from Dev Asset Inspector";
}
