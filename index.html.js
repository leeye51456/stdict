/*jslint
  browser: true
  regexp: true
*/
/*global
  document, window,
  JSON, XMLHttpRequest
*/

var urlPrefix, lastSearch, lastDefinition,
  stackPosition = 'bottom';


function definitionClick(e) {
  'use strict';
  var definitionWord, definitionRequest;

  function split3d(src) {
    var i, j, k, srcsplit, srcsplitlen,
      isUsingLevel = [false, false, false],
      l0split, l1split, l2split,
      l0splitlen, l1splitlen, l2splitlen,
      l1innersplit, l2outersplit, l2innersplit,
      lastTmp, tmp, mat, idxstr;

    l0split = [];
    lastTmp = -1;
    srcsplit = src.split('\n');
    srcsplitlen = srcsplit.length;
    for (i = 0; i < srcsplitlen; i += 1) { // line in src.split('\n'):
      tmp = srcsplit[i].charCodeAt(1) - 'Ⅰ'.charCodeAt(0);
      if ((tmp >= 0) && (tmp <= 9)) {
        if (!isUsingLevel[0]) {
          isUsingLevel[0] = true;
        }
        while (lastTmp < tmp) { // next index
          l0split.push([]);
          lastTmp += 1;
        }
        l0split[tmp].push(srcsplit[i].slice(3));
      } else {
        if (l0split.length === 0) {
          l0split.push([]);
        }
        l0split[0].push(srcsplit[i]);
      }
    }

    l1split = [];
    l0splitlen = l0split.length;
    for (i = 0; i < l0splitlen; i += 1) { // l0entry in l0split:
      l1innersplit = [];
      lastTmp = -1;
      l1splitlen = l0split[i].length;
      for (j = 0; j < l1splitlen; j += 1) { // line in l0split[i]:
        mat = /^\[\d+\]/.exec(l0split[i][j]);
        if (!mat) {
          if (l1innersplit.length === 0) {
            l1innersplit.push([]);
          }
          l1innersplit[0].push(l0split[i][j]);
        } else {
          idxstr = mat[0];
          tmp = parseInt(idxstr.slice(1, -1), 10) - 1;
          if (!isUsingLevel[1]) {
            isUsingLevel[1] = true;
          }
          while (lastTmp < tmp) { // next index
            l1innersplit.push([]);
            lastTmp += 1;
          }
          l1innersplit[tmp].push(l0split[i][j].slice(idxstr.length));
        }
      }
      l1split.push(l1innersplit);
    }

    l2split = [];
    l0splitlen = l1split.length;
    for (i = 0; i < l0splitlen; i += 1) { // l0entry in l1split:
      l2outersplit = [];
      l1splitlen = l1split[i].length;
      for (j = 0; j < l1splitlen; j += 1) { // l1entry in l0entry:
        l2innersplit = [];
        lastTmp = -1;
        l2splitlen = l1split[i][j].length;
        for (k = 0; k < l2splitlen; k += 1) { // line in l1entry:
          mat = /^「\d+」/.exec(l1split[i][j][k]);
          if (!mat) {
            if (l2innersplit.length === 0) {
              l2innersplit.push([]);
            }
            l2innersplit[0].push(l1split[i][j][k]);
          } else {
            idxstr = mat[0];
            tmp = parseInt(idxstr.slice(1, -1), 10) - 1;
            if (!isUsingLevel[2]) {
              isUsingLevel[2] = true;
            }
            while (lastTmp < tmp) { // next index
              l2innersplit.push([]);
              lastTmp += 1;
            }
            l2innersplit[tmp].push(l1split[i][j][k].slice(idxstr.length));
          }
        }
        l2outersplit.push(l2innersplit);
      }
      l2split.push(l2outersplit);
    }

    return l2split;
  }

  function updateDefinition() {
    if (definitionWord !== lastDefinition) {
      return;
    } else if (definitionRequest.readyState === XMLHttpRequest.DONE) {
      if (definitionRequest.status === 200) {
        var
          jsonObject, definitionSection, dlElem, subElem, inner, definitionArray,
          i, j, k, l0length, l1length, l2length;
        jsonObject = JSON.parse(definitionRequest.responseText);
        definitionSection = document.getElementById('definition-section');

        dlElem = document.createElement('dl');
        subElem = document.createElement('dt');
        inner = jsonObject.word;
        if (jsonObject.num !== '') {
          inner += '<sup>' + jsonObject.num.replace(/^0+(\d+?)$/, '$1') + '</sup>';
        }
        if (jsonObject.origin !== '') {
          inner += ' (' + jsonObject.origin + ')';
        }
        subElem.innerHTML = inner;
        dlElem.appendChild(subElem);

        if (jsonObject.pronunciation !== '') {
          subElem = document.createElement('dd');
          subElem.innerHTML = '발음: [' + jsonObject.pronunciation + ']';
          dlElem.appendChild(subElem);
        }
        if (jsonObject.conjugation !== '') {
          subElem = document.createElement('dd');
          subElem.innerHTML = '활용 정보: ' + jsonObject.conjugation.replace('\n', ', ');
          dlElem.appendChild(subElem);
        }
        if (jsonObject.relation !== '') {
          subElem = document.createElement('dd');
          subElem.innerHTML = '관련 어휘: ' + jsonObject.relation.replace('\n', ', ');
          dlElem.appendChild(subElem);
        }
        if (jsonObject.pos !== '' && jsonObject.pos !== '없음') {
          subElem = document.createElement('dd');
          subElem.innerHTML = '품사: ' + jsonObject.pos.replace('\n', ', ');
          dlElem.appendChild(subElem);
        }

        subElem = document.createElement('dd');
        inner = '';
        definitionArray = split3d(jsonObject.definition);
        l0length = definitionArray.length;
        for (i = 0; i < l0length; i += 1) {
          if (l0length > 1) {
            inner += '<p class="level0">[&#' + (0x2160 + i) + ';]</p>';
          }
          l1length = definitionArray[i].length;
          for (j = 0; j < l1length; j += 1) {
            if (l1length > 1) {
              inner += '<p class="level1">[' + (j + 1) + ']</p>';
            }
            l2length = definitionArray[i][j].length;
            for (k = 0; k < l2length; k += 1) {
              if (l2length > 1) {
                inner += '<p class="level2">「' + (k + 1) + '」 ' + definitionArray[i][j][k] + '</p>';
              } else {
                inner += '<p class="level2">' + definitionArray[i][j][k] + '</p>';
              }
            }
          }
        }
        subElem.innerHTML = inner;
        dlElem.appendChild(subElem);

        dlElem.style.backgroundColor = 'lightskyblue';
        dlElem.style.transition = 'background-color 1s';
        document.getElementById('result-section').style.display = '';
        if (stackPosition === 'top') {
          definitionSection.insertBefore(dlElem, definitionSection.children[0]);
          window.scrollTo(0, 0);
        } else {
          definitionSection.appendChild(dlElem);
          window.scrollTo(0, dlElem.getBoundingClientRect().top + document.documentElement.scrollTop - 90);
        }
        window.setTimeout(function () {
          dlElem.style.backgroundColor = 'white';
        }, 50);
        return;
      } else {
        // TODO: error
        return;
      }
    }
  }

  function makeDefinitionRequest() {
    definitionRequest = new XMLHttpRequest();
    if (!definitionRequest) {
      return;
    }
    definitionRequest.onreadystatechange = updateDefinition;
    definitionRequest.open('GET', urlPrefix + '/word/' + definitionWord + '.json');
    definitionRequest.setRequestHeader('Content-Type', 'application/json');
    lastDefinition = definitionWord;
    definitionRequest.send();
  }

  definitionWord = e.currentTarget.getAttribute('data-word');
  makeDefinitionRequest();
}


function searchButtonClick() {
  'use strict';
  var searchText, searchRequest;

  function updateSearchResult() {
    var jsonObject, i, resultDiv, dlElem, dlInner;

    if (searchText !== lastSearch) {
      return;
    } else if (searchRequest.readyState === XMLHttpRequest.DONE) {
      if (searchRequest.status === 200) {
        jsonObject = JSON.parse(searchRequest.responseText); // Array of Objects
        document.getElementById('result-not-exist-span').style.display = 'none';
        document.getElementById('query-span').innerHTML = searchText;
        document.getElementById('num-of-result-span').innerHTML = jsonObject.length;
        document.getElementById('result-exist-span').style.display = 'inline';
        document.getElementById('result-section').style.display = 'block';
        resultDiv = document.getElementById('result-div');
        while (resultDiv.lastChild) {
          resultDiv.removeChild(resultDiv.lastChild);
        }
        for (i = 0; i < jsonObject.length; i += 1) {
          dlElem = document.createElement('dl');
          dlElem.addEventListener('click', definitionClick);
          resultDiv.appendChild(dlElem);

          dlInner = '<dt>' + jsonObject[i].word;
          if (jsonObject[i].num !== '') {
            dlInner += '<sup>' + jsonObject[i].num.replace(/^0+(\d+?)$/, '$1') + '</sup>';
            dlElem.setAttribute('data-word', searchText + jsonObject[i].num);
          } else {
            dlElem.setAttribute('data-word', searchText);
          }
          if (jsonObject[i].origin !== '') {
            dlInner += ' (' + jsonObject[i].origin + ')';
          }
          dlInner += '</dt><dd>';
          if (jsonObject[i].pos !== '' && jsonObject[i].pos !== '없음') {
            dlInner += '「' + jsonObject[i].pos + '」 ';
          }
          dlInner += jsonObject[i].definition + '</dd>';
          dlElem.innerHTML = dlInner;
        }
        if (window.matchMedia('(max-width: 900px)').matches) {
          window.scrollTo(0, 0);
        } else {
          document.getElementById('result-section').scrollTo(0, 0);
        }
        return;
      } else {
        document.getElementById('result-exist-span').style.display = 'none';
        document.getElementById('query-span').innerHTML = searchText;
        document.getElementById('num-of-result-span').innerHTML = 0;
        document.getElementById('result-not-exist-span').style.display = 'inline';
        document.getElementById('result-div').innerHTML = '';
        return;
      }
    }
  }

  function makeSearchRequest() {
    var searchTextElem;
    if (searchText === '') {
      return;
    }
    document.getElementById('result-found-div').style.display = 'block';
    searchRequest = new XMLHttpRequest();
    if (!searchRequest) {
      return false;
    }
    searchRequest.onreadystatechange = updateSearchResult;
    searchRequest.open('GET', urlPrefix + '/same/' + searchText + '.json');
    searchRequest.setRequestHeader('Content-Type', 'application/json');
    lastSearch = searchText;
    searchRequest.send();

    searchTextElem = document.getElementById('search-text');
    // https://stackoverflow.com/a/11160055
    searchTextElem.setAttribute('readonly', 'readonly'); // Force keyboard to hide on input field.
    searchTextElem.setAttribute('disabled', 'disabled'); // Force keyboard to hide on textarea field.
    window.setTimeout(function () {
      var searchTextElem = document.getElementById('search-text');
      searchTextElem.blur();  //actually close the keyboard
      // Remove readonly attribute after keyboard is hidden.
      searchTextElem.removeAttribute('readonly');
      searchTextElem.removeAttribute('disabled');
    }, 50);
  }

  searchText = document.getElementById('search-text').value.trim();
  makeSearchRequest();
}


function resultCloseButtonClick() {
  'use strict';

  document.getElementById('result-section').style.display = '';
  if (window.matchMedia('(max-width: 900px)').matches) {
    if (stackPosition === 'top') {
      window.scrollTo(0, 0);
    } else {
      window.scrollTo(0, document.getElementById('definition-section').lastElementChild.getBoundingClientRect().top + document.documentElement.scrollTop - 90);
    }
  }
}


function invertDirectionButtonClick() {
  'use strict';
  if (stackPosition === 'top') {
    stackPosition = 'bottom';
    document.getElementById('invert-direction-button').innerHTML = '쌓는 방향 반대로<br>(현재: 아래)';
  } else {
    stackPosition = 'top';
    document.getElementById('invert-direction-button').innerHTML = '쌓는 방향 반대로<br>(현재: 위)';
  }
}

function directionButtonClick(e) {
  'use strict';
  var buttonId;

  function enableSearch() {
    var searchText;
    document.getElementById('definition-section').innerHTML = '';
    searchText = document.getElementById('search-text');
    searchText.removeAttribute('disabled');
    document.getElementById('search-button').removeAttribute('disabled');
    searchText.focus();
    document.getElementById('invert-direction-button').style.display = 'block';
  }

  buttonId = e.currentTarget.getAttribute('id');
  if (buttonId === 'stack-top-button') {
    stackPosition = 'top';
    document.getElementById('invert-direction-button').innerHTML = '쌓는 방향 반대로<br>(현재: 위)';
  } else {
    stackPosition = 'bottom';
    document.getElementById('invert-direction-button').innerHTML = '쌓는 방향 반대로<br>(현재: 아래)';
  }
  enableSearch();
}


function init() {
  'use strict';
  var directionSelectDiv, stackTopButton, stackBottomButton, searchButton, searchText;

  if (document.domain === '') {
    urlPrefix = './data'; // for local use; it'll not work
  } else if (document.domain.indexOf('github') >= 0) { // Some browsers don't support string.includes(string)
    urlPrefix = '/stdictdb'; // for github pages
  } else {
    urlPrefix = '/data'; // for test
  }

  document.getElementById('result-close-button').addEventListener('click', resultCloseButtonClick);
  document.getElementById('invert-direction-button').addEventListener('click', invertDirectionButtonClick);

  // scramble stack direction buttons
  directionSelectDiv = document.getElementById('direction-select-div');
  stackTopButton = document.createElement('button');
  stackTopButton.id = 'stack-top-button';
  stackTopButton.innerHTML = '위';
  stackBottomButton = document.createElement('button');
  stackBottomButton.id = 'stack-bottom-button';
  stackBottomButton.innerHTML = '아래';
  if (Math.random() < 0.5) {
    directionSelectDiv.lastElementChild.firstElementChild.appendChild(stackTopButton);
    directionSelectDiv.lastElementChild.lastElementChild.appendChild(stackBottomButton);
  } else {
    directionSelectDiv.lastElementChild.firstElementChild.appendChild(stackBottomButton);
    directionSelectDiv.lastElementChild.lastElementChild.appendChild(stackTopButton);
  }
  document.getElementById('stack-top-button').addEventListener('click', directionButtonClick);
  document.getElementById('stack-bottom-button').addEventListener('click', directionButtonClick);

  searchButton = document.getElementById('search-button');
  searchText = document.getElementById('search-text');
  searchButton.addEventListener('click', searchButtonClick);
  searchText.addEventListener('keypress', function (e) {
    if (e.keyCode === 13) {
      e.preventDefault();
      document.getElementById("search-button").click();
    }
  });
  searchButton.setAttribute('disabled', 'disabled');
  searchText.setAttribute('disabled', 'disabled');
}
window.addEventListener('DOMContentLoaded', init);
