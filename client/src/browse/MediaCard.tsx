import { Media } from '@bitmap-flow/shared/lib/api';
import * as classNames from 'classnames';
import * as React from 'react';

// tslint:disable-next-line:no-var-requires
const style = require('./MediaCard.css');

export interface MediaCardProps {
    media: Media;
    onClick?: () => void;
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
            <div className={classNames(style.card, 'raised')}>
                <div className={style.imageContainer}>
                    <img
                        className={this.state.loading ? style.loading : ''}
                        src={`/api/v1/media/${this.props.media._id}/dl`}
                        onLoad={ () => this.handleImageLoad() }
                        onClick={ () => this.handleClick() }
                    />
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

    private handleImageLoad() {
        this.setState({ loading: false });
    }

    private handleClick() {
        if (this.props.onClick)
            this.props.onClick();
    }
}
