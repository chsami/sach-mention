/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */


import '@stencil/core';


import {
  EventEmitter,
} from '@stencil/core';


export namespace Components {

  interface SachMention {
    /**
    * Set the amount of time, in milliseconds, to wait to trigger the `onChange` event after each keystroke.
    */
    'debounce': number;
    'dictionary': Array<{ key: string; value: string }>;
    /**
    * if true ignores casing when matching strings
    */
    'ignoreCase': boolean;
    'itemTemplate': (key: any, value: any) => string;
    'menuTemplate': (value: any) => string;
    'searchTermLength': number;
  }
  interface SachMentionAttributes extends StencilHTMLAttributes {
    /**
    * Set the amount of time, in milliseconds, to wait to trigger the `onChange` event after each keystroke.
    */
    'debounce'?: number;
    'dictionary'?: Array<{ key: string; value: string }>;
    /**
    * if true ignores casing when matching strings
    */
    'ignoreCase'?: boolean;
    'itemTemplate'?: (key: any, value: any) => string;
    'menuTemplate'?: (value: any) => string;
    /**
    * Emitted when a keyboard input ocurred.
    */
    'onInputEvent'?: (event: CustomEvent<KeyboardEvent>) => void;
    'onOnChange'?: (event: CustomEvent<string>) => void;
    'onOnFocus'?: (event: CustomEvent<void>) => void;
    'searchTermLength'?: number;
  }
}

declare global {
  interface StencilElementInterfaces {
    'SachMention': Components.SachMention;
  }

  interface StencilIntrinsicElements {
    'sach-mention': Components.SachMentionAttributes;
  }


  interface HTMLSachMentionElement extends Components.SachMention, HTMLStencilElement {}
  var HTMLSachMentionElement: {
    prototype: HTMLSachMentionElement;
    new (): HTMLSachMentionElement;
  };

  interface HTMLElementTagNameMap {
    'sach-mention': HTMLSachMentionElement
  }

  interface ElementTagNameMap {
    'sach-mention': HTMLSachMentionElement;
  }


  export namespace JSX {
    export interface Element {}
    export interface IntrinsicElements extends StencilIntrinsicElements {
      [tagName: string]: any;
    }
  }
  export interface HTMLAttributes extends StencilHTMLAttributes {}

}
