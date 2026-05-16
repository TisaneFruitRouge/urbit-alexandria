/-  alexandria
|_  upd=update:alexandria
++  grow
  |%
  ++  noun  upd
  ++  json
    ^-  ^json
    ?-  -.upd
      %init
        %-  pairs:enjs:format
        :~  type+s+'init'
            books+a+(turn books.upd encode-book)
        ==
      %book-added
        %-  pairs:enjs:format
        :~  type+s+'book-added'
            book+(encode-book book-meta.upd)
        ==
      %book-removed
        %-  pairs:enjs:format
        :~  type+s+'book-removed'
            id+n+(ud-ta id.upd)
            source+s+(scot %p ship.upd)
        ==
      %book-updated
        %-  pairs:enjs:format
        :~  type+s+'book-updated'
            book+(encode-book book-meta.upd)
        ==
    ==
  ++  ud-ta
    |=  n=@ud
    ^-  @ta
    (crip (skim (rip 3 (scot %ud n)) |=(b=@ !=(b '.'))))
  ++  encode-book
    |=  bk=book-meta:alexandria
    ^-  ^json
    %-  pairs:enjs:format
    :~  id+n+(ud-ta id.bk)
        hash+s+(scot %uv hash.bk)
        title+s+title.bk
        author+s+author.bk
        description+s+description.bk
        tags+a+(turn tags.bk |=(t=@t s+t))
        uploader+s+(scot %p uploader.bk)
        source+s+(scot %p source.bk)
        uploaded+s+(scot %da uploaded.bk)
        size+n+(ud-ta size.bk)
        filename+s+filename.bk
    ==
  --
++  grab
  |%
  ++  noun  update:alexandria
  --
++  grad  %noun
--
