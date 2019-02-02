const h = window.SachMention.h;

function format(first, middle, last) {
    return ((first || '') +
        (middle ? ` ${middle}` : '') +
        (last ? ` ${last}` : ''));
}
function debounce(func, wait = 0) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(func, wait, ...args);
    };
}
function debounceEvent(event, wait) {
    const original = event._original || event;
    return {
        _original: event,
        emit: debounce(original.emit.bind(original), wait)
    };
}
function searchInHtmlList(dictionary, search, ignoreCase) {
    const list = [];
    dictionary.forEach((slot) => {
        if (ignoreCase) {
            if (slot.value.toLowerCase().includes(search.toLowerCase())) {
                list.push(slot);
            }
        }
        else {
            if (slot.value.includes(search)) {
                list.push(slot);
            }
        }
    });
    return list;
}
function setCursorAtEnd(textbox) {
    window.getSelection().removeAllRanges();
    const range = document.createRange();
    range.setStart(textbox, textbox.childNodes.length);
    window.getSelection().addRange(range);
}
function SetCaretPosition(el, pos) {
    // Loop through all child nodes
    for (var node of el.childNodes) {
        if (node.nodeType == 3) { // we have a text node
            if (node.length >= pos) {
                // finally add our range
                var range = document.createRange(), sel = window.getSelection();
                range.setStart(node, pos);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                return -1; // we are done
            }
            else {
                pos -= node.length;
            }
        }
        else {
            pos = SetCaretPosition(node, pos);
            if (pos == -1) {
                return -1; // no need to finish the for loop
            }
        }
    }
    return pos; // needed because of recursion stuff
}

/**
 * BUG: https://stackoverflow.com/questions/49167241/cursor-moves-to-end-of-the-contenteditable-div-when-character-removed-from-div/49167718
 */
/**
 * Problem with the &nbsp character
 */
class SachMention {
    constructor() {
        this.focusedListItemIndex = -1;
        this.hideList = true;
        this.valuesToShow = [];
        this.divStyle = {
            display: 'inline-block'
            /*width: '250px'*/
        };
        this.dictionary = [
            {
                key: '1',
                value: 'Andy'
            },
            {
                key: '2',
                value: 'Katarina'
            },
            {
                key: '3',
                value: 'Joseph'
            },
            {
                key: '4',
                value: 'Rudolf'
            },
            {
                key: '5',
                value: 'Louis'
            },
            {
                key: '6',
                value: 'Marcus'
            },
            {
                key: '7',
                value: 'Azir'
            },
            {
                key: '8',
                value: 'Stefan'
            }
        ];
        /**
         * Set the amount of time, in milliseconds, to wait to trigger the `onChange` event after each keystroke.
         */
        this.debounce = 0;
        this.searchTermLength = 1;
        this.menuTemplate = null;
        this.itemTemplate = null;
        /**
         * if true ignores casing when matching strings
         * @default true
         */
        this.ignoreCase = true;
        this.onkeyDownListItem = (event, slot) => {
            if (event.key === 'ArrowDown') {
                this.focusListItem(false);
            }
            else if (event.key === 'ArrowUp') {
                this.focusListItem(true);
            }
            else if (event.key === 'Enter') {
                this.addValueToInput(slot);
                event.preventDefault();
            }
        };
        this.onKeyDownTextBox = (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
            }
            if (event.key === 'ArrowDown') {
                this.focusedListItemIndex = -1;
                this.focusListItem(false);
            }
            else if (event.key === '@') {
                this.hideList = false;
            }
        };
        this.findFirstDiffPos = (a, b) => {
            let i = 0;
            if (a === b) {
                return -1;
            }
            while (a[i] === b[i]) {
                i++;
            }
            return i;
        };
        //Filter based on what input value is
        this.onInput = (ev) => {
            const input = ev.target;
            if (input.innerText.length === 0) {
                this.hideList = true;
                return;
            }
            const getIndexForCharacter = this.inputValue
                ? input.innerText
                    .substring(0, this.findFirstDiffPos(input.innerText, this.inputValue))
                    .lastIndexOf('@')
                : -1;
            this.inputValue = input.innerText;
            this.cursorPosition = getIndexForCharacter;
            let searchTerm = input.innerText.substring(getIndexForCharacter + 1, input.innerText.indexOf('@', getIndexForCharacter + 1) > -1
                ? input.innerText.indexOf('@', getIndexForCharacter + 1)
                : input.innerText.length);
            if (searchTerm.includes(' ')) {
                searchTerm = searchTerm.split(' ')[0];
            }
            if (!this.hideList) {
                this.valuesToShow = searchInHtmlList(this.dictionary, //hardcoded list
                searchTerm, this.ignoreCase);
            }
            this.inputEvent.emit(ev);
        };
        this.renderListMenu = () => {
            return this.menuTemplate ? (h("div", { hidden: this.valuesToShow.length === 0 || this.hideList },
                h("ul", { id: "mention-list" }, this.valuesToShow.map((slot) => (h("li", { tabindex: "-1", class: "mention-list-li", onClick: () => this.addValueToInput(slot), onKeyDown: event => this.onkeyDownListItem(event, slot) },
                    h("div", { innerHTML: this.menuTemplate(slot.value) }))))))) : (h("div", { hidden: this.valuesToShow.length === 0 || this.hideList },
                h("ul", { id: "mention-list" }, this.valuesToShow.map((slot) => (h("li", { tabindex: "-1", class: "mention-list-li", onClick: () => this.addValueToInput(slot), onKeyDown: event => this.onkeyDownListItem(event, slot) }, slot.value))))));
        };
        this.renderInput = () => {
            return (h("div", { contenteditable: "true", style: this.divStyle }, "\u00A0"));
        };
    }
    debounceChanged() {
        this.onChange = debounceEvent(this.onChange, this.debounce);
    }
    focusListItem(focusPreviousListItem) {
        const listItemsCount = this.element.shadowRoot.querySelectorAll('li').length;
        if (focusPreviousListItem) {
            if (listItemsCount > 0) {
                if (this.focusedListItemIndex > 0) {
                    this.focusedListItemIndex--;
                    this.element.shadowRoot
                        .querySelectorAll('li')[this.focusedListItemIndex].focus();
                }
            }
        }
        else {
            if (listItemsCount > 0) {
                if (this.focusedListItemIndex < listItemsCount) {
                    this.focusedListItemIndex++;
                    this.element.shadowRoot
                        .querySelectorAll('li')[this.focusedListItemIndex].focus();
                }
                else {
                    this.element.shadowRoot
                        .querySelectorAll('li')[listItemsCount - 1].focus();
                }
            }
        }
    }
    getCaretPosition(node) {
        var range = this.element.shadowRoot.getSelection().getRangeAt(0), preCaretRange = range.cloneRange(), caretPosition, tmp = document.createElement('div');
        preCaretRange.selectNodeContents(node);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        tmp.appendChild(preCaretRange.cloneContents());
        caretPosition = tmp.innerHTML.length;
        return caretPosition;
    }
    restoreSelection(range) {
        if (range) {
            if (this.element.shadowRoot.getSelection) {
                let sel = this.element.shadowRoot.getSelection();
                sel.removeAllRanges();
                sel.addRange(range);
            }
        }
    }
    pasteHtmlAtCaret(html, selectPastedContent) {
        let sel;
        let range;
        if (this.element.shadowRoot.getSelection) {
            // IE9 and non-IE
            sel = this.element.shadowRoot.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();
                var el = document.createElement('div');
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }
                var firstNode = frag.firstChild;
                range.insertNode(frag);
                // Preserve the selection
                if (lastNode) {
                    range = range.cloneRange();
                    range.setStartAfter(lastNode);
                    if (selectPastedContent) {
                        range.setStartBefore(firstNode);
                    }
                    else {
                        range.collapse(true);
                    }
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            }
        }
    }
    placeCaretAtEnd(el) {
        el.focus();
        if (typeof window.getSelection != 'undefined' &&
            typeof document.createRange != 'undefined') {
            var range = document.createRange();
            range.selectNodeContents(el);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        }
    }
    addValueToInput(slot) {
        const textbox = this.element.shadowRoot.getElementById('mention-textbox');
        if (textbox.innerHTML.indexOf('@') < 0) {
            return;
        }
        let wordToDelete = textbox.innerText.substring(this.cursorPosition, textbox.innerText.length);
        if (wordToDelete.length > 0)
            textbox.innerHTML = textbox.innerHTML.replace(wordToDelete.split(' ')[0], '');
        let html = '';
        if (this.itemTemplate) {
            html = `&nbsp;${this.itemTemplate(slot.key, slot.value)}`;
        }
        else {
            html = `&nbsp;@<span id=${slot.key} class="mention" contenteditable="false">${slot.value}</span>`;
        }
        textbox.focus();
        SetCaretPosition(this.element.shadowRoot.getElementById('mention-textbox'), this.cursorPosition);
        this.pasteHtmlAtCaret(html, false);
        this.hideList = true;
    }
    onPaste(event) {
        event.preventDefault();
        // get text representation of clipboard
        const text = event.clipboardData.getData('text/plain');
        // insert text manually
        document.execCommand('insertHTML', false, text);
    }
    componentDidLoad() {
        this.debounceChanged();
    }
    render() {
        return [
            h("div", { id: "mention-textbox", contenteditable: "true", onKeyDown: this.onKeyDownTextBox, onInput: this.onInput, onPaste: this.onPaste }),
            h(this.renderListMenu, null)
        ];
    }
    static get is() { return "sach-mention"; }
    static get encapsulation() { return "shadow"; }
    static get properties() { return {
        "cursorPosition": {
            "state": true
        },
        "debounce": {
            "type": Number,
            "attr": "debounce",
            "watchCallbacks": ["debounceChanged"]
        },
        "dictionary": {
            "type": "Any",
            "attr": "dictionary"
        },
        "element": {
            "elementRef": true
        },
        "hideList": {
            "state": true
        },
        "ignoreCase": {
            "type": Boolean,
            "attr": "ignore-case"
        },
        "inputValue": {
            "state": true
        },
        "itemTemplate": {
            "type": "Any",
            "attr": "item-template"
        },
        "menuTemplate": {
            "type": "Any",
            "attr": "menu-template"
        },
        "searchTermLength": {
            "type": Number,
            "attr": "search-term-length"
        },
        "valuesToShow": {
            "state": true
        }
    }; }
    static get events() { return [{
            "name": "onFocus",
            "method": "onFocus",
            "bubbles": true,
            "cancelable": true,
            "composed": true
        }, {
            "name": "onChange",
            "method": "onChange",
            "bubbles": true,
            "cancelable": true,
            "composed": true
        }, {
            "name": "inputEvent",
            "method": "inputEvent",
            "bubbles": true,
            "cancelable": true,
            "composed": true
        }]; }
    static get style() { return ":host {\n  color: blue; }\n  :host .mention {\n    color: #1DA1F2;\n    cursor: pointer; }\n  :host #mention-list {\n    position: absolute;\n    background-color: white;\n    padding-left: 0px;\n    display: inline-block;\n    width: 250px;\n    -webkit-box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);\n    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12); }\n    :host #mention-list li {\n      list-style: none;\n      cursor: pointer;\n      color: black;\n      padding: 8px; }\n      :host #mention-list li:hover, :host #mention-list li:focus {\n        background-color: rgba(0, 0, 0, 0.05); }\n  :host #mention-textbox {\n    line-height: 2;\n    -webkit-box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);\n    box-shadow: 0 5px 5px -3px rgba(0, 0, 0, 0.2), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12);\n    padding: 10px;\n    color: black;\n    width: 50%; }"; }
}

export { SachMention };
