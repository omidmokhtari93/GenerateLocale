#!/usr/bin/env node
// @ts-check
const fs = require("fs");
const path = require("path");
const translate = require("translate-google"); // Using google-translate-api package
const { Command } = require("commander");
const program = new Command();

// Set up the command-line interface
program
  .argument("<filePath>", "Path to the file you want to translate")
  .action(async (filePath) => {
    const inputFilePath = path.resolve(filePath);
    let state = {
      fa: {
        path: path.join(path.dirname(inputFilePath), "fa.json"),
        json: {},
      },
      en: {
        path: path.join(path.dirname(inputFilePath), "en.json"),
        json: {},
      },
    };
    // Function to translate Persian text in a file and generate JSON
    async function translateFileToEnglish() {
      // Function to translate text
      async function translateText(text) {
        try {
          const res = await translate(text, { from: "fa", to: "en" });
          console.log("Translating:", text, res);
          return res;
        } catch (err) {
          console.error(`Error translating: ${err}`);
          return text; // In case of an error, return the original text
        }
      }

      // Function to extract Persian text from a line
      function extractPersianText(line) {
        const persianRegex = /([\u0600-\u06FF]+(?:\s+[\u0600-\u06FF]+)*)/g;
        return line.match(persianRegex) || [];
      }

      // Read and process the file
      fs.readFile(inputFilePath, "utf8", async (err, data) => {
        if (err) {
          console.error("Error reading file:", err);
          return;
        }

        let lines = data.split("\n");

        for (let i = 0; i < lines.length; i++) {
          let line = lines[i];
          let persianTexts = extractPersianText(line);

          for (let persianText of persianTexts) {
            const translatedText = await translateText(persianText);
            const key = translatedText.replace(/\s+/g, "-")?.toLowerCase();
            state.fa.json[key] = persianText;
            state.en.json[key] = translatedText;
            line = line.replace(persianText, `{t("${key}")}`);
          }

          lines[i] = line;
        }

        const updatedContent = lines.join("\n");

        // Save the updated file
        fs.writeFile(inputFilePath, updatedContent, "utf8", (err) => {
          if (err) {
            console.error("Error writing to file:", err);
          } else {
            console.log(`File updated successfully at ${inputFilePath}`);
          }
        });

        // Save the translation map to a JSON file
        Object.entries(state).map(([key, value]) => {
          fs.writeFile(
            value.path,
            JSON.stringify(value.json, null, 2),
            "utf8",
            (err) => {
              if (err) {
                console.error("Error writing JSON file:", err);
              } else {
                console.log(`Translation map saved to ${path}`);
              }
            }
          );
        });
      });
    }

    // Call the function to process the file
    translateFileToEnglish();
  });

// Parse the arguments passed via CLI
program.parse(process.argv);
