import { Media, MediaFilters, PaginatedData } from '@bitmap-flow/shared/lib/api';
import { isEqual } from 'lodash';
import * as React from 'react';
import * as InfiniteScroll from 'react-infinite-scroller';
import { MediaApi } from '../core/media-api';
import { Fullscreen } from './Fullscreen';
import { MediaCard } from './MediaCard';

// tslint:disable-next-line:no-var-requires
const styles = require('./Board.css');

export class Board extends React.Component<BoardProps, BoardState> {
    public static defaultProps: Partial<BoardProps> = {
        filters: {}
    };

    private static readonly LIMIT = 25;
    private media: MediaApi;

    public constructor(props: {}) {
        super(props);

        this.media = new MediaApi();
        this.state = {
            media: [],
            hasMore: true,
            page: 1,
            total: 0,
            pageStatus: {},
            fullscreenPageIndex: -1
        };
    }

    public render() {
        let message: string | null = null;

        if (!this.state.hasMore) {
            message = (this.state.media.length === 0 ? `There's nothing here` : `That's it`) + 
                ' ¯\\_(ツ)_/¯';
        }

        return (
            <div>
                { this.state.fullscreenPageIndex >= 0 ? <Fullscreen
                    media={this.state.media}
                    index={this.state.fullscreenPageIndex}
                    onCloseRequested={() => this.setState({ fullscreenPageIndex: -1 })}
                    onIndexChange={(i) => this.setState({ fullscreenPageIndex: i })}
                /> : null }
                <InfiniteScroll
                    className={styles.board}
                    pageStart={1}
                    loadMore={() => this.loadNextPage()}
                    hasMore={this.state.hasMore}
                >
                    {this.state.media.map((m, index) =>
                        <MediaCard
                            media={m}
                            key={m._id as string}
                            onClick={() => this.setState({ fullscreenPageIndex: index })}
                        />
                    )}
                </InfiniteScroll>

                { message === null ? null : <p className={styles.noMore}>{ message }</p> }
            </div>
        );
    }

    public componentDidUpdate(prevProps: BoardProps, prevState: BoardState) {
        if (!isEqual(this.props.filters, prevProps.filters)) {
            this.setState({
                hasMore: true,
                page: 1,
                media: [],
                pageStatus: {}
            });
        }
    }

    private loadNextPage() {
        // Already loading or in the process of loading
        if (this.state.pageStatus[this.state.page])
            return;
        
        const newPageStatus = Object.assign({}, this.state.pageStatus);
        newPageStatus[this.state.page] = true;

        this.setState({
            pageStatus: newPageStatus
        });

        this.media.list({
            limit: Board.LIMIT,
            page: this.state.page,
            source: this.props.filters!.source,
            tags: this.props.filters!.tags
        }).then((result: PaginatedData<Media>) => {
            if (this.state.total !== result.total && this.props.onMediaCountChange)
                this.props.onMediaCountChange(result.total);
            
            this.setState((prevState: BoardState) => {
                const media = prevState.media.slice(0);
                media.push(...result.data);

                return {
                    media,
                    hasMore: result.data.length === Board.LIMIT,
                    page: prevState.page + 1,
                    total: result.total
                };
            });
        });
    }
}

interface BoardState {
    /** All loaded media */
    media: Media[];

    /** Can we continue paginating? */
    hasMore: boolean;

    /** Page number, 1 is the first page */
    page: number;

    /** The total number of results available to paginate through */
    total: number;

    /**
     * Keeps track of page loading status. `pageStatus[1] === true` means that
     * the first page is either loaded or is currently loading.
     */
    pageStatus: { [page: number]: boolean };

    fullscreenPageIndex: number;
}

interface BoardProps {
    filters?: MediaFilters;

    /**
     * Called when the total number of results available to paginate through
     * changes
     */
    onMediaCountChange?: (numResults: number) => void;
}
