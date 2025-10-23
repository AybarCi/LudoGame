const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = './assets/images/logo.png';
const outputDir = './assets/images/splash-logos';

// Boyutlar: mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi
const sizes = {
  'mdpi': 48,
  'hdpi': 72,
  'xhdpi': 96,
  'xxhdpi': 144,
  'xxxhdpi': 192
};

async function resizeLogo() {
  try {
    // Output klasörünü oluştur
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Ana logo dosyasını kontrol et
    if (!fs.existsSync(inputPath)) {
      console.error('Logo dosyası bulunamadı:', inputPath);
      return;
    }

    // Her boyut için logo oluştur
    for (const [density, size] of Object.entries(sizes)) {
      const outputPath = path.join(outputDir, `logo-${density}.png`);
      
      await sharp(inputPath)
        .resize(size, size, { 
          fit: 'contain',
          background: { r: 26, g: 26, b: 46, alpha: 1 } // #1a1a2e
        })
        .png({ quality: 90 })
        .toFile(outputPath);
      
      console.log(`✓ ${density} boyutlu logo oluşturuldu: ${size}x${size}px`);
    }

    // Ekstra küçük versiyonlar
    const extraSizes = {
      'small': 32,
      'medium': 64,
      'large': 128
    };

    for (const [name, size] of Object.entries(extraSizes)) {
      const outputPath = path.join(outputDir, `logo-${name}.png`);
      
      await sharp(inputPath)
        .resize(size, size, { 
          fit: 'contain',
          background: { r: 26, g: 26, b: 46, alpha: 1 }
        })
        .png({ quality: 95 })
        .toFile(outputPath);
      
      console.log(`✓ ${name} boyutlu logo oluşturuldu: ${size}x${size}px`);
    }

    console.log('✓ Tüm logo versiyonları başarıyla oluşturuldu!');
    
  } catch (error) {
    console.error('Logo resize hatası:', error);
  }
}

resizeLogo();