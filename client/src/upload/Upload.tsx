import * as React from 'react';
import { MediaApi } from '../core/media-api';

// tslint:disable-next-line:no-var-requires
const styles = require('./Upload.css');

export class Upload extends React.Component<{}, UploadState> {
    private api: MediaApi;

    public constructor(props: {}) {
        super(props);

        this.api = new MediaApi();
        this.state = {
        };
    }

    public render() {
        return (
            <div className={styles.container}>
                <label className={styles.button}>
                    <input
                        type='file'
                        accept='image/png, image/jpeg'
                        onChange={(e) => this.handleChange(e.target.files)}
                    />
                    Pick a file
                </label>
                { this.state.activeUpload ? (
                    <div className='raised'>
                        <img src={this.state.activeUpload.src} />
                    </div>
                ) : null }
                { this.state.activeUpload ? (
                    <span
                        className={styles.button}
                        onClick={() => this.handleUpload()}
                    >
                        Upload
                    </span>
                ) : null }
            </div>
        );
    }

    private handleChange(files: FileList | null) {
        if (files === null || files.length === 0)
            return;
        
        const file = files[0];
        const url = window.URL.createObjectURL(file);
        this.setState({
            activeUpload: {
                src: url,
                file
            }
        });
    }

    private handleUpload() {
        this.api.upload({
            file: this.state.activeUpload!.file
        }).then(() => {
            this.setState({
                activeUpload: undefined
            });
        });
    }
}

interface UploadState {
    activeUpload?: {
        src: string;
        file: File
    };
}
