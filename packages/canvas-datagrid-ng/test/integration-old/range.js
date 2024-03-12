import { g, smallData, assertIf } from './util.js';

export default function () {
  it('range.has 1', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    const has = grid.range.has('none');
    expect(has).to.equal(false);
    done();
  });
  it('range.add 1', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('a', 'C3');
    const has = grid.range.has('a');
    expect(has).to.equal(true);
    done();
  });
  it('range.add 2', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('a', 'A1');
    const has = grid.range.has('n');
    expect(has).to.equal(false);
    done();
  });
  it('range.add 3', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('b', 'A1:B2');
    const has = grid.range.has('b');
    expect(has).to.equal(true);
    done();
  });
  it('range.add 4 multi range', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('b', 'A1:B2,C3:D4');
    const has = grid.range.has('b');
    expect(has).to.equal(true);
    done();
  });
  it('range.add 5 reference other range', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('b', 'A1:B2');
    grid.range.add('c', 'b');
    expect(grid.range.has('b')).to.equal(true);
    expect(grid.range.has('c')).to.equal(true);
    done();
  });
  it('range.add 6 reference other non exist range', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    expect(grid.range.add('c', 'b')).to.equal(false);
    expect(grid.range.has('c')).to.equal(false);
    done();
  });
  it('range.add 7 reference self', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    expect(grid.range.add('c', 'c')).to.equal(false);
    expect(grid.range.has('c')).to.equal(false);
    done();
  });
  it('range.add 7 reference circle', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    const result_b = grid.range.add('b', 'A1:B2');
    const result_c = grid.range.add('c', 'b,C3:D4');
    expect(result_b).to.equal(true);
    expect(result_c).to.equal(true);
    // expect(grid.range.has('d', 'c,E5:F6')).to.equal(true);
    // expect(grid.range.has('b', 'd,G7:H8')).to.equal(false);
    done();
  });
  it('range.add 8 reference circle', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    expect(grid.range.add('b', 'A1:B2')).to.equal(true);
    expect(grid.range.add('c', 'b,C3:D4')).to.equal(true);
    expect(grid.range.add('b', 'c,G7:H8')).to.equal(false);
    done();
  });
  it('range.add range list contains error', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    expect(grid.range.add('b', 'A1:B2,,')).to.equal(false);
    done();
  });
  it('range.get 1', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    const range = grid.range.get('E10');
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(4);
    expect(range.selections[0].startRow).to.equal(9);
    expect(range.selections[0].endColumn).to.equal(4);
    expect(range.selections[0].endRow).to.equal(9);
    done();
  });
  it('range.get 2', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    const range = grid.range.get('AA100');
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(26);
    expect(range.selections[0].startRow).to.equal(99);
    expect(range.selections[0].endColumn).to.equal(26);
    expect(range.selections[0].endRow).to.equal(99);
    done();
  });
  it('range.get 3', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    const range = grid.range.get('E10:F11');
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(4);
    expect(range.selections[0].startRow).to.equal(9);
    expect(range.selections[0].endColumn).to.equal(5);
    expect(range.selections[0].endRow).to.equal(10);
    done();
  });
  it('range.get range 1', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('bb', 'C9');
    const range = grid.range.get('bb');
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(2);
    expect(range.selections[0].startRow).to.equal(8);
    expect(range.selections[0].endColumn).to.equal(2);
    expect(range.selections[0].endRow).to.equal(8);
    done();
  });
  it('range.get range 2', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('tt', 'E12:G13');
    const range = grid.range.get('tt');
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(4);
    expect(range.selections[0].startRow).to.equal(11);
    expect(range.selections[0].endColumn).to.equal(6);
    expect(range.selections[0].endRow).to.equal(12);
    done();
  });
  it('range.get range 3', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('a', 'A1:B2,C3:D4');
    const range = grid.range.get('a');
    expect(range.selections.length).to.equal(2);
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(0);
    expect(range.selections[0].startRow).to.equal(0);
    expect(range.selections[0].endColumn).to.equal(1);
    expect(range.selections[0].endRow).to.equal(1);
    expect(range.selections[1].type).to.equal(1);
    expect(range.selections[1].startColumn).to.equal(2);
    expect(range.selections[1].startRow).to.equal(2);
    expect(range.selections[1].endColumn).to.equal(3);
    expect(range.selections[1].endRow).to.equal(3);
    done();
  });
  it('range.get range 4', function (done) {
    var grid = g({
      test: this.test,
      data: smallData(),
    });
    grid.range.add('a', 'A1:B2');
    grid.range.add('b', 'a,C3:D4');
    const range = grid.range.get('b');
    expect(range.selections.length).to.equal(2);
    expect(range.selections[0].type).to.equal(1);
    expect(range.selections[0].startColumn).to.equal(0);
    expect(range.selections[0].startRow).to.equal(0);
    expect(range.selections[0].endColumn).to.equal(1);
    expect(range.selections[0].endRow).to.equal(1);
    expect(range.selections[1].type).to.equal(1);
    expect(range.selections[1].startColumn).to.equal(2);
    expect(range.selections[1].startRow).to.equal(2);
    expect(range.selections[1].endColumn).to.equal(3);
    expect(range.selections[1].endRow).to.equal(3);
    done();
  });
}
