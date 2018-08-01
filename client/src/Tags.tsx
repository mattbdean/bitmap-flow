import { isEqual, range } from 'lodash';
import * as React from 'react';
import { Autocomplete } from './Autocomplete';

// tslint:disable-next-line:no-var-requires
const styles = require('./Tags.css');

export class Tags extends React.Component<TagsProps, TagsState> {
    public constructor(props: TagsProps) {
        super(props); 

        this.state = {
            value: [],
            lastTags: []
        };
    }

    public render() {
        const inputs = range(this.state.value.length + 1).map((index) => {
            const item = this.state.value[index];
            return (
                <div
                    key={index}
                    className={styles.inputContainer}
                >
                    <Autocomplete
                        ref={item ? item.ref : undefined}
                        value={item ? item.value : ''}
                        options={this.props.options}
                        highlightMatches={true}
                        onValueChange={(value) => this.updateValue(index, value)}
                        onOptionPicked={(value) => this.valueChosen(index, value)}
                        onDeleteRequested={() => this.delete(index)}
                        placeholder='Tag'
                        deleteAction='requestDeletion'
                    />
                </div>
            );
        });
        return (<div className={styles.container}>
            { inputs }
        </div>);
    }

    private delete(index: number) {
        if (index >= this.state.value.length && index > 0) {
            // Can't delete the last input, try to focus it
            this.state.value[index - 1].ref.current!!.focus({ select: true });
        } else {
            // Input with a value
            const value = this.state.value.slice();
            value.splice(index, 1);
            this.setState({
                value
            }, () => this.emitValidTags());

            if (index > 0) {
                this.state.value[index - 1].ref.current!!.focus({ select: true });
            }
        }
    }

    private updateValue(index: number, text: string) {
        const newValue = this.state.value.slice();

        if (index === this.state.value.length) {
            // Entered data into the last input
            newValue.push({
                value: text,
                valid: false,
                ref: React.createRef()
            });
        } else {
            // Updated older value
            newValue[index].value = text;
            // Won't know if it's valid until valueChosen() gets called
            newValue[index].valid = false;
        }

        this.setState({ value: newValue }, () => this.emitValidTags());
    }

    private valueChosen(index: number, value: string) {
        const newValue = this.state.value.slice();

        if (index >= this.state.value.length) {
            // The user chose a value with the mouse/keyboard+enter without
            // typing anything, we don't have an entry in our state for this yet
            newValue.push({
                valid: value.length > 0,
                value,
                ref: React.createRef()
            });
        } else {
            newValue[index].valid = value.length > 0;
            newValue[index].value = value;
        }

        this.setState({ value: newValue });
    }

    private emitValidTags() {
        if (this.props.onChange) {
            const tags = this.state.value
                .filter((el) => el.valid)
                .map((el) => el.value); 
            
            if (!isEqual(tags, this.state.lastTags)) {
                this.props.onChange(tags);
                this.setState({ lastTags: tags });
            }
        }
    }
}

interface TagsProps {
    options: string[] | Promise<string[]>;
    onChange?: (tags: string[]) => void;
}

interface TagsState {
    value: Array<{ value: string, valid: boolean, ref: React.RefObject<Autocomplete> }>;
    lastTags: string[];
}
