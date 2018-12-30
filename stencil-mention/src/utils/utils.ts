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