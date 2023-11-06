// ==UserScript==
// @name         Consolidated Records Tools
// @namespace    http://tampermonkey.net/
// @version      0.3.3
// @downloadURL  https://gist.github.com/jamie-r-davis/042ca01b20b2ff95dc5bcff37060f1d7/raw/consolidate_records_tools.js
// @updateURL    https://gist.github.com/jamie-r-davis/042ca01b20b2ff95dc5bcff37060f1d7/raw/consolidate_records_tools.js
// @description  Adds custom toolbar to Consolidate Records page.
// @author       jamjam
// @match        https://*/manage/database/dedupe
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your code here...
    async function GetDuplicates(folder) {
        let hostname = window.location.hostname;
        var url = new URL(`https://${hostname}/manage/query/run?id=de498e93-ce6a-4dc3-a2b1-69412acc79c6&h=a919c3f6-8a58-d14a-014c-68cf290fde38&cmd=service&output=json`);
        url.searchParams.append('folder', folder);
        console.log(url);
        let duplicates = await fetch(url).then(async function(resp) {let data = await resp.json(); console.log(data); return data.row})
        return duplicates
    }

    async function RemoveDuplicates() {
        var folder = View.folder;
        console.log(`Folder is ${folder}`);
        window.FW.Progress.Load();
        let duplicates = await GetDuplicates(folder);
        for (var i=0; i<duplicates.length; i++) {
            var duplicate = duplicates[i];
            var el = document.querySelector(`tr#r${duplicate.id}`);
            if (el) {
                el.remove();
            }
        };
        UpdateEstimates();
        window.FW.Progress.Unload();
    }

    function UpdateEstimates() {
        let records = document.querySelectorAll('#duplicate_results tbody tr');
        document.querySelector('.query_estimate').innerText = records.length;
    }

    class View {
        static get folder() {
            let container = document.querySelector('#responsesContainer');
            if (container) {
                return document.querySelector('#responsesContainer input[name="folder"]').value;
            }
            return null;
        }
        static get dataset() {
            let container = document.querySelector('#responsesContainer');
            if (container) {
                return document.querySelector('#responsesContainer input[name="dataset"]').value;
            }
            return null;
        }
        static get scope() {
            let container = document.querySelector('#responsesContainer');
            if (container) {
                let node = document.querySelector('#responsesContainer input[name="scope"]');
                if (node) {
                    return node.value;
                } else {
                    return 'person';
                }
            }
            return null;
        }
    }

    function DeleteSiblings() {
        function DeleteSibs(el) {
            let nextElement = el.nextSibling;
            el.parentNode.removeChild(el);
            if (nextElement) {
                DeleteSibs(nextElement)
            };
            return
        }
        let currentElement = document.querySelector('input[type=checkbox]:checked').closest('tr');
        (!currentElement) ? alert('Check the row where you want to begin removing') : DeleteSibs(currentElement);
        UpdateEstimates();
    }

    function GetOUAContainer() {
        let el = document.getElementById('oua-container');
        if (!el) {
            el = document.createElement('div');
            el.setAttribute('id', 'oua-container');
            let styles = {
                'backdrop-filter': 'blur(2px)',
                'background': 'rgba(255,255,255,0.8)',
                'padding': '0.5rem 0',
                'position': 'sticky',
                'top': '0',
                'z-index': '10',
            };
            Object.assign(el.style, styles);
            let parent = document.querySelector('#content');
            parent.insertBefore(el, parent.firstChild);
        }
        return el
    }


    function AddBtn(text, event) {
        let id = text.toLowerCase().replace(/\s+/, '_');
        if (!document.getElementById(id)) {
            let btn = document.createElement('button');
            btn.setAttribute('id', id);
            btn.innerText = text;
            btn.addEventListener('click', event);
            let styles = {
                'margin-right': '0.5rem',
                'border-radius': '2px'
            };
            Object.assign(btn.style, styles);

            let parent = GetOUAContainer();
            parent.appendChild(btn);
        }
    }

    AddBtn('Remove Dup IDs', RemoveDuplicates);
    AddBtn('Remove Rows', DeleteSiblings);
})();
