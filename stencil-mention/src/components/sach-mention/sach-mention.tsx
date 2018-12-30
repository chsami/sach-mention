import {
    Component,
    Prop,
    EventEmitter,
    Event,
    Watch,
    State,
    Element
} from '@stencil/core';
import { debounceEvent, searchInHtmlList, setCursorAtEnd } from '../../utils/utils';

/**
 * BUG: https://stackoverflow.com/questions/49167241/cursor-moves-to-end-of-the-contenteditable-div-when-character-removed-from-div/49167718
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

    @Prop() customTemplate: boolean = false;

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
        const listItemsCount: number = this.element.shadowRoot.querySelectorAll('li').length;
        if (focusPreviousListItem) {
            if (listItemsCount > 0) {
                if (this.focusedListItemIndex <= 0) {
                    const textbox: HTMLDivElement = this.element.shadowRoot.querySelector('#mention-textbox') as HTMLDivElement;
                    textbox.focus();
                    setCursorAtEnd(textbox);
                } else {
                    this.focusedListItemIndex--;
                    this.element.shadowRoot.querySelectorAll('li')[this.focusedListItemIndex].focus();
                }
            }
        } else {
            if (listItemsCount > 0) {
                if (this.focusedListItemIndex < listItemsCount) {
                    this.focusedListItemIndex++;
                    this.element.shadowRoot.querySelectorAll('li')[this.focusedListItemIndex].focus();
                } else {
                    this.element.shadowRoot.querySelectorAll('li')[listItemsCount - 1].focus();
                }
            }
        }

    }

    private onkeyDownListItem = (event: KeyboardEvent, slot: { key: string; value: any }) => {
        if (event.key === 'ArrowDown') {
            this.focusListItem(false);
        } else if (event.key === 'ArrowUp') {
            this.focusListItem(true);
        } else if (event.key === 'Enter') {
            this.addValueToInput(slot);
            event.preventDefault();
        }
    }

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
    }


    private onInput = (ev: Event) => {
        const input: HTMLInputElement = ev.target as HTMLInputElement | null;
        if (input) {
            this.inputValue = input.innerText || '';
            const getIndexForCharacter = this.inputValue.lastIndexOf('@');
            if (this.inputValue.split(' ')[this.inputValue.split(' ').length - 1].includes('@')) {
                this.hideList = false;
            }
            if (getIndexForCharacter < 0) {
                this.hideList = true;
             } else if (!this.hideList
                && this.inputValue.substring(getIndexForCharacter, this.inputValue.length).includes(String.fromCharCode(160))) {
                this.hideList = true;
            } else if (!this.hideList && this.inputValue.charCodeAt(this.inputValue.length - 1) === 160) {
                this.hideList = false;
                this.valuesToShow = searchInHtmlList(
                    this.dictionary,
                    this.inputValue.split('@').pop(),
                    this.ignoreCase
                );
            } else if (!this.hideList) {
                this.valuesToShow = searchInHtmlList(
                    this.dictionary,
                    this.inputValue.split('@').pop(),
                    this.ignoreCase
                );
            }
        }
        this.inputEvent.emit(ev as KeyboardEvent);
    }

    private addValueToInput(slot: { key: string; value: any }): void {
        const textbox: HTMLElement = this.element.shadowRoot.getElementById(
            'mention-textbox'
        );

        if (textbox.innerHTML.indexOf('@') < 0) {
            return;
        }

        textbox.innerHTML = textbox.innerHTML.substring(
            0,
            textbox.innerHTML.lastIndexOf('@')
        );

        if (textbox.querySelector('div') === null) {
            const div = document.createElement('div');
            div.setAttribute('contenteditable', 'true');
            div.setAttribute('style', 'display: inline-block');
            textbox.appendChild(div);
        }

        textbox.querySelector('div').innerHTML += `<span id=${
            slot.key
            } class="mention" contenteditable="false">@${slot.value}</span>`;
        textbox.querySelector('div').innerHTML += `&nbsp;`;
        setCursorAtEnd(textbox);
        this.hideList = true;
        this.element.shadowRoot
            .querySelectorAll('.mention')
            .forEach((element: HTMLElement) => {
                element.onclick = function (): any {
                    alert(element.getAttribute('id'));
                };
            });
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
        return this.customTemplate ? (
            <div hidden={!this.hideList}>
                <slot name='list-menu' />
            </div>
        ) : (
                <div hidden={this.hideList}>
                    <ul id='mention-list'>
                        {this.valuesToShow.map((slot: { key: string; value: any }) => (
                            <li
                                tabindex='-1'
                                class='mention-list-li'
                                onClick={() => this.addValueToInput(slot)}
                                onKeyDown={(event) => this.onkeyDownListItem(event, slot)}>
                                {slot.value}
                            </li>
                        ))}
                    </ul>
                </div>
            );
    }

    renderInput = () => {
        return (
            <div
                contenteditable='true'
                style={this.divStyle}
            >
            </div>
        );
    }

    render(): any {
        return [
            <div
                id='mention-textbox'
                contenteditable='true'
                onKeyDown={this.onKeyDownTextBox}
                onInput={this.onInput}
                onPaste={this.onPaste}>
                <this.renderInput />
            </div>,
            <this.renderListMenu />
        ];
    }
}
