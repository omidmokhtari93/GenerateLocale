const Path = require("path");
const FS = require("fs");
const Translate = require("translate-google");

let persianChars = [
  "ا",
  "ب",
  "پ",
  "ت",
  "ث",
  "ج",
  "چ",
  "ح",
  "خ",
  "د",
  "ذ",
  "ر",
  "ز",
  "ژ",
  "س",
  "ش",
  "ص",
  "ض",
  "ط",
  "ظ",
  "ع",
  "غ",
  "ف",
  "ق",
  "ک",
  "گ",
  "ل",
  "م",
  "ن",
  "و",
  "ه",
  "ی",
  "آ",
];
const validChars = [32, 47, 43, 45, 8204];

let paths = [];

function ThroughDirectory(Directory) {
  FS.readdirSync(Directory).forEach((File) => {
    const Absolute = Path.join(Directory, File);
    if (FS.statSync(Absolute).isDirectory()) return ThroughDirectory(Absolute);
    else return paths.push(Absolute);
  });
}

// Translate("hello", { to: "fa" })
//   .then((res) => {
//     console.log(res);
//   })
//   .catch((err) => {
//     console.error(err);
//   });

ThroughDirectory("./all_files");

paths.forEach((path) => {
  let filePath = Path.join(__dirname, path);
  FS.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
    let obj = {};
    data
      .toString()
      .split("\n")
      .filter((line) =>
        line.split("").some((char) => persianChars.includes(char))
      )
      .forEach((line, index, array) => {
        let filteredPersianChars = line
          .split("")
          .filter(
            (char) =>
              persianChars.includes(char) ||
              validChars.includes(char.charCodeAt(0))
          )
          .join("");
        Translate(filteredPersianChars, { to: "en" }).then((translated) => {
          let key = translated
            .toLowerCase()
            .replaceAll(" ", "-")
            .replaceAll("/", "-");
          obj[key] = filteredPersianChars.trim();
          if (array.length === Object.keys(obj).length) {
            let fileName = "";
            FS.writeFile(
              "./locales/test_file.json",
              JSON.stringify(obj),
              "utf-8",
              () => {
                console.log("done");
              }
            );
          }
        });
      });
  });
});
