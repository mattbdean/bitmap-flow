import * as React from 'react';
import { MediaApi } from '../core/media-api';
import { UploadData } from '../core/upload-data';
import { ActiveUpload } from './active-upload';
import { UploadPreview } from './UploadPreview';

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
                <label className='button'>
                    <input
                        type='file'
                        accept='image/png, image/jpeg'
                        onChange={(e) => this.handleChange(e.target.files)}
                    />
                    Pick a file
                </label>

                { this.state.activeUpload ? <UploadPreview
                    upload={this.state.activeUpload}
                    onFinish={(conf) => this.handleUpload(conf)}
                /> : null }
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

    private handleUpload(data: UploadData) {
        this.api.upload(data).then(() => {
            this.setState({
                activeUpload: undefined
            });
        });
    }
}

interface UploadState {
    activeUpload?: ActiveUpload;
}
