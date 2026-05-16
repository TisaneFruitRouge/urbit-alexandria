/-  alexandria
|_  act=action:alexandria
++  grow
  |%
  ++  noun  act
  --
++  grab
  |%
  ++  noun  action:alexandria
  ++  json
    =,  dejs:format
    |=  jon=json
    ^-  action:alexandria
    %.  jon
    %-  of
    :~  [%remove-book (ot ~[id+ni])]
        [%update-book (ot ~[id+ni title+so author+so description+so tags+(ar so)])]
        [%subscribe (se %p)]
        [%unsubscribe (se %p)]
        [%resync (se %p)]
    ==
  --
++  grad  %noun
--
