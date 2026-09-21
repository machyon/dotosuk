import { parse } from "./parser.js";
function run(label, source) {
    console.log(`\n=== ${label} ===`);
    const result = parse(source);
    console.log(JSON.stringify(result.data, null, 2));
    if (result.errors.length > 0) {
        console.log("--- Errors ---");
        console.log(JSON.stringify(result.errors, null, 2));
    }
}
run("Simple statements", `
beli apel 2
jual apel 2

apel 2 # Defaults to 'jual'
`);
run("Header + bullet list", `
Penjualan Hari Ini:

* perkedel 10
* molen 15
* bakwan 20


beli apel 2 # This is counted as a new transaction since it's not in the bulletin list & any context
`);
run("Pembelian (beli) header, with an override inside the list", `
Pembelian Hari Ini:
* tepung 5
* beli telur 30
- gula 10
`);
//# sourceMappingURL=index.js.map