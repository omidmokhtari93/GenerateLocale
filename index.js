const fs = require("fs");
const path = require("path");
const translate = require("translate-google"); // Using google-translate-api package

// File paths
const inputFilePath = path.join(__dirname, "file.txt"); // Input file
const outputJsonPath = path.join(__dirname, "translations.json"); // Output JSON file

// Object to hold translations (English text as keys, Persian text as values)
let translationMap = {};

// Function to translate text
async function translateText(text) {
  try {
    const res = await translate(text, { from: "fa", to: "en" });
    console.log(res);
    return res;
  } catch (err) {
    console.error(`Error translating: ${err}`);
    return text; // In case of an error, return the original text
  }
}

// Function to extract Persian text from a line
function extractPersianText(line) {
  // Regular expression to find Persian text (includes Persian characters and spaces between them)
  const persianRegex = /([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*)/g;

  // Match Persian text and return the array of matched texts
  return line.match(persianRegex) || []; // Return matches or an empty array if no match
}

// Function to process the file
async function processFile() {
  // Read the file content
  fs.readFile(inputFilePath, "utf8", async (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      return;
    }

    // Split the file content by line
    let lines = data.split("\n");

    // Iterate over each line
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];

      // Extract Persian text from the line
      let persianTexts = extractPersianText(line);

      // Iterate over each Persian sentence and translate it
      for (let persianText of persianTexts) {
        const translatedText = await translateText(persianText);

        // Replace spaces in the English translation with dashes
        const key = translatedText?.toLowerCase()?.replace(/\s+/g, "-");

        // Add to translation object (English as key, Persian as value)
        translationMap[key] = persianText;

        // Replace the Persian sentence with its translation in the line
        line = line.replace(persianText, `{t("${key}")}`);
      }

      // Update the line with translated Persian text
      lines[i] = line;
    }

    // Re-join the lines into the updated file content
    const updatedContent = lines.join("\n");

    // Save the updated content to the file
    fs.writeFile(inputFilePath, updatedContent, "utf8", (err) => {
      if (err) {
        console.error("Error writing to file:", err);
        return;
      }
      console.log("File updated successfully!");
    });

    // Save the translation map to a JSON file
    fs.writeFile(
      outputJsonPath,
      JSON.stringify(translationMap, null, 2),
      "utf8",
      (err) => {
        if (err) {
          console.error("Error writing JSON file:", err);
          return;
        }
        console.log("Translation map saved to translations.json!");
      }
    );
  });
}

// Run the function to process the file
processFile();
