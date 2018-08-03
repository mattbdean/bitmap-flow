import * as React from 'react';
import { Autocomplete } from '../core/Autocomplete';
import { MediaApi } from '../core/media-api';
import { Tags } from '../core/Tags';
import { UploadData } from '../core/upload-data';
import { ActiveUpload } from './active-upload';

// tslint:disable-next-line:no-var-requires
const styles = require('./UploadPreview.css');

export class UploadPreview extends React.Component<UploadPreviewProps, UploadPreviewState> {
    private api: MediaApi;

    public constructor(props: UploadPreviewProps) {
        super(props);
        this.api = new MediaApi();

        this.state = {
            tags: [],
            allSources: this.api.sources(),
            allTags: this.api.tags()
        };
    }

    public render() {
        return (
            <div className={styles.container}>
                <div>
                    <img className='raised' src={this.props.upload.src} />
                </div>
                <div>
                    <div className={styles.metadataWrapper}>
                        <Autocomplete
                            options={this.state.allSources}
                            onValueChange={(val) => this.setState({ source: val })}
                            value={this.state.source}
                            onOptionPicked={(val) => this.handleSourceChange(val)}
                            placeholder='Source'
                            deleteAction='clear'
                            minWidth={200}
                        />
                    </div>
                    <div className={styles.metadataWrapper}>
                        <Tags
                            options={this.state.allTags}
                            allowNewTags={true}
                            onChange={(tags) => this.setState({ tags })}
                        />
                    </div>
                </div>
                <span
                    className='button'
                    onClick={() => this.handleFinish()}
                >Upload</span>
            </div>
        );
    }

    private handleFinish() {
        if (this.props.onFinish) {
            this.props.onFinish({
                file: this.props.upload.file,
                tags: this.state.tags,
                source: this.state.source
            });
        }
    }

    private handleSourceChange(source: string) {
        this.setState({
            source: source === '' ? undefined : source
        });
    }
}

interface UploadPreviewProps {
    upload: ActiveUpload;
    onFinish?: (data: UploadData) => void;
}

interface UploadPreviewState {
    allSources: Promise<string[]>;
    allTags: Promise<string[]>;
    tags: string[];
    source?: string;
}
