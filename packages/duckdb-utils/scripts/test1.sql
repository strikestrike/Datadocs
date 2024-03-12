create table a (id int, name text);
create table b (id int, remark text);
insert into a values (100,'hello'),(101,'world'),(102,'nice'),(103,'hi');
insert into b values (100,'remark100'),(102,'remark102');
-- select rowid, * from (select * from a where id % 2 = 0);
select * from a full join b on (a.id = b.id);
-- this statement needs to be transformed to
DESCRIBE select a.rowid __tb_1_pk, b.rowid __tb_2_pk, a.*, b.* from a full join b on (a.id = b.id);
