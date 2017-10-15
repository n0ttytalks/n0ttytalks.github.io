/**
 * AnderShell - Just a small CSS demo
 *
 * Original Work Copyright (c) 2011-2013, Anders Evenrud <andersevenrud@gmail.com>
 * Modified Work Copyright (c) 2017, Tanoy Bose <tanoybose@hotmail.com>
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
(function() {

  var $output;
  var _inited = false;
  var _locked = false;
  var _buffer = [];
  var _obuffer = [];
  var _ibuffer = [];
  var _cwd = "/";
  var _prompt = function() { return _cwd + " $ "; };
  var _history = [];
  var _hindex = -1;
  var _lhindex = -1;

  var _filetree = {
    'Research': {type: 'dir', files: {
      'CombatPlatform': {type: 'file', mime: 'text/plain', content: "Title:Simulation of a Combat Platform Identification System and Comparative Study of Digital Modulation Techniques\nusing GNU Radio and Python\nPublished at: International Journal of Advanced Research in Computer and Communication Engineering Vol. 3, Issue 5,\nMay 2014"},
      'FreeInternet': {type: 'file', mime: 'text/plain', content: "Title: All your creds are belong to us: Hacking an ISP for fun and internet\nDiscussed the possibility of obtaining free internet due to misconfiguration in PPPoE of an ISP.\nResearch is available at my blog http:\/\/n0tty.github.io\/2017\/02\/25\/ISP-Hacking\/"},
      'ITOps': {type: 'file', mime: 'text/plain', content: "Title:  Enterprise Offense: IT Operations [Part 1] - Post-Exploitation of Puppet and Ansible Servers\nResearched on the possibility of utilizing Puppet and Ansible infrastructures to laterally move in the network.\nI have also presented this paper at BalCCon2k17\nResearch is available at http:\/\/n0tty.github.io\/2017\/06\/11\/Enterprise-Offense-IT-Operations-Part-1\/"}
    }},
    'Interests':   {type: 'dir', files: {
       'Nationality': {type: 'file', mime: 'text/plain', content: "Hindu"},
       'Religion': {type: 'file', mime: 'text/plain', content: "Sanatana Dharma"},
       'Politics': {type: 'file', mime: 'text/plain', content: "No \'one ideology\' is right. But only an ideology at the right time."},
       'CoinCollection': {type: 'file', mime: 'text/plain', content: "My coin collection is mainly for the various designs available on Indian Rupee. I currently have slightly over 100\ndifferent varieties of Indian Rupee coins and about 7 different currencies."},
   }},
    'ABOUTME': {type: 'file', mime: 'text/plain', content: "I am Tanoy Bose. Some call me a hardcore geek and I claim myself to be a security researcher.\n\nI am currently employed as a Senior Cybersecurity Consultant and a part of an amazing team of security \nenthusiasts at a Big Four Audit Firm.\n\nDuring the day I am mainly involved Red Teaming, Infrastructure Penetration Testing and during the night I deep\ndive into my security research. I have got a few hall of fames, one CVE (more on the way),few CTFs and recently \nbegan presenting at security conferences.\n\nBeing a cybersecurity consultant, I have worked in a large number of projects involving Red teaming, Infrastructure\nPentest, Purple Teaming, Forensics and Incidence Response, Cyber Threat Intelligence, Cyber Footprint Assessment,\nSecurity Maturity Assessment, Application Penetration testing.\n\nWhile this is something about me, I welcome you to drop me an email to know more about me."},
    'n0tty' : {type: 'file', mime: 'text/plain', content: 'n0tty (pronounced \"No TTY\" and not naughty) is the white hat handle that I identify myself with. TTY stands for\nTeleTYpe terminal(Read: https:\/\/www.gnu.org\/software\/coreutils\/tty). Also read on pty (Pseudo TYpe terminal).\n\nI use the handle n0tty as it signifies one of the first errors I faced (and resolved) while utilizing Linux -\n\"sudo: no tty present and no askpass program specified\"'}
  };

  var _commands = {

    sound: function(volume, duration, freq) {
      if ( !window.webkitAudioContext ) {
        return ['Your browser does not support this feature :('];
      }

      volume = ((volume || '').replace(/[^0-9]/g, '') << 0) || 100;
      duration = ((duration || '').replace(/[^0-9]/g, '') << 0) || 1;
      freq = ((freq || '').replace(/[^0-9]/g, '') << 0) || 1000;

      var context = new webkitAudioContext();
      var osc = context.createOscillator();
      var vol = context.createGainNode();

      vol.gain.value = volume/100;
      osc.frequency.value = freq;
      osc.connect(vol);
      vol.connect(context.destination);
      osc.start(context.currentTime);

      setTimeout(function() {
        osc.stop();
        osc = null;
        context = null;
        vol = null;
      }, duration*1000);

      return ([
        'Volume:    ' + volume,
        'Duration:  ' + duration,
        'Frequenzy: ' + freq
      ]).join("\n");
    },

    ls: function(dir) {
      dir = parsepath((dir || _cwd));

      var out = [];
      var iter = getiter(dir);

      var p;
      var tree = (iter && iter.type == 'dir') ? iter.files : _filetree;
      var count = 0;
      var total = 0;

      for ( var i in tree ) {
        if ( tree.hasOwnProperty(i) ) {
          p = tree[i];
          if ( p.type == 'dir' ) {
            out.push(format('{0} {1} {2}', padRight('<'+i+'>', 20), padRight(p.type, 20), '0'));
          } else {
            out.push(format('{0} {1} {2}', padRight(i, 20), padRight(p.mime, 20), p.content.length));
            total += p.content.length;
          }
          count++;
        }
      }

      out.push(format("\n{0} file(s) in total, {1} byte(s)", count, total));

      return out.join("\n");
    },

    cd: function(dir) {
      if ( !dir ) {
        return (["You need to supply argument: dir"]).join("\n");
      }

      var dirname = parsepath(dir);
      var iter = getiter(dirname);
      if ( dirname == '/' || (iter && iter.type == 'dir')) {
        _cwd = dirname;
        return (['Entered: ' + dirname]).join("\n");
      }

      return (["Path not found: " + dirname]).join("\n");
    },

    cat: function(file) {
      if ( !file ) {
        return (["You need to supply argument: filename"]).join("\n");
      }

      var filename = parsepath(file);
      var iter = getiter(filename);
      if ( !iter ) {
        return (["File not found: " + filename]).join("\n");
      }

      return iter.content;
    },

    cwd: function() {
      return (['Current directory: ' + _cwd]).join("\n");
    },

    clear: function() {
      return false;
    },

    contact: function(key) {
      key = key || '';
      var out = [];

      switch ( key.toLowerCase() ) {
        case 'email' :
          window.open('mailto:tanoybose@hotmail.com');
          break;
        case 'blog' :
          window.open('https://n0tty.github.io');
          break;
        case 'github' :
          window.open('https://github.com/n0tty');
          break;
        case 'linkedin' :
          window.open('http://www.linkedin.com/in/tanoybose');
          break;
        case 'worpress' :
          window.open('https://scammingindian.wordpress.com/');
          break;
        case 'twitter' :
          window.open('https://twitter.com/#!/TanoyBose');
          break;
        case 'recommendation' :
          window.open('https://n0tty.github.io/recommendations');
          break;
        case 'resume' :
          window.open('https://n0tty.github.io/resume');
          break;

        default :
          if ( key.length ) {
            out = ['Invalid key: ' + key];
          } else {
            out = [
              "Contact information:\n",
              'Name:            Tanoy Bose',
              'Email:           tanoybose@hotmail.com',
              'Keybase:         https://keybase.io/tanoybose',
              'Blog:            https://n0tty.github.io',
              'Github:          https://github.com/n0tty',
              'LinkedIn:        http://www.linkedin.com/in/tanoybose',
              'Wordpress:       https://scammingindian.wordpress.com/',
              'Twitter:         https://twitter.com/#!/TanoyBose',
              'Recommendation:  https://n0tty.github.io/recommendations',
              'Resume:          https://n0tty.github.io/resume '
            ];
          }
          break;
      }

      return out.join("\n");
    },

    help: function() {
      var out = [
        'help                                         This command',
        'contact                                      How to contact author',
        'contact <key>                                  Open page (example: `email` or `google+`)',
        'clear                                        Clears the screen',
        'ls                                           List current (or given) directory contents',
        'cd <dir>                                     Enter directory',
        'cat <filename>                               Show file contents',
        'sound [<volume 0-100>, <duration>, <freq>]   Generate a sound (WebKit only)',
        ''
      ];

      return out.join("\n");
    }

  };

  /////////////////////////////////////////////////////////////////
  // UTILS
  /////////////////////////////////////////////////////////////////

  function setSelectionRange(input, selectionStart, selectionEnd) {
    if (input.setSelectionRange) {
      input.focus();
      input.setSelectionRange(selectionStart, selectionEnd);
    }
    else if (input.createTextRange) {
      var range = input.createTextRange();
      range.collapse(true);
      range.moveEnd('character', selectionEnd);
      range.moveStart('character', selectionStart);
      range.select();
    }
  }

  function format(format) {
    var args = Array.prototype.slice.call(arguments, 1);
    var sprintfRegex = /\{(\d+)\}/g;

    var sprintf = function (match, number) {
      return number in args ? args[number] : match;
    };

    return format.replace(sprintfRegex, sprintf);
  }


  function padRight(str, l, c) {
    return str+Array(l-str.length+1).join(c||" ")
  }

  function padCenter(str, width, padding) {
    var _repeat = function(s, num) {
      for( var i = 0, buf = ""; i < num; i++ ) buf += s;
      return buf;
    };

    padding = (padding || ' ').substr( 0, 1 );
    if ( str.length < width ) {
      var len     = width - str.length;
      var remain  = ( len % 2 == 0 ) ? "" : padding;
      var pads    = _repeat(padding, parseInt(len / 2));
      return pads + str + pads + remain;
    }

    return str;
  }

  function parsepath(p) {
    var dir = (p.match(/^\//) ? p : (_cwd  + '/' + p)).replace(/\/+/g, '/');
    return realpath(dir) || '/';
  }

  function getiter(path) {
    var parts = (path.replace(/^\//, '') || '/').split("/");
    var iter = null;

    var last = _filetree;
    while ( parts.length ) {
      var i = parts.shift();
      if ( !last[i] ) break;

      if ( !parts.length ) {
        iter = last[i];
      } else {
        last = last[i].type == 'dir' ? last[i].files : {};
      }
    }

    return iter;
  }

  function realpath(path) {
    var parts = path.split(/\//);
    var path = [];
    for ( var i in parts ) {
      if ( parts.hasOwnProperty(i) ) {
        if ( parts[i] == '.' ) {
          continue;
        }

        if ( parts[i] == '..' ) {
          if ( path.length ) {
            path.pop();
          }
        } else {
          path.push(parts[i]);
        }
      }
    }

    return path.join('/');
  }

  window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame    ||
    function( callback ){
      window.setTimeout(callback, 1000 / 60);
    };
  })();

  /////////////////////////////////////////////////////////////////
  // SHELL
  /////////////////////////////////////////////////////////////////

  (function animloop(){
    requestAnimFrame(animloop);

    if ( _obuffer.length ) {
      $output.value += _obuffer.shift();
      _locked = true;

      update();
    } else {
      if ( _ibuffer.length ) {
        $output.value += _ibuffer.shift();

        update();
      }

      _locked = false;
      _inited = true;
    }
  })();

  function print(input, lp) {
    update();
    _obuffer = _obuffer.concat(lp ? [input] : input.split(''));
  }

  function update() {
    $output.focus();
    var l = $output.value.length;
    setSelectionRange($output, l, l);
    $output.scrollTop = $output.scrollHeight;
  }

  function clear() {
    $output.value = '';
    _ibuffer = [];
    _obuffer = [];
    print("");
  }

  function command(cmd) {
    print("\n");
    if ( cmd.length ) {
      var a = cmd.split(' ');
      var c = a.shift();
      if ( c in _commands ) {
        var result = _commands[c].apply(_commands, a);
        if ( result === false ) {
          clear();
        } else {
          print(result || "\n", true);
        }
      } else {
        print("Unknown command: " + c);
      }

      _history.push(cmd);
    }
    print("\n\n" + _prompt());

    _hindex = -1;
  }

  function nextHistory() {
    if ( !_history.length ) return;

    var insert;
    if ( _hindex == -1 ) {
      _hindex  = _history.length - 1;
      _lhindex = -1;
      insert   = _history[_hindex];
    } else {
      if ( _hindex > 1 ) {
        _lhindex = _hindex;
        _hindex--;
        insert = _history[_hindex];
      }
    }

    if ( insert ) {
      if ( _lhindex != -1 ) {
        var txt = _history[_lhindex];
        $output.value = $output.value.substr(0, $output.value.length - txt.length);
        update();
      }
      _buffer = insert.split('');
      _ibuffer = insert.split('');
    }
  }

  window.onload = function() {
    $output = document.getElementById("output");
    $output.contentEditable = true;
    $output.spellcheck = false;
    $output.value = '';

    $output.onkeydown = function(ev) {
      var k = ev.which || ev.keyCode;
      var cancel = false;

      if ( !_inited ) {
        cancel = true;
      } else {
        if ( k == 9 ) {
          cancel = true;
        } else if ( k == 38 ) {
          nextHistory();
          cancel = true;
        } else if ( k == 40 ) {
          cancel = true;
        } else if ( k == 37 || k == 39 ) {
          cancel = true;
        }
      }

      if ( cancel ) {
        ev.preventDefault();
        ev.stopPropagation();
        return false;
      }

      if ( k == 8 ) {
        if ( _buffer.length ) {
          _buffer.pop();
        } else {
          ev.preventDefault();
          return false;
        }
      }

      return true;
    };

    $output.onkeypress = function(ev) {
      ev.preventDefault();
      if ( !_inited ) {
        return false;
      }

      var k = ev.which || ev.keyCode;
      if ( k == 13 ) {
        var cmd = _buffer.join('').replace(/\s+/, ' ');
        _buffer = [];
        command(cmd);
      } else {
        if ( !_locked ) {
          var kc = String.fromCharCode(k);
          _buffer.push(kc);
          _ibuffer.push(kc);
        }
      }

      return true;
    };

    $output.onfocus = function() {
      update();
    };

    $output.onblur = function() {
      update();
    };

    window.onfocus = function() {
      update();
    };

    print("Connecting to host ..................................................................\n");
    print("Connection Established!\n");
    print("Attempting to open a session on /dev/tty0 ...........................................\n");
    print("Error: Failed to open session on tty0\n");
    print("Reason: sudo: no tty present and no askpass program specified\n");
    print("Loading shellcode to 0xc0ffee to fix error...........................................\n");
    print("Spawning shell but No TTY ...........................................................\n\n");
    //print("Modified for usage by Tanoy Bose <tanoybose@hotmail.com>\n\n", true);

    print("                  {___     {__           {___ {______{___ {______{__      {__                  \n", true);
    print("                  {_ {__   {__                {__         {__     {__    {__                   \n", true);
    print("                  {__ {__  {__   {__          {__         {__      {__ {__                     \n", true);
    print("                  {__  {__ {__ {__  {__       {__         {__        {__                       \n", true);
    print("                  {__   {_ {__{__    {__      {__         {__        {__                       \n", true);
    print("                  {__    {_ __ {__  {__       {__         {__        {__                       \n", true);
    print("                  {__      {__   {__          {__         {__        {__                       \n", true);
    print("\n\n\n", true);

    //print("------------------------------------------------------------------------------------------------------------------");
//    print("                  @@@  @@@  @@@  @@@@@@@@  @@@        @@@@@@@   @@@@@@   @@@@@@@@@@   @@@@@@@@                  \n", true);
//    print("                  @@@  @@@  @@@  @@@@@@@@  @@@       @@@@@@@@  @@@@@@@@  @@@@@@@@@@@  @@@@@@@@                  \n", true);
//    print("                  @@!  @@!  @@!  @@!       @@!       !@@       @@!  @@@  @@! @@! @@!  @@!                       \n", true);
//    print("                  !@!  !@!  !@!  !@!       !@!       !@!       !@!  @!@  !@! !@! !@!  !@!                       \n", true);
//    print("                  @!!  !!@  @!@  @!!!:!    @!!       !@!       @!@  !@!  @!! !!@ @!@  @!!!:!                    \n", true);
//    print("                  !@!  !!!  !@!  !!!!!:    !!!       !!!       !@!  !!!  !@!   ! !@!  !!!!!:                    \n", true);
//    print("                  !!:  !!:  !!:  !!:       !!:       :!!       !!:  !!!  !!:     !!:  !!:                       \n", true);
//    print("                  :!:  :!:  :!:  :!:        :!:      :!:       :!:  !:!  :!:     :!:  :!:                       \n", true);
//    print("                   :::: :: :::    :: ::::   :: ::::   ::: :::  ::::: ::  :::     ::    :: ::::                  \n", true);
//    print("                    :: :  : :    : :: ::   : :: : :   :: :: :   : :  :    :      :    : :: ::                   \n", true);
//    print("\n\n\n", true);

//    print(padCenter("All graphics are created using CSS, no static files or images\n", 113), true);

//    print("\n\n\n\n\n", true);
    print("Type 'help' for a list of available commands.\n", true);
    print("\n\n" + _prompt());

  };

})();
