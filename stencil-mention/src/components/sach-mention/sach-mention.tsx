import {
  Component,
  Prop,
  EventEmitter,
  Event,
  Watch,
  State,
  Element
} from '@stencil/core';
import {
  debounceEvent,
  searchInHtmlList,
  SetCaretPosition
} from '../../utils/utils';

/**
 * BUG: https://stackoverflow.com/questions/49167241/cursor-moves-to-end-of-the-contenteditable-div-when-character-removed-from-div/49167718
 */

/**
 * Problem with the &nbsp character
 */
@Component({
  tag: 'sach-mention',
  styleUrls: ['sach-mention.scss'],
  shadow: true
})
export class SachMention {
  focusedListItemIndex: number = -1;

  @State() hideList: boolean = true;
  @State() inputValue: string;
  @State() valuesToShow: Array<{ key: string; value: string }> = [];
  @State() cursorPosition: number;

  @Element() element: HTMLElement;

  divStyle: any = {
    display: 'inline-block'
    /*width: '250px'*/
  };

  @Prop() dictionary: Array<{ key: string; value: string }> = [
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
  @Prop() debounce: number = 0;

  @Prop() searchTermLength: number = 1;

  @Prop() menuTemplate: (value: any) => string = null;

  @Prop() itemTemplate: (key: any, value: any) => string = null;


  /**
   * if true ignores casing when matching strings
   * @default true
   */
  @Prop() ignoreCase: boolean = true;

  @Event() onFocus: EventEmitter<void>;

  @Event() onChange: EventEmitter<string>;

  /**
   * Emitted when a keyboard input ocurred.
   */
  @Event() inputEvent!: EventEmitter<KeyboardEvent>;

  @Watch('debounce')
  protected debounceChanged(): void {
    this.onChange = debounceEvent(this.onChange, this.debounce);
  }

  private focusListItem(focusPreviousListItem: boolean): void {
    const listItemsCount: number = this.element.shadowRoot.querySelectorAll(
      'li'
    ).length;
    if (focusPreviousListItem) {
      if (listItemsCount > 0) {
        if (this.focusedListItemIndex > 0) {
          this.focusedListItemIndex--;
          this.element.shadowRoot
            .querySelectorAll('li')
            [this.focusedListItemIndex].focus();
        }
      }
    } else {
      if (listItemsCount > 0) {
        if (this.focusedListItemIndex < listItemsCount) {
          this.focusedListItemIndex++;
          this.element.shadowRoot
            .querySelectorAll('li')
            [this.focusedListItemIndex].focus();
        } else {
          this.element.shadowRoot
            .querySelectorAll('li')
            [listItemsCount - 1].focus();
        }
      }
    }
  }

  getCaretPosition(node) {
    var range = this.element.shadowRoot.getSelection().getRangeAt(0),
      preCaretRange = range.cloneRange(),
      caretPosition,
      tmp = document.createElement('div');

    preCaretRange.selectNodeContents(node);
    preCaretRange.setEnd(range.endContainer, range.endOffset);
    tmp.appendChild(preCaretRange.cloneContents());
    caretPosition = tmp.innerHTML.length;
    return caretPosition;
  }

  restoreSelection(range) {
    if (range) {
      if (this.element.shadowRoot.getSelection) {
        let sel: Selection = this.element.shadowRoot.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  }

  pasteHtmlAtCaret(html, selectPastedContent) {
    let sel: Selection;
    let range: Range;
    if (this.element.shadowRoot.getSelection) {
      // IE9 and non-IE
      sel = this.element.shadowRoot.getSelection();
      if (sel.getRangeAt && sel.rangeCount) {
        range = sel.getRangeAt(0);
        range.deleteContents();

        var el = document.createElement('div');
        el.innerHTML = html;
        var frag = document.createDocumentFragment(),
          node,
          lastNode;
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
          } else {
            range.collapse(true);
          }
          sel.removeAllRanges();
          sel.addRange(range);
        }
      }
    }
  }

  private onkeyDownListItem = (
    event: KeyboardEvent,
    slot: { key: string; value: any }
  ) => {
    if (event.key === 'ArrowDown') {
      this.focusListItem(false);
    } else if (event.key === 'ArrowUp') {
      this.focusListItem(true);
    } else if (event.key === 'Enter') {
      this.addValueToInput(slot);
      event.preventDefault();
    }
  };

  private onKeyDownTextBox = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
    if (event.key === 'ArrowDown') {
      this.focusedListItemIndex = -1;
      this.focusListItem(false);
    } else if (event.key === '@') {
      this.hideList = false;
    }
  };

  private findFirstDiffPos = (a, b) => {
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
  private onInput = (ev: Event) => {
    const input: HTMLInputElement = ev.target as HTMLInputElement | null;
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

    let searchTerm: string = input.innerText.substring(
      getIndexForCharacter + 1,
      input.innerText.indexOf('@', getIndexForCharacter + 1) > -1
        ? input.innerText.indexOf('@', getIndexForCharacter + 1)
        : input.innerText.length
    );

    if (searchTerm.includes(' ')) {
      searchTerm = searchTerm.split(' ')[0];
    }

    if (!this.hideList) {
      this.valuesToShow = searchInHtmlList(
        this.dictionary, //hardcoded list
        searchTerm,
        this.ignoreCase
      );
    }
    this.inputEvent.emit(ev as KeyboardEvent);
  };

  placeCaretAtEnd(el) {
    el.focus();
    if (
      typeof window.getSelection != 'undefined' &&
      typeof document.createRange != 'undefined'
    ) {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }

  private addValueToInput(slot: { key: string; value: any }): void {
    const textbox: HTMLElement = this.element.shadowRoot.getElementById(
      'mention-textbox'
    );

    if (textbox.innerHTML.indexOf('@') < 0) {
      return;
    }

    let wordToDelete = textbox.innerText.substring(
      this.cursorPosition,
      textbox.innerText.length
    );

    if (wordToDelete.length > 0)
      textbox.innerHTML = textbox.innerHTML.replace(
        wordToDelete.split(' ')[0],
        ''
      );

    let html: string = '';

    if (this.itemTemplate) {
      html = `&nbsp;${this.itemTemplate(slot.key, slot.value)}`;
    } else {
      html = `&nbsp;@<span id=${
        slot.key
      } class="mention" contenteditable="false">${slot.value}</span>`;
    }

    
    textbox.focus();
    SetCaretPosition(
      this.element.shadowRoot.getElementById('mention-textbox'),
      this.cursorPosition
    );
    this.pasteHtmlAtCaret(html, false);
    this.hideList = true;
  }

  private onPaste(event: any): void {
    event.preventDefault();

    // get text representation of clipboard
    const text: any = event.clipboardData.getData('text/plain');

    // insert text manually
    document.execCommand('insertHTML', false, text);
  }

  componentDidLoad(): void {
    this.debounceChanged();
  }

  renderListMenu = () => {
    return this.menuTemplate ? (
      <div hidden={this.valuesToShow.length === 0 || this.hideList}>
        <ul id="mention-list">
          {this.valuesToShow.map((slot: { key: string; value: any }) => (
            <li
              tabindex="-1"
              class="mention-list-li"
              onClick={() => this.addValueToInput(slot)}
              onKeyDown={event => this.onkeyDownListItem(event, slot)}
            >
              <div innerHTML={this.menuTemplate(slot.value)} />
            </li>
          ))}
        </ul>
      </div>
    ) : (
      <div hidden={this.valuesToShow.length === 0 || this.hideList}>
        <ul id="mention-list">
          {this.valuesToShow.map((slot: { key: string; value: any }) => (
            <li
              tabindex="-1"
              class="mention-list-li"
              onClick={() => this.addValueToInput(slot)}
              onKeyDown={event => this.onkeyDownListItem(event, slot)}
            >
              {slot.value}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  renderInput = () => {
    return (
      <div contenteditable="true" style={this.divStyle}>
        &nbsp;
      </div>
    );
  };

  render(): any {
    return [
      <div
        id="mention-textbox"
        contenteditable="true"
        onKeyDown={this.onKeyDownTextBox}
        onInput={this.onInput}
        onPaste={this.onPaste}
      />,
      <this.renderListMenu />
    ];
  }
}
