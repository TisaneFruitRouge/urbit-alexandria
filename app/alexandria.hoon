/-  alexandria
/+  default-agent, dbug, lib=alexandria, server
|%
+$  versioned-state
  $%(state-0 state-1)
+$  state-0
  $:  %0
      books=(map book-id:alexandria book-meta-v0:alexandria)
      next-id=@ud
      subscriptions=(set ship)
  ==
+$  state-1
  $:  %1
      books=(map book-key:alexandria book-meta:alexandria)
      next-id=@ud
      subscriptions=(set ship)
  ==
+$  card  card:agent:gall
--
::
%-  agent:dbug
=|  state-1
=*  state  -
^-  agent:gall
=<
|_  =bowl:gall
+*  this  .
    do    ~(. +> bowl)
    def   ~(. (default-agent this %|) bowl)
::
++  on-init
  ^-  (quip card _this)
  :_  this
  bind-http:do
::
++  on-save  !>(state)
::
++  on-load
  |=  old=vase
  ^-  (quip card _this)
  =/  old-state=versioned-state  !<(versioned-state old)
  ?:  ?=(%0 -.old-state)
    :_  this(state (upgrade-state:do old-state))
    bind-http:do
  :_  this(state old-state)
  bind-http:do
::
++  on-poke
  |=  [=mark =vase]
  ^-  (quip card _this)
  ?+  mark  (on-poke:def mark vase)
    ::
    %alexandria-action
      =+  !<(=action:alexandria vase)
      ?-  -.action
        ::
        %remove-book
          =/  bk=(unit book-meta:alexandria)
            (~(get by books) [our.bowl id.action])
          ?~  bk  ~|('book not found' !!)
          ::  only the local ship (admin) or the original uploader may remove
          ?.  ?|(=(our.bowl src.bowl) =(src.bowl uploader.u.bk))
            ~|('unauthorized' !!)
          ::  only delete clay file for locally hosted books
          =/  del-cards=(list card)
            ?.  =(source.u.bk our.bowl)  ~
            =/  cp=path  (clay-path:lib id.action)
            :~  (clay-del:do cp)
            ==
          =.  books  (~(del by books) [our.bowl id.action])
          :_  this
          [(fact-books:do [%book-removed id.action our.bowl]) del-cards]
        ::
        %update-book
          =/  bk=(unit book-meta:alexandria)
            (~(get by books) [our.bowl id.action])
          ?~  bk  ~|('book not found' !!)
          ?.  =(src.bowl uploader.u.bk)
            ~|('unauthorized' !!)
          =/  updated=book-meta:alexandria
            %=  u.bk
              title        title.action
              author       author.action
              description  description.action
              tags         tags.action
            ==
          =.  books  (~(put by books) [our.bowl id.action] updated)
          :_  this
          :~  (fact-books:do [%book-updated updated])
          ==
        ::
        %subscribe
          ?:  =(ship.action our.bowl)
            ~|('cannot subscribe to self' !!)
          ?:  (~(has in subscriptions) ship.action)  `this
          =.  subscriptions  (~(put in subscriptions) ship.action)
          :_  this
          :~  [%pass /subs/(scot %p ship.action) %agent [ship.action %alexandria] %watch /books]
          ==
        ::
        %unsubscribe
          ?:  =(ship.action our.bowl)
            ~|('cannot unsubscribe from self' !!)
          ?.  (~(has in subscriptions) ship.action)  `this
          =.  subscriptions  (~(del in subscriptions) ship.action)
          =/  sans-src=(list [book-key:alexandria book-meta:alexandria])
            %+  skim  ~(tap by books)
            |=  [=book-key:alexandria =book-meta:alexandria]
            !=(source.book-meta ship.action)
          =.  books  (malt sans-src)
          :_  this
          :~  [%pass /subs/(scot %p ship.action) %agent [ship.action %alexandria] %leave ~]
              (fact-books:do [%init ~(val by books)])
          ==
        ::
        %resync
          ?:  =(ship.action our.bowl)
            ~|('cannot resync from self' !!)
          =/  was-subscribed=?  (~(has in subscriptions) ship.action)
          =.  subscriptions  (~(put in subscriptions) ship.action)
          =/  sans-src=(list [book-key:alexandria book-meta:alexandria])
            %+  skim  ~(tap by books)
            |=  [=book-key:alexandria =book-meta:alexandria]
            !=(source.book-meta ship.action)
          =.  books  (malt sans-src)
          =/  resync-cards=(list card)
            ?:  was-subscribed
              :~  [%pass /subs/(scot %p ship.action) %agent [ship.action %alexandria] %leave ~]
                  [%pass /subs/(scot %p ship.action) %agent [ship.action %alexandria] %watch /books]
                  (fact-books:do [%init ~(val by books)])
              ==
            :~  [%pass /subs/(scot %p ship.action) %agent [ship.action %alexandria] %watch /books]
                (fact-books:do [%init ~(val by books)])
            ==
          :_  this
          resync-cards
      ==
    ::
    %handle-http-request
      =+  !<([id=@ta =inbound-request:eyre] vase)
      =/  request=request:http  request.inbound-request
      =/  url=tape  (trip url.request)
      =/  request-line=request-line:server
        (parse-request-line:server url.request)
      ?:  ?&  (gte (lent site.request-line) 2)
              =((snag 0 site.request-line) 'apps')
              =((snag 1 site.request-line) 'alexandria')
          ==
        :_  this
        (redirect-reply:do id '/apps/alexandria/index.html')
      ?+  method.request
        :_  this  (http-reply:do id 405 "method not allowed")
        ::
        ::  GET /apps/alexandria/download?id=... — serve a locally hosted pdf
        %'GET'
          =/  params=(map @t @t)
            (malt args.request-line)
          ?^  (~(get by params) 'meta')
            :_  this  (http-reply:do id 200 (trip (scot %p our.bowl)))
          ?~  (~(get by params) 'id')
            :_  this  (http-reply:do id 200 "alexandria-agent BUILD-MARKER-0526-redirect ok")
          =/  bid=@ud
            (slav %ud (~(gut by params) 'id' '0'))
          =/  bk=(unit book-meta:alexandria)
            (~(get by books) [our.bowl bid])
          ?~  bk
            :_  this  (http-reply:do id 404 "book not found")
          ?.  =(source.u.bk our.bowl)
            :_  this  (http-reply:do id 400 "book is hosted by another ship")
          =/  clay-file=path
            %+  weld
              /(scot %p our.bowl)/(scot %tas q.byk.bowl)/(scot %da now.bowl)
            (clay-path:lib bid)
          =/  pdf=mime
            .^(mime %cx clay-file)
          :_  this
          (mime-reply:do id pdf)
        ::
        ::  POST /apps/alexandria/upload — receive raw pdf bytes, metadata in query params
        %'POST'
          ?~  body.request
            :_  this  (http-reply:do id 400 "missing body")
          =/  content=octs  u.body.request
          ?.  (lte p.content max-size:alexandria)
            :_  this  (http-reply:do id 413 "file exceeds 50mb limit")
          =/  hash=content-hash:alexandria
            (content-hash:do content)
          ::  parse metadata from query string
          =/  params=(map @t @t)
            (malt args.request-line)
          =/  title=@t      (~(gut by params) 'title' '')
          =/  author=@t     (~(gut by params) 'author' '')
          =/  desc=@t       (~(gut by params) 'description' '')
          =/  filename=@t   (~(gut by params) 'filename' 'book.pdf')
          =/  tags=(list @t)
            ~
          ::  create book entry
          =/  bid=@ud  next-id
          =/  meta=book-meta:alexandria
            :*  bid
                hash
                title
                author
                desc
                tags
                our.bowl
                our.bowl
                now.bowl
                p.content
                filename
            ==
          =.  books    (~(put by books) [our.bowl bid] meta)
          =.  next-id  +(next-id)
          =/  cp=path  (clay-path:lib bid)
          =/  pdf=mime  [/application/pdf content]
          :_  this
          :-  (clay-put:do cp pdf)
          :-  (fact-books:do [%book-added meta])
          (http-reply:do id 200 (trip (scot %ud bid)))
      ==
  ==
::
++  on-watch
  |=  =path
  ^-  (quip card _this)
  ?+  path  (on-watch:def path)
    [%books ~]
      ::  only broadcast books hosted on this ship — don't re-export synced ones
      =/  local=(list book-meta:alexandria)
        (books-of:lib books our.bowl)
      :_  this
      :~
        [%give %fact ~[path] %alexandria-update !>(`update:alexandria`[%init local])]
      ==
    [%http-response *]
      `this
  ==
::
++  on-leave
  |=  =path
  ^-  (quip card _this)
  `this
::
++  on-peek
  |=  =path
  ^-  (unit (unit cage))
  ?+  path  (on-peek:def path)
    [%x %books ~]
      ::  return all books (local + synced) to the local frontend
      ``[%alexandria-update !>(`update:alexandria`[%init ~(val by books)])]
    [%x %book @ ~]
      =/  id=@ud  (slav %ud i.t.t.path)
      =/  bk=(unit book-meta:alexandria)  (~(get by books) [our.bowl id])
      ?~  bk  ~
      ``[%alexandria-update !>(`update:alexandria`[%book-added u.bk])]
    [%x %subscriptions ~]
      ``[%alexandria-subscriptions !>(`subscription-list:alexandria`~(tap in subscriptions))]
  ==
::
++  on-agent
  |=  [=wire =sign:agent:gall]
  ^-  (quip card _this)
  ?+  wire  (on-agent:def wire sign)
    [%subs @ ~]
      =/  src=ship  (slav %p i.t.wire)
      ?+  -.sign  (on-agent:def wire sign)
        ::
        %watch-ack
          ?~  p.sign
            %-  (slog leaf+"alexandria: subscribed to {(trip (scot %p src))}" ~)
            `this
          %-  (slog leaf+"alexandria: subscribe failed from {(trip (scot %p src))}" ~)
          =.  subscriptions  (~(del in subscriptions) src)
          `this
        ::
        %kick
          %-  (slog leaf+"alexandria: kicked by {(trip (scot %p src))}, resubscribing" ~)
          :_  this
          :~  [%pass wire %agent [src %alexandria] %watch /books]
          ==
        ::
        %fact
          ?.  =(p.cage.sign %alexandria-update)  `this
          =+  !<(=update:alexandria q.cage.sign)
          ?-  -.update
            %init
              ::  drop stale books from this source, then merge fresh ones
              =/  sans-src=(list [book-key:alexandria book-meta:alexandria])
                %+  skim  ~(tap by books)
                |=  [=book-key:alexandria =book-meta:alexandria]
                !=(source.book-meta src)
              =/  tagged=(list book-meta:alexandria)
                %+  murn  books.update
                |=  b=book-meta:alexandria
                ?.  =(source.b src)  ~
                `b
              =.  books
                %-  ~(gas by (malt sans-src))
                (turn tagged |=(b=book-meta:alexandria [[source.b id.b] b]))
              :_  this
              :~  (fact-books:do [%init ~(val by books)])
              ==
            ::
            %book-added
              =/  b=book-meta:alexandria  book-meta.update
              ?.  =(source.b src)  `this
              =.  books  (~(put by books) [source.b id.b] b)
              :_  this
              :~  (fact-books:do [%book-added b])
              ==
            ::
            %book-removed
              ?.  =(ship.update src)  `this
              =.  books  (~(del by books) [ship.update id.update])
              :_  this
              :~  (fact-books:do [%book-removed id.update ship.update])
              ==
            ::
            %book-updated
              =/  b=book-meta:alexandria  book-meta.update
              ?.  =(source.b src)  `this
              =/  old=(unit book-meta:alexandria)  (~(get by books) [source.b id.b])
              ?~  old  `this
              ?.  =(source.u.old src)  `this
              =.  books  (~(put by books) [source.b id.b] b)
              :_  this
              :~  (fact-books:do [%book-updated b])
              ==
          ==
      ==
  ==
::
++  on-arvo
  |=  [=wire sign=sign-arvo]
  ^-  (quip card _this)
  ?+  sign  `this
    [%eyre %bound *]
      %-  (slog leaf+"alexandria eyre bound" ~)
      `this
  ==
::
++  on-fail  on-fail:def
--
::
|_  =bowl:gall
::
::  +bind-http: drop wedged legacy /apps/alexandria bindings, then bind only
::  the agent's own file-transfer routes. Eyre requires %disconnect to come
::  from the same duct that created the binding, so these use the old connect
::  wires rather than new cleanup wires.
++  bind-http
  ^-  (list card)
  :~
    [%pass /eyre/connect %arvo %e %disconnect [~ /apps/alexandria]]
    [%pass /eyre/connect-upload %arvo %e %disconnect [~ /apps/alexandria/upload]]
    [%pass /eyre/connect-download %arvo %e %disconnect [~ /apps/alexandria/download]]
    [%pass /eyre/connect-tilde %arvo %e %disconnect [~ /'~alexandria']]
    [%pass /eyre/connect-tilde-upload %arvo %e %disconnect [~ /'~alexandria'/upload]]
    [%pass /eyre/connect-tilde-download %arvo %e %disconnect [~ /'~alexandria'/download]]
    [%pass /eyre/connect-direct %arvo %e %connect [~ /alexandria] %alexandria]
    [%pass /eyre/connect-direct-upload %arvo %e %connect [~ /alexandria/upload] %alexandria]
    [%pass /eyre/connect-direct-download %arvo %e %connect [~ /alexandria/download] %alexandria]
  ==
::
::  +content-hash: SHA-256 over exactly the uploaded PDF bytes.
++  content-hash
  |=  dat=octs
  ^-  content-hash:alexandria
  (shay p.dat q.dat)
::
::  +legacy-hash: best-effort hash for pre-hash local uploads.
++  legacy-hash
  |=  bk=book-meta-v0:alexandria
  ^-  content-hash:alexandria
  ?.  =(source.bk our.bowl)  `@uvI`0
  =/  clay-file=path
    %+  weld
      /(scot %p our.bowl)/(scot %tas q.byk.bowl)/(scot %da now.bowl)
    (clay-path:lib id.bk)
  =/  res  (mule |.(.^(mime %cx clay-file)))
  ?:(?=(%& -.res) (content-hash q.p.res) `@uvI`0)
::
::  +upgrade-book: migrate pre-hash metadata into the current shape.
++  upgrade-book
  |=  bk=book-meta-v0:alexandria
  ^-  book-meta:alexandria
  :*  id.bk
      (legacy-hash bk)
      title.bk
      author.bk
      description.bk
      tags.bk
      uploader.bk
      source.bk
      uploaded.bk
      size.bk
      filename.bk
  ==
::
::  +upgrade-state: migrate state saved before content hashes existed.
++  upgrade-state
  |=  old=state-0
  ^-  state-1
  :*  %1
      %-  malt
      %+  turn  ~(tap by books.old)
      |=  [id=book-id:alexandria bk=book-meta-v0:alexandria]
      [[source.bk id] (upgrade-book bk)]
      next-id.old
      subscriptions.old
  ==
::
::  +fact-books: give an update fact to all /books subscribers
++  fact-books
  |=  =update:alexandria
  ^-  card
  [%give %fact ~[/books] %alexandria-update !>(update)]
::
::  +clay-put: write a %mime page into this app's source desk
++  clay-put
  |=  [pax=path dat=mime]
  ^-  card
  [%pass /clay/write %arvo %c %info q.byk.bowl [%& ~[[pax [%ins %mime !>(dat)]]]]]
::
::  +clay-del: delete a page from this app's source desk
++  clay-del
  |=  pax=path
  ^-  card
  [%pass /clay/delete %arvo %c %info q.byk.bowl [%& ~[[pax [%del ~]]]]]
::
::  +http-reply: single-chunk http text response
++  http-reply
  |=  [id=@ta code=@ud msg=tape]
  ^-  (list card)
  =/  body=octs  [(lent msg) (crip msg)]
  %+  give-simple-payload:app:server  id
  [[code ~[['content-type' 'text/plain']]] `body]
::
::  +redirect-reply: send browsers from stale exact /apps binding to glob.
++  redirect-reply
  |=  [id=@ta loc=@t]
  ^-  (list card)
  %+  give-simple-payload:app:server  id
  [[307 ['location' loc]~] ~]
::
::  +mime-reply: single-chunk http mime response
++  mime-reply
  |=  [id=@ta dat=mime]
  ^-  (list card)
  %+  give-simple-payload:app:server  id
  [[200 ~[['content-type' (en-mite:mimes:html p.dat)]]] `q.dat]
--
