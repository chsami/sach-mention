import {
    Component,
    Prop,
    EventEmitter,
    Event,
    Watch,
    State,
    Element
} from '@stencil/core';
import { debounceEvent, searchInHtmlList } from '../../utils/utils';

@Component({
    tag: 'my-component',
    styleUrls: { mycomp: 'my-component.scss', cool: 'cool-component.scss' },
    shadow: true
})
export class MyComponent {

    @State() hideList: boolean = true;
    @State() inputValue: string;
    @State() valuesToShow: Array<{ key: string; value: any }> = [];

    divStyle: any = {
        width: '250px'
    };

    @Element() element: HTMLElement;

    /**
     * The mode determines which platform styles to use.
     */
    @Prop() mode!: string;

    @Prop() dictionary: Array<{ key: string; value: any }> = [
        {
            key: '1',
            value: 'Andy'
        },
        {
            key: '2',
            value: 'Katarina'
        }
    ];

    /**
     * Set the amount of time, in milliseconds, to wait to trigger the `onChange` event after each keystroke.
     */
    @Prop() debounce: number = 0;

    @Prop() searchTermLength: number = 1;

    @Prop() customTemplate: boolean = false;

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

    private onKeyDown = (event: KeyboardEvent) => {
        if (event.key === '@') {
            this.hideList = false;
        }
    }

    private onInput = (ev: Event) => {
        const input: HTMLInputElement = ev.target as HTMLInputElement | null;
        if (input) {
            this.inputValue = input.innerText || '';
            if (
                !this.inputValue.includes('@') ||
                this.inputValue.length <= this.searchTermLength
            ) {
                this.hideList = true;
            } else if (this.inputValue.length > this.searchTermLength) {
                this.hideList = false;
                this.valuesToShow = searchInHtmlList(
                    this.dictionary,
                    this.inputValue.split('@').pop()
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
            textbox.innerHTML.indexOf('@')
        );

        textbox.innerHTML += `<span id=${
            slot.key
            } class="mention" contenteditable="false">${slot.value}</span>`;
        textbox.innerHTML += `&nbsp;`;
        window.getSelection().removeAllRanges();
        const range: Range = document.createRange();
        range.setStart(textbox, textbox.childNodes.length);
        window.getSelection().addRange(range);
        if (textbox.innerHTML.indexOf('@') < 0) {
            this.hideList = true;
        }
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

    renderInput = () => {
        return (
            <div
                id='mention-textbox'
                contenteditable='true'
                onInput={this.onInput}
                onKeyDown={this.onKeyDown}
                onPaste={this.onPaste}
            />
        );
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
                            <li onClick={() => this.addValueToInput(slot)}>{slot.value}</li>
                        ))}
                    </ul>
                </div>
            );
    }

    render(): any {
        return (
            <div style={this.divStyle}>
                <this.renderInput />
                <this.renderListMenu />
            </div>
        );
    }
}
