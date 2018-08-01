import * as classNames from 'classnames';
import { isEqual, sortBy } from 'lodash';
import * as React from 'react';
import { measureText } from './util';

// tslint:disable-next-line:no-var-requires
const styles = require('./Autocomplete.css');

export class Autocomplete extends React.Component<AutocompleteProps, AutocompleteState> {
    // Defaults should add as little functionality as possible
    public static defaultProps: Partial<AutocompleteProps> = {
        value: '',
        highlightMatches: false,
        deleteAction: 'none',
        minWidth: 50
    };

    private keybindings: { [keyCode: number]: (event: React.KeyboardEvent) => boolean | void } = {
        // down
        40: () => {
            if (this.state.optionIndex < this.state.availableOptions.length - 1) {
                this.setState({ optionIndex: this.state.optionIndex + 1 });
            }
        },
        // up
        38: () => {
            if (this.state.optionIndex > 0)
                this.setState({ optionIndex: this.state.optionIndex - 1 });
        },
        // enter
        13: () => {
            // Pressing enter twice will select the first option
            let newIndex: number;

            if (this.state.optionIndex >= 0) {
                this.handleChange(this.state.availableOptions[this.state.optionIndex], true);
                newIndex = -1;
            } else {
                newIndex = 0;
            }

            this.setState({ optionIndex: newIndex });
        },
        // escape
        27: () => {
            this.setState({ showOptions: false });
        },
        // backspace
        8: () => {
            if (this.props.value === '') {
                if (this.props.onDeleteRequested && this.props.deleteAction === 'requestDeletion')
                    this.props.onDeleteRequested();
                return false;
            }
        }
    };

    private inputRef: React.RefObject<HTMLInputElement>;

    public constructor(props: AutocompleteProps) {
        super(props);

        this.state = {
            showOptions: false,
            currentlySelectingOption: false,
            optionIndex: -1,
            // These two will be resolved in componentDidMount
            availableOptions: [],
            allOptions: [],
            textWidth: 0,
            inputPadding: null
        };

        this.inputRef = React.createRef();
    }

    public componentDidMount() {
        // either string[] or Promise<string[]>, just make sure it's a promise
        const optionsPromise = Promise.resolve(this.props.options);
        
        optionsPromise.then((options: string[]) => {
            this.setState({
                allOptions: options,
                availableOptions: sortBy(options, (opt) => opt.toLowerCase())
            });
        });
    }

    public componentDidUpdate(prevProps: AutocompleteProps, prevState: AutocompleteState) {
        const statePatch: Partial<AutocompleteState> = {};

        // Recalculate the available options when the value changes
        if (this.props.value !== prevProps.value) {
            const options = Autocomplete.search(this.props.value!, this.state.allOptions);

            if (!isEqual(this.state.availableOptions, options)) {
                this.setState({
                    // Calculate the new options
                    availableOptions: options
                });
            }

            const fontSettings = this.getInputFont();
            
            statePatch.textWidth = this.measureTextWidth({ text: this.props.value!, fontValue: fontSettings });
        }

        if (this.state.inputPadding === null && this.inputRef.current) {
            const computedStyle = window.getComputedStyle(this.inputRef.current);
            if (computedStyle.paddingLeft === null || computedStyle.paddingRight === null)
                throw new Error('padding-left or padding-right not specified');
            
            if (!computedStyle.paddingLeft.endsWith('px') || !computedStyle.paddingRight.endsWith('px'))
                throw new Error('padding-left and padding-right must be specified in pixels');

            statePatch.inputPadding = {
                // parseInt will stop parsing as soon as it hits a non-number,
                // so "10px" would get parsed as 10.
                left: parseInt(computedStyle.paddingLeft, 10),
                right: parseInt(computedStyle.paddingRight, 10)
            };
        }

        if (Object.keys(statePatch).length > 0)
            this.setState(statePatch as any);
    }

    public render() {
        let menu = null;
        if (this.state.showOptions && this.state.availableOptions.length > 0) {
            const items = this.state.availableOptions.map((opt, index) => {
                const matchedLength = this.props.highlightMatches ? this.props.value!.length : 0;
                const matched = <span
                    className={styles.optionMatched}
                >
                    { opt.slice(0, matchedLength) }
                </span>;
                const unmatched = <span>{ opt.slice(matchedLength) }</span>;

                return (
                    <div
                        key={opt}
                        data-option
                        className={`${styles.option} ${index === this.state.optionIndex ? styles.highlighted : ''}`}
                        onClick={() => this.handleChange(opt, true)}
                        onMouseDown={() => this.handleClickOptionStart()}
                        onMouseUp={() => this.handleClickOptionEnd()}
                    >
                        { matched }{ unmatched }
                    </div>
                );
            });
            menu = (
                <div className={styles.optionContainer}>
                    { items }
                </div>
            );
        }

        const optionSelected = this.state.allOptions.find((opt) => opt === this.props.value) !== undefined;

        const deleteButton = this.props.deleteAction === 'none' ? null : (
            <span
                className={classNames('fas', 'fa-times', styles.deleteButton)}
                onClick={() => this.handleDelete()}
            ></span>
        );

        // Include padding when calculating the input width because it'll mess
        // with our calculations otherwise because of the way flexbox works
        const padding = this.state.inputPadding === null ? 0 :
            this.state.inputPadding.left + this.state.inputPadding.right;
        const inputWidth = this.state.textWidth + padding;

        return (
            <div className={styles.container}>
                <div
                    className={classNames(styles.inputWrapper, styles.inputWrapperStatic)}
                    onFocus={() => this.handleFocus()}
                    onBlur={() => this.handleBlur()}
                >
                    <input
                        className={classNames({
                            [styles.input]: true,
                            [styles.optionMatched]: optionSelected
                        })}
                        style={{
                            width: Autocomplete.formatPixels(inputWidth),
                            minWidth: Autocomplete.formatPixels(this.props.minWidth),
                            maxWidth: Autocomplete.formatPixels(this.props.maxWidth)
                        }}
                        ref={this.inputRef}
                        autoComplete={'off'}
                        spellCheck={false}
                        value={this.props.value}
                        onChange={(evt) => this.handleChange(evt.target.value, false)}
                        onKeyDown={(evt) => this.handleKeyDown(evt)}
                        placeholder={this.props.placeholder}
                    >
                    </input>
                    { deleteButton }
                </div>
                { menu }
            </div>
        );
    }

    /**
     * Focuses the input. If `opts.select` is true, then this method will act
     * similarly to if the user has used the tab button to navigate to this
     * input.
     * 
     * @param opts.select Select the contents of the input as well?
     */
    public focus(opts?: { select?: boolean }) {
        this.inputRef.current!.focus();

        if (opts && opts.select)
            this.inputRef.current!.select();
    }

    private getInputFont(): string {
        const computedStyle = window.getComputedStyle(this.inputRef.current!);
        return computedStyle.getPropertyValue('font');
    }

    private measureTextWidth(opts: { text: string, fontValue: string }): number {
        return measureText(opts);
    }

    /**
     * Called whenever the input has been changed
     * 
     * @param value The new value of the input
     * @param selected If this value was selected via the autocomplete menu
     * either by clicking on an option or using the arrow keys and enter. If
     * this is true, `value` is assumed to be an element of
     * `this.state.allOptions`.
     */
    private handleChange(rawValue: string, selected: boolean) {
        let value = rawValue;

        const typedOption = this.state.availableOptions.find((opt) =>
            opt.toLowerCase() === rawValue.toLowerCase());
        const userTypedOption = !!typedOption;

        // The user has manually typed in a value (ignoring case). Report the
        // value as the option, instead of the raw value.
        if (!selected && userTypedOption) {
            value = typedOption!;
        }

        if (this.props.onValueChange)
            this.props.onValueChange(value);

        if (selected) {
            // An option has been chosen with the mouse or arrow keys/enter,
            // this is likely the final value for the time being
            this.setState({
                showOptions: false
            });
        } else if (!this.state.showOptions) {
                // We're typing but not showing options. This happens when 
            this.setState({
                showOptions: true
            });
        }

        if (userTypedOption && this.props.onOptionPicked)
            this.props.onOptionPicked(value);
    }

    private handleFocus() {
        this.setState({ showOptions: true });
    }

    private handleBlur() {
        // When the user clicks a menu option, the mouse down event is fired
        // before the blur event. If the user is currently clicking an option,
        // don't hide the menu.
        if (!this.state.currentlySelectingOption)
            this.setState({
                showOptions: false,
                optionIndex: -1
            });
    }

    private handleClickOptionStart() {
        this.setState({ currentlySelectingOption: true });
    }

    private handleClickOptionEnd() {
        this.setState({ currentlySelectingOption: false });
    }

    private handleKeyDown(event: React.KeyboardEvent) {
        const binding = this.keybindings[event.keyCode];
        if (binding !== undefined) {
            const result = binding(event);

            if (result === false)
                event.preventDefault();
        }
    }

    private handleDelete() {
        if (this.props.deleteAction === 'none') {
            return;
        } else if (this.props.deleteAction === 'clear') {
            this.handleChange('', false);
            this.focus();
        } else if (this.props.deleteAction === 'requestDeletion' && this.props.onDeleteRequested) {
            this.props.onDeleteRequested();
        } else {
            throw new Error(`Unknown deleteAction: "${this.props.deleteAction}"`);
        }
    }

    /**
     * Returns the elements of `options` that start with `input` (case
     * insensitive).
     */
    private static search(input: string, options: string[]): string[] {
        return options
            .filter((option) => option.toLowerCase().indexOf(input.toLowerCase()) === 0);
    }

    private static formatPixels(size: number | undefined): string | undefined {
        if (size === undefined)
            return undefined;
        
        return size + 'px';
    }
}
    
// TODO(mattbdean): scrollable option menu

export interface AutocompleteProps {
    /** All available options the user can choose from */
    options: string[] | Promise<string[]>;

    /** A manually-specified value. Usually used when acting as a controlled component. */
    value?: string;

    /**
     * Function that will be called when the user enters data or makes a
     * selection. Called with an empty string when the field is cleared.
     */
    onOptionPicked?: (input: string) => void;

    /** Called when the user modifies the text in the input */
    onValueChange?: (raw: string) => void;

    /**
     * Called when the user presses backspace while there is no text or the
     * delete/clear button is pressed when `deleteAction` is `requestDeletion`.
     */
    onDeleteRequested?: () => void;

    /** Text to display when the input is empty */
    placeholder?: string;

    /** If true, matched portions of the options will be highlighted. */
    highlightMatches?: boolean;

    /**
     * What action to take when the delete/clear button is pressed.
     * 
     *  - `"clear"`: clear all text in the input
     *  - `"requestDeletion"`: call `deleteRequested()`,
     *  - `"none"`: hide the button
     */
    deleteAction?: 'clear' | 'requestDeletion' | 'none';

    /**
     * The minimum width of the input field in pixels. This is not the minimum
     * width of the component itself.
     */
    minWidth?: number;

    /**
     * The maximum width of the input field in pixels. This is not the maximum
     * width of the component itself.
     */
    maxWidth?: number;
}

export interface AutocompleteState {
    /** All available options */
    allOptions: string[];

    /** Filtered-out options */
    availableOptions: string[];

    /** If the autocomplete menu is currently being shown */
    showOptions: boolean;

    /** If the user currently has their primary mouse button down on an option */
    currentlySelectingOption: boolean;
    
    /** The option index */
    optionIndex: number;

    textWidth: number;

    inputPadding: { left: number, right: number } | null;
}
