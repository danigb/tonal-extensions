'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tonalDictionary = require('tonal-dictionary');
var tonalInterval = require('tonal-interval');
var tonalTranspose = require('tonal-transpose');
var tonalNote = require('tonal-note');
var tonalArray = require('tonal-array');
var tonalRange = require('tonal-range');
var tonalPcset = require('tonal-pcset');

var guitar = ["E2 A2 D3 G3 B3 E4",["guitar 6-string standard"]];
var charango = ["G4 G4 C5 C5 E5 E4 A4 A4 E5 E5"];
var bouzouki = ["C3 C4 F3 F4 A3 A3 D4 D4"];
var DATA = {
	guitar: guitar,
	charango: charango,
	bouzouki: bouzouki,
	"open D tuning": ["D2 A2 D3 F#3 A3 D4",["vestopol"]],
	"open C tuning": ["C2 G2 C3 G3 C4 E4"]
};

/**
 * This module has functions to create fretboards and query for instrument
 * tunnings.
 *
 * __Currently is NOT part of the tonal distribution__
 *
 * @module fretboard
 */
var dict = tonalDictionary.dictionary(DATA, function(s) {
  return s.split(" ");
});

/**
 * Given a tuning name, returns the notes of the strings in the open position
 * @function
 * @param {String} name - the tuning name
 * @return {Array} the string notes or null if not valid tuning name
 * @example
 * var fret = require('tonal-fretboard')
 * fret.tuning('guitar') // => [ 'E2', 'A2', 'D3', 'G3', 'B3', 'E4' ]
 * fret.tuning('charango') // => [ 'G4', 'G4', 'C5', 'C5', 'E5', 'E4', 'A4', 'A4', 'E5', 'E5' ]
 */
var tuning = dict.get;

/**
 * Given a tuning name returns the notes of the strings in open position
 * as pitch classes removing doubled strings.
 * @param {String} name - the tuning name or notes of the strings in open position
 * @return {Array} the string notes as pitch classes
 * @example
 * fret.simpleTuning('guitar') => [ 'E', 'A', 'D', 'G', 'B', 'E' ]
 * fret.simpleTuning('charango') => [ 'G', 'C', 'E', 'A', 'E' ]
 */
function simpleTuning(src) {
  var pcs = tonalArray.map(tonalNote.pc, tuning(src) || src);
  var simple = pcs.reduce(function(s, pc$$1, i) {
    if (s === false) return s;
    else if (i % 2 === 0) s.push(pc$$1);
    else if (s[s.length - 1] !== pc$$1) return false;
    return s;
  }, []);
  return simple || pcs;
}

/**
 * Get all available tuning names
 * @function
 * @param {Boolean} aliases - get aliases or not
 * @return {Array} an array of tuning names
 */
var names = dict.keys;

/**
 * Build a fretboard using a given tuning (or tuning name), first and last
 * fret numbers and optionally a chord or scale
 *
 * It returns an array of arrays, where each sub-array is the notes of
 * a string.
 *
 * @param {String|Array} tuning - the tuning name or notes
 * @param {Integer} first - the first fret number
 * @param {Integer} last - the last fret number
 * @param {Array|String} set - a scale or chord to filter the fretboard
 * @return {Array} An array of arrays, one for each string
 */
function notes(tun, first, last, set) {
  first = first || 0;
  last = last || first;
  var ivls = tonalRange.numeric([first, last]).map(tonalInterval.fromSemitones);
  var notes = tuning(tun) || tonalArray.asArr(tun);
  var filterFn = set ? tonalArray.map(includedIn(set)) : id;
  return notes
    .map(function(b) {
      return ivls.map(tonalTranspose.transpose(b));
    })
    .map(filterFn);
}
function id(o) {
  return o;
}
function includedIn(set) {
  var isInSet = tonalPcset.includes(set);
  return function(n) {
    return isInSet(n) ? n : null;
  };
}

/**
 * Build a fretboard only showing the notes for the given scale.
 * @param {String|Array} tuning - the tuning name or notes
 * @param {String|Array} scale - the scale notes
 * @param {Integer} first - the first fret number
 * @param {Integer} last - the last fret number
 * @return {Array} An array of arrays, one for each string
 */
function scale(tuning, scale, first, last) {
  return notes(tuning, first, last, scale);
}

/**
 * Build an array of reachable chord shapes based on given notes and tuning.
 * @param {String|Array} tuning - the tuning name or notes
 * @param {Array} notes - an array of chord notes
 * @param {Integer} first - the first fret number.  Default 0.
 * @param {Integer} last - the last fret number.  Default 12.
 * @param {Integer} span - how many frets to include per position.  Default 4.
 * @return {Array} An array of arrays, one for each possible shape.  Element index is string number [ '0', '2', '2', '1', '0', '0' ]
 */
function chordShapes(tuning, notes, first, last, span) {
  // Set defaults
  first = first || 0;
  last = last || 12;
  span = span || 4;

  var fretboard = scale(tuning, notes, first, last);
  var positions = [];

  // Break each string array into {fretSpan} frets overlapping sections
  var strings = fretboard.map(function(string, stringIndex) {
    return string.map(function(fret, fretIndex) {
      return tonalArray.compact(
        string
          .slice(fretIndex, fretIndex + span)
          .map(function(slicedFret, slicedFretIndex) {
            // Convert note names to fret numbers
            return slicedFret !== null ? fretIndex + slicedFretIndex : null;
          })
      );
    });
  });

  // Build positions
  strings.forEach(function(string) {
    string.forEach(function(fretGroup, fretGroupIndex) {
      if (!Array.isArray(positions[fretGroupIndex]))
        positions[fretGroupIndex] = [];

      if (fretGroup.length > 1) positions[fretGroupIndex].push(fretGroup);
      else
        positions[fretGroupIndex].push(
          fretGroup.toString() ? fretGroup.toString() : null
        );
    });
  });

  // Remove null, neighboring duplicate arrays, and arrays with a only one non-null value
  return positions.filter(function(position, i) {
    if (tonalArray.compact(position).length < 2) return false;
    return i === 0
      ? position
      : positions[i].toString() !== positions[i - 1].toString();
  });
}

exports.tuning = tuning;
exports.simpleTuning = simpleTuning;
exports.names = names;
exports.notes = notes;
exports.scale = scale;
exports.chordShapes = chordShapes;
