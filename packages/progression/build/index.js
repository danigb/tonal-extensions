'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalNote = require('tonal-note');
var tonalInterval = require('tonal-interval');
var tonalArray = require('tonal-array');
var tonalTranspose = require('tonal-transpose');
var tonalDistance = require('tonal-distance');
var tonalChord = require('tonal-chord');
var tonalNotation = require('tonal-notation');

/**
 * # `tonal-progressions`
 * > Describe and manipulate chord progressions.
 *
 * @example
 * var progression = require('tonal-progression')
 * progression.abstract('Cmaj7 Dm7 G7', 'C')
 *
 * @module progression
 */
/**
 * Given a chord progression and a tonic, return the chord progression
 * with roman numeral chords.
 *
 * @param {Array|String} chords - the chord progression
 * @param {String} tonic - the tonic
 * @return {Array} the chord progression in roman numerals
 * @example
 * progression.abstract('Cmaj7 Dm7 G7', 'C') // => [ 'Imaj7', 'IIm7', 'V7' ]
 */
function abstract(chords, tonic) {
  tonic = tonalNote.pc(tonic);
  chords = tonalArray.map(tonalChord.parse, chords);
  var tonics = tonalArray.compact(
    chords.map(function(x) {
      return x.tonic;
    })
  );
  // if some tonic missing, can't do the analysis
  if (tonics.length !== chords.length) return null;

  return tonics.map(function(t, i) {
    var p = tonalInterval.props(tonalDistance.interval(tonic, t));
    return buildRoman(p.num - 1, p.alt, chords[i].type);
  });
}

var NUMS = ["I", "II", "III", "IV", "V", "VI", "VII"];
/**
 * Build an abstract chord name using roman numerals
 */
function buildRoman(num, alt, element) {
  return tonalNotation.toAcc(alt) + NUMS[num % 7] + (element || "");
}

/**
 * Get chord progression from a tonic and a list of chord in roman numerals
 *
 * @param {String} tonic - the tonic
 * @param {Array|String} progression - the progression in roman numerals
 * @return {Array} the chord progression
 *
 * @example
 * var progression = require('chord-progression')
 * progression.concrete('I IIm7 V7', 'C') // => ['C', 'Dm7', 'G7']
 */
function concrete(chords, tonic) {
  return tonalArray.map(function(e) {
    var r = parseRomanChord(e);
    return r ? tonalTranspose.transpose(r.root, tonic) + r.type : null;
  }, chords);
}

var ROMAN = /^\s*(b|bb|#|##|)(IV|III|II|I|VII|VI|V|iv|iii|ii|i|vii|vi|v)\s*(.*)\s*$/;
/**
 * Returns a regex to match roman numbers literals with the from:
 * `[accidentals]roman[element]`.
 *
 * The executed regex contains:
 *
 * - input: the input string
 * - accidentals: (Optional) one or two flats (b) or shaprs (#)
 * - roman: (Required) a roman numeral from I to VII either in upper or lower case
 * - element: (Optional) a name of an element
 *
 * @return {RegExp} the regexp
 *
 * @example
 * var r = progression.romanRegex()
 * r.exec('bVImaj7') // => ['bVImaj7', 'b', 'VI', 'maj7'])
 * r.exec('III dom') // => ['III dom', '', 'III', 'dom'])
 */
function romanRegex() {
  return ROMAN;
}

var NUM = { i: 0, ii: 1, iii: 2, iv: 3, v: 4, vi: 5, vii: 6 };

/**
 * Parse a chord expressed with roman numerals. It returns an interval representing
 * the root of the chord relative to the key tonic and the chord name.
 *
 * @param {String} str - the roman numeral string
 * @return {Object} the roman chord property object with:
 *
 * - type: the chord type
 * - root: the interval from the key to the root of this chord
 *
 * @example
 * var parse = require('music-notation/roman.parse')
 * parse('V7') // => { root: '5P', type: '7' }
 * parse('bIIalt') // => { root: '2m', type: 'alt' }
 */
function parseRomanChord(str) {
  var m = ROMAN.exec(str);
  if (!m) return null;
  var num = NUM[m[2].toLowerCase()] + 1;
  var alt = m[1].length;
  if (m[1][0] === "b") alt = -alt;
  return { root: tonalInterval.fromProps({ num: num, alt: alt, dir: 1 }), type: m[3] };
}

exports.abstract = abstract;
exports.buildRoman = buildRoman;
exports.concrete = concrete;
exports.romanRegex = romanRegex;
exports.parseRomanChord = parseRomanChord;
