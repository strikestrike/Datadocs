# Design Concept

This is the design concept for Column Manager v2.

A simple definition of Column Manager v2:

``` text
ColumnManagerV2 := {
  Size,
  Removed,
  LinkedList,
  SchemasArray,
  DefaultColumnGetter,
}
```

## `Size`, `SchemasArray` and `Removed`



## Linkedlist

> <https://en.wikipedia.org/wiki/Doubly_linked_list>


You may notice there is a submodule named `linked-node`.
It is one of the core components of Column Manager v2, the Linked List.

We use an extended linked list implementation to control the order of columns for the UI. 
Each node in this linked list may contain the following fields:

- `schemaIndex`: This value represents the index of the schema in the schema list that 
corresponds to this node. To access the schema for this node, use `schemas[node.schemaIndex]`.
- `isHead`: If `true`, the `schemaIndex` of this node is typically set to `-1`, 
indicating that this node represents the first node in the list. 
- `isRest`: If `true`, this node is the last node in the list and it indicates that 
the `schemaIndex` of the following implicit nodes is incremented sequentially. 
Refer to the next section for more information.
- `hide`: A link to another linked list that stores hidden columns behind the column that 
this node represents.

### How this linked list works

In the initial state, every grid has the following linked list for the order of columns:

``` text
{-1,isHead} -> {0,isRest}
```

After the user modifies any cell or the column's property in the column with a `viewIndex` of `3`:

``` text
{-1,isHead} -> {0} -> {1} -> {2} -> {3} -> {4,isRest}
```

After the user moves the column with a `viewIndex` of `5` behind 
the column with a `viewIndex` of `0`:

``` text
{-1,isHead} -> {0} -> {5} -> {1} -> {2} -> {3} -> {4} -> {6,isRest}
ViewIndex:-1->  0  ->  1  ->  2  ->  3  ->  4  ->  5  ->  6 -> 7 -> ...
```

After the user hide two columns behind the column with a `viewIndex` of `2`:

``` text
{-1,isHead} -> {0} -> {5} -> {1} -> {4} -> {6,isRest}
|                         (hide)|-> {2} -> {3} 
ViewIndex:-1->  0  ->  1  ->  2  ->  3  ->  4  ->  5  -> ...
```

The linked list remains unchanged if:

- the user reorders columns with a `viewIndex` greater than `4`
- the user deletes any column with a `viewIndex` greater than `4`

After the user delete the column with a `viewIndex` of `1`:

``` text
{-1,isHead} -> {0} -> {1} -> {4} -> {6,isRest}
|                         (hide)|-> {2} -> {3} 
ViewIndex:-1->  0  ->  2  ->  3  ->  4  ->  5  -> ...
```


