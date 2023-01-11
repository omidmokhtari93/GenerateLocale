javascript: (() => {
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

  const startTime = performance.now();

  const validChars = [32, 47, 43, 45, 8204];

  let paths = [];

  let interval = null;
  (function () {
    const P = ["\\", "|", "/", "-"];
    let x = 0;
    interval = setInterval(function () {
      process.stdout.write("\r" + P[x++]);
      x &= 3;
    }, 250);
  })();

  function ThroughDirectory(Directory) {
    FS.readdirSync(Directory).forEach((File) => {
      const Absolute = Path.join(Directory, File);
      if (FS.statSync(Absolute).isDirectory())
        return ThroughDirectory(Absolute);
      else return paths.push(Absolute);
    });
  }

  ThroughDirectory("./files");

  const conversionDuration = () => {
    console.log(
      "\nDone in : " + Math.ceil(performance.now() - startTime) + "ms"
    );
    clearInterval(interval);
  };

  let pathCount = 0;

  const checkLocaleFileExists = (fileName) => {
    if (FS.existsSync("./locales/" + fileName + ".json")) {
      console.log(`\nAlready created (${fileName}.json)`);
      return true;
    }
    return false;
  };

  const generetaNewFileByPath = () => {
    pathCount++;
    if (paths[pathCount]) {
      generateFileByPath(paths[pathCount]);
    } else {
      conversionDuration(new Date());
    }
  };

  const generateFileByPath = (path) => {
    if (!path || !path.includes(".tsx")) {
      generetaNewFileByPath();
      return;
    }
    let filePath = Path.join(__dirname, path);
    let fileName = Path.dirname(path)
      .split("\\")
      .pop()
      .match(/[A-Z][a-z]+/g)
      .map((element) => element.toLowerCase())
      .join("-");
    if (checkLocaleFileExists(fileName)) {
      generetaNewFileByPath();
      return;
    }
    FS.readFile(filePath, { encoding: "utf-8" }, function (err, data) {
      let filteredPersianChars = data
        .toString()
        .split("\n")
        .map((char) => char.trim())
        .filter((line) =>
          //for checking lines includes persian chars
          line.split("").some((char) => persianChars.includes(char))
        )
        .map((line, index, array) => {
          let editedLine = line
            .split("")
            .filter(
              (char) =>
                persianChars.includes(char) ||
                validChars.includes(char.charCodeAt(0))
            )
            .join("");
          return editedLine;
        })
        .map((char) => char.trim())
        .map((char) => {
          let trimedChar = char;
          validChars.map((validChar) => {
            if (validChar !== 32) {
              let regex = new RegExp(
                `^${"\\" + String.fromCharCode(validChar)}+|${
                  "\\" + String.fromCharCode(validChar)
                }+`,
                "g"
              );
              trimedChar = trimedChar.replace(regex, "");
            }
          });
          return trimedChar.trim();
        });
      let obj = {};
      let counter = 0;
      const translate = (text) => {
        Translate(text, { to: "en" })
          .then((translated) => {
            let key = translated
              .toLowerCase()
              .trim()
              .split("")
              .map((char) =>
                validChars.includes(char.charCodeAt(0)) ? "-" : char
              )
              .join("");
            if (translated) {
              if (!obj[key.toString()]) {
                obj[key.toString()] = text.trim();
              }
              counter++;
              if (filteredPersianChars[counter]) {
                translate(filteredPersianChars[counter]);
              } else {
                createFile(obj);
              }
            }
          })
          .catch((error) => {
            translate(text);
          });
      };
      if (filteredPersianChars[counter]) {
        translate(filteredPersianChars[counter]);
      } else {
        generetaNewFileByPath();
      }

      const createFile = (createdJson) => {
        if (!FS.existsSync("./locales")) {
          FS.mkdirSync("./locales");
        }
        FS.writeFile(
          `./locales/${fileName}.json`,
          JSON.stringify(createdJson),
          "utf-8",
          () => {
            console.log(`\n${fileName}.json file created.`);
            generetaNewFileByPath();
          }
        );
      };
    });
  };

  if (paths[pathCount]) {
    generateFileByPath(paths[pathCount]);
  }
})();
