import { Media } from '@bitmap-flow/shared/lib/api';
import * as React from 'react';

// tslint:disable-next-line:no-var-requires
const styles = require('./Fullscreen.css');

export class Fullscreen extends React.Component<FullscreenProps> {
    private ref: React.RefObject<HTMLDivElement>;

    public constructor(props: FullscreenProps) {
        super(props);

        this.ref = React.createRef();
    }

    public render() {
        return (
            <div
                className={styles.modalContainer}
                onClick={(event) => this.handleClick(event)}
                ref={this.ref}
                onKeyDown={(event) => this.handleKeyPress(event)}
                // Necessary for key bindings to work
                tabIndex={0}
            >
                <p className={styles.info}>
                    { this.props.index + 1 } of { this.props.media.length }
                </p>
                <div className={styles.imageContainer}>
                    <img
                        src={`/api/v1/media/${this.props.media[this.props.index]._id}/dl`}
                    />
                </div>
            </div>
        );
    }

    public componentDidMount() {
        // Focus the wrapping <div> so that key bindings work
        this.ref.current!.focus();
    }

    private handleClick(event: React.MouseEvent) {
        if (event.target === this.ref.current && this.props.onCloseRequested) {
            this.props.onCloseRequested();
        }
    }

    private handleKeyPress(event: React.KeyboardEvent) {
        console.log(event.keyCode);
        if (event.keyCode === 27) {
            event.preventDefault();
            if (this.props.onCloseRequested)
                this.props.onCloseRequested();
        } else if (event.keyCode === 39 || event.keyCode === 37) {
            if (this.props.onIndexChange) {
                let index = this.props.index + (event.keyCode === 39 ? 1 : -1);
                if (index < 0)
                    index = this.props.media.length - 1;
                else if (index >= this.props.media.length)
                    index = 0;
                
                this.props.onIndexChange(index);
            }
        }
    }
}

interface FullscreenProps {
    media: Media[];
    index: number;
    onIndexChange?: (index: number) => void;
    onCloseRequested?: () => void;
}
