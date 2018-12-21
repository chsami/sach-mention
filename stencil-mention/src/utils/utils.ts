import { EventEmitter } from "@stencil/core";

export function format(first: string, middle: string, last: string): string {
    return (
        (first || '') +
        (middle ? ` ${middle}` : '') +
        (last ? ` ${last}` : '')
    );
}

export function debounce(func: (...args: any[]) => void, wait = 0) {
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

export function searchInHtmlList(dictionary: Array<{ key: string, value: any }>, search: string): Array<{ key: string, value: any }>  {
    let list: Array<{ key: string, value: any }> = [];
    dictionary.forEach((slot: {key: string, value: any}) => {
        if (slot.value.includes(search)) {
            list.push(slot);
        }
    });
    return list
}