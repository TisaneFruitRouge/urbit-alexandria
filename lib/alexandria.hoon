/-  alexandria
|%
::  +clay-path: path for a book's pdf in our desk.
::  Store as %mime so arbitrary uploaded filenames do not need Clay marks.
++  clay-path
  |=  id=book-id:alexandria
  ^-  path
  /books/(scot %ud id)/pdf/mime
::
::  +content-hash: SHA-256 over exactly the PDF bytes.
++  content-hash
  |=  dat=octs
  ^-  content-hash:alexandria
  (shay p.dat q.dat)
::
::  +books-of: all books whose source is the given ship
++  books-of
  |=  [books=(map book-key:alexandria book-meta:alexandria) src=ship]
  ^-  (list book-meta:alexandria)
  %+  murn  ~(val by books)
  |=  b=book-meta:alexandria
  ?.  =(source.b src)  ~
  `b
--
