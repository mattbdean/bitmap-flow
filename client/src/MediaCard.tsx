import * as React from 'react';
import { Media } from '../../shared/src/api';

// tslint:disable-next-line:no-var-requires
const style = require('./MediaCard.css');

export interface MediaCardProps {
    media: Media;
}

export class MediaCard extends React.Component<MediaCardProps, { loading: boolean }> {
    public constructor(props: MediaCardProps) {
        super(props);
        this.state = { loading: true };
    }

    public render() {
        // Only apply the 'loading' class while the image is loading
        const hasSource = this.props.media.source !== null;

        const tags = this.props.media.tags.map((t, index) =>
            <span key={index} className={style.tag}>{t}</span>
        );

        return (
            <div className={style.card}>
                <div className={style.imageContainer}>
                    <a href={`/api/v1/media/${this.props.media._id}/dl`}>
                        <img
                            className={this.state.loading ? style.loading : ''}
                            src={`/api/v1/media/${this.props.media._id}/dl`}
                            onLoad={ () => this.onImageLoad() }
                        />
                    </a>
                </div>
                <div className={style.info}>
                    <span
                        className={`${style.source} ${hasSource ? '' : style.noSource}`}
                    >
                        { hasSource ? this.props.media.source : '(no source)' }
                    </span>

                    { tags }
                </div>
            </div>
        );
    }

    private onImageLoad() {
        this.setState({ loading: false });
    }
}
