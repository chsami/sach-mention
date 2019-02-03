import { EventEmitter } from '@stencil/core';

export function format(first: string, middle: string, last: string): string {
    return (
        (first || '') +
        (middle ? ` ${middle}` : '') +
        (last ? ` ${last}` : '')
    );
}

export function debounce(func: (...args: any[]) => void, wait: number = 0): any {
    let timer: any;
    return (...args: any[]): any => {
        clearTimeout(timer);
        timer = setTimeout(func, wait, ...args);
    };
}

export function debounceEvent(event: EventEmitter, wait: number): EventEmitter {
    const original = (event as any)._original || event;
    return {
        _original: event,
        emit: debounce(original.emit.bind(original), wait)
    } as EventEmitter;
}

export function searchInHtmlList(
    dictionary: Array<{ key: string, value: string }>,
    search: string,
    ignoreCase: boolean): Array<{ key: string, value: string }> {
    const list: Array<{ key: string, value: any }> = [];
    dictionary.forEach((slot: { key: string, value: string }) => {
        if (ignoreCase) {
            if (slot.value.toLowerCase().includes(search.toLowerCase())) {
                list.push(slot);
            }
        } else {
            if (slot.value.includes(search)) {
                list.push(slot);
            }
        }
    });
    return list;
}

export function setCursorAtEnd(textbox: HTMLElement): void {
    window.getSelection().removeAllRanges();
    const range: Range = document.createRange();
    range.setStart(textbox, textbox.childNodes.length);
    window.getSelection().addRange(range);
}

export function SetCaretPosition(el, pos){

    // Loop through all child nodes
    for(var node of el.childNodes){
        if(node.nodeType == 3){ // we have a text node
            if(node.length >= pos){
                // finally add our range
                var range = document.createRange(),
                    sel = window.getSelection();
                range.setStart(node,pos);
                range.collapse(true);
                sel.removeAllRanges();
                sel.addRange(range);
                return -1; // we are done
            }else{
                pos -= node.length;
            }
        }else{
            pos = SetCaretPosition(node,pos);
            if(pos == -1){
                return -1; // no need to finish the for loop
            }
        }
    }
    return pos; // needed because of recursion stuff
}

export function pasteHtmlAtCaret(shadowRoot: ShadowRoot, html: string, selectPastedContent: string, action: Function) {
    let sel: Selection;
    let range: Range;
    if (shadowRoot.getSelection) {
      // IE9 and non-IE
      sel = shadowRoot.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        var el = document.createElement('div');
        el.innerHTML = html;
        var frag = document.createDocumentFragment(),
          node,
          lastNode;
        while ((node = el.firstChild)) {
            node.onclick = function() {
                action();
            };
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
          } else {
            range.collapse(true);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }