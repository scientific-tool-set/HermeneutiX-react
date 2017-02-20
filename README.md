# HermeneutiX-react [![Build Status (master)](https://travis-ci.org/scientific-tool-set/HermeneutiX-react.svg?branch=master)](https://travis-ci.org/scientific-tool-set/HermeneutiX-react)

This is an attempt at porting HermeneutiX (a module of the Java Swing desktop application SciToS) to a React (Web) Application.

## Done

* Setup
  * Basic project with webpack and babel for ES6 code
  * Consistent code style via eslint
  * Test infrastructure with jasmine and karma
  * Automated builds via Travis CI
* Port model classes (Pericope, Relation, Proposition, ClauseItem, ...) to Javascript.
* Port model change logic (ModelChanger and related parts from model classes) and its tests to JavaScript.
* Create plain model representation (without circular references) to put into Redux store.

## Still to do

1. Create Redux Reducer for single model instance (Pericope).
1. Create basic React App
  * handling syntactic analysis
  * handling semantic analysis
1. Enable handling of .hmx files
  * upload
  * download
1. Enable SVG export
  * for syntactic analysis
  * for semantic analysis
1. Enable changing of settings
  * language (including syntactic functions)
  * types of semantic relations
  * display settings
1. Enable import/export of settings
  * language (including syntactic functions)
  * types of semantic relations

## Far future

* Maybe integrate with cloud storage APIs (e.g. Dropbox, OneDrive, iCloud, Google Drive)
