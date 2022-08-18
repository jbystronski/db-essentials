module.exports = function parseEncodedUri(uri) {
  const charactersToDecode = {
    "%2C": ",",
    "%2F": "/",
    "%3D": "=",
    "%2E": ".",
    "%26": "&",
    "%2A": "*",
    "%2B": "+",
    "%2D": "-",
    "%21": "!",
    "%23": "%",
    "%3F": "?",
    "%5C": `\\`,
    "%5E": "^",
    "%5F": "_",
    "%5B": "[",
    "%5D": "]",
    "%7E": "~",
    "%7B": "{",
    "%7D": "}",
    "%7C": "|",
    "%3A": ":",
    "%3C": "<",
    "%3E": ">",
    "%3B": ";",
    "%28": "(",
    "%29": ")",
  };

  Object.keys(charactersToDecode).forEach((char) => {
    if (uri.includes(char)) {
      uri = uri.replaceAll(char, charactersToDecode[char]);
    }
  });

  return uri;
};
