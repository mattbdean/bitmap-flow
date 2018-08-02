import { MediaFilters } from '@bitmap-flow/shared/lib/api';
import * as React from 'react';
import { Board } from './Board';
import { Filters } from './Filters';

// tslint:disable-next-line:no-var-requires
const styles = require('./Browse.css');

export class Browse extends React.Component<{}, AppState> {
    public constructor(props: {}) {
        super(props);
        this.state = {
            filters: {},
            numResults: 0
        };
    }

    public render() {
        return (
            <div className={styles.container}>
                <div className={styles.content}>
                    <Filters
                        change={(filters) => this.onFiltersChanged(filters)}
                        numResults={this.state.numResults}
                    />
                    <div className={styles.boardContainer}>
                        <Board
                            filters={this.state.filters}
                            onMediaCountChange={(count) => this.handleMediaCountChange(count)}
                        />
                    </div>
                </div>
            </div>
        );
    }

    private onFiltersChanged(filters: MediaFilters) {
        this.setState({
            filters: {
                // Don't include missing sources
                source: filters.source === '' ? undefined : filters.source,
                tags: filters.tags
            }
        });
    }

    private handleMediaCountChange(count: number) {
        this.setState({
            numResults: count
        });
    }
}

interface AppState {
    filters: MediaFilters;
    numResults: number;
}
