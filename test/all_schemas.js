// run this test from root path
// because paths are made that way

// 1. find schema
// 2. test if valid json
// 3. find samples
// 4. test if sample valid json
// 5. test sample against the schema

var errors = [];

var loadModule = function(path) {
	try {
		return require(path);
	}
	catch(e) {
		errors.push(e.message);
	}
};

var loadFile = function(fpath) {
	try {
		return fs.readFileSync(path.resolve(__dirname, fpath));
	}
	catch(e) {
		if(e.code === "ENOENT") {
			errors.push("Could not load the file, make sure it exists: " + e.path);
		} else {
			errors.push("There was some error. Please report it if you can: " + e.message);
		}
		return null;
	}
};

var printErrors = function() {
	if(errors.length > 0) {
		console.log("+++ There were some errors in test setup. Probably missing dependecies or files. If you think it is a bug, send me an email or report an issue ;-)");
		console.log("INFO: Current working directory: " + process.cwd());
		console.log("INFO: Current path: " + __dirname);
		console.log("INFO: Current script: " + __filename);
		errors.forEach(function(element, index, array) {
			console.log("-", element);
		});
		return 1;
	}
};

var jsonErrors = null;

var validateSchema = function(schema, sample) {
	// TODO handle external schemas
	//var externalSchemas = {};
	//var val = validator(schema);
	// greedy tries to validate the most of the document
	//var vali = val(sample, {schemas: externalSchemas, greedy: true});
	//jsonErrors = val.errors;

	var valid = validator.validate(sample, schema);
	jsonErrors = validator.getLastErrors();
  return valid;
};

global.fs = loadModule("fs");
global.chai = loadModule("chai");
global.assert = chai.assert;
global.glob = loadModule("glob");
//global.validator = loadModule("is-my-json-valid");
//global.validator = loadModule("jsen");
global.ZSchema = loadModule("z-schema");
/*global.validator = new ZSchema({
	noExtraKeywords: true,
	forceItems: true,
	forceMinItems: true,
	forceMaxItems: true,
	forceMinLength: true,
	forceMaxLength: true,
	forceProperties: true,
	breakOnFirstError: false
});*/
global.validator = new ZSchema();
global.path = loadModule("path");

global.schema04 = JSON.parse(loadFile('../resources/schemaschema-draft04/schema.json'));
global.hyperschema04 = JSON.parse(loadFile('../resources/schemaschema-draft04/hyper-schema.json'));

printErrors();

var schemaFiles = glob.sync(path.resolve(__dirname, "../src/**/*.js[on]?"), null);

// the nice and essential feature of z-schema it allows to set remote schemas manually
// it means, that I can set them up by hand and no automatic downloader will attempt to download
// them from the internet
// I could reference uris without url, but ultimately I want them to be available on that address
// but it is insane to try it in development, setting up http server, playing with dns, ...
// z-schema has one disadvantage, that local references doesn't work nicely if remote are used
// so cannot use #/definitions/something

// need to set external references to schemas, so it plays nicely
validator.setRemoteReference("http://json-schema.org/draft-04/schema", schema04);
validator.setRemoteReference("http://json-schema.org/draft-04/hyper-schema", hyperschema04);
// TODO handle invalid JSON, run the test beforehand
schemaFiles.forEach(function(schemaFile, index, arr) {
	var schemaURI = path.relative(path.join(__dirname, "..", "src"), schemaFile);
	validator.setRemoteReference("http://schema.myrtana.sk/" + schemaURI, JSON.parse(fs.readFileSync(schemaFile)));
});

//console.log(JSON.stringify(validator, null, 4));
console.log(Object.keys(validator.cache));

// globs needs to be synchronous for tests to work properly!
//console.log('Common errors:');
//console.log('SyntaxError: Unexpected token } - malformated JSON');
//console.log('SyntaxError: Unexpected end of input - JSON file is empty, must be at least {} or []');

describe('All JSON Schemas', function() {

	if(schemaFiles.length === 0) {
		console.log("No JSON schemas found in src/, maybe download some from schemas.myrtana.sk or create a new one?");
	}
	else {
		schemaFiles.forEach(function(schemaFile, index, arr) {
			// load given JSON schema
			var schemaURI = path.relative(path.join(__dirname, "..", "src"), schemaFile);
			console.log("Found schema:", schemaURI);

			it(schemaFile +' is a valid JSON', function(){
				assert.doesNotThrow(
					function() { JSON.parse(fs.readFileSync(schemaFile));	},
					SyntaxError
				);
			});

			// while JSON validity is tested above, it is async
			// and must load and catch by hand
			var schemaContent = null;

			try {
				schemaContent = JSON.parse(fs.readFileSync(schemaFile));
			} catch(err) {}

			// test samples only if source schema is valid
			if(schemaContent) {
				var invalidSamplesFiles = path.resolve(__dirname, path.join('samples', schemaURI, "*invalid*.json"));
				var validSamplesFiles = path.resolve(__dirname, path.join('samples', schemaURI, "!(*invalid*).json"));

				// load respective tests for a schema
				// fail test if no valid or invalid tests are found
				describe("Schema '" + schemaURI + "'", function() {
					describe("Invalid samples", function() {
						var invalidSamples = glob.sync(invalidSamplesFiles, null);

					  it('has some invalid examples', function() {
							assert.isAbove(invalidSamples.length, 0, 'no invalid samples found');
						});

						invalidSamples.forEach(function(sampleURI, index, arr) {
							it(sampleURI, function() {
								assert.doesNotThrow(
									function() { JSON.parse(fs.readFileSync(sampleURI));	},
									SyntaxError
								);

								var sample = JSON.parse(fs.readFileSync(sampleURI));
								assert.equal(validateSchema(schemaContent, sample), false, 'IS VALID');
							});
						});
					});

					describe("Valid samples", function() {
						var validSamples = glob.sync(validSamplesFiles, null);

					  it('has some valid examples', function() {
							assert.isAbove(validSamples.length, 0, 'no valid samples found');
						});

						validSamples.forEach(function(sampleURI, index, arr) {
							it(sampleURI, function() {
								assert.doesNotThrow(
									function() { JSON.parse(fs.readFileSync(sampleURI));	},
									SyntaxError
								);

								var sample = JSON.parse(fs.readFileSync(sampleURI));
								var validated = validateSchema(schemaContent, sample);
								console.log(validated);
								assert.equal(validated, true, 'IS NOT VALID, cause: ' + JSON.stringify(jsonErrors, null, 4));
							});
						});
					});

				}); // end desribe schema
			} // end if schemaContent

		});
	}
});

