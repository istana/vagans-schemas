// run this test from root path
// because paths are made that way

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

var validateSchema = function(schema, sample) {
	// TODO handle external schemas
	var externalSchemas = {};
	var val = validator(schema);
	// greedy tries to validate the most of the document
	var vali = val(sample, {schemas: externalSchemas, greedy: true});
  return vali;
};

global.fs = loadModule("fs");
global.chai = loadModule("chai");
global.assert = chai.assert;
global.glob = loadModule("glob");
global.validator = loadModule("is-my-json-valid");
global.path = loadModule("path");

global.schema = loadFile('../src/schemaschema-draft04/schema.json');
global.hyperschema = loadFile('../src/schemaschema-draft04/hyper-schema.json');

printErrors();

// globs needs to be synchronous for tests to work properly!
console.log('Common errors:');
console.log('SyntaxError: Unexpected token } - malformated JSON');
console.log('SyntaxError: Unexpected end of input - JSON file is empty, must be at least {} or []');

describe('All JSON Schemas', function() {
  var schemaFiles = glob.sync(path.resolve(__dirname, "../src/**/*.js[on]?"), null);

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
								assert.equal(validated, true, 'IS NOT VALID: ' + validated.errors);
							});
						});
					});

				}); // end desribe schema
			} // end if schemaContent

		});
	}
});

