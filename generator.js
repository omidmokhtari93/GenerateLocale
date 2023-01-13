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

  if (!FS.existsSync("./files")) {
    console.log(
      "\nPlease create directory in root of project, then put your files there."
    );
  } else {
    ThroughDirectory("./files");
  }

  const conversionDuration = () => {
    console.log(
      "\nDone in : " + Math.ceil(performance.now() - startTime) + "ms"
    );
    clearInterval(interval);
  };

  let pathCount = 0;

  const checkLocaleFileExists = (fileName) => {
    if (FS.existsSync("./locales/" + fileName + "_fa.json")) {
      console.log(`\nAlready created (${fileName})`);
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
    if (!path && (!path.includes(".tsx") || !path.includes(".jsx"))) {
      generetaNewFileByPath();
      return;
    }
    let filePath = Path.join(__dirname, path);
    let fileName = (
      Path.dirname(path)
        .split("\\")
        .pop()
        .match(/[A-Z][a-z]+/g) || []
    )
      .map((element) => element && element.toLowerCase())
      .join("-");
    if (fileName && checkLocaleFileExists(fileName)) {
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
          //for filter invalid characters
          let editedLine = line
            .split("")
            .filter((char) => {
              return (
                persianChars.includes(char) ||
                validChars.includes(char.charCodeAt(0))
              );
            })
            .join("");
          return editedLine;
        })
        .map((char) => char.trim())
        .map((char) => {
          let trimedChar = char;
          //console.log("invalid char : ", char);
          validChars.map((validChar) => {
            if (![8204, 32].includes(validChar)) {
              function trim(s, c) {
                if (c === "]") c = "\\]";
                if (c === "^") c = "\\^";
                if (c === "\\") c = "\\\\";
                return s.replace(
                  new RegExp("^[" + c + "]+|[" + c + "]+$", "g"),
                  ""
                );
              }
              trimedChar = trim(trimedChar, String.fromCharCode(validChar));
            }
          });
          //console.log("valid char", trimedChar);
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
        let enJson = {};
        Object.keys(createdJson).map((key) => {
          enJson[key] = key
            .split("-")
            .map((char, index) => {
              if (index === 0) {
                return char
                  .split("")
                  .map((word, idx) => (idx === 0 ? word.toUpperCase() : word))
                  .join("");
              }
              return char;
            })
            .join(" ");
        });
        FS.writeFile(
          `./locales/${fileName}_fa.json`,
          JSON.stringify(createdJson),
          "utf-8",
          () => {
            FS.writeFile(
              `./locales/${fileName}_en.json`,
              JSON.stringify(enJson),
              () => {
                console.log(`\n${fileName}.json file created.`);
                generetaNewFileByPath();
              }
            );
          }
        );
      };
    });
  };

  if (paths[pathCount]) {
    generateFileByPath(paths[pathCount]);
  }
})();
