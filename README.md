# vagans-schemas

Not entirely sure, something with JSON schemas

## Why

The goal is to able to create JSON schemas really fast.
This requires automatic tests for a schema.

* `gulp lint` checks syntax and badness of JSON/JavaScript files in src/, test/ and root directory
* `gulp test` finds all schemas in src/ directory and validates them agains samples located in test/ directory

Files can have either .js or .json file extension.

Adding a new schema is easy, just follow the conventions of existing ones.

- add mypage.json into `src/text/mypage.json` (JSON schema)
- add samples (JSON files, content) into `test/samples/mypage.json/minimalexample1.json`, `invalidexample1.json`
- run `gulp lint` and then `gulp test`. Read the output

Name of the sample is not restricted, though invalid samples must contain *invalid* string somewhere in its filename.

## Ultimate goal

- validate data (like text article) agains JSON schemas, so I can create embedded JSON database and validate input. Then use it in my Linux programs. Most likely some TUI managers.

Future aka not important:

- generate forms (in curses of course :-D) for that text article

Far far future:

- use hyperschema for APIs


## License

MIT.

JSON schema schemas are licensed under the AFL or BSD license. They are in `src/schemaschema-draft04`.