"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function processBrands() {
    try {
        // Read the brand data file
        const brandDataPath = path_1.default.join(__dirname, '../scraper/debug/brand.json');
        const brandData = JSON.parse(fs_1.default.readFileSync(brandDataPath, 'utf-8'));
        // Extract only id and name (title)
        const simplifiedBrands = brandData.map((brand) => ({
            id: brand.id,
            name: brand.title
        }));
        // Write the simplified data to a new file
        const outputPath = path_1.default.join(__dirname, '../scraper/debug/simplified-brands.json');
        fs_1.default.writeFileSync(outputPath, JSON.stringify(simplifiedBrands, null, 2));
        console.log('Successfully processed brands. Output saved to simplified-brands.json');
    }
    catch (error) {
        console.error('Error processing brands:', error);
    }
}
// Run the script
processBrands();
