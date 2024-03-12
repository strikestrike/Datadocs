import { deepStrictEqual as eq } from 'assert';
import { escapeId, escape, raw } from './sqlstring.js';

describe('escapeId', () => {
  it('value is quoted', () => {
    eq(escapeId('id'), '"id"');
  });
  it('value toString is called', () => {
    eq(
      escapeId({
        toString: function () {
          return 'foo';
        },
      }),
      '"foo"',
    );
  });

  it('value containing escapes is quoted', () => {
    eq(escapeId('i"d'), '"i""d"');
  });

  it('value containing separator is quoted', () => {
    eq(escapeId('id1.id2'), '"id1"."id2"');
  });

  it('value containing separator and escapes is quoted', () => {
    eq(escapeId('id"1.i"d2'), '"id""1"."i""d2"');
  });

  it('value containing separator is fully escaped when forbidQualified', function () {
    eq(escapeId('id1.id2', true), '"id1.id2"');
  });

  it('arrays are turned into lists', function () {
    eq(escapeId(['a', 'b', 't.c']), '"a", "b", "t"."c"');
  });

  it('nested arrays are flattened', function () {
    eq(escapeId(['a', ['b', ['t.c']]]), '"a", "b", "t"."c"');
  });
});

describe('escape', () => {
  it('undefined -> NULL', function () {
    eq(escape(undefined), 'NULL');
  });

  it('null -> NULL', function () {
    eq(escape(null), 'NULL');
  });

  it('raw not escaped', function () {
    eq(escape(raw('NOW()')), 'NOW()');
  });

  it('objects toSqlString is called', function () {
    eq(
      escape({
        toSqlString: function () {
          return '@foo_id';
        },
      }),
      '@foo_id',
    );
  });

  it('objects toSqlString is not quoted', function () {
    eq(
      escape({
        toSqlString: function () {
          return 'CURRENT_TIMESTAMP()';
        },
      }),
      'CURRENT_TIMESTAMP()',
    );
  });

  it('strings are quoted', function () {
    eq(escape('Super'), "'Super'");
  });

  it('single quotes get escaped', function () {
    eq(escape("Sup'er"), "'Sup''er'");
    eq(escape("Super'"), "'Super'''");
    eq(escape("Super'Super'"), "'Super''Super'''");
    eq(escape("Super''"), "'Super'''''");
  });

  it("double quotes doesn't need to be escaped", function () {
    eq(escape('Sup"er'), "'Sup\"er'");
  });
});
