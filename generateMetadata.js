const fs = require('fs');
const path = require('path');

const jsonsFilePath = path.join(__dirname, 'public', 'jsons.txt');
const metadataDirPath = path.join(__dirname, 'public', 'metadata');

fs.readFile(jsonsFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading jsons.txt:', err);
    return;
  }

  const names = data.trim().split('\n');
  names.forEach((name, index) => {
    const metadata = {
      image: `https://famousjsons.com/json_art/${name}.svg`,
      external_url: `https://famousjsons.com?s=${name}`,
      background_color: "242424",
      name: name,
      description: `Famous JSON ${index + 1} of ${names.length}`
    };

    const metadataFilePath = path.join(metadataDirPath, `json${index}`);
    fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2), err => {
      if (err) {
        console.error(`Error writing metadata for ${name}:`, err);
      } else {
        console.log(`Metadata for ${name} written successfully.`);
      }
    });
  });
});
