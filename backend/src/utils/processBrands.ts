import fs from 'fs';
import path from 'path';

interface Brand {
  id: number;
  title: string;
  slug: string;
  favourite_count: number;
  pretty_favourite_count: string;
  item_count: number;
  pretty_item_count: string;
  is_visible_in_listings: boolean;
  path: string;
  requires_authenticity_check: boolean;
  is_luxury: boolean;
  url: string;
  is_favourite: boolean;
  is_hated: boolean;
}

interface SimplifiedBrand {
  id: number;
  name: string;
}

function processBrands() {
  try {
    // Read the brand data file
    const brandDataPath = path.join(__dirname, '../scraper/debug/brand.json');
    const brandData = JSON.parse(fs.readFileSync(brandDataPath, 'utf-8'));

    // Extract only id and name (title)
    const simplifiedBrands: SimplifiedBrand[] = brandData.map((brand: Brand) => ({
      id: brand.id,
      name: brand.title
    }));

    // Write the simplified data to a new file
    const outputPath = path.join(__dirname, '../scraper/debug/simplified-brands.json');
    fs.writeFileSync(outputPath, JSON.stringify(simplifiedBrands, null, 2));

    console.log('Successfully processed brands. Output saved to simplified-brands.json');
  } catch (error) {
    console.error('Error processing brands:', error);
  }
}

// Run the script
processBrands(); 