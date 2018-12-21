import { Component, Prop, EventEmitter, Event, Watch, State, Element } from '@stencil/core';
import { debounceEvent, searchInHtmlList } from '../../utils/utils';

@Component({
    tag: 'my-component',
    styleUrls: { mycomp: 'my-component.scss', cool: 'cool-component.scss' },
    shadow: true
})
export class MyComponent {

    @Element() element: HTMLElement;

    /**
       * The mode determines which platform styles to use.
    */
    @Prop() mode!: string;

    @Prop() values: Array<string> = ['andy', 'katerina'];

    /**
     * Set the amount of time, in milliseconds, to wait to trigger the `onChange` event after each keystroke.
   */
    @Prop() debounce = 0;

    @Prop() searchTermLength: number = 1;


    @Event() onFocus: EventEmitter<void>

    @Event() onChange: EventEmitter<string>

    /**
        * Emitted when a keyboard input ocurred.
    */
    @Event() inputEvent!: EventEmitter<KeyboardEvent>;


    @Watch('debounce')
    protected debounceChanged() {
        this.onChange = debounceEvent(this.onChange, this.debounce);
    }

    @State() hideList: boolean = true;
    @State() inputValue: string;
    @State() valuesToShow: Array<string> = [];


    private onKeyDown = (event: KeyboardEvent) => {
        console.log(event);
        if (event.key === '@') {
            this.hideList = false;
        }
    }

    private onInput = (ev: Event) => {
        const input = ev.target as HTMLInputElement | null;
        if (input) {
            this.inputValue = input.innerText || '';
            if (!this.inputValue.includes('@') || this.inputValue.length <= this.searchTermLength) {
                this.hideList = true;
            } else if (this.inputValue.length > this.searchTermLength) {
                this.hideList = false;
                this.valuesToShow = searchInHtmlList(
                    this.values,
                    this.inputValue.split('@').pop());
            }
        }
        this.inputEvent.emit(ev as KeyboardEvent);
    }

    private addValueToInput(value: any) {
        let textbox: HTMLElement = this.element.shadowRoot.getElementById('mention-textbox');
        if (textbox.innerHTML.indexOf('@') < 0) return;

        textbox.innerHTML = textbox.innerHTML.substring(0, textbox.innerHTML.indexOf('@'));
        textbox.innerHTML += `<span class="mention" contenteditable="false">${value}</span>`;
        textbox.innerHTML += `&nbsp;`;
        window.getSelection().removeAllRanges();
        var range = document.createRange();
        range.setStart(textbox, textbox.childNodes.length);
        window.getSelection().addRange(range);
        if (textbox.innerHTML.indexOf('@') < 0) {
            this.hideList = true;
        }
    }

    private onPaste(event) {
        event.preventDefault();

         // get text representation of clipboard
         var text = event.clipboardData.getData("text/plain");

         // insert text manually
         document.execCommand("insertHTML", false, text);
    }


    componentDidLoad() {
        this.debounceChanged();
    }


    render() {
        return ([
            <div>
                <div
                    id="mention-textbox"
                    contenteditable="true"
                    onInput={this.onInput}
                    onKeyDown={this.onKeyDown}
                    onPaste={this.onPaste}>
                </div>
                <ul id="mention-list" hidden={this.hideList}>
                    {this.valuesToShow.map((value: string) =>
                        <li onClick={() => this.addValueToInput(value)}>{value}</li>
                    )}
                </ul>
            </div>
        ]);
    }
}
