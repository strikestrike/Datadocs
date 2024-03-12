-- parpare tables and datas
create table tableA (id int, name text);
create table tableB (id int, remark text);
create table tableC (id int, age int);

insert into tableA values (100,'hello'),(101,'world'),(102,'nice'),(103,'hi');
insert into tableB values (101,'remark101'),(102,'remark102'),(103,'remark103');
insert into tableC values (100,29),(101,28),(102,33),(103,NULL);

WITH tableD AS (VALUES (1,3), (7,8)),
  tableE AS (VALUES (4,'Hi'))
SELECT * FROM tableD UNION ALL SELECT * FROM tableE;
-- schema: col0 int32; col1 varchar

WITH tableD(id, id2) AS (VALUES (1,3), (7,8)),
  tableE AS (VALUES (4,'Hi'))
SELECT * FROM tableD UNION ALL SELECT * FROM tableE;
-- schema: id int32; id2 varchar

WITH tableD AS (VALUES (101,3), (107,8))
SELECT * FROM tableA FULL JOIN tableD ON (tableA.id = tableD.col0)
UNION ALL (
  WITH tableE AS (VALUES (300,4,NULL,NULL),(500, 'A',NULL,NULL))
  SELECT * FROM (SELECT * FROM tableE WHERE tableE.col0 > 300)
)
UNION ALL VALUES(100,null,null,null)
UNION ALL (SELECT * FROM VALUES(101,null,1,1) AS tableTmp);


SELECT * FROM tableA
  UNION ALL SELECT * FROM tableB;

SELECT tableA.id, tableB.remark FROM tableA, tableB;
