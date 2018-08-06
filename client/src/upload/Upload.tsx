import { cloneDeep } from 'lodash';
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
            currentIndex: -1
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
                        multiple
                    />
                    Choose files to upload
                </label>

                {
                    this.state.currentIndex >= 0 ?
                        <p>{ this.state.currentIndex + 1 } of { this.state.files!.length }</p> : null
                }

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
        
        this.setState({
            files,
            activeUpload: Upload.createActiveUpload(files[0]),
            currentIndex: 0
        });
    }

    private handleUpload(data: UploadData) {
        this.api.upload(data).then(() => this.nextUpload());
    }

    private nextUpload() {
        let nextIndex = this.state.currentIndex + 1;
        let nextUpload: ActiveUpload | undefined;

        if (this.state.files === undefined || nextIndex >= this.state.files.length) {
            nextIndex = -1;
            nextUpload = undefined;
        } else {
            nextUpload = Upload.createActiveUpload(this.state.files[nextIndex]);
        }

        const patch: Partial<UploadState> = {
            currentIndex: nextIndex,
            activeUpload: nextUpload,
        };

        if (nextIndex < 0)
            patch.files = undefined;

        this.setState(patch as any);
    }

    private static createActiveUpload(file: File): ActiveUpload {
        const url = window.URL.createObjectURL(file);
        return {
            src: url,
            file
        };
    }
}

interface UploadState {
    currentIndex: number;
    files?: FileList;
    activeUpload?: ActiveUpload;
}
