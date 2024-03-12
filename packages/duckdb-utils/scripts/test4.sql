create table a (id int, value varchar);
create table b (id int, value varchar);
select c.id, c."id:1" from (select b.*, a.id from b full join a on a.id = b.id) c;
select c.id, c.* from (select b.*, a.* from b full join a on a.id = b.id) c;

-- failed:
-- SELECT id2, 'id:1', randomid FROM (SELECT random() as randomid, x.* FROM (SELECT * FROM a) x);
SELECT id, 'id:1', randomid FROM (SELECT random() as randomid, x.* FROM (SELECT * FROM a) x);
