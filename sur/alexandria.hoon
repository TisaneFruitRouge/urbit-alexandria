|%
+$  book-id  @ud
::
+$  book-key  [source=ship id=book-id]
::
+$  content-hash  @uvI
::
+$  book-meta-v0
  $:  id=book-id
      title=@t
      author=@t
      description=@t
      tags=(list @t)
      uploader=ship
      source=ship
      uploaded=@da
      size=@ud
      filename=@t
  ==
::
+$  book-meta
  $:  id=book-id
      hash=content-hash
      title=@t
      author=@t
      description=@t
      tags=(list @t)
      uploader=ship
      source=ship
      uploaded=@da
      size=@ud
      filename=@t
  ==
::
::  actions sent via json poke (file upload is handled via http)
+$  action
  $%  [%remove-book id=book-id]
      $:  %update-book
          id=book-id
          title=@t
          author=@t
          description=@t
          tags=(list @t)
      ==
      [%subscribe =ship]
      [%unsubscribe =ship]
      [%resync =ship]
  ==
::
+$  update
  $%  [%init books=(list book-meta)]
      [%book-added =book-meta]
      [%book-removed id=book-id =ship]
      [%book-updated =book-meta]
  ==
::
+$  subscription-list  (list ship)
::
::  50mb in bytes
++  max-size  ^~((mul 50 (mul 1.024 1.024)))
--
