#!/usr/bin/env node --enable-source-maps
(function() {
;
var ASCIIDrawing, ASCIIMapping, CSSStyle, CSVDrawing, CoffeeMapping, CoffeeScript, Context, DOMParser, DSVDrawing, Drawing, Drawings, DynamicSymbol, HasSettings, Input, JSMapping, Mapping, Mappings, SSVDrawing, SVGNS, SVGTilerException, StaticSymbol, Style, Styles, StylusStyle, Symbol, TSVDrawing, XLINKNS, XLSXDrawings, XMLSerializer, allBlank, attributeOrStyle, babelConfig, blankCells, bufferSize, contentType, convertSVG, defaultSettings, domImplementation, domRecurse, escapeId, extensionMap, extensionOf, extractOverflowBox, extractZIndex, fs, getHref, getOutputDir, getSetting, graphemeSplitter, help, hrefAttr, implicitFinalExportDefault, inkscapeVersion, isAuto, main, metadata, parseBox, parseNum, path, paths, postprocess, prettyXML, renderDOM, renderPreact, sanitize, splitIntoLines, svgBBox, svgtiler, unrecognizedSymbol, whitespace, xmldom, zeroSizeReplacement,
  indexOf = [].indexOf,
  hasProp = {}.hasOwnProperty;

if (typeof window === "undefined" || window === null) {
  path = require('path');
  fs = require('fs');
  xmldom = require('@xmldom/xmldom');
  DOMParser = xmldom.DOMParser;
  domImplementation = new xmldom.DOMImplementation();
  XMLSerializer = xmldom.XMLSerializer;
  prettyXML = require('prettify-xml');
  graphemeSplitter = new require('grapheme-splitter')();
  metadata = require('../package.json');
} else {
  DOMParser = window.DOMParser; // escape CoffeeScript scope
  domImplementation = document.implementation;
  XMLSerializer = window.XMLSerializer; // escape CoffeeScript scope
  path = {
    extname: function(x) {
      return /\.[^\/]+$/.exec(x)[0];
    },
    dirname: function(x) {
      return /[^]*\/|/.exec(x)[0];
    }
  };
  graphemeSplitter = {
    splitGraphemes: function(x) {
      return x.split('');
    }
  };
  metadata = {
    version: '(web)'
  };
}

//# Register `require` hooks of Babel and CoffeeScript,
//# so that imported/required modules are similarly processed.
if (typeof window === "undefined" || window === null) {
  //# Babel plugin to add implicit `export default` to last line of program,
  //# to simulate the effect of `eval` but in a module context.
  implicitFinalExportDefault = function({types}) {
    return {
      visitor: {
        Program: function(path) {
          var body, exportLast, k, last, len, part;
          body = path.get('body');
          if (!body.length) { // empty program
            return;
          }
          for (k = 0, len = body.length; k < len; k++) {
            part = body[k];
            if (types.isExportDefaultDeclaration(part)) { // already an export default, so don't add one
              return;
            }
          }
          last = body[body.length - 1];
          if (last.node.type === 'ExpressionStatement') {
            exportLast = types.exportDefaultDeclaration(last.node.expression);
            exportLast.leadingComments = last.node.leadingComments;
            exportLast.innerComments = last.node.innerComments;
            exportLast.trailingComments = last.node.trailingComments;
            last.replaceWith(exportLast);
          }
          return void 0;
        }
      }
    };
  };
  babelConfig = {
    plugins: [
      implicitFinalExportDefault,
      [
        require.resolve('babel-plugin-auto-import'),
        {
          declarations: [
            {
              default: 'preact',
              path: 'preact'
            },
            {
              default: 'svgtiler',
              path: 'svgtiler'
            }
          ]
        }
      ],
      require.resolve('@babel/plugin-transform-modules-commonjs'),
      [
        require.resolve('@babel/plugin-transform-react-jsx'),
        {
          useBuiltIns: true,
          runtime: 'automatic',
          importSource: 'preact',
          //pragma: 'preact.h'
          //pragmaFrag: 'preact.Fragment'
          throwIfNamespace: false
        }
      ]
    ],
    //inputSourceMap: true  # CoffeeScript sets this to its own source map
    sourceMaps: 'inline',
    retainLines: true
  };
  //# Tell CoffeeScript's register to transpile with our Babel config.
  module.options = {
    bare: true, // needed for implicitFinalExportDefault
    //inlineMap: true  # rely on Babel's source map
    transpile: babelConfig
  };
  require('@babel/register')(babelConfig);
  CoffeeScript = require('coffeescript');
  CoffeeScript.FILE_EXTENSIONS = ['.coffee', '.cjsx'];
  CoffeeScript.register();
}

defaultSettings = {
  //# Force all symbol tiles to have specified width or height.
  forceWidth: null, //# default: no size forcing
  forceHeight: null, //# default: no size forcing
  //# Inline <image>s into output SVG (replacing URLs to other files).
  inlineImages: typeof window === "undefined" || window === null,
  //# Process hidden sheets within spreadsheet files.
  keepHidden: false,
  //# Don't delete blank extreme rows/columns.
  keepMargins: false,
  //# Directories to output all or some files.
  outputDir: null, //# default: same directory as input
  outputDirExt: { //# by extension; default is to use outputDir
    '.svg': null,
    '.pdf': null,
    '.png': null,
    '.svg_tex': null
  },
  //# Default overflow behavior is 'visible' unless --no-overflow specified;
  //# use `overflow:hidden` to restore normal SVG behavior of keeping each tile
  //# within its bounding box.
  overflowDefault: 'visible',
  //# When a mapping refers to an SVG filename, assume this encoding.
  svgEncoding: 'utf8',
  //# Move <text> from SVG to accompanying LaTeX file.tex.
  texText: false,
  //# Use `href` instead of `xlink:href` attribute in <use> and <image>.
  //# `href` behaves better in web browsers, but `xlink:href` is more
  //# compatible with older SVG drawing programs.
  useHref: typeof window !== "undefined" && window !== null,
  //# renderDOM-specific
  filename: 'drawing.asc', // default filename when not otherwise specified
  keepParent: false,
  keepClass: false
};

getSetting = function(settings, key) {
  var ref;
  return (ref = settings != null ? settings[key] : void 0) != null ? ref : defaultSettings[key];
};

getOutputDir = function(settings, extension) {
  var dir, err, ref, ref1;
  dir = (ref = (ref1 = getSetting(settings, 'outputDirExt')) != null ? ref1[extension] : void 0) != null ? ref : getSetting(settings, 'outputDir');
  if (dir) {
    try {
      fs.mkdirSync(dir, {
        recursive: true
      });
    } catch (error1) {
      err = error1;
      console.warn(`Failed to make directory '${dir}': ${err}`);
    }
  }
  return dir;
};

HasSettings = class HasSettings {
  getSetting(key) {
    return getSetting(this.settings, key);
  }

  getOutputDir(extension) {
    return getOutputDir(this.settings, extension);
  }

};

SVGNS = 'http://www.w3.org/2000/svg';

XLINKNS = 'http://www.w3.org/1999/xlink';

splitIntoLines = function(data) {
  return data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
};

whitespace = /[\s\uFEFF\xA0]+/; //# based on https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim

extensionOf = function(filename) {
  return path.extname(filename).toLowerCase();
};

SVGTilerException = class SVGTilerException {
  constructor(message) {
    this.message = message;
  }

  toString() {
    return `svgtiler: ${this.message}`;
  }

};

parseBox = function(box) {
  if (!box) {
    return null;
  }
  box = box.split(/\s*[\s,]\s*/).map(parseNum);
  if (indexOf.call(box, null) >= 0) {
    return null;
  }
  return box;
};

extractOverflowBox = function(xml) {
  var box;
  //# Parse and return root overflowBox attribute.
  //# Also remove it if present, so output is valid SVG.
  box = xml.documentElement.getAttribute('overflowBox');
  xml.documentElement.removeAttribute('overflowBox');
  return parseBox(box);
};

parseNum = function(x) {
  var parsed;
  parsed = parseFloat(x);
  if (isNaN(parsed)) {
    return null;
  } else {
    return parsed;
  }
};

svgBBox = function(xml) {
  var recurse, viewBox;
  //# xxx Many unsupported features!
  //#   - transformations
  //#   - used symbols/defs
  //#   - paths
  //#   - text
  //#   - line widths which extend bounding box
  if (xml.documentElement.hasAttribute('viewBox')) {
    return parseBox(xml.documentElement.getAttribute('viewBox'));
  } else {
    recurse = function(node) {
      var child, coord, cx, cy, point, points, r, ref, ref1, ref10, ref11, ref12, ref13, ref14, ref15, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, rx, ry, viewBox, viewBoxes, x1, x2, xmax, xmin, xs, y1, y2, ymax, ymin, ys;
      if (node.nodeType !== node.ELEMENT_NODE || ((ref = node.nodeName) === 'defs' || ref === 'use')) {
        return null;
      }
      // Ignore <symbol>s except the root <symbol> that we're bounding
      if (node.nodeName === 'symbol' && node !== xml.documentElement) {
        return null;
      }
      switch (node.tagName) {
        case 'rect':
        case 'image':
          //# For <image>, should autodetect image size (#42)
          return [(ref1 = parseNum(node.getAttribute('x'))) != null ? ref1 : 0, (ref2 = parseNum(node.getAttribute('y'))) != null ? ref2 : 0, (ref3 = parseNum(node.getAttribute('width'))) != null ? ref3 : 0, (ref4 = parseNum(node.getAttribute('height'))) != null ? ref4 : 0];
        case 'circle':
          cx = (ref5 = parseNum(node.getAttribute('cx'))) != null ? ref5 : 0;
          cy = (ref6 = parseNum(node.getAttribute('cy'))) != null ? ref6 : 0;
          r = (ref7 = parseNum(node.getAttribute('r'))) != null ? ref7 : 0;
          return [cx - r, cy - r, 2 * r, 2 * r];
        case 'ellipse':
          cx = (ref8 = parseNum(node.getAttribute('cx'))) != null ? ref8 : 0;
          cy = (ref9 = parseNum(node.getAttribute('cy'))) != null ? ref9 : 0;
          rx = (ref10 = parseNum(node.getAttribute('rx'))) != null ? ref10 : 0;
          ry = (ref11 = parseNum(node.getAttribute('ry'))) != null ? ref11 : 0;
          return [cx - rx, cy - ry, 2 * rx, 2 * ry];
        case 'line':
          x1 = (ref12 = parseNum(node.getAttribute('x1'))) != null ? ref12 : 0;
          y1 = (ref13 = parseNum(node.getAttribute('y1'))) != null ? ref13 : 0;
          x2 = (ref14 = parseNum(node.getAttribute('x2'))) != null ? ref14 : 0;
          y2 = (ref15 = parseNum(node.getAttribute('y2'))) != null ? ref15 : 0;
          xmin = Math.min(x1, x2);
          ymin = Math.min(y1, y2);
          return [xmin, ymin, Math.max(x1, x2) - xmin, Math.max(y1, y2) - ymin];
        case 'polyline':
        case 'polygon':
          points = (function() {
            var k, len, ref16, results;
            ref16 = node.getAttribute('points').trim().split(/\s+/);
            results = [];
            for (k = 0, len = ref16.length; k < len; k++) {
              point = ref16[k];
              results.push((function() {
                var l, len1, ref17, results1;
                ref17 = point.split(/,/);
                results1 = [];
                for (l = 0, len1 = ref17.length; l < len1; l++) {
                  coord = ref17[l];
                  results1.push(parseFloat(coord));
                }
                return results1;
              })());
            }
            return results;
          })();
          xs = (function() {
            var k, len, results;
            results = [];
            for (k = 0, len = points.length; k < len; k++) {
              point = points[k];
              results.push(point[0]);
            }
            return results;
          })();
          ys = (function() {
            var k, len, results;
            results = [];
            for (k = 0, len = points.length; k < len; k++) {
              point = points[k];
              results.push(point[1]);
            }
            return results;
          })();
          xmin = Math.min(...xs);
          ymin = Math.min(...ys);
          if (isNaN(xmin) || isNaN(ymin)) { // invalid points attribute; don't render
            return null;
          } else {
            return [xmin, ymin, Math.max(...xs) - xmin, Math.max(...ys) - ymin];
          }
          break;
        default:
          viewBoxes = (function() {
            var k, len, ref16, results;
            ref16 = node.childNodes;
            results = [];
            for (k = 0, len = ref16.length; k < len; k++) {
              child = ref16[k];
              results.push(recurse(child));
            }
            return results;
          })();
          viewBoxes = (function() {
            var k, len, results;
            results = [];
            for (k = 0, len = viewBoxes.length; k < len; k++) {
              viewBox = viewBoxes[k];
              if (viewBox != null) {
                results.push(viewBox);
              }
            }
            return results;
          })();
          xmin = Math.min(...((function() {
            var k, len, results;
            results = [];
            for (k = 0, len = viewBoxes.length; k < len; k++) {
              viewBox = viewBoxes[k];
              results.push(viewBox[0]);
            }
            return results;
          })()));
          ymin = Math.min(...((function() {
            var k, len, results;
            results = [];
            for (k = 0, len = viewBoxes.length; k < len; k++) {
              viewBox = viewBoxes[k];
              results.push(viewBox[1]);
            }
            return results;
          })()));
          xmax = Math.max(...((function() {
            var k, len, results;
            results = [];
            for (k = 0, len = viewBoxes.length; k < len; k++) {
              viewBox = viewBoxes[k];
              results.push(viewBox[0] + viewBox[2]);
            }
            return results;
          })()));
          ymax = Math.max(...((function() {
            var k, len, results;
            results = [];
            for (k = 0, len = viewBoxes.length; k < len; k++) {
              viewBox = viewBoxes[k];
              results.push(viewBox[1] + viewBox[3]);
            }
            return results;
          })()));
          return [xmin, ymin, xmax - xmin, ymax - ymin];
      }
    };
    viewBox = recurse(xml.documentElement);
    if ((viewBox == null) || indexOf.call(viewBox, 2e308) >= 0 || indexOf.call(viewBox, -2e308) >= 0) {
      return null;
    } else {
      return viewBox;
    }
  }
};

isAuto = function(xml, prop) {
  return xml.documentElement.hasAttribute(prop) && /^\s*auto\s*$/i.test(xml.documentElement.getAttribute(prop));
};

attributeOrStyle = function(node, attr, styleKey = attr) {
  var match, style, value;
  if (value = node.getAttribute(attr)) {
    return value.trim();
  } else {
    style = node.getAttribute('style');
    if (style) {
      match = RegExp(`(?:^|;)\\s*${styleKey}\\s*:\\s*([^;\\s][^;]*)`, "i").exec(style);
      return match != null ? match[1] : void 0;
    }
  }
};

getHref = function(node) {
  var href, k, key, len, ref;
  ref = ['xlink:href', 'href'];
  for (k = 0, len = ref.length; k < len; k++) {
    key = ref[k];
    if (href = node.getAttribute(key)) {
      return {
        key: key,
        href: href
      };
    }
  }
  return {
    key: null,
    href: null
  };
};

extractZIndex = function(node) {
  var z;
  //# Check whether DOM node has a specified z-index, defaulting to zero.
  //# Also remove z-index attribute, so output is valid SVG.
  //# Note that z-index must be an integer.
  //# 1. https://www.w3.org/Graphics/SVG/WG/wiki/Proposals/z-index suggests
  //# a z-index="..." attribute.  Check for this first.
  //# 2. Look for style="z-index:..." as in HTML.
  z = parseInt(attributeOrStyle(node, 'z-index'));
  node.removeAttribute('z-index');
  if (isNaN(z)) {
    return 0;
  } else {
    return z;
  }
};

domRecurse = function(node, callback) {
  var child, nextChild;
  /*
  Recurse through DOM starting at `node`, calling `callback(node, parent)`
  on every recursive node except `node` itself.
  `callback()` should return a true value if you want to recurse into
  the specified node's children (typically, when there isn't a match).
  */
  if (!node.hasChildNodes()) {
    return;
  }
  child = node.lastChild;
  while (child != null) {
    nextChild = child.previousSibling;
    if (callback(child, node)) {
      domRecurse(child, callback);
    }
    child = nextChild;
  }
  return null;
};

contentType = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

renderPreact = function(data) {
  if (typeof data === 'object' && (data.type != null) && (data.props != null)) {
    data = require('preact-render-to-string')(data);
  }
  return data;
};

Symbol = class Symbol extends HasSettings {
  static parse(key, data, settings) {
    var extension, filename;
    if (data == null) {
      throw new SVGTilerException(`Attempt to create symbol '${key}' without data`);
    } else if (typeof data === 'function') {
      return new DynamicSymbol(key, data, settings);
    } else if (data.function != null) {
      return new DynamicSymbol(key, data.function, settings);
    } else {
      //# Render Preact virtual dom nodes (e.g. from JSX notation) into strings.
      //# Serialization + parsing shouldn't be necessary, but this lets us
      //# deal with one parsed format (xmldom).
      data = renderPreact(data);
      if (typeof data === 'string') {
        if (data.trim() === '') { //# Blank SVG treated as 0x0 symbol
          data = {
            svg: '<symbol viewBox="0 0 0 0"/>'
          };
        } else if (data.indexOf('<') < 0) { //# No <'s -> interpret as filename
          if ((settings != null ? settings.dirname : void 0) != null) {
            filename = path.join(settings.dirname, data);
          } else {
            filename = data;
          }
          extension = extensionOf(data);
          //# <image> tag documentation: "Conforming SVG viewers need to
          //# support at least PNG, JPEG and SVG format files."
          //# [https://svgwg.org/svg2-draft/embedded.html#ImageElement]
          data = (function() {
            switch (extension) {
              case '.png':
              case '.jpg':
              case '.jpeg':
              case '.gif':
                return {
                  svg: `<image ${hrefAttr(settings)}="${encodeURI(data)}"/>`
                };
              case '.svg':
                settings = {
                  ...settings,
                  dirname: path.dirname(filename)
                };
                return data = {
                  filename: filename,
                  svg: fs.readFileSync(filename, {
                    encoding: getSetting(settings, 'svgEncoding')
                  })
                };
              default:
                throw new SVGTilerException(`Unrecognized extension in filename '${data}' for symbol '${key}'`);
            }
          })();
        } else {
          data = {
            svg: data
          };
        }
      }
      return new StaticSymbol(key, {...data, settings});
    }
  }

  includes(substring) {
    return this.key.indexOf(substring) >= 0;
  }

  //# ECMA6: @key.includes substring
  match(regex) {
    return this.key.match(regex);
  }

};

escapeId = function(key) {
  /*
  According to XML spec [https://www.w3.org/TR/xml/#id],
  id/href follows the XML name spec: [https://www.w3.org/TR/xml/#NT-Name]
    NameStartChar ::= ":" | [A-Z] | "_" | [a-z] | [#xC0-#xD6] | [#xD8-#xF6] | [#xF8-#x2FF] | [#x370-#x37D] | [#x37F-#x1FFF] | [#x200C-#x200D] | [#x2070-#x218F] | [#x2C00-#x2FEF] | [#x3001-#xD7FF] | [#xF900-#xFDCF] | [#xFDF0-#xFFFD] | [#x10000-#xEFFFF]
    NameChar      ::= NameStartChar | "-" | "." | [0-9] | #xB7 | [#x0300-#x036F] | [#x203F-#x2040]
    Name          ::= NameStartChar (NameChar)*
  In addition, colons in IDs fail when embedding an SVG via <img>.
  We use encodeURIComponent which escapes everything except
    A-Z a-z 0-9 - _ . ! ~ * ' ( )
  [https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent]
  into %-encoded symbols, plus we encode _ . ! ~ * ' ( ) and - 0-9 (start only).
  But % (and %-encoded) symbols are not supported, so we replace '%' with '_',
  an allowed character that we escape.
  In the special case of a blank key, we use the special _blank which cannot
  be generated by the escaping process.
  */
  return (encodeURIComponent(key).replace(/[_\.!~*'()]|^[\-0-9]/g, function(c) {
    return `%${c.charCodeAt(0).toString(16).toUpperCase()}`;
  }).replace(/%/g, '_')) || '_blank';
};

zeroSizeReplacement = 1;

StaticSymbol = (function() {
  class StaticSymbol extends Symbol {
    constructor(key1, options) {
      var attribute, child, doc, forceHeight, forceWidth, k, key, l, len, len1, node, overflow, overflowDefault, ref, ref1, ref2, ref3, symbol, value, warnings;
      super();
      this.key = key1;
      for (key in options) {
        if (!hasProp.call(options, key)) continue;
        value = options[key];
        this[key] = value;
      }
      //# Force SVG namespace when parsing, so nodes have correct namespaceURI.
      //# (This is especially important on the browser, so the results can be
      //# reparented into an HTML Document.)
      this.svg = this.svg.replace(/^\s*<(?:[^<>'"\/]|'[^']*'|"[^"]*")*\s*(\/?\s*>)/, function(match, end) {
        if (indexOf.call(match, 'xmlns') < 0) {
          match = match.slice(0, match.length - end.length) + ` xmlns='${SVGNS}'` + match.slice(match.length - end.length);
        }
        return match;
      });
      this.xml = new DOMParser({
        locator: { //# needed when specifying errorHandler
          line: 1,
          col: 1
        },
        errorHandler: (level, msg, indent = '  ') => {
          msg = msg.replace(/^\[xmldom [^\[\]]*\]\t/, '');
          msg = msg.replace(/@#\[line:(\d+),col:(\d+)\]$/, (match, line, col) => {
            var lines;
            lines = this.svg.split('\n');
            return (line > 1 ? indent + lines[line - 2] + '\n' : '') + indent + lines[line - 1] + '\n' + indent + ' '.repeat(col - 1) + '^^^' + (line < lines.length ? '\n' + indent + lines[line] : '');
          });
          return console.error(`SVG parse ${level} in symbol '${this.key}': ${msg}`);
        }
      }).parseFromString(this.svg, 'image/svg+xml');
      // Remove from the symbol any top-level xmlns=SVGNS possibly added above:
      // we will have such a tag in the top-level <svg>.
      this.xml.documentElement.removeAttribute('xmlns');
      //# Wrap XML in <symbol> if not already.
      symbol = this.xml.createElementNS(SVGNS, 'symbol');
      symbol.setAttribute('id', this.id = escapeId(this.key));
      // Avoid a layer of indirection for <symbol>/<svg> at top level
      if (((ref = this.xml.documentElement.nodeName) === 'symbol' || ref === 'svg') && (this.xml.documentElement.nextSibling == null)) {
        ref1 = this.xml.documentElement.attributes;
        for (k = 0, len = ref1.length; k < len; k++) {
          attribute = ref1[k];
          if (!(((ref2 = attribute.name) === 'version' || ref2 === 'id') || attribute.name.slice(0, 5) === 'xmlns')) {
            symbol.setAttribute(attribute.name, attribute.value);
          }
        }
        doc = this.xml.documentElement;
        this.xml.removeChild(this.xml.documentElement);
      } else {
        doc = this.xml;
      }
      ref3 = (function() {
        var len1, n, ref3, results;
        ref3 = doc.childNodes;
        results = [];
        for (n = 0, len1 = ref3.length; n < len1; n++) {
          node = ref3[n];
          results.push(node);
        }
        return results;
      })();
      for (l = 0, len1 = ref3.length; l < len1; l++) {
        child = ref3[l];
        symbol.appendChild(child);
      }
      this.xml.appendChild(symbol);
      //# <image> processing
      domRecurse(this.xml.documentElement, (node) => {
        /*
        Fix image-rendering: if unspecified, or if specified as "optimizeSpeed"
        or "pixelated", attempt to render pixels as pixels, as needed for
        old-school graphics.  SVG 1.1 and Inkscape define
        image-rendering="optimizeSpeed" for this.  Chrome doesn't support this,
        but supports a CSS3 (or SVG) specification of
        "image-rendering:pixelated".  Combining these seems to work everywhere.
        */
        var dirname, e, filedata, filename, height, href, ref4, rendering, size, style, type, width;
        if (node.nodeName === 'image') {
          rendering = attributeOrStyle(node, 'image-rendering');
          if ((rendering == null) || (rendering === 'optimizeSpeed' || rendering === 'pixelated')) {
            node.setAttribute('image-rendering', 'optimizeSpeed');
            style = (ref4 = node.getAttribute('style')) != null ? ref4 : '';
            style = style.replace(/(^|;)\s*image-rendering\s*:\s*\w+\s*($|;)/, function(m, before, after) {
              return before || after || '';
            });
            if (style) {
              style += ';';
            }
            node.setAttribute('style', style + 'image-rendering:pixelated');
          }
          //# Read file for width/height detection and/or inlining
          ({href, key} = getHref(node));
          filename = href;
          if (((dirname = this.getSetting('dirname')) != null) && filename) {
            filename = path.join(dirname, filename);
          }
          if ((filename != null) && !/^data:|file:|[a-z]+:\/\//.test(filename)) { // skip URLs
            filedata = null;
            try {
              if (typeof window === "undefined" || window === null) {
                filedata = fs.readFileSync(filename);
              }
            } catch (error1) {
              e = error1;
              console.warn(`Failed to read image '${filename}': ${e}`);
            }
            //# Fill in width and height
            size = null;
            if (typeof window === "undefined" || window === null) {
              try {
                size = require('image-size')(filedata != null ? filedata : filename);
              } catch (error1) {
                e = error1;
                console.warn(`Failed to detect size of image '${filename}': ${e}`);
              }
            }
            if (size != null) {
              //# If one of width and height is set, scale to match.
              if (!isNaN(width = parseFloat(node.getAttribute('width')))) {
                node.setAttribute('height', size.height * (width / size.width));
              } else if (!isNaN(height = parseFloat(node.getAttribute('height')))) {
                node.setAttribute('width', size.width * (height / size.height));
              } else {
                //# If neither width nor height are set, set both.
                node.setAttribute('width', size.width);
                node.setAttribute('height', size.height);
              }
            }
            //# Inline
            if ((filedata != null) && this.getSetting('inlineImages')) {
              type = contentType[extensionOf(filename)];
              if (type != null) {
                node.setAttribute("data-filename", filename);
                if (size != null) {
                  node.setAttribute("data-width", size.width);
                  node.setAttribute("data-height", size.height);
                }
                node.setAttribute(key, `data:${type};base64,${filedata.toString('base64')}`);
              }
            }
          }
          return false;
        } else {
          return true;
        }
      });
      //# Compute viewBox attribute if absent.
      this.viewBox = svgBBox(this.xml);
      //# Overflow behavior
      overflow = attributeOrStyle(this.xml.documentElement, 'overflow');
      if ((overflow == null) && ((overflowDefault = this.getSetting('overflowDefault')) != null)) {
        this.xml.documentElement.setAttribute('overflow', overflow = overflowDefault);
      }
      this.overflowVisible = (overflow != null) && /^\s*(visible|scroll)\b/.test(overflow);
      this.width = this.height = null;
      if (this.viewBox != null) {
        this.width = this.viewBox[2];
        this.height = this.viewBox[3];
        /*
        SVG's viewBox has a special rule that "A value of zero [in <width>
        or <height>] disables rendering of the element."  Avoid this.
        [https://www.w3.org/TR/SVG11/coords.html#ViewBoxAttribute]
        */
        if (this.overflowVisible) {
          if (this.width === 0) {
            this.viewBox[2] = zeroSizeReplacement;
          }
          if (this.height === 0) {
            this.viewBox[3] = zeroSizeReplacement;
          }
        }
        //# Reset viewBox attribute in case either absent (and computed via
        //# svgBBox) or changed to avoid zeroes.
        this.xml.documentElement.setAttribute('viewBox', this.viewBox.join(' '));
      }
      this.overflowBox = extractOverflowBox(this.xml);
      if ((forceWidth = this.getSetting('forceWidth')) != null) {
        this.width = forceWidth;
      }
      if ((forceHeight = this.getSetting('forceHeight')) != null) {
        this.height = forceHeight;
      }
      warnings = [];
      if (this.width == null) {
        warnings.push('width');
        this.width = 0;
      }
      if (this.height == null) {
        warnings.push('height');
        this.height = 0;
      }
      if (warnings.length > 0) {
        console.warn(`Failed to detect ${warnings.join(' and ')} of SVG for symbol '${this.key}'`);
      }
      //# Detect special `width="auto"` and/or `height="auto"` fields for future
      //# processing, and remove them to ensure valid SVG.
      this.autoWidth = isAuto(this.xml, 'width');
      this.autoHeight = isAuto(this.xml, 'height');
      if (this.autoWidth) {
        this.xml.documentElement.removeAttribute('width');
      }
      if (this.autoHeight) {
        this.xml.documentElement.removeAttribute('height');
      }
      this.zIndex = extractZIndex(this.xml.documentElement);
      //# Optionally extract <text> nodes for LaTeX output
      if (this.getSetting('texText')) {
        this.text = [];
        domRecurse(this.xml.documentElement, (node, parent) => {
          if (node.nodeName === 'text') {
            this.text.push(node);
            parent.removeChild(node);
            return false; // don't recurse into <text>'s children
          } else {
            return true;
          }
        });
      }
    }

    setId(id) {
      this.id = id; // for <use>
      return this.xml.documentElement.setAttribute('id', id);
    }

    use() {
      return this;
    }

  };

  StaticSymbol.prototype.usesContext = false;

  return StaticSymbol;

}).call(this);

DynamicSymbol = (function() {
  class DynamicSymbol extends Symbol {
    constructor(key1, func1, settings1) {
      super();
      this.key = key1;
      this.func = func1;
      this.settings = settings1;
      this.versions = {};
      this.nversions = 0;
      this.constructor.all.push(this);
    }

    static resetAll() {
      var k, len, ref, results, symbol;
      ref = this.all;
      //# Resets all DynamicSymbol's versions to 0.
      //# Use before starting a new SVG document.
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        symbol = ref[k];
        symbol.versions = {};
        results.push(symbol.nversions = 0);
      }
      return results;
    }

    use(context) {
      var result, string, version;
      result = this.func.call(context);
      if (result == null) {
        throw new Error(`Function for symbol ${this.key} returned ${result}`);
      }
      //# Render Preact virtual dom elements (e.g. from JSX notation) to SVG now,
      //# for better duplicate detection.
      result = renderPreact(result);
      //# We use JSON serialization to detect duplicate symbols.  This enables
      //# return values like {filename: ...}, in addition to raw SVG strings.
      string = JSON.stringify(result);
      if (!(string in this.versions)) {
        version = this.nversions++;
        this.versions[string] = Symbol.parse(`${this.key}_v${version}`, result, this.settings);
        this.versions[string].setId(`${escapeId(this.key)}_v${version}`);
      }
      return this.versions[string];
    }

  };

  DynamicSymbol.all = [];

  DynamicSymbol.prototype.usesContext = true;

  return DynamicSymbol;

}).call(this);

//# Symbol to fall back to when encountering an unrecognized symbol.
//# Path from https://commons.wikimedia.org/wiki/File:Replacement_character.svg
//# by Amit6, released into the public domain.
unrecognizedSymbol = new StaticSymbol('_unrecognized', {
  svg: `<symbol viewBox="0 0 200 200" preserveAspectRatio="none" width="auto" height="auto">
  <rect width="200" height="200" fill="yellow"/>
  <path stroke="none" fill="red" d="M 200,100 100,200 0,100 100,0 200,100 z M 135.64709,74.70585 q 0,-13.52935 -10.00006,-22.52943 -9.99999,-8.99999 -24.35289,-8.99999 -17.29415,0 -30.117661,5.29409 L 69.05879,69.52938 q 9.764731,-6.23528 21.52944,-6.23528 8.82356,0 14.58824,4.82351 5.76469,4.82351 5.76469,12.70589 0,8.5883 -9.94117,21.70588 -9.94117,13.11766 -9.94117,26.76473 l 17.88236,0 q 0,-6.3529 6.9412,-14.9412 11.76471,-14.58816 12.82351,-16.35289 6.9412,-11.05887 6.9412,-23.29417 z m -22.00003,92.11771 0,-24.70585 -27.29412,0 0,24.70585 27.29412,0 z"/>
</symbol>`
});

unrecognizedSymbol.setId('_unrecognized'); // cannot be output of escapeId()

Input = (function() {
  class Input extends HasSettings {
    static parseFile(filename, filedata, settings) {
      var input;
      //# Generic method to parse file once we're already in the right class.
      input = new (this)();
      input.filename = filename;
      input.settings = settings;
      if (!((filedata != null) || this.skipRead)) {
        filedata = fs.readFileSync(filename, {
          encoding: this.encoding
        });
      }
      input.parse(filedata);
      return input;
    }

    static recognize(filename, filedata, settings) {
      var extension;
      //# Recognize type of file and call corresponding class's `parseFile`.
      extension = extensionOf(filename);
      if (extension in extensionMap) {
        return extensionMap[extension].parseFile(filename, filedata, settings);
      } else {
        throw new SVGTilerException(`Unrecognized extension in filename ${filename}`);
      }
    }

  };

  Input.encoding = 'utf8';

  return Input;

}).call(this);

Style = class Style extends Input {
  load(css) {
    this.css = css;
  }

};

CSSStyle = (function() {
  class CSSStyle extends Style {
    parse(filedata) {
      return this.load(filedata);
    }

  };

  CSSStyle.title = "CSS style file";

  return CSSStyle;

}).call(this);

StylusStyle = (function() {
  class StylusStyle extends Style {
    parse(filedata) {
      var styl;
      styl = require('stylus')(filedata, {
        filename: this.filename
      });
      return this.load(styl.render());
    }

  };

  StylusStyle.title = "Stylus style file (https://stylus-lang.com/)";

  return StylusStyle;

}).call(this);

Styles = class Styles {
  constructor(styles1 = []) {
    this.styles = styles1;
  }

  push(map) {
    return this.styles.push(map);
  }

};

Mapping = class Mapping extends Input {
  constructor(data) {
    super();
    this.map = {};
    if (data != null) {
      this.load(data);
    }
  }

  load(data) {
    if (typeof data === 'function') {
      return this.function = data;
    } else {
      return this.merge(data);
    }
  }

  merge(data) {
    var key, results, settings, value;
    settings = this.settings;
    if (this.filename != null) {
      settings = {
        ...settings,
        dirname: path.dirname(this.filename)
      };
    }
    results = [];
    for (key in data) {
      if (!hasProp.call(data, key)) continue;
      value = data[key];
      if (!(value instanceof Symbol)) {
        value = Symbol.parse(key, value, settings);
      }
      results.push(this.map[key] = value);
    }
    return results;
  }

  lookup(key) {
    var settings, value;
    key = key.toString(); //# Sometimes get a number, e.g., from XLSX
    if (key in this.map) {
      return this.map[key];
    } else if (this.function != null) {
      //# Cache return value of function so that only one Symbol generated
      //# for each key.  It still may be a DynamicSymbol, which will allow
      //# it to make multiple versions, but keep track of which are the same.
      value = this.function(key);
      if (value != null) {
        settings = this.settings;
        if (this.filename != null) {
          settings = {
            ...settings,
            dirname: path.dirname(this.filename)
          };
        }
        return this.map[key] = Symbol.parse(key, value, settings);
      } else {
        return value;
      }
    } else {
      return void 0;
    }
  }

};

ASCIIMapping = (function() {
  class ASCIIMapping extends Mapping {
    parse(data) {
      var k, key, len, line, map, ref, separator;
      map = {};
      ref = splitIntoLines(data);
      for (k = 0, len = ref.length; k < len; k++) {
        line = ref[k];
        separator = whitespace.exec(line);
        if (separator == null) {
          continue;
        }
        if (separator.index === 0) {
          if (separator[0].length === 1) {
            //# Single whitespace character at beginning defines blank character
            key = '';
          } else {
            //# Multiple whitespace at beginning defines first whitespace character
            key = line[0];
          }
        } else {
          key = line.slice(0, separator.index);
        }
        map[key] = line.slice(separator.index + separator[0].length);
      }
      return this.load(map);
    }

  };

  ASCIIMapping.title = "ASCII mapping file";

  ASCIIMapping.help = "Each line is <symbol-name><space><raw SVG or filename.svg>";

  return ASCIIMapping;

}).call(this);

JSMapping = (function() {
  class JSMapping extends Mapping {
    parse(data) {
      var _dirname, _filename, code, exports, filename, func, ref;
      if (data == null) {
        //# Normally use `require` to load code as a real NodeJS module
        filename = path.resolve(this.filename);
        return this.load((ref = require(filename).default) != null ? ref : {});
      } else {
        //# But if file has been explicitly loaded (e.g. in browser),
        //# compile manually and simulate module.
        ({code} = require('@babel/core').transform(data, {
          ...babelConfig,
          filename: this.filename
        }));
        exports = {};
        //# Mimick NodeJS module's __filename and __dirname variables
        //# [https://nodejs.org/api/modules.html#modules_the_module_scope]
        _filename = path.resolve(this.filename);
        _dirname = path.dirname(_filename);
        //# Use `new Function` instead of `eval` for improved performance and to
        //# restrict to passed arguments + global scope.
        //@load eval code
        func = new Function('exports', '__filename', '__dirname', 'svgtiler', 'preact', code);
        func(exports, _filename, _dirname, svgtiler, (0 <= code.indexOf('preact') ? require('preact') : void 0));
        return this.load(exports.default);
      }
    }

  };

  JSMapping.title = "JavaScript mapping file (including JSX notation)";

  JSMapping.help = "Object mapping symbol names to SYMBOL e.g. {dot: 'dot.svg'}";

  JSMapping.skipRead = true; // require loads file contents for us

  return JSMapping;

}).call(this);

CoffeeMapping = (function() {
  class CoffeeMapping extends JSMapping {
    parse(data) {
      if (data == null) {
        return super.parse(data);
      } else {
        return super.parse(require('coffeescript').compile(data, {
          bare: true,
          inlineMap: true,
          filename: this.filename,
          sourceFiles: [this.filename]
        }));
      }
    }

  };

  CoffeeMapping.title = "CoffeeScript mapping file (including JSX notation)";

  CoffeeMapping.help = "Object mapping symbol names to SYMBOL e.g. dot: 'dot.svg'";

  return CoffeeMapping;

}).call(this);

Mappings = class Mappings {
  constructor(maps = []) {
    this.maps = maps;
  }

  static from(data) {
    if (data instanceof Mappings) {
      return data;
    } else if (data instanceof Mapping) {
      return new Mappings([data]);
    } else if (Array.isArray(data)) {
      return new Mappings(data);
    } else {
      throw new SVGTilerException(`Could not convert into Mapping(s): ${data}`);
    }
  }

  push(map) {
    return this.maps.push(map);
  }

  lookup(key) {
    var i, k, ref, value;
    if (!this.maps.length) {
      return;
    }
    for (i = k = ref = this.maps.length - 1; (ref <= 0 ? k <= 0 : k >= 0); i = ref <= 0 ? ++k : --k) {
      value = this.maps[i].lookup(key);
      if (value != null) {
        return value;
      }
    }
    return void 0;
  }

};

blankCells = {
  '': true,
  ' ': true //# for ASCII art in particular
};

allBlank = function(list) {
  var k, len, x;
  for (k = 0, len = list.length; k < len; k++) {
    x = list[k];
    if ((x != null) && !(x in blankCells)) {
      return false;
    }
  }
  return true;
};

hrefAttr = function(settings) {
  if (getSetting(settings, 'useHref')) {
    return 'href';
  } else {
    return 'xlink:href';
  }
};

Drawing = class Drawing extends Input {
  hrefAttr() {
    return hrefAttr(this.settings);
  }

  load(data) {
    var cell, j, k, l, len, len1, row;
    //# Turn strings into arrays
    data = (function() {
      var k, len, results;
      results = [];
      for (k = 0, len = data.length; k < len; k++) {
        row = data[k];
        results.push((function() {
          var l, len1, results1;
          results1 = [];
          for (l = 0, len1 = row.length; l < len1; l++) {
            cell = row[l];
            results1.push(cell);
          }
          return results1;
        })());
      }
      return results;
    })();
    if (!this.getSetting('keepMargins')) {
      //# Top margin
      while (data.length > 0 && allBlank(data[0])) {
        data.shift();
      }
      //# Bottom margin
      while (data.length > 0 && allBlank(data[data.length - 1])) {
        data.pop();
      }
      if (data.length > 0) {
        //# Left margin
        while (allBlank((function() {
            var l, len1, results;
            results = [];
            for (l = 0, len1 = data.length; l < len1; l++) {
              row = data[l];
              results.push(row[0]);
            }
            return results;
          })())) {
          for (k = 0, len = data.length; k < len; k++) {
            row = data[k];
            row.shift();
          }
        }
        //# Right margin
        j = Math.max(...((function() {
          var l, len1, results;
          results = [];
          for (l = 0, len1 = data.length; l < len1; l++) {
            row = data[l];
            results.push(row.length);
          }
          return results;
        })()));
        while (j >= 0 && allBlank((function() {
            var len2, n, results;
            results = [];
            for (n = 0, len2 = data.length; n < len2; n++) {
              row = data[n];
              results.push(row[j]);
            }
            return results;
          })())) {
          for (l = 0, len1 = data.length; l < len1; l++) {
            row = data[l];
            if (j < row.length) {
              row.pop();
            }
          }
          j--;
        }
      }
    }
    return this.data = data;
  }

  writeSVG(mappings, styles, filename) {
    var outputDir;
    //# Default filename is the input filename with extension replaced by .svg
    if (filename == null) {
      filename = path.parse(this.filename);
      if (filename.ext === '.svg') {
        filename.base += '.svg';
      } else {
        filename.base = filename.base.slice(0, -filename.ext.length) + '.svg';
      }
      if ((outputDir = this.getOutputDir('.svg')) != null) {
        filename.dir = outputDir;
      }
      filename = path.format(filename);
    }
    console.log('->', filename);
    fs.writeFileSync(filename, this.renderSVG(mappings, styles));
    return filename;
  }

  renderSVGDOM(mappings, styles) {
    var cell, colWidths, coordsRow, doc, dx, dy, i, inlineImageVersions, inlineImages, j, k, key, l, lastSymbol, len, len1, len2, len3, len4, len5, level, levelOrder, levels, missing, n, name, node, o, p, q, ref, ref1, ref2, ref3, ref4, ref5, ref6, ref7, row, row2, rowHeight, scaleX, scaleY, style, styleTag, svg, symbol, symbolsByKey, use, viewBox, x, y;
    /*
    Main rendering engine, returning an xmldom object for the whole document.
    Also saves the table of symbols in `@symbols`, the corresponding
    coordinates in `@coords`, and overall `@weight` and `@height`,
    for use by `renderTeX`.
    */
    DynamicSymbol.resetAll();
    doc = domImplementation.createDocument(SVGNS, 'svg');
    svg = doc.documentElement;
    if (!this.getSetting('useHref')) {
      svg.setAttribute('xmlns:xlink', XLINKNS);
    }
    svg.setAttribute('version', '1.1');
    ref1 = (ref = styles != null ? styles.styles : void 0) != null ? ref : [];
    //svg.appendChild defs = doc.createElementNS SVGNS, 'defs'
    //# <style> tags for CSS
    for (k = 0, len = ref1.length; k < len; k++) {
      style = ref1[k];
      svg.appendChild(styleTag = doc.createElementNS(SVGNS, 'style'));
      styleTag.textContent = style.css;
    }
    //# Look up all symbols in the drawing.
    missing = {};
    this.symbols = (function() {
      var l, len1, ref2, results;
      ref2 = this.data;
      results = [];
      for (l = 0, len1 = ref2.length; l < len1; l++) {
        row = ref2[l];
        results.push((function() {
          var len2, n, results1;
          results1 = [];
          for (n = 0, len2 = row.length; n < len2; n++) {
            cell = row[n];
            symbol = mappings.lookup(cell);
            if (symbol != null) {
              results1.push(lastSymbol = symbol);
            } else {
              missing[cell] = true;
              results1.push(unrecognizedSymbol);
            }
          }
          return results1;
        })());
      }
      return results;
    }).call(this);
    missing = (function() {
      var results;
      results = [];
      for (key in missing) {
        if (!hasProp.call(missing, key)) continue;
        results.push(`'${key}'`);
      }
      return results;
    })();
    if (missing.length) {
      console.warn("Failed to recognize symbols:", missing.join(', '));
    }
    //# Instantiate (.use) all (dynamic) symbols in the drawing.
    symbolsByKey = {};
    this.symbols = (function() {
      var l, len1, ref2, results;
      ref2 = this.symbols;
      results = [];
      for (i = l = 0, len1 = ref2.length; l < len1; i = ++l) {
        row = ref2[i];
        results.push((function() {
          var len2, n, results1;
          results1 = [];
          for (j = n = 0, len2 = row.length; n < len2; j = ++n) {
            symbol = row[j];
            if (symbol.usesContext) {
              symbol = symbol.use(new Context(this, i, j));
            } else {
              symbol = symbol.use();
            }
            if (!(symbol.key in symbolsByKey)) {
              symbolsByKey[symbol.key] = symbol;
            } else if (symbolsByKey[symbol.key] === !symbol) {
              console.warn(`Multiple symbols with key ${symbol.key}`);
            }
            results1.push(symbol);
          }
          return results1;
        }).call(this));
      }
      return results;
    }).call(this);
//# Include all used symbols in SVG
    for (key in symbolsByKey) {
      symbol = symbolsByKey[key];
      if (symbol == null) {
        continue;
      }
      svg.appendChild(symbol.xml.documentElement.cloneNode(true));
    }
    //# Factor out duplicate inline <image>s into separate <symbol>s.
    inlineImages = {};
    inlineImageVersions = {};
    domRecurse(svg, (node, parent) => {
      var attr, attributes, filename, height, href, l, len1, ref2, ref3, use, version, width;
      if (node.nodeName !== 'image') {
        return true;
      }
      ({href} = getHref(node));
      if (!(href != null ? href.startsWith('data:') : void 0)) {
        return true;
      }
      // data-filename gets set to the original filename when inlining,
      // which we use for key labels so isn't needed as an exposed attribute.
      // Ditto for width and height of image.
      filename = (ref2 = node.getAttribute('data-filename')) != null ? ref2 : '';
      node.removeAttribute('data-filename');
      width = node.getAttribute('data-width');
      node.removeAttribute('data-width');
      height = node.getAttribute('data-height');
      node.removeAttribute('data-height');
      // Transfer x/y/width/height to <use> element, for more re-usability.
      parent.replaceChild((use = doc.createElementNS(SVGNS, 'use')), node);
      ref3 = ['x', 'y', 'width', 'height'];
      for (l = 0, len1 = ref3.length; l < len1; l++) {
        attr = ref3[l];
        if (node.hasAttribute(attr)) {
          use.setAttribute(attr, node.getAttribute(attr));
        }
        node.removeAttribute(attr);
      }
      // Memoize versions
      attributes = (function() {
        var len2, n, ref4, results;
        ref4 = node.attributes;
        results = [];
        for (n = 0, len2 = ref4.length; n < len2; n++) {
          attr = ref4[n];
          results.push(`${attr.name}=${attr.value}`);
        }
        return results;
      })();
      attributes.sort();
      attributes = attributes.join(' ');
      if (!(attributes in inlineImages)) {
        if (inlineImageVersions[filename] == null) {
          inlineImageVersions[filename] = 0;
        }
        version = inlineImageVersions[filename]++;
        inlineImages[attributes] = `_image_${escapeId(filename)}_v${version}`;
        svg.appendChild(symbol = doc.createElementNS(SVGNS, 'symbol'));
        symbol.setAttribute('id', inlineImages[attributes]);
        // If we don't have width/height set from data-width/height fields,
        // we take the first used width/height as the defining height.
        node.setAttribute('width', width || use.getAttribute('width'));
        node.setAttribute('height', height || use.getAttribute('height'));
        symbol.setAttribute('viewBox', `0 0 ${width} ${height}`);
        symbol.appendChild(node);
      }
      use.setAttribute(this.hrefAttr(), '#' + inlineImages[attributes]);
      return false;
    });
    //# Lay out the symbols in the drawing via SVG <use>.
    viewBox = [
      0,
      0,
      0,
      0 //# initially x-min, y-min, x-max, y-max
    ];
    levels = {};
    y = 0;
    colWidths = {};
    this.coords = [];
    ref2 = this.symbols;
    for (i = l = 0, len1 = ref2.length; l < len1; i = ++l) {
      row = ref2[i];
      this.coords.push(coordsRow = []);
      rowHeight = 0;
      for (n = 0, len2 = row.length; n < len2; n++) {
        symbol = row[n];
        if (!symbol.autoHeight) {
          if (symbol.height > rowHeight) {
            rowHeight = symbol.height;
          }
        }
      }
      x = 0;
      for (j = o = 0, len3 = row.length; o < len3; j = ++o) {
        symbol = row[j];
        coordsRow.push({x, y});
        if (symbol == null) {
          continue;
        }
        if (levels[name = symbol.zIndex] == null) {
          levels[name] = [];
        }
        levels[symbol.zIndex].push(use = doc.createElementNS(SVGNS, 'use'));
        use.setAttribute(this.hrefAttr(), '#' + symbol.id);
        use.setAttribute('x', x);
        use.setAttribute('y', y);
        scaleX = scaleY = 1;
        if (symbol.autoWidth) {
          if (colWidths[j] == null) {
            colWidths[j] = Math.max(0, ...((function() {
              var len4, p, ref3, results;
              ref3 = this.symbols;
              results = [];
              for (p = 0, len4 = ref3.length; p < len4; p++) {
                row2 = ref3[p];
                if ((row2[j] != null) && !row2[j].autoWidth) {
                  results.push(row2[j].width);
                }
              }
              return results;
            }).call(this)));
          }
          if (symbol.width !== 0) {
            scaleX = colWidths[j] / symbol.width;
          }
          if (!symbol.autoHeight) {
            scaleY = scaleX;
          }
        }
        if (symbol.autoHeight) {
          if (symbol.height !== 0) {
            scaleY = rowHeight / symbol.height;
          }
          if (!symbol.autoWidth) {
            scaleX = scaleY;
          }
        }
        //# Scaling of symbol is relative to viewBox, so use that to define
        //# width and height attributes:
        use.setAttribute('width', ((ref3 = (ref4 = symbol.viewBox) != null ? ref4[2] : void 0) != null ? ref3 : symbol.width) * scaleX);
        use.setAttribute('height', ((ref5 = (ref6 = symbol.viewBox) != null ? ref6[3] : void 0) != null ? ref5 : symbol.height) * scaleY);
        if (symbol.overflowBox != null) {
          dx = (symbol.overflowBox[0] - symbol.viewBox[0]) * scaleX;
          dy = (symbol.overflowBox[1] - symbol.viewBox[1]) * scaleY;
          viewBox[0] = Math.min(viewBox[0], x + dx);
          viewBox[1] = Math.min(viewBox[1], y + dy);
          viewBox[2] = Math.max(viewBox[2], x + dx + symbol.overflowBox[2] * scaleX);
          viewBox[3] = Math.max(viewBox[3], y + dy + symbol.overflowBox[3] * scaleY);
        }
        x += symbol.width * scaleX;
        viewBox[2] = Math.max(viewBox[2], x);
      }
      y += rowHeight;
      viewBox[3] = Math.max(viewBox[3], y);
    }
    //# Change from x-min, y-min, x-max, y-max to x-min, y-min, width, height
    viewBox[2] = viewBox[2] - viewBox[0];
    viewBox[3] = viewBox[3] - viewBox[1];
    //# Sort by level
    levelOrder = ((function() {
      var results;
      results = [];
      for (level in levels) {
        results.push(level);
      }
      return results;
    })()).sort(function(x, y) {
      return x - y;
    });
    for (p = 0, len4 = levelOrder.length; p < len4; p++) {
      level = levelOrder[p];
      ref7 = levels[level];
      for (q = 0, len5 = ref7.length; q < len5; q++) {
        node = ref7[q];
        svg.appendChild(node);
      }
    }
    svg.setAttribute('viewBox', viewBox.join(' '));
    svg.setAttribute('width', this.width = viewBox[2]);
    svg.setAttribute('height', this.height = viewBox[3]);
    //svg.setAttribute 'preserveAspectRatio', 'xMinYMin meet'
    return doc;
  }

  renderSVG(mappings, styles) {
    var out;
    out = new XMLSerializer().serializeToString(this.renderSVGDOM(mappings, styles));
    //# Parsing xlink:href in user's SVG fragments, and then serializing,
    //# can lead to these null namespace definitions.  Remove.
    out = out.replace(/\sxmlns:xlink=""/g, '');
    if (prettyXML != null) {
      out = prettyXML(out, {
        newline: '\n' //# force consistent line endings, not require('os').EOL
      });
    }
    return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
` + out;
  }

  renderTeX(filename, relativeDir) {
    var anchor, basename, child, content, i, j, k, l, len, len1, len2, lines, n, ref, ref1, ref2, ref3, row, symbol, text, tx, ty, wrap, x, y;
    //# Must be called *after* `renderSVG` (or `renderSVGDOM`)
    filename = path.parse(filename);
    basename = filename.base.slice(0, -filename.ext.length);
    if (relativeDir) {
      relativeDir += '/';
      //# TeX uses forward slashes for path separators
      if (require('process').platform === 'win32') {
        relativeDir = relativeDir.replace(/\\/g, '/');
      }
    }
    //# LaTeX based loosely on Inkscape's PDF/EPS/PS + LaTeX output extension.
    //# See http://tug.ctan.org/tex-archive/info/svg-inkscape/
    lines = [
      `%% Creator: svgtiler ${metadata.version}, https://github.com/edemaine/svgtiler
%% This LaTeX file includes and overlays text on top of companion file
%% ${basename}.pdf/.png
%%
%% Instead of \\includegraphics, include this figure via
%%   \\input{${filename.base}}
%% You can scale the image by first defining \\svg{width,height,scale}:
%%   \\def\\svgwidth{\\linewidth} % full width
%% or
%%   \\def\\svgheight{5in}
%% or
%%   \\def\\svgscale{0.5} % 50%
%% (If multiple are specified, the first in the list above takes priority.)
%%
%% If this file resides in another directory from the root .tex file,
%% you need to help it find its auxiliary .pdf/.png file via one of the
%% following options (any one will do):
%%   1. \\usepackage{currfile} so that this file can find its own directory.
%%   2. \\usepackage{import} and \\import{path/to/file/}{${filename.base}}
%%      instead of \\import{${filename.base}}
%%   3. \\graphicspath{{path/to/file/}} % note extra braces and trailing slash
%%
\\begingroup
  \\providecommand\\color[2][]{%
    \\errmessage{You should load package 'color.sty' to render color in svgtiler text.}%
    \\renewcommand\\color[2][]{}%
  }%
  \\ifx\\currfiledir\\undefined
    \\def\\currfiledir{}%
  \\fi
  \\ifx\\svgwidth\\undefined
    \\ifx\\svgheight\\undefined
      \\unitlength=0.75bp\\relax % 1px (SVG unit) = 0.75bp (SVG pts)
      \\ifx\\svgscale\\undefined\\else
        \\ifx\\real\\undefined % in case calc.sty not loaded
          \\unitlength=\\svgscale \\unitlength
        \\else
          \\setlength{\\unitlength}{\\unitlength * \\real{\\svgscale}}%
        \\fi
      \\fi
    \\else
      \\unitlength=\\svgheight
      \\unitlength=${1 / this.height}\\unitlength % divide by image height
    \\fi
  \\else
    \\unitlength=\\svgwidth
    \\unitlength=${1 / this.width}\\unitlength % divide by image width
  \\fi
  \\def\\clap#1{\\hbox to 0pt{\\hss#1\\hss}}%
  \\begin{picture}(${this.width},${this.height})%
    \\put(0,0){\\includegraphics[width=${this.width}\\unitlength]{\\currfiledir ${relativeDir != null ? relativeDir : ''}${basename}}}%`
    ];
    ref = this.symbols;
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      row = ref[i];
      for (j = l = 0, len1 = row.length; l < len1; j = ++l) {
        symbol = row[j];
        ({x, y} = this.coords[i][j]);
        ref1 = symbol.text;
        for (n = 0, len2 = ref1.length; n < len2; n++) {
          text = ref1[n];
          tx = (ref2 = parseNum(text.getAttribute('x'))) != null ? ref2 : 0;
          ty = (ref3 = parseNum(text.getAttribute('y'))) != null ? ref3 : 0;
          content = ((function() {
            var len3, o, ref4, results;
            ref4 = text.childNodes;
            // TEXT_NODE
            results = [];
            for (o = 0, len3 = ref4.length; o < len3; o++) {
              child = ref4[o];
              if (child.nodeType === 3) {
                results.push(child.data);
              }
            }
            return results;
          })()).join('');
          anchor = attributeOrStyle(text, 'text-anchor');
          if (/^middle\b/.test(anchor)) {
            wrap = '\\clap{';
          } else if (/^end\b/.test(anchor)) {
            wrap = '\\rlap{'; //if /^start\b/.test anchor  # default
          } else {
            wrap = '\\llap{';
          }
          // "@height -" is to flip between y down (SVG) and y up (picture)
          lines.push(`    \\put(${x + tx},${this.height - (y + ty)}){\\color{${attributeOrStyle(text, 'fill') || 'black'}}${wrap}${content}${wrap && '}'}}%`);
        }
      }
    }
    lines.push(`  \\end{picture}%
\\endgroup`, ''); // trailing newline
    return lines.join('\n');
  }

  writeTeX(filename, relativeDir) {
    var graphicDir, outputDir, ref;
    /*
    Must be called *after* `writeSVG`.
    Default filename is the input filename with extension replaced by .svg_tex
    (analogous to .pdf_tex from Inkscape's --export-latex feature, but noting
    that the text is extracted from the SVG not the PDF, and that this file
    works with both .pdf and .png auxiliary files).
    */
    if (filename == null) {
      filename = path.parse(this.filename);
      if (filename.ext === '.svg_tex') {
        filename.base += '.svg_tex';
      } else {
        filename.base = filename.base.slice(0, -filename.ext.length) + '.svg_tex';
      }
      if ((outputDir = this.getOutputDir('.svg_tex')) != null) {
        filename.dir = outputDir;
      }
      if (((graphicDir = (ref = this.getOutputDir('.pdf')) != null ? ref : this.getOutputDir('.png')) != null) || (outputDir != null)) {
        relativeDir = path.relative(outputDir != null ? outputDir : '.', graphicDir != null ? graphicDir : '.');
      }
      filename = path.format(filename);
    }
    console.log(' &', filename);
    fs.writeFileSync(filename, this.renderTeX(filename, relativeDir));
    return filename;
  }

};

ASCIIDrawing = (function() {
  class ASCIIDrawing extends Drawing {
    parse(data) {
      var line;
      return this.load((function() {
        var k, len, ref, results;
        ref = splitIntoLines(data);
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          line = ref[k];
          results.push(graphemeSplitter.splitGraphemes(line));
        }
        return results;
      })());
    }

  };

  ASCIIDrawing.title = "ASCII drawing (one character per symbol)";

  return ASCIIDrawing;

}).call(this);

DSVDrawing = class DSVDrawing extends Drawing {
  parse(data) {
    var ref;
    //# Remove trailing newline / final blank line.
    if (data.slice(-2) === '\r\n') {
      data = data.slice(0, -2);
    } else if ((ref = data.slice(-1)) === '\r' || ref === '\n') {
      data = data.slice(0, -1);
    }
    //# CSV parser.
    return this.load(require('csv-parse/sync').parse(data, {
      delimiter: this.constructor.delimiter,
      relax_column_count: true
    }));
  }

};

SSVDrawing = (function() {
  class SSVDrawing extends DSVDrawing {
    parse(data) {
      //# Coallesce non-newline whitespace into single space
      return super.parse(data.replace(/[ \t\f\v]+/g, ' '));
    }

  };

  SSVDrawing.title = "Space-delimiter drawing (one word per symbol)";

  SSVDrawing.delimiter = ' ';

  return SSVDrawing;

}).call(this);

CSVDrawing = (function() {
  class CSVDrawing extends DSVDrawing {};

  CSVDrawing.title = "Comma-separated drawing (spreadsheet export)";

  CSVDrawing.delimiter = ',';

  return CSVDrawing;

}).call(this);

TSVDrawing = (function() {
  class TSVDrawing extends DSVDrawing {};

  TSVDrawing.title = "Tab-separated drawing (spreadsheet export)";

  TSVDrawing.delimiter = '\t';

  return TSVDrawing;

}).call(this);

Drawings = (function() {
  class Drawings extends Input {
    load(datas) {
      var data, drawing;
      return this.drawings = (function() {
        var k, len, results;
        results = [];
        for (k = 0, len = datas.length; k < len; k++) {
          data = datas[k];
          drawing = new Drawing();
          drawing.filename = this.filename;
          drawing.subname = data.subname;
          drawing.load(data);
          results.push(drawing);
        }
        return results;
      }).call(this);
    }

    subfilename(extension, drawing) {
      var filename2, outputDir;
      filename2 = path.parse(this.filename);
      filename2.base = filename2.base.slice(0, -filename2.ext.length);
      if (this.drawings.length > 1) {
        filename2.base += this.constructor.filenameSeparator + drawing.subname;
      }
      filename2.base += extension;
      if ((outputDir = this.getOutputDir(extension)) != null) {
        filename2.dir = outputDir;
      }
      return path.format(filename2);
    }

    writeSVG(mappings, styles, filename) {
      var drawing, k, len, ref, results;
      ref = this.drawings;
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        drawing = ref[k];
        results.push(drawing.writeSVG(mappings, styles, this.subfilename('.svg', drawing)));
      }
      return results;
    }

    writeTeX(filename) {
      var drawing, k, len, ref, ref1, ref2, relativeDir, results, subfilename;
      ref = this.drawings;
      results = [];
      for (k = 0, len = ref.length; k < len; k++) {
        drawing = ref[k];
        subfilename = this.subfilename('.svg_tex', drawing);
        relativeDir = path.relative(path.dirname(subfilename), (ref1 = (ref2 = this.getOutputDir('.pdf')) != null ? ref2 : this.getOutputDir('.png')) != null ? ref1 : '.');
        results.push(drawing.writeTeX(subfilename, relativeDir));
      }
      return results;
    }

  };

  Drawings.filenameSeparator = '_';

  return Drawings;

}).call(this);

XLSXDrawings = (function() {
  class XLSXDrawings extends Drawings {
    parse(data) {
      var rows, sheet, sheetInfo, subname, workbook, xlsx;
      xlsx = require('xlsx');
      workbook = xlsx.read(data, {
        type: 'binary'
      });
      //# https://www.npmjs.com/package/xlsx#common-spreadsheet-format
      return this.load((function() {
        var k, len, ref, results;
        ref = workbook.Workbook.Sheets;
        results = [];
        for (k = 0, len = ref.length; k < len; k++) {
          sheetInfo = ref[k];
          subname = sheetInfo.name;
          sheet = workbook.Sheets[subname];
          //# 0 = Visible, 1 = Hidden, 2 = Very Hidden
          //# https://sheetjs.gitbooks.io/docs/#sheet-visibility
          if (sheetInfo.Hidden && !this.getSetting('keepHidden')) {
            continue;
          }
          if (subname.length === 31) {
            console.warn(`Warning: Sheet '${subname}' has length exactly 31, which may be caused by Google Sheets export truncation`);
          }
          rows = xlsx.utils.sheet_to_json(sheet, {
            header: 1,
            defval: ''
          });
          rows.subname = subname;
          results.push(rows);
        }
        return results;
      }).call(this));
    }

  };

  XLSXDrawings.encoding = 'binary';

  XLSXDrawings.title = "Spreadsheet drawing(s) (Excel/OpenDocument/Lotus/dBASE)";

  return XLSXDrawings;

}).call(this);

Context = class Context {
  constructor(drawing1, i1, j1) {
    var ref, ref1;
    this.drawing = drawing1;
    this.i = i1;
    this.j = j1;
    this.symbols = this.drawing.symbols;
    this.filename = this.drawing.filename;
    this.subname = this.drawing.subname;
    this.symbol = (ref = this.symbols[this.i]) != null ? ref[this.j] : void 0;
    this.key = (ref1 = this.symbol) != null ? ref1.key : void 0;
  }

  neighbor(dj, di) {
    return new Context(this.drawing, this.i + di, this.j + dj);
  }

  includes(...args) {
    return (this.symbol != null) && this.symbol.includes(...args);
  }

  row(di = 0) {
    var i, j, k, len, ref, ref1, results, symbol;
    i = this.i + di;
    ref1 = (ref = this.symbols[i]) != null ? ref : [];
    results = [];
    for (j = k = 0, len = ref1.length; k < len; j = ++k) {
      symbol = ref1[j];
      results.push(new Context(this.drawing, i, j));
    }
    return results;
  }

  column(dj = 0) {
    var i, j, k, len, ref, results, row;
    j = this.j + dj;
    ref = this.symbols;
    results = [];
    for (i = k = 0, len = ref.length; k < len; i = ++k) {
      row = ref[i];
      results.push(new Context(this.drawing, i, j));
    }
    return results;
  }

};

extensionMap = {
  // Mappings
  '.txt': ASCIIMapping,
  '.js': JSMapping,
  '.jsx': JSMapping,
  '.coffee': CoffeeMapping,
  '.cjsx': CoffeeMapping,
  // Drawings
  '.asc': ASCIIDrawing,
  '.ssv': SSVDrawing,
  '.csv': CSVDrawing,
  '.tsv': TSVDrawing,
  //# Parsable by xlsx package:
  '.xlsx': XLSXDrawings, //# Excel 2007+ XML Format
  '.xlsm': XLSXDrawings, //# Excel 2007+ Macro XML Format
  '.xlsb': XLSXDrawings, //# Excel 2007+ Binary Format
  '.xls': XLSXDrawings, //# Excel 2.0 or 2003-2004 (SpreadsheetML)
  '.ods': XLSXDrawings, //# OpenDocument Spreadsheet
  '.fods': XLSXDrawings, //# Flat OpenDocument Spreadsheet
  '.dif': XLSXDrawings, //# Data Interchange Format (DIF)
  '.prn': XLSXDrawings, //# Lotus Formatted Text
  '.dbf': XLSXDrawings, //# dBASE II/III/IV / Visual FoxPro
  // Styles
  '.css': CSSStyle,
  '.styl': StylusStyle
};

renderDOM = function(mappings, elts, settings) {
  var dom, drawing, elt, err, filename, key, ref, results, value;
  mappings = Mappings.from(mappings);
  if (typeof elts === 'string') {
    elts = document.querySelectorAll(elts);
  } else if (elts instanceof HTMLElement) {
    elts = [elts];
  }
  results = [];
  for (elt of elts) {
    //# Default to href attribute which works better in DOM.
    settings = {
      ...defaultSettings,
      useHref: true,
      ...settings
    };
    ref = elt.dataset;
    //# Override settings via data-* attributes.
    for (key in ref) {
      value = ref[key];
      if (!(key in settings)) {
        continue;
      }
      if (typeof settings[key] === 'boolean') {
        switch (value = setting(key)) {
          //when 'true', 'on', 'yes'
          //  settings[key] = true
          case 'false':
          case 'off':
          case 'no': //, ''
            settings[key] = false;
            break;
          default:
            settings[key] = Boolean(value);
        }
      } else {
        settings[key] = value;
      }
    }
    try {
      elt.style.whiteSpace = 'pre';
      filename = settings.filename;
      drawing = Input.recognize(filename, elt.innerText, settings);
      if (drawing instanceof Drawing) {
        dom = drawing.renderSVGDOM(mappings).documentElement;
        if (settings.keepParent) {
          elt.innerHTML = '';
          elt.appendChild(dom);
        } else {
          elt.replaceWith(dom);
          if (settings.keepClass) {
            dom.setAttribute('class', elt.className);
          }
        }
      } else {
        console.warn(`Parsed element with filename '${filename}' into ${drawing.constructor.name} instead of Drawing:`, elt);
        dom = null;
      }
      results.push({
        input: elt,
        output: dom,
        drawing: drawing,
        filename: filename
      });
    } catch (error1) {
      err = error1;
      console.error('svgtiler.renderDOM failed to parse element:', elt);
      results.push(console.error(err));
    }
  }
  return results;
};

sanitize = true;

bufferSize = 16 * 1024;

postprocess = function(format, filename) {
  var buffer, e, file, fileSize, match, position, readSize, string;
  if (!sanitize) {
    return;
  }
  try {
    switch (format) {
      case 'pdf':
        //# Blank out /CreationDate in PDF for easier version control.
        //# Replace these commands with spaces to avoid in-file pointer errors.
        buffer = Buffer.alloc(bufferSize);
        fileSize = fs.statSync(filename).size;
        position = Math.max(0, fileSize - bufferSize);
        file = fs.openSync(filename, 'r+');
        readSize = fs.readSync(file, buffer, 0, bufferSize, position);
        string = buffer.toString('binary'); //# must use single-byte encoding!
        match = /\/CreationDate\s*\((?:[^()\\]|\\[^])*\)/.exec(string);
        if (match != null) {
          fs.writeSync(file, ' '.repeat(match[0].length), position + match.index);
        }
        return fs.closeSync(file);
    }
  } catch (error1) {
    e = error1;
    return console.log(`Failed to postprocess '${filename}': ${e}`);
  }
};

inkscapeVersion = null;

convertSVG = function(format, svg, sync, settings) {
  var args, child_process, extension, filename, output, outputDir, preprocess, result;
  child_process = require('child_process');
  if (inkscapeVersion == null) {
    result = child_process.spawnSync('inkscape', ['--version']);
    if (result.error) {
      console.log(`inkscape --version failed: ${result.error.message}`);
    } else if (result.status || result.signal) {
      console.log(`inkscape --version failed: ${result.stderr.toString()}`);
    } else {
      inkscapeVersion = result.stdout.toString().replace(/^Inkscape\s*/, '');
    }
  }
  extension = `.${format}`;
  filename = path.parse(svg);
  if (filename.ext === extension) {
    filename.base += extension;
  } else {
    filename.base = `${filename.base.slice(0, -filename.ext.length)}${extension}`;
  }
  if ((outputDir = getOutputDir(settings, extension)) != null) {
    filename.dir = outputDir;
  }
  output = path.format(filename);
  //# Workaround relative paths not working in MacOS distribution of Inkscape
  //# [https://bugs.launchpad.net/inkscape/+bug/181639]
  if (process.platform === 'darwin') {
    preprocess = path.resolve;
  } else {
    preprocess = function(x) {
      return x;
    };
  }
  if (inkscapeVersion.startsWith('0')) {
    args = ["-z", `--file=${preprocess(svg)}`, `--export-${format}=${preprocess(output)}`];
  } else {
    args = [
      "--export-overwrite",
      //"--export-type=#{format}"
      `--export-filename=${preprocess(output)}`,
      preprocess(svg)
    ];
  }
  if (sync) {
    //# In synchronous mode, we let inkscape directly output its error messages,
    //# and add warnings about any failures that occur.
    console.log('=>', output);
    result = child_process.spawnSync('inkscape', args, {
      stdio: 'inherit'
    });
    if (result.error) {
      return console.log(result.error.message);
    } else if (result.status || result.signal) {
      return console.log(`:-( ${output} FAILED`);
    } else {
      return postprocess(format, output);
    }
  } else {
    //# In asynchronous mode, we capture inkscape's outputs, and print them only
    //# when the process has finished, along with which file failed, to avoid
    //# mixing up messages from parallel executions.
    return function(resolve) {
      var inkscape, out;
      console.log('=>', output);
      inkscape = child_process.spawn('inkscape', args);
      out = '';
      inkscape.stdout.on('data', function(buf) {
        return out += buf;
      });
      inkscape.stderr.on('data', function(buf) {
        return out += buf;
      });
      inkscape.on('error', function(error) {
        return console.log(error.message);
      });
      return inkscape.on('exit', function(status, signal) {
        if (status || signal) {
          console.log(`:-( ${output} FAILED:`);
          console.log(out);
        } else {
          postprocess(format, output);
        }
        return resolve();
      });
    };
  }
};

help = function() {
  var extension, klass;
  console.log(`svgtiler ${metadata.version}
Usage: ${process.argv[1]} (...options and filenames...)
Documentation: https://github.com/edemaine/svgtiler

Optional arguments:
  --help                Show this help message and exit.
  -m / --margin         Don't delete blank extreme rows/columns
  --hidden              Process hidden sheets within spreadsheet files
  --tw TILE_WIDTH / --tile-width TILE_WIDTH
                        Force all symbol tiles to have specified width
  --th TILE_HEIGHT / --tile-height TILE_HEIGHT
                        Force all symbol tiles to have specified height
  -o DIR / --output DIR Write all output files to directory DIR
  --os DIR / --output-svg DIR   Write all .svg files to directory DIR
  --op DIR / --output-pdf DIR   Write all .pdf files to directory DIR
  --oP DIR / --output-png DIR   Write all .png files to directory DIR
  --ot DIR / --output-tex DIR   Write all .svg_tex files to directory DIR
  -p / --pdf            Convert output SVG files to PDF via Inkscape
  -P / --png            Convert output SVG files to PNG via Inkscape
  -t / --tex            Move <text> from SVG to accompanying LaTeX file.svg_tex
  --no-inline           Don't inline <image>s into output SVG
  --no-overflow         Don't default <symbol> overflow to "visible"
  --no-sanitize         Don't sanitize PDF output by blanking out /CreationDate
  -j N / --jobs N       Run up to N Inkscape jobs in parallel

Filename arguments:  (mappings before drawings!)
`);
  for (extension in extensionMap) {
    klass = extensionMap[extension];
    if (extension.length < 10) {
      extension += ' '.repeat(10 - extension.length);
    }
    console.log(`  *${extension}  ${klass.title}`);
    if (klass.help != null) {
      console.log(`               ${klass.help}`);
    }
  }
  console.log(`
SYMBOL specifiers:  (omit the quotes in anything except .js and .coffee files)

  'filename.svg':   load SVG from specified file
  'filename.png':   include PNG image from specified file
  'filename.jpg':   include JPEG image from specified file
  '<svg>...</svg>': raw SVG
  -> ...@key...:    function computing SVG, with \`this\` bound to Context with
                    \`key\` (symbol name), \`i\` and \`j\` (y and x coordinates),
                    \`filename\` (drawing filename), \`subname\` (subsheet name),
                    and supporting \`neighbor\`/\`includes\`/\`row\`/\`column\` methods`);
  //object with one or more attributes
  return process.exit();
};

main = function(args = process.argv.slice(2)) {
  var arg, filename, filenames, files, format, formats, i, input, jobs, k, l, len, len1, len2, mappings, n, settings, skip, styles, sync;
  mappings = new Mappings();
  styles = new Styles();
  files = skip = 0;
  formats = [];
  jobs = [];
  sync = true;
  settings = {...defaultSettings};
  for (i = k = 0, len = args.length; k < len; i = ++k) {
    arg = args[i];
    if (skip) {
      skip--;
      continue;
    }
    switch (arg) {
      case '-h':
      case '--help':
        help();
        break;
      case '-m':
      case '--margin':
        settings.keepMargins = true;
        break;
      case '--hidden':
        settings.keepHidden = true;
        break;
      case '--tw':
      case '--tile-width':
        skip = 1;
        arg = parseFloat(args[i + 1]);
        if (arg) {
          settings.forceWidth = arg;
        } else {
          console.warn(`Invalid argument to --tile-width: ${args[i + 1]}`);
        }
        break;
      case '--th':
      case '--tile-height':
        skip = 1;
        arg = parseFloat(args[i + 1]);
        if (arg) {
          settings.forceHeight = arg;
        } else {
          console.warn(`Invalid argument to --tile-height: ${args[i + 1]}`);
        }
        break;
      case '-o':
      case '--output':
        skip = 1;
        settings.outputDir = args[i + 1];
        break;
      case '--os':
      case '--output-svg':
        skip = 1;
        settings.outputDirExt['.svg'] = args[i + 1];
        break;
      case '--op':
      case '--output-pdf':
        skip = 1;
        settings.outputDirExt['.pdf'] = args[i + 1];
        break;
      case '--oP':
      case '--output-png':
        skip = 1;
        settings.outputDirExt['.png'] = args[i + 1];
        break;
      case '--ot':
      case '--output-tex':
        skip = 1;
        settings.outputDirExt['.svg_tex'] = args[i + 1];
        break;
      case '-p':
      case '--pdf':
        formats.push('pdf');
        break;
      case '-P':
      case '--png':
        formats.push('png');
        break;
      case '-t':
      case '--tex':
        settings.texText = true;
        break;
      case '--no-sanitize':
        sanitize = false;
        break;
      case '--no-overflow':
        settings.overflowDefault = null; // no default
        break;
      case '--no-inline':
        settings.inlineImages = false;
        break;
      case '-j':
      case '--jobs':
        skip = 1;
        arg = parseInt(args[i + 1]);
        if (arg) {
          jobs = new require('async-limiter')({
            concurrency: arg
          });
          sync = false;
        } else {
          console.warn(`Invalid argument to --jobs: ${args[i + 1]}`);
        }
        break;
      default:
        files++;
        console.log('*', arg);
        input = Input.recognize(arg, void 0, settings);
        if (input instanceof Mapping) {
          mappings.push(input);
        } else if (input instanceof Style) {
          styles.push(input);
        } else if (input instanceof Drawing || input instanceof Drawings) {
          filenames = input.writeSVG(mappings, styles);
          if (settings.texText) {
            input.writeTeX();
          }
          for (l = 0, len1 = formats.length; l < len1; l++) {
            format = formats[l];
            if (typeof filenames === 'string') {
              jobs.push(convertSVG(format, filenames, sync, settings));
            } else {
              for (n = 0, len2 = filenames.length; n < len2; n++) {
                filename = filenames[n];
                jobs.push(convertSVG(format, filename, sync, settings));
              }
            }
          }
        }
    }
  }
  if (!files) {
    console.log('Not enough filename arguments');
    return help();
  }
};

svgtiler = {
  Symbol,
  StaticSymbol,
  DynamicSymbol,
  unrecognizedSymbol,
  Mapping,
  ASCIIMapping,
  JSMapping,
  CoffeeMapping,
  Drawing,
  ASCIIDrawing,
  DSVDrawing,
  SSVDrawing,
  CSVDrawing,
  TSVDrawing,
  Drawings,
  XLSXDrawings,
  Style,
  CSSStyle,
  StylusStyle,
  extensionMap,
  Input,
  Mappings,
  Context,
  SVGTilerException,
  SVGNS,
  XLINKNS,
  escapeId,
  main,
  convertSVG,
  renderDOM,
  defaultSettings,
  version: metadata.version
};

if (typeof module !== "undefined" && module !== null) {
  module.exports = svgtiler;
}

if (typeof window !== "undefined" && window !== null) {
  window.svgtiler = svgtiler;
}

if ((typeof module !== "undefined" && module !== null) && (typeof require !== "undefined" && require !== null ? require.main : void 0) === module && (typeof window === "undefined" || window === null)) {
  paths = [
    //# Enable require('svgtiler') (as autoimported by `svgtiler` access)
    //# to load this module (needed if the module is installed globally).
    path.join(__dirname,
    '..',
    '..'),
    //# Enable require('preact') (as autoimported by `preact` access)
    //# to load SVG Tiler's copy of preact.
    path.join(__dirname,
    '..',
    'node_modules')
  ];
  if (process.env.NODE_PATH) {
    paths.push(process.env.NODE_PATH);
  }
  process.env.NODE_PATH = paths.join((require('process').platform === 'win32' ? ';' : ':'));
  require('module').Module._initPaths();
  main();
}

}).call(this);
